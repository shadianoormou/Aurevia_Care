import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await login(formData.email, formData.password);
      toast.success("Welcome back!");
      navigate(searchParams.get("redirect") || "/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Welcome Back</h1>
        <p className="text-sm text-gray-500 text-center mt-1">Log in to your MediMart AI account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              {...register("email", { required: "Email is required" })}
              className="input-field mt-1"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-600">Password</label>
            <input
              type="password"
              {...register("password", { required: "Password is required" })}
              className="input-field mt-1"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary-600 font-medium">Register</Link>
        </p>

        <div className="mt-6 border-t border-gray-100 pt-4 text-xs text-gray-400 text-center">
          Demo admin: admin@medimart.ai / Admin@12345
        </div>
      </div>
    </div>
  );
};

export default Login;
