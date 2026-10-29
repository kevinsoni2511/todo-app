import React, { useState } from 'react';
import { getApiBaseUrl, setApiBaseUrl, api } from '../services/api';

/**
 * BackendModal Component
 *
 * Allows users to inspect, test, or reconfigure the live PHP backend API URL.
 * Particularly helpful when accessing the Netlify production app from mobile devices
 * where localhost is inaccessible and a tunnel (e.g. localtunnel / ngrok) is needed.
 */
export default function BackendModal({ isOpen, onClose, onSave }) {
  const [customUrl, setCustomUrl] = useState(getApiBaseUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      setApiBaseUrl(customUrl);
      const res = await api.get('/api/auth/me.php');
      setTestResult({
        success: true,
        message: 'Connected successfully to PHP backend!'
      });
    } catch (err) {
      // 401 still means API is reachable and alive
      if (err.status === 401) {
        setTestResult({
          success: true,
          message: 'Connected! PHP Backend is online and responding.'
        });
      } else {
        setTestResult({
          success: false,
          message: err.message || 'Could not connect to this URL.'
        });
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setApiBaseUrl(customUrl);
    if (onSave) onSave(customUrl);
    onClose();
  };

  const handleReset = () => {
    setApiBaseUrl('');
    setCustomUrl(getApiBaseUrl());
    setTestResult(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon">⚙️</div>
          <h3 className="modal-title">PHP Backend Connection</h3>
        </div>

        <p className="modal-message">
          Your frontend is running in the cloud (Netlify). To perform login, registration, and save tasks,
          your browser must connect to an active PHP & MySQL backend.
        </p>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">PHP Backend Base URL:</label>
          <input
            type="text"
            value={customUrl}
            onChange={(e) => {
              setCustomUrl(e.target.value);
              setTestResult(null);
            }}
            placeholder="https://your-tunnel-or-server.loca.lt/todo-app/backend"
            className="input-title"
            style={{ width: '100%', fontSize: '13px' }}
          />
        </div>

        {testResult && (
          <div
            className={`test-result-badge ${testResult.success ? 'test-success' : 'test-failed'}`}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '18px',
              background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              border: `1px solid ${testResult.success ? '#10b981' : '#f43f5e'}`,
              color: testResult.success ? '#10b981' : '#f43f5e',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{testResult.success ? '✓' : '⚠️'}</span>
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="modal-actions" style={{ flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="btn-modal-cancel"
            style={{ flex: '1 1 120px', background: 'rgba(99, 102, 241, 0.2)', color: '#c7d2fe', border: '1px solid #6366f1' }}
          >
            {testing ? 'Pinging API...' : '⚡ Test Connection'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="btn-modal-confirm"
            style={{ flex: '1 1 120px', background: 'var(--primary)' }}
          >
            Save & Connect
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="btn-modal-cancel"
            style={{ width: '100%', marginTop: '6px', fontSize: '12px' }}
          >
            ↺ Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}
