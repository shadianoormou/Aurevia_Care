import { useEffect, useRef, useState } from "react";

const configuredClients = new Set();
const credentialCallbacks = new Map();

const GoogleAuthButton = ({ onCredential, onUnavailable, disabled = false }) => {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const callbackRef = useRef(onCredential);

  useEffect(() => { callbackRef.current = onCredential; }, [onCredential]);

  useEffect(() => {
    if (!clientId || disabled) return undefined;
    let attempts = 0;
    const render = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return false;
      containerRef.current.replaceChildren();
      credentialCallbacks.set(clientId, (credential) => callbackRef.current?.(credential));
      if (!configuredClients.has(clientId)) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => credentialCallbacks.get(clientId)?.(response.credential),
          ux_mode: "popup",
        });
        configuredClients.add(clientId);
      }
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        // `continue_with` is personalized by Google to "Continue as …" for
        // the last account used in the browser. Keep the shared auth surface
        // neutral so every visitor can choose their own Google account.
        text: "signin_with",
        width: 360,
      });
      setReady(true);
      return true;
    };
    if (render()) return undefined;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (render() || attempts > 30) window.clearInterval(timer);
    }, 200);
    return () => window.clearInterval(timer);
  }, [clientId, disabled]);

  if (!clientId) {
    return <button type="button" disabled={disabled} onClick={onUnavailable} className="auth-google-fallback"><span className="auth-google-mark">G</span>Continue with Google</button>;
  }

  const handleGoogleClick = () => {
    if (disabled || !ready) return;
    if (window.google?.accounts?.id) {
      // Use the official One Tap prompt from our neutral button. This keeps
      // the visible label generic while still opening Google's account flow.
      window.google.accounts.id.prompt();
    } else {
      onUnavailable?.();
    }
  };

  // Google personalizes its hosted iframe label to the last browser account
  // (for example, "Sign in as Shadia"). Keep the visible surface neutral;
  // the transparent hosted button remains on top to preserve Google's secure
  // OAuth flow and account picker.
  return (
    <div className={`auth-google-button-wrap ${ready ? "" : "opacity-60"}`}>
      <button type="button" disabled={disabled || !ready} onClick={handleGoogleClick} className="auth-google-custom">
        <span className="auth-google-mark">G</span>Continue with Google
      </button>
      <div ref={containerRef} className="auth-google-provider" aria-hidden="true" />
    </div>
  );
};

export default GoogleAuthButton;
