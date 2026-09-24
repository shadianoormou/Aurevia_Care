import { useEffect, useRef, useState } from "react";

const GoogleAuthButton = ({ onCredential, onUnavailable, disabled = false }) => {
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const callbackRef = useRef(onCredential);
  const unavailableRef = useRef(onUnavailable);
  const tokenClientRef = useRef(null);

  useEffect(() => { callbackRef.current = onCredential; }, [onCredential]);
  useEffect(() => { unavailableRef.current = onUnavailable; }, [onUnavailable]);

  useEffect(() => {
    if (!clientId || disabled) return undefined;
    let attempts = 0;
    const setup = () => {
      if (!window.google?.accounts?.oauth2) return false;
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid email profile",
        callback: (response) => {
          if (response.error || !response.access_token) {
            unavailableRef.current?.("Google sign-in was cancelled or blocked. Please allow pop-ups and try again.");
            return;
          }
          callbackRef.current?.({ accessToken: response.access_token });
        },
        error_callback: () => unavailableRef.current?.("Google sign-in was blocked by the browser. Please allow pop-ups and try again."),
      });
      setReady(true);
      return true;
    };
    if (setup()) return undefined;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (setup() || attempts > 30) window.clearInterval(timer);
    }, 200);
    return () => window.clearInterval(timer);
  }, [clientId, disabled]);

  if (!clientId) {
    return <button type="button" disabled={disabled} onClick={() => unavailableRef.current?.("Google sign-in is not configured yet.")} className="auth-google-fallback"><span className="auth-google-mark">G</span>Continue with Google</button>;
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!tokenClientRef.current || !ready) {
          unavailableRef.current?.("Google sign-in is still loading. Please try again in a moment.");
          return;
        }
        try {
          tokenClientRef.current.requestAccessToken({ prompt: "select_account" });
        } catch {
          unavailableRef.current?.("Google sign-in was blocked by the browser. Please allow pop-ups and try again.");
        }
      }}
      className="auth-google-fallback"
    >
      <span className="auth-google-mark">G</span>Continue with Google
    </button>
  );
};

export default GoogleAuthButton;
