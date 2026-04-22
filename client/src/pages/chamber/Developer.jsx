import { Link } from "react-router-dom";

export default function Developer() {
  return (
    <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <Link to="/dashboard" style={{ fontWeight: 600, color: "#1976d2" }}>
        ← Back home
      </Link>
      <h1 style={{ color: "#388e3c" }}>Developer</h1>
      <p>
        This MERN stack version replaces the original PHP + JSON files with MongoDB, Express, and a React SPA. Source lives in{" "}
        <code>fruit-chamber-mern/</code>.
      </p>
      <ul>
        <li>Backend: Node.js, Express, Mongoose, Multer (uploads), PDF bills via PDFKit</li>
        <li>Frontend: Vite, React, React Router, Chart.js</li>
      </ul>
    </div>
  );
}
