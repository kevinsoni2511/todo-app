<?php
/**
 * User Logout Endpoint
 * POST /api/auth/logout.php
 *
 * Clears session variables, removes session cookie, and destroys session.
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(405, false, "Method not allowed. Use POST.");
}

destroySession();

sendJsonResponse(200, true, "You have been logged out successfully.");
