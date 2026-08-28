// routes/pets.js
import express from "express";
import { db } from "../db.js";

const router = express.Router();

// 🐾 GET all pets
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Pet");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching pets:", err.message);
    res.status(500).json({ error: "Failed to fetch pets." });
  }
});

// 🐕 GET pet by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM Pet WHERE Pet_ID = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Pet not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching pet:", err.message);
    res.status(500).json({ error: "Failed to fetch pet details." });
  }
});

// ➕ Add new pet (for admin)
router.post("/", async (req, res) => {
  const { Name, Breed, Category, Age, Gender, Description, Health_Status, Weight, Height, Image_URL, Shelter_ID } =
    req.body;

  if (!Name || !Category) {
    return res.status(400).json({ error: "Name and Category are required." });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO Pet (Name, Breed, Category, Age, Gender, Description, Health_Status, Weight, Height, Image_URL, Shelter_ID)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Name,
        Breed,
        Category,
        Age,
        Gender,
        Description,
        Health_Status,
        Weight,
        Height,
        Image_URL,
        Shelter_ID || 1,
      ]
    );

    res.json({ success: true, message: "Pet added successfully!", Pet_ID: result.insertId });
  } catch (err) {
    console.error("❌ Error adding pet:", err.message);
    res.status(500).json({ error: "Failed to add pet." });
  }
});

// 🗑️ Delete pet
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM Pet WHERE Pet_ID = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Pet not found" });
    res.json({ success: true, message: "Pet deleted successfully!" });
  } catch (err) {
    console.error("❌ Error deleting pet:", err.message);
    res.status(500).json({ error: "Failed to delete pet." });
  }
});

export default router;
