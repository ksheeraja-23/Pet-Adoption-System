// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

// ✅ Import local database connection
import { db } from "./db.js";

// ✅ Import all route files
import petsRouter from "./routes/pets.js";
import usersRouter from "./routes/users.js";
import adoptionsRouter from "./routes/adoptions.js";

const app = express();

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ Test route
app.get("/", (req, res) => res.send("🐾 PawsHome API running..."));

// ✅ Test MySQL connection route
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS solution");
    res.json({ success: true, message: "✅ MySQL connected!", result: rows });
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ API routes
app.use("/api/pets", petsRouter);
app.use("/api/users", usersRouter);
app.use("/api/adoptions", adoptionsRouter);

// ✅ Serve frontend files (HTML, CSS, JS)
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve files from ../public or /public inside backend
app.use(express.static(path.join(__dirname, "public")));

// ✅ Handle all other routes — serve index.html
// ✅ Express 5-compatible catch-all
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
