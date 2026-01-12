import { Router } from "express";
import multer from "multer";
import fs from "fs-extra";
import xlsx from "xlsx";
import { parse } from "csv-parse/sync";
import pool from "../db.js"; // ✅ correcto
import { authenticateToken } from '../middleware/authMiddleware.js';


import { clean } from "../utils/text.js";
import { embed } from "../ollama.js";

const router = Router();
const upload = multer({ dest: process.env.UPLOAD_DIR || "./uploads" });
const VECTOR_DIM = parseInt(process.env.VECTOR_DIM || "1024", 10);


function rowsFromExcel(filePath) {
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(ws, { defval: "" });
}

function rowsFromCsv(filePath) {
  const raw = fs.readFileSync(filePath);
  return parse(raw, { columns: true, skip_empty_lines: true });
}

router.post("/", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Falta archivo" });

    let rows = [];
    if (req.file.originalname.toLowerCase().endsWith(".xlsx") || req.file.originalname.toLowerCase().endsWith(".xls")) {
      rows = rowsFromExcel(req.file.path);
    } else if (req.file.originalname.toLowerCase().endsWith(".csv")) {
      rows = rowsFromCsv(req.file.path);
    } else {
      return res.status(400).json({ error: "Solo CSV o Excel" });
    }

    for (const row of rows) {
      // arma texto para embedding (ajusta campos a tu realidad)
      const text = clean(Object.entries(row).map(([k,v]) => `${k}: ${v}`).join(" | "));
      const emb = await embed(text);
      if (!emb || emb.length !== VECTOR_DIM) {
        throw new Error(`Dimensión de embedding inesperada: ${emb?.length}`);
      }
      await pool.query(
        `INSERT INTO records(id, raw, text_for_embedding, embedding)
         VALUES (gen_random_uuid(), $1, $2, $3)`,
        [row, text, emb]
      );
    }

    res.json({ ok: true, inserted: rows.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally {
    if (req.file) fs.remove(req.file.path).catch(()=>{});
  }
});

export default router;

