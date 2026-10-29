<?php
/**
 * Shared Response Helper
 * 
 * Standardizes API JSON responses across all PHP endpoints.
 * Handles CORS headers, credentials, HTTP status codes, and pre-flight OPTIONS requests.
 */

/**
 * Applies required CORS headers for cross-origin requests from the React frontend.
 */
function setCorsHeaders(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    // Whitelist trusted origins: Netlify, Localtunnel, Ngrok, and localhost
    $isAllowed = false;
    if (!empty($origin)) {
        if (
            str_contains($origin, 'localhost') ||
            str_contains($origin, '127.0.0.1') ||
            str_ends_with($origin, '.netlify.app') ||
            str_ends_with($origin, '.loca.lt') ||
            str_ends_with($origin, '.ngrok-free.app') ||
            str_ends_with($origin, '.ngrok.io')
        ) {
            $isAllowed = true;
        }
    }

    if ($isAllowed) {
        header("Access-Control-Allow-Origin: {$origin}");
    } else {
        header("Access-Control-Allow-Origin: https://todo-app-by-kevin.netlify.app");
    }
    
    // Required to allow PHP session cookies in cross-origin requests
    header("Access-Control-Allow-Credentials: true");
    
    // Permitted HTTP methods
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    
    // Permitted HTTP headers
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Bypass-Tunnel-Reminder");

    // Automatically handle pre-flight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * Sends a structured JSON response and terminates script execution.
 *
 * @param int         $statusCode HTTP response code (e.g., 200, 201, 400, 401, 404, 500)
 * @param bool        $success    true for success, false for failure
 * @param string      $message    User-friendly status message
 * @param mixed|null  $data       Optional payload data
 */
function sendJsonResponse(int $statusCode, bool $success, string $message, $data = null): void {
    setCorsHeaders();
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code($statusCode);

    $response = [
        "success" => $success,
        "message" => $message
    ];

    if ($data !== null) {
        $response["data"] = $data;
    }

    echo json_encode($response, JSON_PRETTY_PRINT);
    exit;
}

/**
 * Parses and returns the JSON body from the incoming HTTP request.
 *
 * @return array Parsed associative array
 */
function getJsonInput(): array {
    $rawInput = file_get_contents('php://input');
    if (empty($rawInput)) {
        return [];
    }

    $decoded = json_decode($rawInput, true);
    if (!is_array($decoded)) {
        sendJsonResponse(400, false, "Invalid JSON payload provided.");
    }

    return $decoded;
}
