// routes/adoptions.js
import express from "express";
import { db } from "../db.js";

const router = express.Router();

/* ===============================
   🐾 CREATE ADOPTION REQUEST
   =============================== */
router.post("/", async (req, res) => {
  const { adopter_id, pet_id, reason, contact_number } = req.body;

  if (!adopter_id || !pet_id)
    return res.status(400).json({ error: "Adopter ID and Pet ID are required." });

  try {
    // Check if pet exists
    const [pet] = await db.query("SELECT * FROM Pet WHERE Pet_ID = ?", [pet_id]);
    if (pet.length === 0)
      return res.status(404).json({ error: "Pet not found." });

    // ✅ Use the stored procedure instead of direct INSERT
    await db.query(
      "CALL AddAdoptionRequest(?, ?, ?, ?)",
      [adopter_id, pet_id, reason || "No reason provided", contact_number || "Not provided"]
    );

    // ✅ Get the latest inserted Adoption_ID
    const [idResult] = await db.query("SELECT LAST_INSERT_ID() AS Adoption_ID");

    res.json({
      success: true,
      message: "🎉 Adoption request submitted successfully!",
      Adoption_ID: idResult[0].Adoption_ID
    });
  } catch (err) {
    console.error("❌ Error submitting adoption:", err.message);
    res.status(500).json({ error: "Failed to submit adoption request." });
  }
});

/* ===============================
   🐾 GET ADOPTIONS FOR USER
   =============================== */
router.get("/", async (req, res) => {
  const { adopter_id } = req.query;

  if (!adopter_id)
    return res.status(400).json({ error: "Adopter ID required in query." });

  try {
    const [rows] = await db.query(
      `SELECT a.Adoption_ID, a.Status, a.Adoption_Date, a.Reason,
              p.Name AS petName, p.Image_URL AS petImage
       FROM Adoption a
       JOIN Pet p ON a.Pet_ID = p.Pet_ID
       WHERE a.Adopter_ID = ?
       ORDER BY a.Adoption_Date DESC`,
      [adopter_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching adoptions:", err.message);
    res.status(500).json({ error: "Failed to load adoption data." });
  }
});

/* ===============================
   🐾 ADMIN: UPDATE STATUS
   =============================== */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Approved", "Rejected", "Pending"].includes(status))
    return res.status(400).json({ error: "Invalid status value." });

  try {
    const [result] = await db.query("UPDATE Adoption SET Status = ? WHERE Adoption_ID = ?", [status, id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Adoption request not found." });

    res.json({ success: true, message: `Adoption ${status.toLowerCase()}.` });
  } catch (err) {
    console.error("❌ Error updating adoption status:", err.message);
    res.status(500).json({ error: "Failed to update status." });
  }
});

export default router;
