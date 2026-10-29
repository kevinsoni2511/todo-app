import React from 'react';

/**
 * Toast Notification Component
 * Renders floating alerts for success, error, and info events with auto-dismiss.
 */
export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" role="status">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type || 'info'}`}
        >
          <span className="toast-icon">
            {toast.type === 'success' && '✨'}
            {toast.type === 'error' && '⚠️'}
            {toast.type === 'info' && '💡'}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="toast-close-btn"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
