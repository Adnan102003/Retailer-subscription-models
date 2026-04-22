import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const resolveErrorMessage = (err) => {
    if (!err.response) return "Server unavailable. Please ensure backend and MongoDB are running.";
    if (err.response?.data?.errors?.length) return err.response.data.errors[0].msg;
    return err.response?.data?.message || "Login failed";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      if (data.role === "admin") {
        localStorage.setItem("adminToken", data.token);
        localStorage.removeItem("token");
        navigate("/admin/dashboard");
        return;
      }

      await loginWithToken(data.token);
      localStorage.removeItem("adminToken");
      if (data.user?.mustChangePassword) {
        navigate("/dashboard");
        return;
      }
      if (!data.user?.selectedPlan || data.user?.subscriptionStatus === "expired") {
        navigate("/payment");
        return;
      }
      navigate("/chamber");
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-6">
      <div className="w-full max-w-5xl grid gap-6 lg:grid-cols-2">
        <div className="hidden lg:flex rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-900 p-10 text-white shadow-xl">
          <div className="my-auto space-y-5">
            <p className="inline-flex w-fit rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs tracking-wide uppercase">
              Welcome Back
            </p>
            <h1 className="text-4xl font-bold leading-tight">Manage your cold storage operations with confidence.</h1>
            <p className="text-white/90">
              Access your dashboard, track approvals, and monitor facility workflows from one secure platform.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-10">
          <div className="mb-7 space-y-2">
            <h2 className="text-3xl font-semibold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-600">Use your account credentials to continue.</p>
          </div>

          {error && <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email or Username
              </label>
              <input
                id="email"
                name="email"
                type="text"
                placeholder="you@example.com / username"
                value={form.email}
                onChange={onChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={onChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Please wait..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            New to ColdStore Pro?{" "}
            <Link to="/register" className="font-medium text-blue-700 hover:text-blue-800">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Login;

