<?php
/**
 * Create Todo Endpoint
 * POST /api/todos/create.php
 *
 * Validates task fields, associates the task with the authenticated user ID
 * extracted directly from the session, and inserts into MySQL using prepared statements.
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/db.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(405, false, "Method not allowed. Use POST.");
}

// Extract authenticated user directly from server session
$user = requireAuth();
$input = getJsonInput();

$title = trim($input['title'] ?? '');
$description = isset($input['description']) && trim($input['description']) !== ''
    ? trim($input['description'])
    : null;
$priority = strtolower(trim($input['priority'] ?? 'medium'));
$dueDate = !empty($input['due_date']) ? trim($input['due_date']) : null;

// Validation
if (empty($title)) {
    sendJsonResponse(422, false, "Task title is required.");
}

if (strlen($title) > 255) {
    sendJsonResponse(422, false, "Task title cannot exceed 255 characters.");
}

$allowedPriorities = ['low', 'medium', 'high'];
if (!in_array($priority, $allowedPriorities, true)) {
    $priority = 'medium';
}

if ($dueDate !== null) {
    $dateObj = DateTime::createFromFormat('Y-m-d', $dueDate);
    if (!$dateObj || $dateObj->format('Y-m-d') !== $dueDate) {
        sendJsonResponse(422, false, "Invalid due date format. Expected YYYY-MM-DD.");
    }
}

$db = getDBConnection();

$stmt = $db->prepare("INSERT INTO todos (user_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("issss", $user['id'], $title, $description, $priority, $dueDate);

if (!$stmt->execute()) {
    $stmt->close();
    sendJsonResponse(500, false, "Failed to create task due to a database error.");
}

$newId = $stmt->insert_id;
$stmt->close();

// Fetch created record
$fetchStmt = $db->prepare("SELECT id, user_id, title, description, is_completed, priority, due_date, created_at, updated_at FROM todos WHERE id = ?");
$fetchStmt->bind_param("i", $newId);
$fetchStmt->execute();
$newTodo = $fetchStmt->get_result()->fetch_assoc();
$fetchStmt->close();

$newTodo['id'] = (int)$newTodo['id'];
$newTodo['user_id'] = (int)$newTodo['user_id'];
$newTodo['is_completed'] = (int)$newTodo['is_completed'];

sendJsonResponse(201, true, "Task created successfully.", [
    "todo" => $newTodo
]);
