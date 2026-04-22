import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api.js";

function formatMonthsAndDays(days) {
  const d = Math.floor(Number(days) || 0);
  const months = Math.floor(d / 30);
  const remainingDays = d % 30;
  return `${months} Months & ${remainingDays} Days`;
}

export default function Notifications() {
  const [list, setList] = useState([]);
  const nav = useNavigate();

  const load = () => api.get("/notifications").then((r) => setList(r.data));

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function del(id) {
    if (!confirm("Delete this notification?")) return;
    await api.delete(`/notifications/${id}`);
    load();
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#1976d2",
          color: "#fff",
          padding: "14px 18px",
          borderRadius: "0 0 18px 18px",
          marginBottom: 18,
        }}
      >
        <button
          type="button"
          onClick={() => nav("/dashboard")}
          style={{
            background: "#fff",
            color: "#1976d2",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontWeight: 600,
            cursor: "pointer",
            marginRight: 18,
          }}
        >
          ← Back
        </button>
        <span style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: "1.2rem" }}>Notifications</span>
      </div>
      <div style={{ maxWidth: 500, margin: "0 auto", padding: "0 16px 32px" }}>
        {list.length === 0 && <div style={{ padding: 16, background: "#e3f2fd", borderRadius: 8 }}>No notifications.</div>}
        {list.map((n) => (
          <div
            key={n._id}
            style={{
              background: "#e3f2fd",
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              cursor: "pointer",
            }}
            onClick={() => nav(`/customers/${n.customerId}/fruits/${n.fruitId}#boxEntity_${n.boxId}`)}
          >
            <div style={{ flex: 1 }}>
              Dear Admin,
              <br />
              🔔 Rent Due Alert:
              <h2 style={{ color: "#1976d2", margin: "8px 0" }}>{n.customer}</h2>
              has store box rent pending for {n.fruit} stored in Fruit Chamber {n.chamber}.
              <br />
              Due Months &amp; Days: {formatMonthsAndDays(n.due_days)}
              <br />
              📅 Due Date: {n.date}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                del(n._id);
              }}
              style={{
                background: "#ff5252",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "8px 12px",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
