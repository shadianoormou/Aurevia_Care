import { useEffect, useRef, useState } from "react";

const GoogleAuthButton = ({ onCredential, onUnavailable, disabled = false }) => {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || disabled) return undefined;
    let attempts = 0;
    const render = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return false;
      containerRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredential(response.credential),
        ux_mode: "popup",
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
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
  }, [clientId, disabled, onCredential]);

  if (!clientId) {
    return <button type="button" disabled={disabled} onClick={onUnavailable} className="auth-google-fallback"><span className="auth-google-mark">G</span>Continue with Google</button>;
  }

  return <div ref={containerRef} className={`auth-google-button ${ready ? "" : "opacity-60"}`} aria-label="Continue with Google" />;
};

export default GoogleAuthButton;
