import multer from "multer";
import path from "path";
import fs from "fs-extra";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import pool from "../db.js"; // ✅ correcto
import { Router } from "express";
import { authenticateToken } from '../middleware/authMiddleware.js';
import { chunkText } from "../utils/chunk.js";
import { clean } from "../utils/text.js";
import { embed } from "../ollama.js";
import { v4 as uuidv4 } from "uuid";



const upload = multer({
  dest: path.join(process.cwd(), 'uploads', 'temp'),
  limits: { fileSize: 10 * 1024 * 1024 } // ✅ Limita a 10MB
});

const VECTOR_DIM = parseInt(process.env.VECTOR_DIM || "1024", 10);
const MAX_CHUNKS = 500;
const BATCH_SIZE = 10;

const router = Router();

async function extractText(filePath, mimetype, originalname) {
  const ext = (path.extname(originalname) || "").toLowerCase();
  if (mimetype.includes("pdf") || ext === ".pdf") {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
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

router.post("/", authenticateToken, upload.single("file"), async (req, res) => {
  let userFilePath = null;
  
  try {
    const { title, author, tags, owner } = req.body;
    const userId = req.user.id; // Obtenido desde JWT
    if (!req.file) return res.status(400).json({ error: "Falta archivo" });

    const textRaw = await extractText(
      req.file.path,
      req.file.mimetype,
      req.file.originalname
    );

    const text = clean(textRaw);

    // 🚨 Limita el texto antes de fragmentarlo
    const MAX_TEXT_LENGTH = 1500 * MAX_CHUNKS;
    const safeText = text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text;

    const chunks = chunkText(safeText, 1500, 200);

    const sourceId = uuidv4();
    await pool.query(
      `INSERT INTO sources(id, title, author, tags, owner, kind, user_id, file_path)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [sourceId, title || req.file.originalname, author || null, tags ? tags.split(",").map(s => s.trim()) : null, owner || null, "doc", userId, null]
    );
    console.log(`📄 Fragmentos a procesar: ${chunks.length}`);

    
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);

      for (let j = 0; j < batch.length; j++) {
         console.log(`🧠 Generando embedding ${i + j + 1} de ${chunks.length}`);
        const emb = await embed(batch[j]);
        if (!emb || emb.length !== VECTOR_DIM) {
          throw new Error(`Dimensión de embedding inesperada: ${emb?.length}`);
        }
        const vectorString = `[${emb.join(",")}]`;

        await pool.query(
          `INSERT INTO chunks(id, source_id, chunk_index, content, embedding)
          VALUES (gen_random_uuid(), $1, $2, $3, $4::vector)`,
          [sourceId, i + j, batch[j], vectorString]
        );

      }
     

      // 🔄 Pausa breve para liberar memoria
      await new Promise(resolve => setTimeout(resolve, 200));
      // 🧹 Fuerza recolección de basura si está disponible
      if (global.gc) {
        global.gc();
      }


    }

    // ✅ AL FINAL: Copiar archivo a la carpeta del usuario
    const userUploadDir = path.join(process.cwd(), 'uploads', userId.toString());
    await fs.ensureDir(userUploadDir);
    
    // Mantener el nombre original del archivo, evitar sobreescritura
    let finalFileName = req.file.originalname;
    let filePath = path.join(userUploadDir, finalFileName);
    
    // Si ya existe un archivo con ese nombre, agregar timestamp
    let counter = 1;
    while (await fs.pathExists(filePath)) {
      const ext = path.extname(req.file.originalname);
      const baseName = path.basename(req.file.originalname, ext);
      finalFileName = `${baseName}_${Date.now()}_${counter}${ext}`;
      filePath = path.join(userUploadDir, finalFileName);
      counter++;
    }
    
    userFilePath = filePath;
    await fs.copy(req.file.path, userFilePath);
    console.log(`📁 Copia guardada en: ${userFilePath}`);

    // Actualizar el registro con la ruta del archivo
    await pool.query(
      `UPDATE sources SET file_path = $1 WHERE id = $2`,
      [userFilePath, sourceId]
    );

    res.json({ ok: true, sourceId, chunks: chunks.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally {
    // Limpiar archivo temporal de Multer
    if (req.file && req.file.path) {
      await fs.remove(req.file.path).catch(() => {});
    }
  }
});

export default router;