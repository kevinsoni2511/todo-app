<?php
/**
 * Clear All Completed Todos Endpoint
 * POST /api/todos/clear_completed.php
 *
 * Removes all completed tasks belonging exclusively to the authenticated user.
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/db.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(405, false, "Method not allowed. Use POST.");
}

$user = requireAuth();
$db = getDBConnection();

$stmt = $db->prepare("DELETE FROM todos WHERE user_id = ? AND is_completed = 1");
$stmt->bind_param("i", $user['id']);
$stmt->execute();

$deletedCount = $stmt->affected_rows;
$stmt->close();

sendJsonResponse(200, true, "Cleared {$deletedCount} completed task(s).", [
    "deleted_count" => $deletedCount
]);
