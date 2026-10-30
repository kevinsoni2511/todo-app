<?php
/**
 * Database Configuration & Connection Handler
 * 
 * Uses MySQLi with Strict Error Reporting (throws exceptions on error)
 * and sets utf8mb4 character set for complete Unicode/emoji support.
 */

// Application Environment: 'development' displays debug info, 'production' hides internals
if (!defined('APP_ENV')) {
    define('APP_ENV', getenv('APP_ENV') ?: 'development');
}

// Database Credentials (Supports Render / TiDB / Aiven / Railway or Local XAMPP)
if (!defined('DB_HOST')) define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
if (!defined('DB_USER')) define('DB_USER', getenv('DB_USER') ?: 'root');
if (!defined('DB_PASS')) define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');
if (!defined('DB_NAME')) define('DB_NAME', getenv('DB_NAME') ?: 'todo_app');
if (!defined('DB_PORT')) define('DB_PORT', (int)(getenv('DB_PORT') ?: 3306));

// Enable MySQLi Exception Mode so errors throw mysqli_sql_exception instead of silent warnings
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

/**
 * Returns a reusable MySQLi database connection (Singleton pattern).
 *
 * @return mysqli Active MySQLi connection
 */
function getDBConnection(): mysqli {
    static $conn = null;

    if ($conn === null) {
        try {
            $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
            
            // Set charset to utf8mb4 to prevent character encoding issues & support emojis
            $conn->set_charset('utf8mb4');

        } catch (mysqli_sql_exception $e) {
            // Log error internally in server logs
            error_log("Database Connection Error: " . $e->getMessage());

            // Clean JSON error response for client - never expose raw DB passwords
            if (!headers_sent()) {
                header("Content-Type: application/json; charset=UTF-8");
                header("Access-Control-Allow-Origin: http://localhost:5173");
                header("Access-Control-Allow-Credentials: true");
                http_response_code(500);
            }

            $errorMessage = (APP_ENV === 'development')
                ? "Database connection failed: " . $e->getMessage()
                : "Internal server error. Database connection failed.";

            echo json_encode([
                "success" => false,
                "message" => $errorMessage
            ]);
            exit;
        }
    }

    return $conn;
}
