import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, photoUrl } from "./api.js";

export default function Customers() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const nav = useNavigate();

  const load = () => api.get("/customers").then((r) => setList(r.data));

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const filtered = list.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) || String(c.phone).includes(q)
  );

  async function remove(id, e) {
    e.stopPropagation();
    if (!confirm("Delete this customer?")) return;
    await api.delete(`/customers/${id}`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link to="/dashboard" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
          ← Back
        </Link>
        <p className="text-sm text-slate-600">Total Customers: <span className="font-semibold text-slate-900">{list.length}</span></p>
      </div>
      <input
        placeholder="Search…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      />
      {filtered.map((c) => (
        <div
          key={c._id}
          onClick={() => nav(`/customers/${c._id}`)}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:shadow-md cursor-pointer"
        >
          {c.photo ? (
            <img
              src={photoUrl(c.photo)}
              alt=""
              style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#e3f2fd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#1976d2",
              }}
            >
              {c.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div>
              <strong>Name:</strong> {c.name}
            </div>
            <div>
              <strong>Phone:</strong> {c.phone}
            </div>
            <div>
              <strong>Address:</strong> {c.address || "-"}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500">Document Photo</p>
            {c.photo ? (
              <a
                href={photoUrl(c.photo)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                Open
              </a>
            ) : (
              <span className="text-xs text-slate-400">Not uploaded</span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => remove(c._id, e)}
            className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
