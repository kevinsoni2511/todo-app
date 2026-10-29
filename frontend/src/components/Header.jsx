import React from 'react';

/**
 * Header Component
 * Displays app branding, live API status badge, test API trigger, and user profile information.
 */
export default function Header({ user, onLogout, apiStatus, onTestApi }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon">
          <span>✓</span>
        </div>
        <div>
          <h1 className="brand-title">TaskMaster <span className="brand-badge">Pro</span></h1>
          <p className="brand-subtitle">Smart Todo & Productivity Manager</p>
        </div>
      </div>

      <div className="header-actions">
        {/* Backend API Health Badge */}
        {apiStatus && (
          <div
            className={`api-status-badge ${apiStatus.connected ? 'online' : 'offline'}`}
            title={apiStatus.message}
          >
            <span className="status-dot"></span>
            <span>{apiStatus.connected ? 'PHP API: Connected' : 'PHP API: Offline'}</span>
          </div>
        )}

        {/* Quick API Test Button */}
        <button
          onClick={onTestApi}
          className="btn-test-api"
          title="Send a sample POST request to PHP Backend"
        >
          ⚡ Test API Call
        </button>

        <div className="date-badge">
          📅 <span>{today}</span>
        </div>

        {user && (
          <div className="user-profile">
            <div className="user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="btn-logout"
              title="Logout from your account"
            >
              Logout ⎋
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
