import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FiArrowRight, FiCheck, FiLock, FiMail, FiPhone, FiShield, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleAuthButton from "../components/GoogleAuthButton.jsx";

const Register = () => {
  const { register: registerUser, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [registerMode, setRegisterMode] = useState("email");
  const { register: fieldRegister, handleSubmit, watch, formState: { errors } } = useForm({ mode: "onBlur" });
  const password = watch("password", "");
  const strength = password.length >= 14 ? "Strong password" : password.length >= 10 ? "Good password" : "Use 10+ characters";

  const onGoogleCredential = useCallback(async (credential) => {
    setGoogleBusy(true);
    try { await googleLogin(credential); toast.success("Your Google account is ready."); navigate("/"); }
    catch (error) { toast.error(error.response?.data?.message || "Google sign-up could not be completed"); }
    finally { setGoogleBusy(false); }
  }, [googleLogin, navigate]);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await registerUser({ name: formData.name.trim(), email: formData.email?.trim() || undefined, phone: formData.phone?.trim() || undefined, password: formData.password });
      toast.success("Your secure care account is ready.");
      navigate("/");
    } catch (error) { toast.error(error.response?.data?.message || "Registration failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="auth-page-shell">
      <div className="auth-shell-grid">
        <aside className="auth-story">
          <div className="auth-story-mark"><img src="/aurevia-mark.svg" alt="" /></div>
          <p className="eyebrow-dark mt-8">Aurevia private care</p>
          <h1 className="font-display text-4xl leading-[.98] text-white mt-3">A calmer way<br /><em className="font-normal text-accent-200">to care for yourself.</em></h1>
          <p className="text-sm leading-6 text-primary-100 mt-6 max-w-sm">One account for pharmacist-reviewed prescriptions, considered essentials, orders and Bangladesh-wide care navigation.</p>
          <div className="auth-story-list"><p><FiCheck /> Source-attributed care contacts</p><p><FiCheck /> Private prescription vault</p><p><FiCheck /> One-tap order tracking</p></div>
        </aside>

        <section className="auth-card">
          <div className="flex items-center justify-between gap-4"><div><p className="eyebrow">Create your account</p><h2 className="font-display text-3xl text-primary-900 mt-2">Welcome to Aurevia.</h2><p className="text-sm text-slate-500 mt-2">Choose how you would like to create your secure account.</p></div><FiShield className="text-accent-600 text-2xl shrink-0" /></div>
          <div className="auth-method-switch" role="tablist" aria-label="Registration method"><button type="button" onClick={() => setRegisterMode("email")} className={registerMode === "email" ? "auth-method-active" : ""}><FiMail /> Email</button><button type="button" onClick={() => setRegisterMode("phone")} className={registerMode === "phone" ? "auth-method-active" : ""}><FiPhone /> Phone</button></div>
          <GoogleAuthButton onCredential={onGoogleCredential} onUnavailable={(message) => toast(message || "Google sign-up could not be opened.")} disabled={googleBusy || submitting} />
          <div className="auth-divider"><span>or continue with {registerMode}</span></div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <label className="auth-field"><span><FiUser /> Full name</span><input autoComplete="name" placeholder="Your name" {...fieldRegister("name", { required: "Your name is required" })} />{errors.name && <small>{errors.name.message}</small>}</label>
            {registerMode === "email" ? <label className="auth-field"><span><FiMail /> Email address</span><input type="email" autoComplete="email" placeholder="you@example.com" {...fieldRegister("email", { required: "Email is required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" } })} />{errors.email && <small>{errors.email.message}</small>}</label> : <label className="auth-field"><span><FiPhone /> Bangladesh phone number</span><input type="tel" autoComplete="tel" placeholder="017XXXXXXXX" {...fieldRegister("phone", { required: "Phone number is required", pattern: { value: /^(?:\+?880|0)1\d{9}$/, message: "Use a valid Bangladesh phone number" } })} />{errors.phone && <small>{errors.phone.message}</small>}</label>}
            {registerMode === "email" && <label className="auth-field"><span><FiPhone /> Phone <i>optional</i></span><input type="tel" autoComplete="tel" placeholder="017XXXXXXXX" {...fieldRegister("phone", { pattern: { value: /^(?:\+?880|0)1\d{9}$/, message: "Use a valid Bangladesh phone number" } })} />{errors.phone && <small>{errors.phone.message}</small>}</label>}
            {registerMode === "phone" && <label className="auth-field"><span><FiMail /> Email <i>optional</i></span><input type="email" autoComplete="email" placeholder="you@example.com" {...fieldRegister("email", { pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" } })} />{errors.email && <small>{errors.email.message}</small>}</label>}
            <label className="auth-field"><span><FiLock /> Password</span><input type="password" autoComplete="new-password" placeholder="At least 10 characters" {...fieldRegister("password", { required: "Password is required", minLength: { value: 10, message: "Use at least 10 characters" } })} />{errors.password && <small>{errors.password.message}</small>}<em className={password.length >= 10 ? "auth-strength-ok" : ""}>{strength}</em></label>
            <label className="auth-field"><span><FiLock /> Confirm password</span><input type="password" autoComplete="new-password" placeholder="Repeat your password" {...fieldRegister("confirmPassword", { required: "Please confirm your password", validate: (value) => value === password || "Passwords do not match" })} />{errors.confirmPassword && <small>{errors.confirmPassword.message}</small>}</label>
            <button type="submit" disabled={submitting || googleBusy} className="auth-submit">{submitting ? "Creating your account…" : "Create secure account"}<FiArrowRight /></button>
          </form>
          <p className="auth-legal">By continuing, you agree to use Aurevia Care as a pharmacy and care-navigation service—not as a diagnostic replacement.</p>
          <p className="text-sm text-slate-500 text-center mt-5">Already have an account? <Link to="/login" className="font-extrabold text-primary-700 hover:text-accent-700">Sign in</Link></p>
        </section>
      </div>
    </div>
  );
};

export default Register;
