import { useState, useEffect, useCallback } from 'react';
import api, { setCsrfToken } from '../services/api';

/**
 * Custom Hook: useAuth
 *
 * Manages user authentication state, session persistence,
 * login, registration, and logout operations.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if session cookie is already active on mount
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/auth/me.php');
      if (res.success && res.data && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      // 401 response means not logged in
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/api/auth/login.php', { email, password });
      if (res.success && res.data && res.data.user) {
        setUser(res.data.user);
        return { success: true };
      }
      throw new Error(res.message || 'Login failed.');
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Register handler
  const register = async (name, email, password, confirmPassword) => {
    setError(null);
    try {
      const res = await api.post('/api/auth/register.php', {
        name,
        email,
        password,
        confirm_password: confirmPassword
      });
      if (res.success && res.data && res.data.user) {
        setUser(res.data.user);
        return { success: true };
      }
      throw new Error(res.message || 'Registration failed.');
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/api/auth/logout.php', {});
    } catch (err) {
      console.warn('Logout request error:', err);
    } finally {
      setCsrfToken(null);
      setUser(null);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    checkAuth
  };
}

export default useAuth;
