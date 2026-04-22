const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const { uploadDir } = require("./middleware/chamberUpload");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
let httpServer;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const isConfiguredOrigin = process.env.CLIENT_URL && origin === process.env.CLIENT_URL;
      const isLocalViteOrigin = /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
      if (isConfiguredOrigin || isLocalViteOrigin) return callback(null, true);
      return callback(new Error("CORS not allowed"));
    },
    credentials: false
  })
);
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/chamber", require("./routes/chamberRoutes"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    httpServer = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

const shutdown = () => {
  if (!httpServer) {
    process.exit(0);
    return;
  }
  httpServer.close(() => {
    process.exit(0);
  });
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGUSR2", () => shutdown("SIGUSR2"));

startServer();

