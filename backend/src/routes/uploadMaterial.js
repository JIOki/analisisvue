const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { pool } = require("../db.js");
const { chunkText } = require("../utils/chunk.js");
const { clean } = require("../utils/text.js");
const { embed } = require("../ollama.js");
const { v4: uuidv4 } = require("uuid");

const router = Router();
const upload = multer({ dest: process.env.UPLOAD_DIR || "./uploads" });
const VECTOR_DIM = parseInt(process.env.VECTOR_DIM || "1024", 10);

async function extractText(filePath, mimetype, originalname) {
  const ext = (path.extname(originalname) || "").toLowerCase();
  if (mimetype.includes("pdf") || ext === ".pdf") {
    const data = await pdfParse(await fs.readFile(filePath));
    return data.text || "";
  }
  if (ext === ".docx") {
    const { value } = await mammoth.extractRawText({ path: filePath });
    return value || "";
  }
  if (ext === ".txt") {
    return await fs.readFile(filePath, "utf8");
  }
  throw new Error(`Tipo no soportado para material: ${originalname}`);
}

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { title, author, tags, owner } = req.body;
    if (!req.file) return res.status(400).json({ error: "Falta archivo" });

    const textRaw = await extractText(
      req.file.path,
      req.file.mimetype,
      req.file.originalname
    );
    const text = clean(textRaw);
    const chunks = chunkText(text, 1500, 200);

    // Crea fuente
    const sourceId = uuidv4();
    await pool.query(
      `INSERT INTO sources(id, title, author, tags, owner, kind)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [sourceId, title || req.file.originalname, author || null, tags ? tags.split(",").map(s=>s.trim()) : null, owner || null, "doc"]
    );

    // Inserta chunks con embeddings
    for (let i = 0; i < chunks.length; i++) {
      const emb = await embed(chunks[i]);
      if (!emb || emb.length !== VECTOR_DIM) {
        throw new Error(`Dimensión de embedding inesperada: ${emb?.length}`);
      }
      await pool.query(
        `INSERT INTO chunks(id, source_id, chunk_index, content, embedding)
         VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
        [sourceId, i, chunks[i], emb]
      );
    }

    res.json({ ok: true, sourceId, chunks: chunks.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally {
    if (req.file) fs.remove(req.file.path).catch(()=>{});
  }
});

module.exports = router;