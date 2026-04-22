import { useEffect, useState, useRef } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { api, API_ROOT, photoUrl } from "./api.js";

export default function FruitDetail() {
  const { customerId, fruitId } = useParams();
  const location = useLocation();
  const [c, setC] = useState(null);
  const [fruit, setFruit] = useState(null);
  const [open, setOpen] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [box, setBox] = useState(1);
  const [date, setDate] = useState("");
  const [rent, setRent] = useState("");
  const hashScrolled = useRef(false);

  const load = () =>
    api.get(`/customers/${customerId}`).then((r) => {
      setC(r.data);
      const f = (r.data.fruits || []).find((x) => String(x._id) === String(fruitId));
      setFruit(f || null);
    });

  useEffect(() => {
    load().catch(console.error);
  }, [customerId, fruitId]);

  useEffect(() => {
    if (!date) {
      const n = new Date();
      n.setMinutes(n.getMinutes() - n.getTimezoneOffset());
      setDate(n.toISOString().slice(0, 16));
    }
  }, [date]);

  useEffect(() => {
    const h = location.hash?.replace("#", "");
    if (h && fruit && !hashScrolled.current) {
      hashScrolled.current = true;
      setTimeout(() => {
        const el = document.getElementById(h);
        el?.scrollIntoView({ behavior: "smooth" });
        const idx = h.replace("boxEntity_", "");
        if (idx) setOpen((o) => ({ ...o, [idx]: true }));
      }, 400);
    }
  }, [location.hash, fruit]);

  if (!c || !fruit) return <p style={{ padding: 24 }}>Loading…</p>;

  const totalRentSum = (fruit.boxes || []).reduce((s, b) => s + (b.total_rent || 0), 0);

  async function addBox(e) {
    e.preventDefault();
    await api.post(`/customers/${customerId}/fruits/${fruitId}/boxes`, {
      box: parseInt(box, 10),
      date,
      rent_per_box: parseFloat(rent),
    });
    setShowAdd(false);
    load();
  }

  async function pay(boxId, amount, dt) {
    await api.post(`/customers/${customerId}/fruits/${fruitId}/boxes/${boxId}/pay`, {
      paid_amount: amount,
      paid_datetime: dt,
    });
    load();
  }

  async function removeBoxes(boxId, count, dt) {
    await api.post(`/customers/${customerId}/fruits/${fruitId}/boxes/${boxId}/remove`, {
      remove_box_count: count,
      remove_datetime: dt,
    });
    load();
  }

  async function delRemoved(boxId, idx) {
    if (!confirm("Delete this removed history?")) return;
    await api.delete(`/customers/${customerId}/fruits/${fruitId}/boxes/${boxId}/removed/${idx}`);
    load();
  }

  async function delEntity(boxId) {
    if (!confirm("Delete this entire box entity?")) return;
    await api.delete(`/customers/${customerId}/fruits/${fruitId}/boxes/${boxId}`);
    load();
  }

  function billUrl(boxId) {
    return `${API_ROOT}/api/chamber/bill/pdf/${customerId}/${fruitId}/${boxId}`;
  }

  async function openBill(boxId) {
    try {
      const res = await api.get(`/bill/pdf/${customerId}/${fruitId}/${boxId}`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      if (!w) {
        const a = document.createElement("a");
        a.href = url;
        a.download = "Fruit-Bill.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to download bill. Please login again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-blue-700 to-indigo-900 px-5 py-5 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link to={`/customers/${customerId}`} className="text-sm font-semibold text-white/90 hover:text-white">
              ← Back
            </Link>
            <div className="text-center sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Fruit</p>
              <h1 className="text-2xl font-bold">{fruit.fruitname}</h1>
              <p className="text-sm text-white/85">{c.name}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Boxes</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {(fruit.boxes || []).reduce((s, b) => s + Number(b.original_box ?? b.box ?? 0), 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Boxes</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {(fruit.boxes || []).reduce((s, b) => s + Number(b.box ?? 0), 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-rose-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Total Due</p>
                <p className="mt-1 text-lg font-semibold text-rose-800">₹{Number(totalRentSum).toLocaleString("en-IN")}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
            >
              + Add New Box
            </button>
          </div>
        </div>
      </div>

      {showAdd && (
        <form
          onSubmit={addBox}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-2">
            <h2 className="text-lg font-semibold text-slate-900">Add Box</h2>
            <p className="text-sm text-slate-600">Record incoming boxes with time and rent.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              Boxes
              <input type="number" min={1} required value={box} onChange={(e) => setBox(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Date &amp; time
              <input type="datetime-local" required value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Rent per box (₹)
              <input type="number" min={0} step="0.01" required value={rent} onChange={(e) => setRent(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
              Add
            </button>
            <button type="button" className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-300" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {(fruit.boxes || []).map((b, i) => (
          <div
            key={b._id}
            id={`boxEntity_${b._id}`}
            className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {new Date(b.date).toLocaleDateString("en-GB")} — {b.time}
                    </p>
                    <p className="text-sm text-slate-600">Box entity</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800" onClick={() => openBill(b._id)}>
                    Bill
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                    onClick={() =>
                      setOpen((o) => ({
                        ...o,
                        [`det_${b._id}`]: true,
                        [b._id]: !o[b._id],
                      }))
                    }
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                    onClick={() =>
                      setOpen((o) => ({
                        ...o,
                        [`det_${b._id}`]: true,
                        [`pay_${b._id}`]: !o[`pay_${b._id}`],
                      }))
                    }
                  >
                    Pay
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Stat label="Total" value={b.origBoxDisplay} />
                <Stat label="Current" value={b.box} />
                <Stat label="Duration" value={`${b.months}m ${b.rem_days}d`} />
                <Stat label="Rate" value={`₹${b.rent_per_box}`} />
                <Stat label="Store" value={`₹${Number(b.future_rent).toLocaleString("en-IN")}`} />
                <Stat label="Due" value={`₹${Math.abs(b.total_rent || 0).toLocaleString("en-IN")}${(b.total_rent || 0) < 0 ? " (Adv)" : ""}`} danger={(b.total_rent || 0) >= 0} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [`det_${b._id}`]: !o[`det_${b._id}`] }))}
              className="w-full border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              {open[`det_${b._id}`] ? "▲" : "▼"} Details
            </button>

            {open[`det_${b._id}`] && (
              <div className="border-t border-slate-200 bg-white px-5 py-4">
                {open[`pay_${b._id}`] && (
                  <PayForm
                    onSubmit={(amt, dt) => {
                      pay(b._id, amt, dt);
                      setOpen((o) => ({ ...o, [`pay_${b._id}`]: false }));
                    }}
                    onCancel={() => setOpen((o) => ({ ...o, [`pay_${b._id}`]: false }))}
                  />
                )}
                {open[b._id] && (
                  <RemoveForm
                    max={b.box}
                    onSubmit={(cnt, dt) => {
                      removeBoxes(b._id, cnt, dt);
                      setOpen((o) => ({ ...o, [b._id]: false }));
                    }}
                    onCancel={() => setOpen((o) => ({ ...o, [b._id]: false }))}
                  />
                )}
                {(b.removed?.length > 0 || b.paid?.length > 0) && (
                  <div className="mt-4">
                    <strong className="text-sm text-slate-900">History</strong>
                    {(b.removed || []).map((rem, ri) => (
                      <div key={ri} className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs">
                        <span>
                          Removed {rem.count} — ₹{rem.rent} ({rem.months} mo)
                        </span>
                        <button type="button" className="rounded-lg px-2 py-1 text-rose-700 hover:bg-rose-50" onClick={() => delRemoved(b._id, ri)}>
                          ✕
                        </button>
                      </div>
                    ))}
                    {(b.paid || []).map((p, pi) => (
                      <div key={pi} className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                        Paid ₹{p.amount} @ {p.datetime}
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" className="mt-4 w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700" onClick={() => delEntity(b._id)}>
                  Delete entity
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {(fruit.boxes || []).length === 0 && <p style={{ textAlign: "center", color: "#666" }}>No boxes yet.</p>}

      <SlideMenu customer={c} />
    </div>
  );
}

function Stat({ label, value, danger }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${danger ? "text-rose-700" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}

function PayForm({ onSubmit, onCancel }) {
  const [amt, setAmt] = useState("");
  const [dt, setDt] = useState(() => {
    const n = new Date();
    n.setMinutes(n.getMinutes() - n.getTimezoneOffset());
    return n.toISOString().slice(0, 16);
  });
  return (
    <form
      className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(parseFloat(amt), dt);
      }}
    >
      <input type="number" step="0.01" required placeholder="Amount" value={amt} onChange={(e) => setAmt(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
      <input type="datetime-local" required value={dt} onChange={(e) => setDt(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
          Record
        </button>
        <button type="button" className="flex-1 rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-300" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function RemoveForm({ max, onSubmit, onCancel }) {
  const [cnt, setCnt] = useState(1);
  const [dt, setDt] = useState(() => {
    const n = new Date();
    n.setMinutes(n.getMinutes() - n.getTimezoneOffset());
    return n.toISOString().slice(0, 16);
  });
  if (max <= 0) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        No boxes to remove
        <button type="button" className="ml-2 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-100" onClick={onCancel}>
          Close
        </button>
      </div>
    );
  }
  return (
    <form
      className="mt-3 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(parseInt(cnt, 10), dt);
      }}
    >
      <input type="number" min={1} max={max} required value={cnt} onChange={(e) => setCnt(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
      <input type="datetime-local" required value={dt} onChange={(e) => setDt(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">
          Remove
        </button>
        <button type="button" className="flex-1 rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-300" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function SlideMenu({ customer }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800"
      >
        ☰ Menu
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30"
          onClick={() => setOpen(false)}
        >
          <div
            className="h-full w-80 max-w-[80vw] bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => setOpen(false)} className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              ← Back
            </button>
            <div className="mt-5 flex items-center gap-3">
              {customer.photo ? (
                <img src={photoUrl(customer.photo)} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 font-bold text-white"
                >
                  {customer.name.charAt(0).toUpperCase()}
                </div>
              )}
              <strong>{customer.name}</strong>
            </div>
            <p className="mt-4 text-sm text-slate-600">Report / present boxes — coming soon (as in original app).</p>
          </div>
        </div>
      )}
    </>
  );
}

const inp = { width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" };
const btn = { padding: "8px 12px", border: "none", borderRadius: 8, background: "#1976d2", color: "#fff", cursor: "pointer" };
const mini = { padding: "4px 8px", fontSize: 11, border: "none", borderRadius: 4, background: "#1976d2", color: "#fff", cursor: "pointer" };
