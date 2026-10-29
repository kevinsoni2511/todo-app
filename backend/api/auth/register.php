<?php
/**
 * User Registration Endpoint
 * POST /api/auth/register.php
 *
 * Validates registration input, enforces email uniqueness,
 * securely hashes passwords with bcrypt, inserts into MySQL,
 * and creates a secure PHP session.
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/db.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(405, false, "Method not allowed. Use POST.");
}

$input = getJsonInput();

$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$confirmPassword = $input['confirm_password'] ?? '';

// 1. Validation
if (empty($name) || empty($email) || empty($password)) {
    sendJsonResponse(422, false, "Name, email, and password are required.");
}

if (strlen($name) < 2 || strlen($name) > 100) {
    sendJsonResponse(422, false, "Name must be between 2 and 100 characters.");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJsonResponse(422, false, "Please provide a valid email address.");
}

if (strlen($password) < 6) {
    sendJsonResponse(422, false, "Password must be at least 6 characters long.");
}

if ($password !== $confirmPassword) {
    sendJsonResponse(422, false, "Passwords do not match.");
}

$db = getDBConnection();

// 2. Check for duplicate email using prepared statement
$checkStmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
$checkStmt->bind_param("s", $email);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows > 0) {
    $checkStmt->close();
    sendJsonResponse(409, false, "An account with this email already exists.");
}
$checkStmt->close();

// 3. Hash password securely using standard bcrypt
$passwordHash = password_hash($password, PASSWORD_BCRYPT);

// 4. Insert user record
$insertStmt = $db->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
$insertStmt->bind_param("sss", $name, $email, $passwordHash);

if (!$insertStmt->execute()) {
    $insertStmt->close();
    sendJsonResponse(500, false, "Registration failed due to a server error.");
}

$userId = $insertStmt->insert_id;
$insertStmt->close();

// 5. Establish secure session for the new user
initSession();
session_regenerate_id(true); // Prevent session fixation attacks
$_SESSION['user_id'] = $userId;
$_SESSION['user_name'] = $name;
$_SESSION['user_email'] = $email;

$csrfToken = getCsrfToken();

// 6. Return success response (never return password hash)
sendJsonResponse(201, true, "Registration successful! Welcome to TaskMaster.", [
    "user" => [
        "id" => $userId,
        "name" => $name,
        "email" => $email
    ],
    "csrf_token" => $csrfToken
]);
