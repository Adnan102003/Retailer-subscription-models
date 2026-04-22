import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "./api.js";

export default function CustomerNew() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [file, setFile] = useState(null);
  const [err, setErr] = useState("");
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const fd = new FormData();
    fd.append("name", name);
    fd.append("phone", phone);
    fd.append("address", address);
    if (file) fd.append("photo", file);
    try {
      const { data } = await api.post("/customers", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      nav(`/customers/${data._id}`);
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#1976d2",
          color: "#fff",
          padding: "12px 18px",
          borderRadius: "0 0 16px 16px",
          margin: "-16px -16px 24px",
        }}
      >
        <Link to="/dashboard" style={{ color: "#fff", fontWeight: 600 }}>
          ← Back
        </Link>
        <span style={{ fontWeight: 600 }}>New Customer</span>
        <span style={{ width: 48 }} />
      </div>
      <h2 style={{ color: "#1976d2" }}>Add customer</h2>
      {err && <p style={{ color: "#c62828" }}>{err}</p>}
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <label>
          Name
          <input required value={name} onChange={(e) => setName(e.target.value)} style={inp} />
        </label>
        <label>
          Phone
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} style={inp} />
        </label>
        <label>
          Address
          <input value={address} onChange={(e) => setAddress(e.target.value)} style={inp} />
        </label>
        <label>
          Photo
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <button type="submit" style={btn}>
          Save
        </button>
      </form>
    </div>
  );
}

const inp = { display: "block", width: "100%", padding: 12, marginTop: 4, borderRadius: 8, border: "1px solid #ccc" };
const btn = {
  background: "#1976d2",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: 14,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
};
