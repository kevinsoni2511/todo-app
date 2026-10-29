<?php
/**
 * Toggle Todo Completion Status
 * POST /api/todos/toggle.php
 *
 * Flips the is_completed state (0 <-> 1) for the authenticated user's task.
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
if ($id <= 0) {
    sendJsonResponse(422, false, "Invalid task ID.");
}

$db = getDBConnection();

// Verify ownership
$checkStmt = $db->prepare("SELECT id, is_completed FROM todos WHERE id = ? AND user_id = ?");
$checkStmt->bind_param("ii", $id, $user['id']);
$checkStmt->execute();
$result = $checkStmt->get_result();

if ($result->num_rows === 0) {
    $checkStmt->close();
    sendJsonResponse(404, false, "Task not found or access denied.");
}

$currentTodo = $result->fetch_assoc();
$checkStmt->close();

$newStatus = $currentTodo['is_completed'] ? 0 : 1;

$updateStmt = $db->prepare("UPDATE todos SET is_completed = ? WHERE id = ? AND user_id = ?");
$updateStmt->bind_param("iii", $newStatus, $id, $user['id']);

if (!$updateStmt->execute()) {
    $updateStmt->close();
    sendJsonResponse(500, false, "Failed to toggle task status.");
}
$updateStmt->close();

sendJsonResponse(200, true, "Task completion updated.", [
    "id" => $id,
    "is_completed" => $newStatus
]);
