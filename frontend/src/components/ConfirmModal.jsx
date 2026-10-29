import React, { useEffect } from 'react';

/**
 * ConfirmModal Component
 * Replaces native browser alert/confirm popups with an elegant, accessible modal.
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel
}) {
  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-icon-wrapper">
          <span className="modal-icon">⚠️</span>
        </div>

        <h3 id="modal-title" className="modal-title">
          {title}
        </h3>

        <p className="modal-message">{message}</p>

        <div className="modal-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-modal-cancel"
            autoFocus
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`btn-modal-confirm variant-${confirmVariant}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
