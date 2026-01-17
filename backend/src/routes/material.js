

import { Router } from "express";
import pool from "../db.js"; // ✅ conexión a la BD
import { processDocument } from "../routes/processDocument.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { readFile } from 'fs/promises';
import fs from 'fs-extra';
import { authenticateToken } from '../middleware/authMiddleware.js';
import path from 'path';






const router = Router();
const uploadMiddleware = multer({ dest: path.join(process.cwd(), 'uploads', 'temp') }).single("file");


router.post("/upload", authenticateToken, uploadMiddleware, async (req, res) => {
  const { fileName, fileType, chunks } = req.body;
  const client = await pool.connect();

  try {
    if (!req.file) throw new Error("Archivo no recibido");

    let { title, author, owner, tags, category } = req.body;
    const user_id = req.user.id; // Obtenido desde JWT
    console.log("🔎 user_id desde JWT:", user_id);

    const userCheck = await client.query(
      `SELECT id FROM users WHERE id = $1 LIMIT 1`,
      [user_id]
    );

    if (userCheck.rowCount === 0) {
      throw new Error("El usuario no existe en la base de datos");
    }

    await client.query('BEGIN');
    const sourceId = uuidv4();
    const insertSourceQuery = `
      INSERT INTO sources (
        id, title, author, owner, tags, category, user_id, filename, path
      ) VALUES (
        $1, $2, $3, $4, $5::text[], $6, $7, $8, $9
      ) RETURNING id
    `;
    
    category = category || null;

    const values = [
      sourceId,
      title,
      author,
      owner,
      tags ? tags.split(",").map(t => t.trim()) : [],
      category,
      user_id,
      req.file.originalname,
      req.file.path
    ];

    
    const result = await client.query(insertSourceQuery, values);

    if (result.rowCount !== 1) throw new Error("❌ Insert en sources falló");
// 🔄 Pausa breve para liberar memoria
      await new Promise(resolve => setTimeout(resolve, 200));
      // 🧹 Fuerza recolección de basura si está disponible
      if (global.gc) {
        global.gc();
      }


    // Verificación adicional
    const verifySource = await client.query(
      `SELECT id, title FROM sources WHERE id = $1`,
      [sourceId]
    );
    console.log('🔍 Source verificado:', verifySource.rows[0]);
    console.log('✅ Documento guardado en sources:', result.rowCount);

    const buffer = await readFile(req.file.path);

    console.log("📦 Buffer size:", buffer.length);
    console.log('✅ IdSource', sourceId);

    await processDocument(buffer, sourceId, client);

    // ✅ COPIAR archivo a la carpeta del usuario después de procesar
    const userUploadDir = path.join(process.cwd(), 'uploads', user_id.toString());
    await fs.ensureDir(userUploadDir);
    
    // Generar nombre con versionado si ya existe archivo con mismo nombre base
    const finalFileName = await getNextVersionFilename(userUploadDir, req.file.originalname);
    const userFilePath = path.join(userUploadDir, finalFileName);
    
    // Copiar archivo a la carpeta del usuario
    await fs.copy(req.file.path, userFilePath);
    console.log(`📁 Copia guardada en: ${userFilePath}`);

    // Actualizar el path en la base de datos
    await client.query(
      `UPDATE sources SET path = $1 WHERE id = $2`,
      [userFilePath, sourceId]
    );

    await client.query('COMMIT');

    res.json({ sourceId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Error en backend /upload:", err.message, err.stack);
    res.status(500).json({
      error: err.message || "Error interno en el servidor",
      details: err.stack || null
    });
  } finally {
    client.release();
    if (req.file?.path) {
      fs.unlink(req.file.path).catch(() => { });
    }


  }
});


/* ✅ Ruta para obtener tags únicos del usuario autenticado */
router.get("/tags", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT DISTINCT unnested.tag
      FROM (
        SELECT UNNEST(tags) AS tag FROM sources WHERE tags IS NOT NULL AND user_id = $1
      ) AS unnested
    `;
    const { rows } = await pool.query(query, [userId]);
    const tags = rows.map(r => r.tag).sort();
    res.json(tags);
  } catch (err) {
    console.error("Error en /api/material/tags:", err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

/* ✅ Ruta para listar documentos con filtros - SOLO del usuario autenticado */
router.get("/list", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Usuario autenticado desde JWT
    const { owner, tags, title, category } = req.query;
    const conditions = ['s.user_id = $1']; // Filtro obligatorio por usuario
    const values = [userId];

    if (owner) {
      conditions.push(`owner ILIKE $${values.length + 1}`);
      values.push(`%${owner}%`);
    }

    if (title) {
      conditions.push(`title ILIKE $${values.length + 1}`);
      values.push(`%${title}%`);
    }

    if (tags) {
      const tagList = tags.split(",").map(t => t.trim());
      conditions.push(`tags && $${values.length + 1}::text[]`);
      values.push(tagList);
    }

    if (category) {
      conditions.push(`category = $${values.length + 1}`);
      values.push(category);
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const query = `
      SELECT s.*, (
        SELECT COUNT(*) FROM chunks c WHERE c.source_id = s.id
      ) AS chunk_count
      FROM sources s
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error("Error en /api/material/list:", err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

/* ✅ Ruta para obtener un documento por ID - verificación de ownership */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const query = `
      SELECT s.*, (
        SELECT COUNT(*) FROM chunks c WHERE c.source_id = s.id
      ) AS chunk_count
      FROM sources s
      WHERE s.id = $1 AND s.user_id = $2
    `;

    const { rows } = await pool.query(query, [id, userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Material no encontrado" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error en /api/material/:id:", err.message, err.stack);
    res.status(500).json({ error: "Error al obtener el material" });
  }
});

/* ✅ Ruta para compartir documentos con otro usuario - verificar ownership */
router.post("/share", authenticateToken, async (req, res) => {
  try {
    const { source_id, share_with } = req.body;
    const userId = req.user.id;

    // Verificar que el usuario sea dueño del documento
    const ownerCheck = await pool.query(
      'SELECT id FROM sources WHERE id = $1 AND user_id = $2',
      [source_id, userId]
    );

    if (ownerCheck.rowCount === 0) {
      return res.status(403).json({ error: 'No autorizado para compartir este documento' });
    }

    await pool.query(
      `INSERT INTO shared_access (source_id, shared_with) VALUES ($1, $2)`,
      [source_id, share_with]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error al compartir documento:", err.message);
    res.status(500).json({ error: "Error al compartir documento" });
  }
});

/* ✅ Ruta para revocar acceso compartido - verificar ownership */
router.post("/unshare", authenticateToken, async (req, res) => {
  try {
    const { source_id, shared_with } = req.body;
    const userId = req.user.id;

    // Verificar que el usuario sea dueño del documento
    const ownerCheck = await pool.query(
      'SELECT id FROM sources WHERE id = $1 AND user_id = $2',
      [source_id, userId]
    );

    if (ownerCheck.rowCount === 0) {
      return res.status(403).json({ error: 'No autorizado para revocar acceso de este documento' });
    }

    const result = await pool.query(
      `DELETE FROM shared_access WHERE source_id = $1 AND shared_with = $2`,
      [source_id, shared_with]
    );

    res.json({ success: true, removed: result.rowCount });
  } catch (err) {
    console.error("Error al revocar acceso compartido:", err.message);
    res.status(500).json({ error: "Error al revocar acceso" });
  }
});

//ruta de edicion - Obtener chunks de un documento (verificar ownership)
router.get("/preview/:sourceId", authenticateToken, async (req, res) => {
  const { sourceId } = req.params;
  const userId = req.user.id;

  try {
    // Verificar ownership
    const ownerCheck = await pool.query(
      'SELECT id FROM sources WHERE id = $1 AND user_id = $2',
      [sourceId, userId]
    );

    if (ownerCheck.rowCount === 0) {
      return res.status(403).json({ error: 'No autorizado para ver este documento' });
    }

    const result = await pool.query(
      `SELECT chunk_index, content FROM chunks WHERE source_id = $1 ORDER BY chunk_index ASC`,
      [sourceId]
    );

    const preview = result.rows.map(r => r.content).join(" ");
    res.json({ preview });
  } catch (err) {
    console.error("❌ Error en GET /material/preview/:sourceId", err.message);
    res.status(500).json({ error: "Error al recuperar el contenido" });
  }
});



/* ✅ Ruta para actualizar material por ID - verificar ownership */
router.put("/update/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, author, tags } = req.body;
  const userId = req.user.id;

  try {
    // Actualizar solo si el usuario es el dueño
    const result = await pool.query(
      `UPDATE sources SET title = $1, author = $2, tags = $3::text[] WHERE id = $4 AND user_id = $5`,
      [title, author, tags ? tags.split(",").map(t => t.trim()) : [], id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Material no encontrado para actualizar" });
    }

    res.json({ success: true, updated: result.rowCount });
  } catch (err) {
    console.error("❌ Error al actualizar material:", err.message);
    res.status(500).json({ error: "Error al actualizar material" });
  }
});







/**
 * Genera el siguiente nombre de archivo con versionado automático
 * Ejemplo: "Reporte.pdf" → "Reporte_v2.pdf" (si ya existe Reporte.pdf)
 * @param {string} dir - Directorio del usuario
 * @param {string} filename - Nombre original del archivo
 * @returns {string} - Nombre de archivo con versión
 */
async function getNextVersionFilename(dir, filename) {
  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext);
  
  // Buscar archivos existentes con el mismo nombre base
  const files = await fs.readdir(dir);
  
  // Buscar versiones existentes (archivo_base.pdf, archivo_base_v2.pdf, etc.)
  const versionPattern = new RegExp(`^${escapeRegex(baseName)}(_v(\\d+))?${escapeRegex(ext)}$`);
  
  let maxVersion = 0;
  
  for (const file of files) {
    const match = file.match(versionPattern);
    if (match) {
      const versionNum = match[2] ? parseInt(match[2]) : 1; // Si no tiene _v, es versión 1
      if (versionNum > maxVersion) {
        maxVersion = versionNum;
      }
    }
  }
  
  // Generar nuevo nombre con versión incrementada
  const nextVersion = maxVersion + 1;
  if (nextVersion === 1) {
    return filename; // Primera versión, usar nombre original
  }
  
  return `${baseName}_v${nextVersion}${ext}`;
}

/**
 * Escapa caracteres especiales para expresiones regulares
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default router;
