<?php
/**
 * Dashboard Statistics Endpoint
 * GET /api/todos/stats.php
 *
 * Computes deep database aggregate metrics for the authenticated user:
 * total, completed, pending, overdue, priority breakdown, and completion rate.
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

$stmt = $db->prepare(
    "SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END), 0) as completed,
        COALESCE(SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN is_completed = 0 AND due_date IS NOT NULL AND due_date < CURDATE() THEN 1 ELSE 0 END), 0) as overdue,
        COALESCE(SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END), 0) as high_priority,
        COALESCE(SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END), 0) as medium_priority,
        COALESCE(SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END), 0) as low_priority
     FROM todos 
     WHERE user_id = ?"
);
$stmt->bind_param("i", $userId);
$stmt->execute();
$stats = $stmt->get_result()->fetch_assoc();
$stmt->close();

$total = (int)($stats['total'] ?? 0);
$completed = (int)($stats['completed'] ?? 0);
$pending = (int)($stats['pending'] ?? 0);
$overdue = (int)($stats['overdue'] ?? 0);
$highPriority = (int)($stats['high_priority'] ?? 0);
$mediumPriority = (int)($stats['medium_priority'] ?? 0);
$lowPriority = (int)($stats['low_priority'] ?? 0);

$completionRate = $total > 0 ? round(($completed / $total) * 100) : 0;

sendJsonResponse(200, true, "Dashboard statistics calculated successfully.", [
    "stats" => [
        "total" => $total,
        "completed" => $completed,
        "pending" => $pending,
        "overdue" => $overdue,
        "completion_rate" => $completionRate,
        "priorities" => [
            "high" => $highPriority,
            "medium" => $mediumPriority,
            "low" => $lowPriority
        ]
    ]
]);
