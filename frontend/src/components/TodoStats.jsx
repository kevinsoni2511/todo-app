import React from 'react';

/**
 * TodoStats Component
 * Displays dashboard metrics: Total, Completed, Pending, Overdue, and Progress bar.
 */
export default function TodoStats({ stats }) {
  const { total = 0, completed = 0, pending = 0, overdue = 0 } = stats;

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="stats-dashboard">
      <div className="stats-cards-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper total">📋</div>
          <div className="stat-content">
            <span className="stat-label">Total Tasks</span>
            <span className="stat-value">{total}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper pending">⏳</div>
          <div className="stat-content">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{pending}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper completed">✅</div>
          <div className="stat-content">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{completed}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper overdue">⚠️</div>
          <div className="stat-content">
            <span className="stat-label">Overdue</span>
            <span className="stat-value">{overdue}</span>
          </div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-label-row">
          <span className="progress-title">Overall Progress</span>
          <span className="progress-percentage">{percentage}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
