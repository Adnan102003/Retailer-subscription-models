import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, photoUrl } from "./api.js";

export default function CustomerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [fruitname, setFruitname] = useState("");
  const [chamber, setChamber] = useState("");
  const [showFruit, setShowFruit] = useState(false);
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const load = () => api.get(`/customers/${id}`).then((r) => {
    setC(r.data);
    setName(r.data.name);
    setPhone(r.data.phone);
    setAddress(r.data.address || "");
  });

  useEffect(() => {
    load().catch(() => nav("/customers"));
  }, [id, nav]);

  if (!c) return <p style={{ padding: 24 }}>Loading…</p>;

  let totalRent = 0;
  let totalPaid = 0;
  for (const f of c.fruits || []) {
    for (const b of f.boxes || []) {
      for (const rem of b.removed || []) totalRent += rem.rent || 0;
      for (const p of b.paid || []) totalPaid += p.amount || 0;
    }
  }
  const netRent = Math.max(0, totalRent - totalPaid);

  async function addFruit(e) {
    e.preventDefault();
    await api.post(`/customers/${id}/fruits`, { fruitname, chamber });
    setFruitname("");
    setChamber("");
    setShowFruit(false);
    load();
  }

  async function delFruit(fid) {
    if (!confirm("Delete this fruit?")) return;
    await api.delete(`/customers/${id}/fruits/${fid}`);
    load();
  }

  async function saveCustomer(e) {
    e.preventDefault();
    await api.patch(`/customers/${id}`, { name, phone, address });
    setEdit(false);
    load();
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link to="/customers" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
          ← Back
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEdit(true)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex items-center gap-4">
            {c.photo ? (
              <img
                src={photoUrl(c.photo)}
                alt=""
                className="h-20 w-20 rounded-full object-cover ring-4 ring-blue-100 sm:h-24 sm:w-24"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-2xl font-bold text-blue-700 ring-4 ring-blue-100 sm:h-24 sm:w-24">
                {c.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</p>
              <h1 className="text-2xl font-semibold text-slate-900">{c.name}</h1>
              <p className="text-sm text-slate-600">{c.phone}</p>
              <p className="text-sm text-slate-600">{c.address || "-"}</p>
            </div>
          </div>

          <div className="flex-1">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Rent</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">₹{Number(totalRent).toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paid</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">₹{Number(totalPaid).toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-2xl bg-rose-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Net Due</p>
                <p className="mt-1 text-xl font-semibold text-rose-800">₹{Number(netRent).toLocaleString("en-IN")}</p>
              </div>
            </div>

            {edit && (
              <form onSubmit={saveCustomer} className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
                <input value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                <input value={address} onChange={(e) => setAddress(e.target.value)} required className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                <div className="sm:col-span-3 flex gap-2">
                  <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-800">
                    Update
                  </button>
                  <button type="button" className="rounded-xl bg-rose-600 px-4 py-2.5 text-white hover:bg-rose-700" onClick={() => setEdit(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
            Total Fruits: {(c.fruits || []).length}
          </div>
          <button
            type="button"
            onClick={() => setShowFruit(true)}
            className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:from-blue-800 hover:to-indigo-800"
          >
            + Add Fruit
          </button>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">Available Fruits</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {(c.fruits || []).map((f) => (
              <div
                key={f._id}
                onClick={() => nav(`/customers/${id}/fruits/${f._id}`)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:shadow-md cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{f.fruitname}</p>
                  <p className="text-sm text-slate-600">Chamber: {f.chamber}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    delFruit(f._id);
                  }}
                  className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          {(c.fruits || []).length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
              No fruits yet. Add your first fruit to start tracking boxes.
            </div>
          )}
        </div>
      </div>

      {showFruit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={addFruit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-slate-900">Add Fruit</h3>
              <p className="text-sm text-slate-600">Create a fruit entry for this customer.</p>
            </div>
            <div className="grid gap-3">
              <label className="text-sm font-medium text-slate-700">
                Fruit name
                <input required value={fruitname} onChange={(e) => setFruitname(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Chamber
                <input required value={chamber} onChange={(e) => setChamber(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
              </label>
              <div className="mt-2 flex gap-2">
                <button type="submit" className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-800">
                  Save
                </button>
                <button type="button" className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-white hover:bg-rose-700" onClick={() => setShowFruit(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const inp = { display: "block", width: "100%", padding: 10, marginTop: 4, borderRadius: 6, border: "1px solid #ccc" };
const btn = { padding: 10, border: "none", borderRadius: 8, background: "#1976d2", color: "#fff", fontWeight: 600, cursor: "pointer" };
