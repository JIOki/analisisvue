import pool from "../db.js"; // ✅ Importación correcta
import { Router } from "express";
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Ejemplo de ruta usando pool
router.get("/preguntar", authenticateToken, async (req, res) => {
  try {
    const { pregunta } = req.query;

    const query = `
      SELECT respuesta
      FROM respuestas
      WHERE pregunta ILIKE $1
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [`%${pregunta}%`]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "No se encontró respuesta" });
    }

    res.json({ respuesta: rows[0].respuesta });
  } catch (err) {
    console.error("❌ Error en /ask/preguntar:", err.message);
    res.status(500).json({ error: "Error al procesar la pregunta" });
  }
});

export default router;