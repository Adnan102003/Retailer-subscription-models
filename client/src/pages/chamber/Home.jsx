import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "./api.js";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#1976d2",
  color: "#fff",
  padding: "12px 18px",
  borderRadius: "0 0 16px 16px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  position: "sticky",
  top: 0,
  zIndex: 100,
};

export default function Home() {
  const [badge, setBadge] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.post("/notifications/generate").catch(() => {});
  }, []);

  const hasSubscription =
    !!user?.subscriptionEndAt &&
    new Date(user.subscriptionEndAt) > new Date() &&
    ["active", "trial"].includes(user.subscriptionStatus);

  const handleProtectedNavigation = (path) => {
    if (hasSubscription) {
      navigate(path);
      return;
    }

    Swal.fire({
      icon: "warning",
      title: "Subscription Required",
      text: "Pehle subscription lo, phir is page ko access kar sakte ho.",
      confirmButtonText: "Go to Payment"
    }).then((result) => {
      if (result.isConfirmed) navigate("/payment");
    });
  };

  useEffect(() => {
    const load = () =>
      api
        .get("/notifications/count", { responseType: "text" })
        .then((r) => setBadge(parseInt(r.data, 10) || 0))
        .catch(() => setBadge(0));
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-6">
      <div className="w-full max-w-5xl grid gap-6 lg:grid-cols-2">
        <div className="hidden lg:flex rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-900 p-10 text-white shadow-xl">
          <div className="my-auto space-y-5">
            <p className="inline-flex w-fit rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs tracking-wide uppercase">
              Fruit Chamber
            </p>
            <h1 className="text-4xl font-bold leading-tight">Manage customers, chambers, boxes and bills.</h1>
            <p className="text-white/90">
              Quick actions and notifications are available on the right.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-semibold text-slate-900">Fruit Chamber</h2>
              <p className="text-sm text-slate-600">Choose where you want to go.</p>
            </div>
            <Link to="/notifications" className="relative rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 hover:bg-slate-100">
              <span className="sr-only">Notifications</span>
              {badge > 0 && (
                <span className="absolute -top-2 -right-2 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {badge}
                </span>
              )}
              🔔
            </Link>
          </div>

          <div className="mt-8 grid gap-3">
            <button type="button" onClick={() => handleProtectedNavigation("/chamber/dashboard")} className={actionBtn}>
              Dashboard
            </button>
            <button type="button" onClick={() => handleProtectedNavigation("/customers/new")} className={actionBtn}>
              New Customer
            </button>
            <button type="button" onClick={() => handleProtectedNavigation("/customers")} className={actionBtn}>
              Customer List
            </button>
            <button type="button" onClick={() => handleProtectedNavigation("/developer")} className={devBtn}>
              Developer
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const actionBtn =
  "w-full rounded-xl bg-slate-900 px-4 py-3 text-center font-medium text-white transition hover:bg-slate-800";
const devBtn =
  "w-full rounded-xl bg-emerald-700 px-4 py-3 text-center font-medium text-white transition hover:bg-emerald-800";
