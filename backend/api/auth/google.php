<?php
/**
 * Google OAuth 2.0 Authentication Endpoint
 * POST /api/auth/google.php
 *
 * Verifies Google ID Token (JWT) directly via Google's tokeninfo API,
 * finds or registers the user in MySQL, and sets up a secure PHP session.
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../config/db.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(405, false, "Method not allowed. Use POST.");
}

$input = getJsonInput();
$credential = trim($input['credential'] ?? '');

if (empty($credential)) {
    sendJsonResponse(422, false, "Missing Google credential token.");
}

$googleUserData = null;

// Support demo/testing credentials for local development if Google Client ID is pending
if (str_starts_with($credential, 'demo_google_')) {
    $googleUserData = [
        'sub' => 'google_demo_' . substr(md5($input['email'] ?? 'kevin.soni@example.com'), 0, 16),
        'email' => filter_var($input['email'] ?? 'kevin.soni@gmail.com', FILTER_VALIDATE_EMAIL) ?: 'kevin.soni@gmail.com',
        'name' => trim($input['name'] ?? 'Kevin Soni (Google)'),
        'picture' => $input['picture'] ?? 'https://lh3.googleusercontent.com/a/default-user=s96-c'
    ];
} else {
    // Verify real Google OAuth 2.0 ID Token using Google's official tokeninfo endpoint
    $verifyUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($credential);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $verifyUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_SSL_VERIFYPEER => false // Resilient against missing local SSL CA bundles in XAMPP
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || empty($response)) {
        sendJsonResponse(401, false, "Google authentication failed: Invalid or expired token.");
    }

    $decoded = json_decode($response, true);
    if (!is_array($decoded) || empty($decoded['sub']) || empty($decoded['email'])) {
        sendJsonResponse(401, false, "Invalid Google credential payload.");
    }

    $googleUserData = [
        'sub' => $decoded['sub'],
        'email' => strtolower(trim($decoded['email'])),
        'name' => trim($decoded['name'] ?? 'Google User'),
        'picture' => $decoded['picture'] ?? null
    ];
}

$db = getDBConnection();

$googleId = $googleUserData['sub'];
$email = $googleUserData['email'];
$name = $googleUserData['name'];
$picture = $googleUserData['picture'];

// 1. Check if user already exists by google_id OR email
$stmt = $db->prepare("SELECT id, name, email, google_id, avatar FROM users WHERE google_id = ? OR email = ? LIMIT 1");
$stmt->bind_param("ss", $googleId, $email);
$stmt->execute();
$result = $stmt->get_result();

$userId = null;
$userName = $name;
$userAvatar = $picture;

if ($result->num_rows > 0) {
    // Existing user: Link google_id and update avatar/name if missing
    $existing = $result->fetch_assoc();
    $userId = (int)$existing['id'];
    $userName = !empty($existing['name']) ? $existing['name'] : $name;
    $userAvatar = !empty($picture) ? $picture : ($existing['avatar'] ?? null);

    $updateStmt = $db->prepare("UPDATE users SET google_id = COALESCE(google_id, ?), avatar = COALESCE(?, avatar) WHERE id = ?");
    $updateStmt->bind_param("ssi", $googleId, $userAvatar, $userId);
    $updateStmt->execute();
    $updateStmt->close();
} else {
    // New user: Create account directly from Google Profile
    $insertStmt = $db->prepare("INSERT INTO users (name, email, google_id, avatar, password) VALUES (?, ?, ?, ?, NULL)");
    $insertStmt->bind_param("ssss", $name, $email, $googleId, $picture);
    $insertStmt->execute();
    $userId = (int)$insertStmt->insert_id;
    $insertStmt->close();
}

$stmt->close();

// 2. Establish authenticated session
initSession();
session_regenerate_id(true);

$_SESSION['user_id'] = $userId;
$_SESSION['user_name'] = $userName;
$_SESSION['user_email'] = $email;
$_SESSION['user_avatar'] = $userAvatar;

$csrfToken = getCsrfToken();

sendJsonResponse(200, true, "Google login successful! Welcome, {$userName}.", [
    "user" => [
        "id" => $userId,
        "name" => $userName,
        "email" => $email,
        "avatar" => $userAvatar
    ],
    "csrf_token" => $csrfToken
]);
