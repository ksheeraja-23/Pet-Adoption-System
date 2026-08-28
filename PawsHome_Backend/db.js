// db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "vishal36646",
  database: process.env.DB_NAME || "PetAdoption",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ Test the connection (wrapped in async IIFE)
(async () => {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS test");
    console.log("✅ MySQL connected successfully!");
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
  }
})();
