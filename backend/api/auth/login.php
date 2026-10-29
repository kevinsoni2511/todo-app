<?php
/**
 * User Login Endpoint with Brute-Force Rate Limiting & CSRF Generation
 * POST /api/auth/login.php
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/db.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(405, false, "Method not allowed. Use POST.");
}

// 1. Enforce Rate Limiting (max 5 failed attempts in 5 minutes)
checkLoginRateLimit();

$input = getJsonInput();

$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    sendJsonResponse(422, false, "Please enter both email and password.");
}

$db = getDBConnection();

// 2. Fetch user by email
$stmt = $db->prepare("SELECT id, name, email, password FROM users WHERE email = ? LIMIT 1");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    $stmt->close();
    recordFailedLoginAttempt();
    sendJsonResponse(401, false, "Invalid email or password.");
}

$user = $result->fetch_assoc();
$stmt->close();

// 3. Verify bcrypt password hash
if (!password_verify($password, $user['password'])) {
    recordFailedLoginAttempt();
    sendJsonResponse(401, false, "Invalid email or password.");
}

// 4. Reset rate-limiting counter upon successful login
resetLoginAttempts();

// 5. Establish secure session & generate fresh session ID (Anti-Fixation)
initSession();
session_regenerate_id(true);
$_SESSION['user_id'] = (int)$user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_email'] = $user['email'];

$csrfToken = getCsrfToken();

// 6. Return safe user info & CSRF token
sendJsonResponse(200, true, "Login successful! Welcome back.", [
    "user" => [
        "id" => (int)$user['id'],
        "name" => $user['name'],
        "email" => $user['email']
    ],
    "csrf_token" => $csrfToken
]);
