<?php
/**
 * Authentication Helper, CSRF Protection & Session Manager
 *
 * Configures secure PHP session cookies (HttpOnly, SameSite),
 * CSRF token generation and validation, brute-force rate limiting,
 * and authentication guards.
 */

require_once __DIR__ . '/response.php';

/**
 * Initializes a secure session with hardened cookie parameters.
 */
function initSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 86400 * 7, // 7 days session
            'path' => '/',
            'domain' => '',
            'secure' => false, // false for HTTP local development, true for production HTTPS
            'httponly' => true, // Prevents malicious JavaScript from accessing the session cookie (anti-XSS)
            'samesite' => 'Lax' // Allows session cookie across localhost ports (5173 -> 80)
        ]);

        session_start();
    }
}

/**
 * Generates or retrieves the active cryptographically secure CSRF token.
 *
 * @return string 64-character hexadecimal token
 */
function getCsrfToken(): string {
    initSession();

    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

/**
 * Validates CSRF token for state-changing HTTP methods (POST, PUT, DELETE).
 * Protects session-authenticated users from Cross-Site Request Forgery.
 */
function validateCsrfToken(): void {
    $method = $_SERVER['REQUEST_METHOD'];

    // Only validate state-changing methods
    if (in_array($method, ['POST', 'PUT', 'DELETE'], true)) {
        initSession();

        // Check header first (HTTP_X_CSRF_TOKEN)
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;

        // Fallback to request body if not in header
        if (!$token) {
            $rawInput = file_get_contents('php://input');
            if (!empty($rawInput)) {
                $decoded = json_decode($rawInput, true);
                if (is_array($decoded) && isset($decoded['csrf_token'])) {
                    $token = $decoded['csrf_token'];
                }
            }
        }

        $sessionToken = $_SESSION['csrf_token'] ?? '';

        // Constant-time string comparison protects against timing attacks
        if (empty($token) || empty($sessionToken) || !hash_equals($sessionToken, $token)) {
            sendJsonResponse(403, false, "Forbidden: Invalid or missing CSRF token. Please refresh the page.");
        }
    }
}

/**
 * Checks login rate limiting to prevent brute-force attacks.
 * Max 5 failed attempts in 5 minutes.
 */
function checkLoginRateLimit(): void {
    initSession();

    $maxAttempts = 5;
    $lockoutDuration = 300; // 5 minutes (in seconds)

    $attempts = $_SESSION['login_failed_attempts'] ?? 0;
    $lastAttemptTime = $_SESSION['login_last_attempt_time'] ?? 0;

    if ($attempts >= $maxAttempts) {
        $elapsed = time() - $lastAttemptTime;
        if ($elapsed < $lockoutDuration) {
            $remaining = $lockoutDuration - $elapsed;
            sendJsonResponse(429, false, "Too many failed login attempts. Please wait {$remaining} seconds before trying again.");
        } else {
            // Lockout period expired; reset counter
            $_SESSION['login_failed_attempts'] = 0;
            unset($_SESSION['login_last_attempt_time']);
        }
    }
}

/**
 * Increments failed login count.
 */
function recordFailedLoginAttempt(): void {
    initSession();
    $_SESSION['login_failed_attempts'] = ($_SESSION['login_failed_attempts'] ?? 0) + 1;
    $_SESSION['login_last_attempt_time'] = time();
}

/**
 * Resets failed login count upon successful authentication.
 */
function resetLoginAttempts(): void {
    initSession();
    $_SESSION['login_failed_attempts'] = 0;
    unset($_SESSION['login_last_attempt_time']);
}

/**
 * Returns current authenticated user or null.
 */
function getAuthenticatedUser(): ?array {
    initSession();

    if (isset($_SESSION['user_id']) && !empty($_SESSION['user_id'])) {
        return [
            'id' => (int)$_SESSION['user_id'],
            'name' => $_SESSION['user_name'] ?? 'User',
            'email' => $_SESSION['user_email'] ?? ''
        ];
    }

    return null;
}

/**
 * Authentication & CSRF Guard
 * Verifies active session AND validates CSRF token for state-changing requests.
 *
 * @return array Authenticated user details
 */
function requireAuth(): array {
    $user = getAuthenticatedUser();

    if (!$user) {
        sendJsonResponse(401, false, "Unauthorized. Please log in to continue.");
    }

    // Automatically enforce CSRF protection on authenticated state-changing requests
    validateCsrfToken();

    return $user;
}

/**
 * Safely destroys the session and clears the session cookie.
 */
function destroySession(): void {
    initSession();
    $_SESSION = [];

    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }

    session_destroy();
}
