import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const AdminLogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const resolveErrorMessage = (err) => {
    if (!err.response) return "Server unavailable. Please ensure backend and MongoDB are running.";
    return err.response?.data?.message || "Admin login failed";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/admin/login", form);
      localStorage.setItem("adminToken", data.token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-6">
      <div className="w-full max-w-5xl grid gap-6 lg:grid-cols-2">
        <div className="hidden lg:flex rounded-3xl bg-gradient-to-br from-slate-900 to-blue-900 p-10 text-white shadow-xl">
          <div className="my-auto space-y-5">
            <p className="inline-flex w-fit rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs tracking-wide uppercase">
              Supervisor Console
            </p>
            <h1 className="text-4xl font-bold leading-tight">Control inventory approvals and facility access.</h1>
            <p className="text-white/85">
              Review incoming registrations, validate payment status, and keep your cold storage operations secure and compliant.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-10">
          <div className="mb-7 space-y-2">
            <h2 className="text-3xl font-semibold text-slate-900">Admin Sign in</h2>
            <p className="text-sm text-slate-600">Use authorized credentials to access the control panel.</p>
          </div>

          {error && <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Admin Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="admin@coldstore.com"
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
                placeholder="Enter your secure password"
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
              {loading ? "Please wait..." : "Access Admin Portal"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AdminLogin;

