// routes/users.js
import express from "express";
import { db } from "../db.js";

const router = express.Router();

// 🧾 Register
router.post("/register", async (req, res) => {
  const { name, email, phone, address } = req.body;
  if (!name || !email)
    return res.status(400).json({ error: "Name and Email required." });

  try {
    const [existing] = await db.query("SELECT * FROM Adopter WHERE Email = ?", [email]);
    if (existing.length > 0)
      return res.status(400).json({ error: "Email already registered." });

    const [result] = await db.query(
      "INSERT INTO Adopter (Name, Email, Phone, Address) VALUES (?, ?, ?, ?)",
      [name, email, phone, address]
    );

    res.json({
      success: true,
      user: { Adopter_ID: result.insertId, Name: name, Email: email },
    });
  } catch (err) {
    console.error("❌ Register error:", err.message);
    res.status(500).json({ error: "Registration failed." });
  }
});

// 🔐 Login
router.post("/login", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required." });

  try {
    const [rows] = await db.query("SELECT * FROM Adopter WHERE Email = ?", [email]);
    if (rows.length === 0)
      return res.status(401).json({ message: "User not found. Please register first." });

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ message: "Login failed." });
  }
});

export default router;
