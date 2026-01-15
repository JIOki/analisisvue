// backend/src/routes/conversationRoutes.js
import { Router } from "express";
import db from "../db.js";
import { sendMessage, embed } from "../ollama.js";
import { authenticateToken } from "../middleware/authMiddleware.js";




// Función auxiliar para obtener chunks relevantes usando búsqueda semántica
async function getRelevantChunks(message, sourceIds) {
  try {
    // Generar embedding del mensaje del usuario
    const messageEmbedding = await embed(message);
    
    // Obtener source_ids de la conversación si no se proporcionan
    let actualSourceIds = sourceIds;
    if (!actualSourceIds) {
      // Si no se proporcionan source_ids, buscar en la conversación
      // Esta función asumiría que se le pasa el conversation_id y buscaría los source_ids
      console.log("No se proporcionaron source_ids, búsqueda limitada");
      return [];
    }

    // Query SQL para encontrar chunks similares usando el operador <=>
    // IMPORTANTE: source_id es UUID, por eso usamos $2::uuid[] en lugar de $2::int[]
    const query = `
      SELECT content, 1 - (embedding <=> $1::vector) as similarity
      FROM chunks 
      WHERE source_id = ANY($2::uuid[])
      ORDER BY embedding <=> $1::vector
      LIMIT 5
    `;
    
    // Los sourceIds ya son UUIDs strings, no necesitamos convertir a int
    const result = await db.query(query, [JSON.stringify(messageEmbedding), actualSourceIds]);
    
    // Concatenar texto de chunks relevantes
    const relevantContext = result.rows
      .filter(row => row.similarity > 0.5) // Umbral de similitud
      .map(row => row.content)
      .join('\n\n');
    
    console.log(`Encontrados ${result.rows.length} chunks relevantes con similitud > 0.5`);
    return relevantContext;
  } catch (error) {
    console.error('Error en búsqueda semántica:', error.message);
    return '';
  }
}

const router = Router();

// Iniciar conversación
router.post('/conversations/start', authenticateToken, async (req, res) => {
  const { source_ids, title } = req.body;
  const user_id = req.user.id; // Usar el ID del usuario autenticado
  
  try {
    console.log(`Iniciando conversación para usuario: ${req.user.email}`);
    const result = await db.query(
      'INSERT INTO conversations (user_id, source_ids, title) VALUES ($1, $2, $3) RETURNING id',
      [user_id, source_ids, title]
    );
    res.json({ conversation_id: result.rows[0].id });
  } catch (err) {
    console.error('Error al iniciar conversación:', err.message);
    res.status(500).json({ error: 'No se pudo iniciar la conversación' });
  }
});

// Enviar mensaje
router.post('/chat', authenticateToken, async (req, res) => {
  const { conversation_id, message } = req.body;
  
  try {
    // Verificar que la conversación pertenece al usuario
    const ownerCheck = await db.query(
      'SELECT id, source_ids FROM conversations WHERE id = $1 AND user_id = $2',
      [conversation_id, req.user.id]
    );
    
    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Acceso denegado a esta conversación' });
    }
    
    await db.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [conversation_id, 'user', message]
    );

    // Usar los source_ids ya verificados
    const conversationResult = ownerCheck;

    let context = '';
    if (conversationResult.rows.length > 0) {
      const sourceIds = conversationResult.rows[0].source_ids;
      console.log('Source IDs de la conversación:', sourceIds);
      
      // Obtener chunks relevantes usando búsqueda semántica
      context = await getRelevantChunks(message, sourceIds);
    }

    // Construir mensaje con contexto si está disponible
    const fullMessage = context 
      ? `Contexto relevante:\n${context}\n\nPregunta del usuario: ${message}`
      : message;

    console.log('Enviando mensaje con contexto:', fullMessage.substring(0, 200) + '...');
    
    // Llamar sendMessage con contexto (pasamos null como message ya que el contexto tiene todo)
    const reply = await sendMessage(null, fullMessage);

    await db.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [conversation_id, 'assistant', reply]
    );
    res.json({ reply });
  } catch (err) {
    console.error('Error en el chat:', err.message);
    res.status(500).json({ error: 'No se pudo procesar el mensaje' });
  }
});

// Recuperar historial
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verificar que la conversación pertenece al usuario
    const ownerCheck = await db.query(
      'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Acceso denegado a esta conversación' });
    }
    
    const result = await db.query(
      `SELECT id, role, content, created_at, verification_data 
       FROM messages 
       WHERE conversation_id = $1 
       ORDER BY created_at ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al recuperar mensajes:', err.message);
    res.status(500).json({ error: 'No se pudo recuperar el historial' });
  }
});

// Endpoint para guardar datos de verificación de un mensaje
// PATCH /api/messages/:messageId/verification
router.patch('/messages/:messageId/verification', authenticateToken, async (req, res) => {
  const { messageId } = req.params;
  const { verification_data } = req.body;
  
  try {
    // Verificar que el mensaje existe y pertenece a una conversación del usuario
    const messageCheck = await db.query(
      `SELECT m.id FROM messages m
       INNER JOIN conversations c ON m.conversation_id = c.id
       WHERE m.id = $1 AND c.user_id = $2`,
      [messageId, req.user.id]
    );
    
    if (messageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Mensaje no encontrado o no autorizado' });
    }
    
    // Actualizar verification_data
    try {
        const result = await db.query(
            `UPDATE messages
             SET verification_data = $1
             WHERE id = $2
             RETURNING id, verification_data`,
            [JSON.stringify(verification_data), messageId]
        );

        res.json({
            message: 'Verificación guardada correctamente',
            message_id: messageId,
            verification_data: result.rows[0].verification_data
        });
    } catch (err) {
        console.error('Error al guardar verificación:', err.message);
        console.error('Error completo:', err);
        console.error('verification_data type:', typeof verification_data);
        console.error('verification_data length:', verification_data ? JSON.stringify(verification_data).length : 'null');
        res.status(500).json({
            error: 'No se pudo guardar la verificación',
            details: err.message
        });
    }
  } catch (err) {
    console.error('Error al guardar verificación:', err.message);
    res.status(500).json({ error: 'No se pudo guardar la verificación' });
  }
});

// Función auxiliar para obtener chunks por source_ids
async function getChunksBySourceIds(sourceIds) {
  try {
    if (!sourceIds || sourceIds.length === 0) {
      return [];
    }

    // Query SQL con JOIN entre chunks y sources
    // IMPORTANTE: source_id es UUID, usamos $1::uuid[] para la comparación correcta
    const query = `
      SELECT 
        c.id as chunk_id,
        c.content as text,
        c.chunk_index,
        c.mime_type,
        c.created_at as chunk_created_at,
        s.id as source_id,
        s.title as source_title,
        s.author,
        s.kind as source_kind,
        s.category
      FROM chunks c
      JOIN sources s ON c.source_id = s.id
      WHERE c.source_id = ANY($1::uuid[])
      ORDER BY s.title ASC, c.chunk_index ASC
    `;

    const result = await db.query(query, [sourceIds]);
    
    // Formatear respuesta para incluir metadata estructurada
    return result.rows.map(row => ({
      chunk_id: row.chunk_id,
      text: row.text,
      metadata: {
        chunk_index: row.chunk_index,
        mime_type: row.mime_type,
        created_at: row.chunk_created_at,
        source: {
          id: row.source_id,
          title: row.source_title,
          author: row.author,
          kind: row.source_kind,
          category: row.category
        }
      },
      source_title: row.source_title
    }));

  } catch (err) {
    console.error('Error en getChunksBySourceIds:', err.message);
    throw new Error('No se pudieron recuperar los chunks');
  }
}

// Endpoint para obtener chunks de una conversación
router.get('/conversations/:id/chunks', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verificar que la conversación pertenece al usuario
    const conversationResult = await db.query(
      'SELECT source_ids FROM conversations WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (conversationResult.rows.length === 0) {
      return res.status(403).json({ error: 'Acceso denegado a esta conversación' });
    }

    const sourceIds = conversationResult.rows[0].source_ids;
    
    if (!sourceIds || sourceIds.length === 0) {
      return res.json([]);
    }

    // Obtener chunks usando la función auxiliar
    const chunks = await getChunksBySourceIds(sourceIds);
    
    res.json(chunks);
  } catch (err) {
    console.error('Error al obtener chunks:', err.message);
    res.status(500).json({ error: 'No se pudieron recuperar los chunks' });
  }
});

export default router;