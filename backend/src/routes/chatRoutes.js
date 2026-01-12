// backend/src/routes/chatRoutes.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import db from "../db.js";
import { processDocument } from "./processDocument.js";
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Configuración de multer para guardar archivos temporalmente
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || "./uploads");
  },
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(16).toString('hex');
    cb(null, hash);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/plain', // .txt
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo Word, TXT y Excel.'));
    }
  }
});

// Endpoint para subir documentos desde el chat (drag & drop)
router.post('/chat/upload-documents', authenticateToken, upload.array('documents', 5), async (req, res) => {
  const client = await db.connect();
  
  try {
    const { conversation_id } = req.body;
    const user_id = req.user.id; // Obtenido desde JWT
    
    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id es requerido' });
    }
    
    // Verificar que la conversación pertenezca al usuario
    const ownerCheck = await client.query(
      'SELECT user_id FROM conversations WHERE id = $1',
      [conversation_id]
    );
    
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    if (ownerCheck.rows[0].user_id !== user_id) {
      return res.status(403).json({ error: 'No autorizado para subir documentos a esta conversación' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se recibieron archivos' });
    }

    console.log(`📤 Procesando ${req.files.length} documentos para conversación ${conversation_id}`);
    
    await client.query('BEGIN');
    
    const uploadedSources = [];
    
    // Procesar cada archivo
    for (const file of req.files) {
      console.log(`📄 Procesando: ${file.originalname}`);
      
      // Leer el archivo
      const buffer = fs.readFileSync(file.path);
      
      // Crear entrada en sources
      const sourceResult = await client.query(
        `INSERT INTO sources (
          title, 
          author, 
          owner, 
          kind, 
          category, 
          filename, 
          user_id,
          path
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          file.originalname, // title
          'Usuario Chat', // author
          'chat-upload', // owner
          path.extname(file.originalname).substring(1), // kind (extension sin punto)
          'ChatUpload', // category
          file.originalname, // filename
          user_id, // user_id desde JWT
          file.path // path
        ]
      );
      
      const sourceId = sourceResult.rows[0].id;
      
      // Procesar documento y generar chunks con embeddings
      await processDocument(buffer, sourceId, client);
      
      uploadedSources.push({
        id: sourceId,
        filename: file.originalname
      });
      
      console.log(`✅ Documento ${file.originalname} procesado exitosamente`);
    }
    
    // Obtener source_ids actuales de la conversación
    const conversationResult = await client.query(
      'SELECT source_ids FROM conversations WHERE id = $1',
      [conversation_id]
    );
    
    if (conversationResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    const currentSourceIds = conversationResult.rows[0].source_ids || [];
    const newSourceIds = uploadedSources.map(s => s.id);
    const updatedSourceIds = [...currentSourceIds, ...newSourceIds];
    
    // Actualizar source_ids en la conversación
    await client.query(
      'UPDATE conversations SET source_ids = $1 WHERE id = $2',
      [updatedSourceIds, conversation_id]
    );
    
    await client.query('COMMIT');
    
    console.log(`✅ ${uploadedSources.length} documentos agregados a la conversación`);
    
    res.json({
      success: true,
      message: `${uploadedSources.length} documento(s) cargado(s) exitosamente`,
      sources: uploadedSources,
      total_sources: updatedSourceIds.length
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error al procesar documentos:', err);
    res.status(500).json({ 
      error: 'Error al procesar documentos',
      details: err.message 
    });
  } finally {
    client.release();
  }
});

// Endpoint para obtener documentos de una conversación
router.get('/chat/:conversation_id/documents', authenticateToken, async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const userId = req.user.id;
    
    // Verificar ownership de la conversación
    const ownerCheck = await db.query(
      'SELECT user_id FROM conversations WHERE id = $1',
      [conversation_id]
    );
    
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    if (ownerCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'No autorizado para ver documentos de esta conversación' });
    }
    
    const result = await db.query(
      `SELECT s.id, s.title, s.filename, s.kind, s.category, s.created_at
       FROM sources s
       JOIN conversations c ON s.id = ANY(c.source_ids)
       WHERE c.id = $1
       ORDER BY s.created_at DESC`,
      [conversation_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener documentos:', err);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
});

export default router;
