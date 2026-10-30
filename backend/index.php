<?php
/**
 * Render / Cloud Health Check Endpoint
 * GET /health.php or GET /index.php
 */

require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/config/db.php';

setCorsHeaders();

$dbStatus = 'disconnected';
$error = null;

try {
    $conn = getDBConnection();
    if ($conn->ping()) {
        $dbStatus = 'connected';
    }
} catch (Throwable $e) {
    $error = $e->getMessage();
}

sendJsonResponse(200, true, "TaskMaster Pro PHP REST API is live!", [
    "service" => "TaskMaster Pro Backend",
    "status" => "online",
    "php_version" => PHP_VERSION,
    "database" => $dbStatus,
    "time" => date('Y-m-d H:i:s'),
    "error" => $error
]);
