<?php
/**
 * Read / List Todos Endpoint with Server-Side Search, Filters, Sorting & Pagination
 * GET /api/todos/list.php
 *
 * Query Parameters:
 * - search: string (matches title or description)
 * - status: 'all' | 'pending' | 'completed' | 'overdue'
 * - priority: 'all' | 'high' | 'medium' | 'low'
 * - sort_by: 'newest' | 'oldest' | 'due_date' | 'priority'
 * - page: int (default: 1)
 * - limit: int (default: 5)
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/db.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(405, false, "Method not allowed. Use GET.");
}

$user = requireAuth();
$userId = (int)$user['id'];
$db = getDBConnection();

// 1. Sanitize input query parameters
$search = trim($_GET['search'] ?? '');
$status = strtolower(trim($_GET['status'] ?? 'all'));
$priority = strtolower(trim($_GET['priority'] ?? 'all'));
$sortBy = strtolower(trim($_GET['sort_by'] ?? 'newest'));
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = max(1, min(50, (int)($_GET['limit'] ?? 5))); // Cap items per page
$offset = ($page - 1) * $limit;

// 2. Compute Global User Stats via Single SQL Aggregate Query
$statsSql = "SELECT 
                COUNT(*) as total,
                COALESCE(SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END), 0) as completed,
                COALESCE(SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END), 0) as pending,
                COALESCE(SUM(CASE WHEN is_completed = 0 AND due_date IS NOT NULL AND due_date < CURDATE() THEN 1 ELSE 0 END), 0) as overdue
             FROM todos 
             WHERE user_id = ?";
$statsStmt = $db->prepare($statsSql);
$statsStmt->bind_param("i", $userId);
$statsStmt->execute();
$statsRow = $statsStmt->get_result()->fetch_assoc();
$statsStmt->close();

$globalStats = [
    "total" => (int)($statsRow['total'] ?? 0),
    "completed" => (int)($statsRow['completed'] ?? 0),
    "pending" => (int)($statsRow['pending'] ?? 0),
    "overdue" => (int)($statsRow['overdue'] ?? 0)
];

// 3. Dynamic WHERE conditions for filtered list
$whereConditions = ["user_id = ?"];
$paramTypes = "i";
$paramValues = [$userId];

// Status Filter
if ($status === 'pending') {
    $whereConditions[] = "is_completed = 0";
} elseif ($status === 'completed') {
    $whereConditions[] = "is_completed = 1";
} elseif ($status === 'overdue') {
    $whereConditions[] = "is_completed = 0 AND due_date IS NOT NULL AND due_date < CURDATE()";
}

// Priority Filter
$allowedPriorities = ['low', 'medium', 'high'];
if (in_array($priority, $allowedPriorities, true)) {
    $whereConditions[] = "priority = ?";
    $paramTypes .= "s";
    $paramValues[] = $priority;
}

// Search Query (Prepared Statement prevents SQL Injection)
if (!empty($search)) {
    $whereConditions[] = "(title LIKE ? OR description LIKE ?)";
    $paramTypes .= "ss";
    $searchTerm = "%{$search}%";
    $paramValues[] = $searchTerm;
    $paramValues[] = $searchTerm;
}

$whereSql = implode(" AND ", $whereConditions);

// 4. Count Query for pagination
$countSql = "SELECT COUNT(*) as total FROM todos WHERE {$whereSql}";
$countStmt = $db->prepare($countSql);
$countStmt->bind_param($paramTypes, ...$paramValues);
$countStmt->execute();
$countResult = $countStmt->get_result()->fetch_assoc();
$totalItems = (int)($countResult['total'] ?? 0);
$countStmt->close();

$totalPages = (int)ceil($totalItems / $limit);
if ($totalPages === 0) {
    $totalPages = 1;
}

// 5. Fixed Allowlist for Sorting
$orderBySql = match ($sortBy) {
    'oldest' => "created_at ASC",
    'due_date' => "CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC, created_at DESC",
    'priority' => "CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END ASC, created_at DESC",
    default => "created_at DESC"
};

// 6. Paginated Data Query
$dataSql = "SELECT id, user_id, title, description, is_completed, priority, due_date, created_at, updated_at
            FROM todos
            WHERE {$whereSql}
            ORDER BY {$orderBySql}
            LIMIT ? OFFSET ?";

$dataParamTypes = $paramTypes . "ii";
$dataParamValues = array_merge($paramValues, [$limit, $offset]);

$dataStmt = $db->prepare($dataSql);
$dataStmt->bind_param($dataParamTypes, ...$dataParamValues);
$dataStmt->execute();
$dataResult = $dataStmt->get_result();

$todos = [];
while ($row = $dataResult->fetch_assoc()) {
    $row['id'] = (int)$row['id'];
    $row['user_id'] = (int)$row['user_id'];
    $row['is_completed'] = (int)$row['is_completed'];
    $todos[] = $row;
}
$dataStmt->close();

sendJsonResponse(200, true, "Tasks retrieved successfully.", [
    "todos" => $todos,
    "stats" => $globalStats,
    "pagination" => [
        "total_items" => $totalItems,
        "current_page" => $page,
        "total_pages" => $totalPages,
        "limit" => $limit,
        "has_next_page" => $page < $totalPages,
        "has_prev_page" => $page > 1
    ]
]);
