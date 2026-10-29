<?php
/**
 * Backend API Entry Point & Health Check
 */

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include database connection
require_once __DIR__ . '/config/db.php';

try {
    $db = getDBConnection();
    
    // Check if tables exist
    $tablesResult = $db->query("SHOW TABLES LIKE 'todos'");
    $tablesExist = $tablesResult->num_rows > 0;

    echo json_encode([
        "success" => true,
        "message" => "Todo App PHP Backend API is running successfully!",
        "database" => [
            "status" => "connected",
            "name" => DB_NAME,
            "tables_ready" => $tablesExist,
            "server_info" => $db->server_info
        ],
        "timestamp" => date("Y-m-d H:i:s")
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server Error: " . $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
