<?php
/**
 * Update Todo Endpoint
 * POST /api/todos/update.php
 *
 * Validates task changes and enforces strict ownership check
 * so a user can never edit another user's task.
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/db.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(405, false, "Method not allowed. Use POST.");
}

$user = requireAuth();
$input = getJsonInput();

$id = isset($input['id']) ? (int)$input['id'] : 0;
$title = trim($input['title'] ?? '');
$description = isset($input['description']) && trim($input['description']) !== ''
    ? trim($input['description'])
    : null;
$priority = strtolower(trim($input['priority'] ?? 'medium'));
$dueDate = !empty($input['due_date']) ? trim($input['due_date']) : null;

if ($id <= 0) {
    sendJsonResponse(422, false, "Invalid task ID.");
}

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

// Verify ownership before updating
$checkStmt = $db->prepare("SELECT id FROM todos WHERE id = ? AND user_id = ?");
$checkStmt->bind_param("ii", $id, $user['id']);
$checkStmt->execute();
if ($checkStmt->get_result()->num_rows === 0) {
    $checkStmt->close();
    sendJsonResponse(404, false, "Task not found or access denied.");
}
$checkStmt->close();

// Update with prepared statement
$updateStmt = $db->prepare(
    "UPDATE todos 
     SET title = ?, description = ?, priority = ?, due_date = ? 
     WHERE id = ? AND user_id = ?"
);
$updateStmt->bind_param("ssssii", $title, $description, $priority, $dueDate, $id, $user['id']);

if (!$updateStmt->execute()) {
    $updateStmt->close();
    sendJsonResponse(500, false, "Failed to update task.");
}
$updateStmt->close();

// Return updated task
$fetchStmt = $db->prepare("SELECT id, user_id, title, description, is_completed, priority, due_date, created_at, updated_at FROM todos WHERE id = ?");
$fetchStmt->bind_param("i", $id);
$fetchStmt->execute();
$updatedTodo = $fetchStmt->get_result()->fetch_assoc();
$fetchStmt->close();

$updatedTodo['id'] = (int)$updatedTodo['id'];
$updatedTodo['user_id'] = (int)$updatedTodo['user_id'];
$updatedTodo['is_completed'] = (int)$updatedTodo['is_completed'];

sendJsonResponse(200, true, "Task updated successfully.", [
    "todo" => $updatedTodo
]);
