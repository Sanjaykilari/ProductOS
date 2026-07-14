import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDatabase } from "./db/database.js";
import aiRouter from "./routes/ai.js";
import orchestratorRouter from "./routes/orchestrator.js";
import developerRouter from "./routes/developer.js";

// Load configurations
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Global Middleware
app.use(cors());
app.use(express.json());

// API Key authentication checker for secure requests
app.use((req, res, next) => {
  // Simple check for MVP sandbox
  const apiKey = req.headers["x-productos-key"];
  if (process.env.REQUIRE_API_AUTH === "true" && !apiKey) {
    return res.status(401).json({ error: "Missing x-productos-key authentication header" });
  }
  next();
});

// Mount Routes
app.use("/api/ai", aiRouter);
app.use("/api/orchestrator", orchestratorRouter);
app.use("/api/developer", developerRouter);

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// Start Server and migrate schemas
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 ProductOS AI Integration Gateway online on port ${PORT}`);
      console.log(`📁 Database SQLite loaded: server/database.sqlite`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error("❌ Fatal: Failed to initialize AI Integration server:", err);
    process.exit(1);
  }
}

startServer();
