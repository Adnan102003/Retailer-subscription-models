import { Link } from "react-router-dom";

const Home = () => {
  const modules = [
    { title: "Inventory Intake", desc: "Capture lot entries with owner details, quantity, and storage period in one flow." },
    { title: "Stock Monitoring", desc: "Track paid, approved, and active accounts for smooth storage operations." },
    { title: "Rental Billing", desc: "Manage annual subscriptions today and extend to rack-wise rent plans in future updates." },
    { title: "Approval Workflow", desc: "Use admin controls to approve only verified, paid customers for secure facility access." },
    { title: "Operations Dashboard", desc: "Get a clean view of registration health, pending reviews, and onboarding pipeline." },
    { title: "Notification Ready", desc: "Send timely status updates by email for approvals and account activation notices." }
  ];

  const inventoryUpdates = [
    "Real-time inventory onboarding status",
    "Pending and approved account visibility",
    "Payment readiness for rental activation",
    "Clear action queue for administrators"
  ];

  return (
    <div className="bg-slate-100">
      <section className="bg-gradient-to-b from-blue-950 to-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <p className="inline-block rounded-full border border-white/20 bg-white/10 px-6 py-2 text-lg font-semibold tracking-wide">
            COLD STORAGE MANAGEMENT SYSTEM
          </p>
          <h1 className="mt-8 text-4xl md:text-6xl font-bold leading-tight">
            Professional platform for cold storage
            <br />
            inventory and rental operations
          </h1>
          <p className="mt-6 text-lg md:text-2xl text-slate-300 leading-relaxed max-w-4xl mx-auto">
            Built to help you manage customer onboarding, inventory-related workflows, and rental lifecycle without operational delays.
          </p>
          <div className="mt-10 flex flex-col md:flex-row justify-center gap-4">
            <Link to="/register" className="rounded-xl bg-white text-blue-800 px-8 py-3 text-lg font-semibold">
              Create Account
            </Link>
            <Link to="/login" className="rounded-xl border border-white/40 px-8 py-3 text-lg font-semibold text-white">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-center text-blue-600 font-semibold tracking-[0.2em]">CORE MODULES</p>
        <h2 className="text-center text-4xl md:text-5xl font-bold text-slate-900 mt-4 leading-tight">
          Designed for day-to-day cold storage management
        </h2>
        <p className="text-center text-lg text-slate-600 mt-6 max-w-3xl mx-auto">
          Clean, recruiter-ready UI with practical modules focused on inventory, approvals, and future-ready rental workflows.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {modules.map((module) => (
            <article key={module.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">{module.title}</h3>
              <p className="mt-3 text-slate-600">{module.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-blue-700">INVENTORY UPDATES</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Operational visibility that helps decisions</h3>
            <ul className="mt-4 space-y-3 text-slate-700">
              {inventoryUpdates.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-blue-700">RENT MANAGEMENT</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Ready for inventory rental expansion</h3>
            <p className="mt-4 text-slate-600">
              Current flow supports subscription-based onboarding. The same structure can be extended for rack-wise rent, monthly billing,
              overdue alerts, and customer-level payment history.
            </p>
            <p className="mt-4 text-slate-700 font-medium">
              This positions your project as practical and scalable for real cold storage business needs.
            </p>
          </div>
        </div>
      </section>

      <section id="pricing" className="max-w-6xl mx-auto px-6 py-14">
        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 md:p-10">
          <p className="text-sm font-semibold tracking-[0.2em] text-blue-700">PRICING</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900">Simple annual plan for storage operators</h2>
          <p className="mt-4 text-slate-700">One annual plan to start operations. Add advanced inventory-rent modules as your business grows.</p>
          <p className="mt-5 text-4xl font-bold text-blue-700">
            Rs. 2,499 <span className="text-lg text-slate-600">/ year</span>
          </p>
        </div>
      </section>

      <section className="bg-blue-950 py-20 text-center text-white">
        <h2 className="text-4xl md:text-5xl font-bold">Run your cold storage platform professionally</h2>
        <p className="mt-5 text-lg md:text-xl text-slate-300">Start now and showcase a production-style management portal to recruiters.</p>
        <Link
          to="/register"
          className="mt-8 inline-block rounded-xl bg-white text-blue-800 px-8 py-3 text-lg font-semibold"
        >
          Get Started
        </Link>
      </section>
    </div>
  );
};

export default Home;

