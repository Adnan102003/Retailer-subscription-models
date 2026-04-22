import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { api } from "./api.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/stats")
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <p style={{ padding: 24 }}>{err}</p>;
  if (!data) return <p style={{ padding: 24 }}>Loading…</p>;

  const chartData = {
    labels: data.chartLabels,
    datasets: [
      {
        label: "Total Boxes Stored",
        data: data.chartData,
        backgroundColor: "#42a5f5",
      },
    ],
  };

  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ padding: 16, fontFamily: "Segoe UI, sans-serif", background: "#f4f6f9", minHeight: "100vh" }}>
      <Link to="/dashboard" style={{ display: "inline-block", marginBottom: 18, fontWeight: 600, color: "#1976d2" }}>
        ← Back
      </Link>
      <h1 style={{ textAlign: "center" }}>Admin Dashboard</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 15, justifyContent: "center" }}>
        <Card title="Total Customers" value={data.totalCustomers} />
        <Card title="Pending Rent" value={`₹${Number(data.pendingRent).toLocaleString("en-IN")}`} />
        <Card title="Total Boxes Stored" value={data.totalBoxes} />
        <Card title="Fruit Types Stored" value={data.totalFruitTypes} />
      </div>

      <Section title={`📅 Today's Activity — ${today}`}>
        <Table
          headers={["Time", "Activity", "Customer", "Fruit", "Boxes"]}
          rows={data.todayRows.map((r) => [r.time, r.activity, r.customer, r.fruit, r.boxes])}
        />
      </Section>

      <Section title="💰 Pending Rent Collection">
        <Table
          headers={["Customer", "Fruit", "Boxes", "Months Stored", "Rent/Box", "Total Rent"]}
          rows={data.pendingRows.map((r) => [
            r.customer,
            r.fruit,
            r.boxes,
            r.months,
            `₹${r.rent_per_box}`,
            `₹${Number(r.total_rent).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          ])}
        />
      </Section>

      <Section title="📊 Fruit-wise Total Boxes Stored">
        <div style={{ height: 420, background: "#fff", padding: 12, borderRadius: 10 }}>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  ticks: {
                    callback: function (val) {
                      const label = this.getLabelForValue(val);
                      return label.length > 12 ? label.slice(0, 12) + "…" : label;
                    },
                  },
                },
                y: { beginAtZero: true },
              },
            }}
          />
        </div>
      </Section>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        flex: "1 1 230px",
        background: "#fff",
        borderRadius: 10,
        padding: 15,
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: 24, margin: "5px 0", color: "#007bff" }}>{value}</h2>
      <p style={{ fontSize: 14, color: "#666" }}>{title}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 35 }}>
      <h2
        style={{
          fontSize: 22,
          marginBottom: 15,
          textAlign: "center",
          color: "#1976d2",
          background: "linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)",
          borderRadius: 8,
          padding: "10px 0",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Table({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto", background: "#fff", padding: 10, borderRadius: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={{ padding: 8, border: "1px solid #ddd", textAlign: "left" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: 12, border: "1px solid #ddd" }}>
                No rows
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                {row.map((c, j) => (
                  <td key={j} style={{ padding: 8, border: "1px solid #ddd" }}>
                    {c}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
