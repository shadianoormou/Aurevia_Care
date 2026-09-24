import { useEffect, useRef, useState } from "react";

const GoogleAuthButton = ({ onCredential, onUnavailable, disabled = false }) => {
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const callbackRef = useRef(onCredential);
  const tokenClientRef = useRef(null);

  useEffect(() => { callbackRef.current = onCredential; }, [onCredential]);

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
            onUnavailable?.();
            return;
          }
          callbackRef.current?.({ accessToken: response.access_token });
        },
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
  }, [clientId, disabled, onUnavailable]);

  if (!clientId) {
    return <button type="button" disabled={disabled} onClick={onUnavailable} className="auth-google-fallback"><span className="auth-google-mark">G</span>Continue with Google</button>;
  }

  return (
    <button
      type="button"
      disabled={disabled || !ready}
      onClick={() => tokenClientRef.current?.requestAccessToken({ prompt: "select_account" })}
      className="auth-google-fallback"
    >
      <span className="auth-google-mark">G</span>Continue with Google
    </button>
  );
};

export default GoogleAuthButton;
