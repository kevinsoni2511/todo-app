<?php
/**
 * Delete Todo Endpoint
 * POST /api/todos/delete.php
 *
 * Permanently removes a task after verifying ownership.
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

$stmt = $db->prepare("DELETE FROM todos WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $id, $user['id']);
$stmt->execute();

if ($stmt->affected_rows === 0) {
    $stmt->close();
    sendJsonResponse(404, false, "Task not found or access denied.");
}
$stmt->close();

sendJsonResponse(200, true, "Task deleted successfully.", [
    "id" => $id
]);
