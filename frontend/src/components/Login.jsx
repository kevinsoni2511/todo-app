import React, { useState } from 'react';
import GoogleSignInButton from './GoogleSignInButton';

/**
 * Login Component
 * Provides clean, modern login form with email & password validation.
 */
export default function Login({ onLogin, onGoogleLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setSubmitting(true);
    const result = await onLogin(email.trim(), password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.message || 'Invalid email or password.');
    }
  };

  const handleGoogleAuth = async (credential, profileData) => {
    if (!onGoogleLogin) return;
    setError('');
    const result = await onGoogleLogin(credential, profileData);
    if (!result.success) {
      setError(result.message || 'Google Sign-in failed.');
    }
  };

  return (
    <div className="auth-card-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand-icon">✓</div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to access your personal tasks</p>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        {onGoogleLogin && (
          <>
            <GoogleSignInButton
              onGoogleSuccess={handleGoogleAuth}
              disabled={submitting}
              text="Continue with Google"
            />

            <div className="auth-divider">
              <span>OR CONTINUE WITH EMAIL</span>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="input-title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-title"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-submit auth-btn"
          >
            {submitting ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Don't have an account? </span>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="auth-link-btn"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}
