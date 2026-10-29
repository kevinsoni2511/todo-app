import React, { useState } from 'react';

/**
 * Register Component
 * Provides user registration form with name, email, password, and confirm password fields.
 */
export default function Register({ onRegister, onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const result = await onRegister(name.trim(), email.trim(), password, confirmPassword);
    setSubmitting(false);

    if (!result.success) {
      setError(result.message || 'Registration failed.');
    }
  };

  return (
    <div className="auth-card-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand-icon">✨</div>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join TaskMaster to manage your daily productivity</p>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reg-name" className="form-label">
              Full Name <span className="required">*</span>
            </label>
            <input
              id="reg-name"
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="input-title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">
              Email Address <span className="required">*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">
              Password (min. 6 characters) <span className="required">*</span>
            </label>
            <input
              id="reg-password"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirm" className="form-label">
              Confirm Password <span className="required">*</span>
            </label>
            <input
              id="reg-confirm"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="input-title"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-submit auth-btn"
          >
            {submitting ? 'Creating Account...' : 'Sign Up →'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account? </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="auth-link-btn"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
