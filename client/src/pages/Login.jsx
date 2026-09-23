import { useCallback, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FiArrowRight, FiLock, FiMail, FiShield } from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleAuthButton from "../components/GoogleAuthButton.jsx";

const Login = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ mode: "onBlur" });

  const onGoogleCredential = useCallback(async (credential) => {
    setGoogleBusy(true);
    try { await googleLogin(credential); toast.success("Welcome back to Aurevia."); navigate(searchParams.get("redirect") || "/"); }
    catch (error) { toast.error(error.response?.data?.message || "Google sign-in could not be completed"); }
    finally { setGoogleBusy(false); }
  }, [googleLogin, navigate, searchParams]);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try { await login(formData.identifier.trim(), formData.password); toast.success("Welcome back."); navigate(searchParams.get("redirect") || "/"); }
    catch (error) { toast.error(error.response?.data?.message || "Sign-in failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="auth-page-shell">
      <div className="auth-shell-grid auth-shell-login">
        <aside className="auth-story"><div className="auth-story-mark"><img src="/aurevia-mark.svg" alt="" /></div><p className="eyebrow-dark mt-8">Aurevia private care</p><h1 className="font-display text-4xl leading-[.98] text-white mt-3">Good care begins<br /><em className="font-normal text-accent-200">with context.</em></h1><p className="text-sm leading-6 text-primary-100 mt-6 max-w-sm">Return to your prescriptions, curated essentials and source-attributed Bangladesh care guide.</p><div className="auth-story-list"><p><FiShield /> Encrypted session cookies</p><p><FiShield /> Pharmacist-reviewed fulfilment</p></div></aside>
        <section className="auth-card">
          <div className="flex items-center justify-between gap-4"><div><p className="eyebrow">Secure sign in</p><h2 className="font-display text-3xl text-primary-900 mt-2">Welcome back.</h2><p className="text-sm text-slate-500 mt-2">Use your email, phone number or Google account.</p></div><FiShield className="text-accent-600 text-2xl shrink-0" /></div>
          <GoogleAuthButton onCredential={onGoogleCredential} onUnavailable={() => toast("Google sign-in needs a configured OAuth client.")} disabled={googleBusy || submitting} />
          <div className="auth-divider"><span>or use email or phone</span></div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <label className="auth-field"><span><FiMail /> Email or phone number</span><input autoComplete="username" placeholder="you@example.com or 017XXXXXXXX" {...register("identifier", { required: "Email or phone number is required" })} />{errors.identifier && <small>{errors.identifier.message}</small>}</label>
            <label className="auth-field"><span><FiLock /> Password</span><input type="password" autoComplete="current-password" placeholder="Your password" {...register("password", { required: "Password is required" })} />{errors.password && <small>{errors.password.message}</small>}</label>
            <button type="submit" disabled={submitting || googleBusy} className="auth-submit">{submitting ? "Signing you in…" : "Sign in securely"}<FiArrowRight /></button>
          </form>
          <p className="auth-legal">Aurevia Care uses secure HTTP-only sessions. Never share your password or one-time verification code.</p>
          <p className="text-sm text-slate-500 text-center mt-5">New to Aurevia? <Link to="/register" className="font-extrabold text-primary-700 hover:text-accent-700">Create an account</Link></p>
        </section>
      </div>
    </div>
  );
};

export default Login;
