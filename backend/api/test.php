<?php
/**
 * Test API Endpoint
 * Demonstrates GET and POST request-response cycle with JSON input/output.
 */

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../config/db.php';

// Set CORS for this request
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $db = getDBConnection();
    
    sendJsonResponse(200, true, "GET request successful! PHP & MySQL are communicating.", [
        "method" => "GET",
        "server" => "Apache / PHP " . phpversion(),
        "database" => DB_NAME . " (" . $db->server_info . ")",
        "timestamp" => date("Y-m-d H:i:s")
    ]);
}

if ($method === 'POST') {
    $data = getJsonInput();

    sendJsonResponse(200, true, "POST request successful! Server received your payload.", [
        "method" => "POST",
        "received_data" => $data,
        "processed_at" => date("Y-m-d H:i:s")
    ]);
}

// Any other method
sendJsonResponse(405, false, "Method {$method} not allowed.");
