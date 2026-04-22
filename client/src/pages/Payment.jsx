import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    const existing = document.getElementById("razorpay-js");
    if (existing) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Payment = () => {
  const { user, setUser } = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [tier, setTier] = useState("personal");

  const plans = [
    {
      id: "trial",
      name: "Free Trial",
      price: "Free",
      priceSub: "3 days",
      cta: "Start Free Trial",
      features: ["Access to Fruit Chamber", "Manage up to 5 customers", "Basic dashboard", "Email support", "Limited storage"]
    },
    {
      id: "monthly",
      name: "Monthly Plan",
      price: "₹499",
      priceSub: "per month",
      cta: "Subscribe to Monthly",
      features: ["Full access to Fruit Chamber", "Unlimited customers", "Advanced dashboard", "Priority email support", "Unlimited storage", "Customer notifications"],
      highlight: true,
    },
    {
      id: "yearly",
      name: "Yearly Plan",
      price: "₹4,999",
      priceSub: "per year",
      cta: "Subscribe to Yearly",
      features: ["Everything in Monthly", "20% cost savings", "Dedicated support", "API access", "Advanced analytics", "Custom integrations"],
    },
  ];

  const startPayment = async (planId) => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Razorpay SDK failed to load");

      const { data } = await api.post("/payment/create-order", { planId });
      const options = {
        key: data.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "ColdStore Pro",
        description: `ColdStore Pro — ${data.planName || planId} subscription`,
        order_id: data.orderId,
        handler: async function (response) {
          try {
            const verify = await api.post("/payment/verify", { ...response, planId });
            setUser((prev) => ({ ...prev, ...verify.data.user }));
            setMessage("Payment successful. Subscription activated.");
          } catch (err) {
            setError(err.response?.data?.message || "Payment verification failed");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || ""
        },
        theme: { color: "#0f172a" }
      };
      const rz = new window.Razorpay(options);
      rz.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const activateTrial = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await api.post("/payment/activate-trial");
      setUser((prev) => ({ ...prev, ...data.user }));
      setMessage(data.message || "Free trial activated.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to activate free trial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-10rem)] bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Upgrade your plan</h1>
          <p className="mt-2 text-sm text-slate-600">Choose a subscription to keep your account active.</p>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setTier("personal")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${tier === "personal" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
            >
              Personal
            </button>
            <button
              type="button"
              onClick={() => setTier("business")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${tier === "business" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
            >
              Business
            </button>
          </div>
        </div>

        {(message || error) && (
          <div className="mx-auto mt-6 max-w-3xl">
            {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
            {error && <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
          </div>
        )}

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const isActive = user?.selectedPlan === plan.id && user?.subscriptionStatus === "active";
            const isTrialActive = user?.selectedPlan === "trial" && user?.subscriptionStatus === "trial";
            const isSelected = selectedPlan === plan.id || isActive || (plan.id === "trial" && isTrialActive);
            const trialDisabled = plan.id === "trial" && (loading || user?.trialUsed);
            return (
              <div
                key={plan.id}
                className={`text-left rounded-3xl border p-6 shadow-sm transition ${
                  plan.highlight ? "border-slate-700 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"
                } ${isSelected ? "ring-2 ring-blue-500" : "hover:-translate-y-0.5 hover:shadow-md"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{plan.name}</h2>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                    </div>
                    <p className={`mt-1 text-xs ${plan.highlight ? "text-white/70" : "text-slate-600"}`}>{plan.priceSub}</p>
                  </div>
                  {isActive && (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${plan.highlight ? "bg-white/15 text-white" : "bg-emerald-100 text-emerald-800"}`}>
                      Active
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  {plan.id === "trial" ? (
                    <button
                      type="button"
                      disabled={trialDisabled || isTrialActive}
                      onClick={activateTrial}
                      className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isTrialActive ? "Trial Active" : user?.trialUsed ? "Trial Used" : plan.cta}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      disabled={loading || isActive}
                      className={`w-full rounded-2xl px-4 py-3 text-center text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                        plan.highlight ? "bg-white text-slate-900" : "bg-slate-900 text-white"
                      }`}
                    >
                      {isActive ? "Your current plan" : plan.cta}
                    </button>
                  )}
                </div>

                <ul className={`mt-5 space-y-2 text-sm ${plan.highlight ? "text-white/85" : "text-slate-700"}`}>
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className={`${plan.highlight ? "text-white/80" : "text-slate-500"}`}>✦</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.id === "trial" && (
                  <p className="mt-4 text-xs text-slate-500">
                    One-time trial. It expires automatically after 3 days.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          {(user?.subscriptionStatus === "active" || user?.subscriptionStatus === "trial") && user?.selectedPlan && (
            <p className="text-center text-sm text-slate-600">
              Active plan: <span className="font-semibold text-slate-900">{user.selectedPlan}</span>
            </p>
          )}
          <button
            onClick={() => startPayment(selectedPlan)}
            disabled={loading || selectedPlan === "trial" || (user?.selectedPlan === selectedPlan && user?.subscriptionStatus === "active")}
            className="mt-4 w-full rounded-2xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Processing..." : "Continue to payment"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Payment;

