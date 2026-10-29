<?php
/**
 * Current User Authentication Check Endpoint
 * GET /api/auth/me.php
 *
 * Checks active PHP session and returns current user details.
 * Used on page reload to maintain persistent login.
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(405, false, "Method not allowed. Use GET.");
}

$user = getAuthenticatedUser();

if (!$user) {
    sendJsonResponse(401, false, "No active session found.");
}

sendJsonResponse(200, true, "Session active.", [
    "user" => $user,
    "csrf_token" => getCsrfToken()
]);
