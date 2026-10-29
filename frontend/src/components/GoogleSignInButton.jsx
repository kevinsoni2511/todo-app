import React, { useEffect, useRef, useState } from 'react';

/**
 * GoogleSignInButton Component
 *
 * Integrates Google Identity Services (GIS).
 * If a Google Client ID is set in VITE_GOOGLE_CLIENT_ID, it seamlessly initializes
 * and displays Google's official Sign In prompt/button.
 * If not yet configured, it offers a seamless 1-click test mode so developers and users
 * can test the Google OAuth flow immediately without setup friction.
 */
export default function GoogleSignInButton({ onGoogleSuccess, disabled = false, text = 'Continue with Google' }) {
  const [loading, setLoading] = useState(false);
  const [clientIdPrompt, setClientIdPrompt] = useState(false);
  const [customClientId, setCustomClientId] = useState('');
  const googleBtnContainerRef = useRef(null);

  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const activeClientId = customClientId || envClientId;

  useEffect(() => {
    if (!activeClientId) return;

    const initializeGoogle = () => {
      if (window.google?.accounts?.id && googleBtnContainerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: activeClientId,
            callback: (response) => {
              if (response?.credential) {
                setLoading(true);
                onGoogleSuccess(response.credential).finally(() => setLoading(false));
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true
          });

          // Render official Google button
          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'filled_black',
            size: 'large',
            width: 320,
            shape: 'pill',
            text: 'continue_with'
          });
        } catch (err) {
          console.warn('Google GSI initialization notice:', err);
        }
      }
    };

    // If script is already loaded
    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      // Poll briefly for script load
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initializeGoogle();
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [activeClientId, onGoogleSuccess]);

  const handleCustomButtonClick = () => {
    if (disabled || loading) return;

    if (activeClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      // One-click demo sign-in for effortless local testing
      setLoading(true);
      onGoogleSuccess('demo_google_oneclick', {
        email: 'kevin.soni@gmail.com',
        name: 'Kevin Soni (Google)',
        picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
      }).finally(() => setLoading(false));
    }
  };

  return (
    <div className="google-auth-wrapper">
      {/* Container for Official Google Button when Client ID is configured */}
      {activeClientId && (
        <div ref={googleBtnContainerRef} className="google-official-btn-container" />
      )}

      {/* Styled Glassmorphic Google Button */}
      {(!activeClientId || !window.google?.accounts?.id) && (
        <button
          type="button"
          onClick={handleCustomButtonClick}
          disabled={disabled || loading}
          className="btn-google-auth"
          title={activeClientId ? 'Sign in with Google' : 'Click to test Google Sign-in instantly (Demo Mode)'}
        >
          {loading ? (
            <span className="google-btn-spinner" />
          ) : (
            <svg className="google-icon" width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
          )}
          <span>{loading ? 'Authenticating with Google...' : text}</span>
        </button>
      )}

      {/* Helpful setup hint for production credentials */}
      {!envClientId && (
        <div className="google-setup-hint">
          <span>⚡ Quick 1-Click Google Test Active</span>
          <button
            type="button"
            className="link-setup-btn"
            onClick={() => setClientIdPrompt(!clientIdPrompt)}
          >
            {clientIdPrompt ? '✕ Close' : '⚙️ Custom Client ID'}
          </button>
        </div>
      )}

      {clientIdPrompt && !envClientId && (
        <div className="google-client-id-box">
          <input
            type="text"
            placeholder="Paste Google OAuth Client ID here..."
            value={customClientId}
            onChange={(e) => setCustomClientId(e.target.value.trim())}
            className="input-title google-id-input"
          />
          <p className="hint-text">
            Add <code>VITE_GOOGLE_CLIENT_ID</code> to <code>frontend/.env</code> to persist.
          </p>
        </div>
      )}
    </div>
  );
}
