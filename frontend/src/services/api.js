/**
 * API Service Layer — Native Fetch Wrapper
 *
 * Centralizes all HTTP communication between React and the PHP backend.
 * Features:
 * - Standardized API base URL
 * - Credentials included (`credentials: 'include'`) for cookie-based PHP sessions
 * - Automatic CSRF Token injection on state-changing requests (POST, PUT, DELETE)
 * - Automatic JSON serialization and parsing
 * - Comprehensive HTTP status code and network error handling
 */

// Configurable API URL for Netlify production vs localhost development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/todo-app/backend';

// In-memory CSRF token store (never stored in localStorage for maximum security)
let currentCsrfToken = null;

export const setCsrfToken = (token) => {
  currentCsrfToken = token;
};

export const getCsrfToken = () => currentCsrfToken;

/**
 * Core HTTP Request Function
 *
 * @param {string} endpoint - API path (e.g., '/api/todos/list.php')
 * @param {object} options  - fetch options (method, body, custom headers)
 * @returns {Promise<any>} Parsed response data
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  // Automatically attach CSRF token to state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && currentCsrfToken) {
    headers['X-CSRF-Token'] = currentCsrfToken;
  }

  const config = {
    method,
    headers,
    // CRITICAL: 'include' tells browser to send and receive PHP session cookies across ports
    credentials: 'include',
    ...options,
  };

  // Automatically JSON stringify body objects if present
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    // Safely check if response is valid JSON
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}`);
    }

    // Auto-capture CSRF token if returned in response
    if (data && data.data && data.data.csrf_token) {
      setCsrfToken(data.data.csrf_token);
    }

    // Check HTTP status code (200-299 is ok)
    if (!response.ok) {
      const errorMessage = data.message || `HTTP Error ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    // Check application-level success property
    if (data.success === false) {
      throw new Error(data.message || 'Server reported an unsuccessful operation.');
    }

    return data;
  } catch (error) {
    if (!error.status) {
      console.error(`[Network Error] Unable to connect to ${url}. Is Apache running?`, error);
    } else {
      console.error(`[API Error ${error.status}] ${url}:`, error.message);
    }
    throw error;
  }
}

/**
 * Convenience methods for HTTP verbs
 */
export const api = {
  get: (endpoint, headers) => apiRequest(endpoint, { method: 'GET', headers }),
  post: (endpoint, body, headers) => apiRequest(endpoint, { method: 'POST', body, headers }),
  put: (endpoint, body, headers) => apiRequest(endpoint, { method: 'PUT', body, headers }),
  delete: (endpoint, body, headers) => apiRequest(endpoint, { method: 'DELETE', body, headers }),
};

export default api;
