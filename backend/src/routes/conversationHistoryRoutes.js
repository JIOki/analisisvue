// backend/src/routes/conversationHistoryRoutes.js
// Endpoints para gestión de historial de conversaciones y materiales por conversación
// Fase 5: Chat History y Gestión de Materiales

import { Router } from "express";
import db from "../db.js";
import { sendMessage, embed } from "../ollama.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// ============================================
// UTILITARIOS PARA LA FASE 5
// ============================================

// Función para verificar propiedad de conversación
async function verifyConversationOwnership(conversationId, userId) {
  const result = await db.query(
    `SELECT id, user_id, llm_model, status, conversation_stats, 
            conversation_config, materials_linked_at, materials_updated 
     FROM conversations 
     WHERE id = $1 AND user_id = $2 AND status != 'deleted'`,
    [conversationId, userId]
  );
  return result.rows[0] || null;
}

// Función para verificar propiedad de material
async function verifyMaterialOwnership(sourceId, userId) {
  const result = await db.query(
    `SELECT id, title, category, is_ai_accessible 
     FROM sources 
     WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE`,
    [sourceId, userId]
  );
  return result.rows[0] || null;
}

// Función para obtener chunks filtrados por materiales de conversación
async function getRelevantChunksForConversation(message, conversationId, similarityThreshold = 0.5) {
  try {
    const messageEmbedding = await embed(message);
    
    // Usar la función PostgreSQL para búsqueda filtrada por contexto de conversación
    const query = `
      SELECT 
        c.id as chunk_id,
        c.content,
        c.source_id,
        s.title as source_title,
        c.chunk_category,
        c.abstraction_level,
        c.key_concepts,
        1 - (c.embedding <=> $1::vector) as similarity
      FROM chunks c
      INNER JOIN sources s ON c.source_id = s.id
      INNER JOIN conversation_materials cm ON c.source_id = cm.source_id
      WHERE cm.conversation_id = $2 
        AND cm.status = 'active'
        AND c.is_ai_accessible = TRUE
        AND (1 - (c.embedding <=> $1::vector)) >= $3
      ORDER BY c.embedding <=> $1::vector
      LIMIT 10
    `;
    
    const result = await db.query(query, [
      JSON.stringify(messageEmbedding), 
      conversationId, 
      similarityThreshold
    ]);
    
    return result.rows;
  } catch (error) {
    console.error('Error en búsqueda semántica por conversación:', error.message);
    return [];
  }
}

// ============================================
// ENDPOINTS DE GESTIÓN DE CONVERSACIONES
// ============================================

// GET /api/conversations - Listar conversaciones del usuario
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'active', limit = 20, offset = 0 } = req.query;
    
    const result = await db.query(
      `SELECT 
        c.id,
        c.title,
        c.description,
        c.llm_model,
        c.status,
        c.conversation_stats,
        c.materials_linked_at,
        c.last_activity_at,
        c.created_at,
        c.updated_at,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
        (SELECT COUNT(*) FROM conversation_materials WHERE conversation_id = c.id AND status = 'active') as material_count
      FROM conversations c
      WHERE c.user_id = $1 AND c.status = $2
      ORDER BY c.last_activity_at DESC
      LIMIT $3 OFFSET $4`,
      [userId, status, parseInt(limit), parseInt(offset)]
    );
    
    res.json({
      conversations: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.rows.length === parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Error al listar conversaciones:', err.message);
    res.status(500).json({ error: 'No se pudieron listar las conversaciones' });
  }
});

// POST /api/conversations - Crear nueva conversación
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, llm_model, source_ids } = req.body;
    
    const result = await db.query(
      `INSERT INTO conversations (
        user_id, title, description, llm_model, 
        conversation_config, status
      ) VALUES ($1, $2, $3, $4, $5, 'active') 
      RETURNING *`,
      [
        userId, 
        title || 'Nueva Conversación', 
        description, 
        llm_model || 'llama3.2:1b',
        JSON.stringify({ temperature: 0.7, max_tokens: 2048 })
      ]
    );
    
    const conversation = result.rows[0];
    
    // Si se proporcionan source_ids, vincularlos automáticamente
    if (source_ids && Array.isArray(source_ids) && source_ids.length > 0) {
      for (const sourceId of source_ids) {
        await db.query(
          `SELECT link_material_to_conversation($1, $2, 'manual', 0, 'context', $3)`,
          [conversation.id, sourceId, userId]
        );
      }
    }
    
    res.status(201).json(conversation);
  } catch (err) {
    console.error('Error al crear conversación:', err.message);
    res.status(500).json({ error: 'No se pudo crear la conversación' });
  }
});

// GET /api/conversations/:id - Obtener detalles de una conversación
router.get('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const conversation = await verifyConversationOwnership(id, userId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    // Obtener conteos adicionales
    const messageCount = await db.query(
      'SELECT COUNT(*) FROM messages WHERE conversation_id = $1',
      [id]
    );
    
    const activeMaterials = await db.query(
      "SELECT COUNT(*) FROM conversation_materials WHERE conversation_id = $1 AND status = 'active'",
      [id]
    );
    
    res.json({
      ...conversation,
      message_count: parseInt(messageCount.rows[0].count),
      active_materials_count: parseInt(activeMaterials.rows[0].count)
    });
  } catch (err) {
    console.error('Error al obtener conversación:', err.message);
    res.status(500).json({ error: 'No se pudo obtener la conversación' });
  }
});

// PUT /api/conversations/:id - Actualizar conversación
router.put('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, status, llm_model, conversation_config } = req.body;
    
    const conversation = await verifyConversationOwnership(id, userId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (status !== undefined && ['active', 'archived', 'deleted'].includes(status)) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (llm_model !== undefined) {
      updates.push(`llm_model = $${paramCount++}`);
      values.push(llm_model);
    }
    if (conversation_config !== undefined) {
      updates.push(`conversation_config = $${paramCount++}`);
      values.push(JSON.stringify(conversation_config));
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }
    
    values.push(id, userId);
    
    const result = await db.query(
      `UPDATE conversations 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount++} AND user_id = $${paramCount}
       RETURNING *`,
      values
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar conversación:', err.message);
    res.status(500).json({ error: 'No se pudo actualizar la conversación' });
  }
});

// DELETE /api/conversations/:id - Eliminar conversación (soft delete)
router.delete('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const conversation = await verifyConversationOwnership(id, userId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    await db.query(
      "UPDATE conversations SET status = 'deleted', updated_at = NOW() WHERE id = $1",
      [id]
    );
    
    res.json({ message: 'Conversación eliminada correctamente' });
  } catch (err) {
    console.error('Error al eliminar conversación:', err.message);
    res.status(500).json({ error: 'No se pudo eliminar la conversación' });
  }
});

// ============================================
// ENDPOINTS DE GESTIÓN DE MATERIALES POR CONVERSACIÓN
// ============================================

// GET /api/conversations/:id/materials - Obtener materiales vinculados
router.get('/conversations/:id/materials', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const conversation = await verifyConversationOwnership(id, userId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    const result = await db.query(
      `SELECT 
        cm.id,
        cm.source_id,
        cm.link_type,
        cm.relevance_order,
        cm.usage_category,
        cm.usage_count,
        cm.tokens_consumed,
        cm.last_accessed_at,
        cm.status,
        cm.created_at,
        s.title as source_title,
        s.category as source_category,
        s.kind as source_kind,
        s.author as source_author
      FROM conversation_materials cm
      INNER JOIN sources s ON cm.source_id = s.id
      WHERE cm.conversation_id = $1
      ORDER BY cm.relevance_order ASC, cm.created_at ASC`,
      [id]
    );
    
    res.json({
      materials: result.rows,
      total: result.rows.length,
      conversation_id: id
    });
  } catch (err) {
    console.error('Error al obtener materiales:', err.message);
    res.status(500).json({ error: 'No se pudieron obtener los materiales' });
  }
});

// POST /api/conversations/:id/materials - Vincular material a conversación
router.post('/conversations/:id/materials', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { source_id, link_type = 'manual', relevance_order = 0, usage_category = 'context' } = req.body;
    
    if (!source_id) {
      return res.status(400).json({ error: 'source_id es obligatorio' });
    }
    
    const conversation = await verifyConversationOwnership(id, userId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    // Verificar que el material existe y es accesible para el usuario
    const material = await verifyMaterialOwnership(source_id, userId);
    
    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado o no accesible' });
    }
    
    // Usar la función PostgreSQL para vincular
    const result = await db.query(
      `SELECT * FROM link_material_to_conversation($1, $2, $3, $4, $5, $6)`,
      [id, source_id, link_type, relevance_order, usage_category, userId]
    );
    
    res.status(201).json({
      message: 'Material vinculado correctamente',
      link: result.rows[0]
    });
  } catch (err) {
    console.error('Error al vincular material:', err.message);
    res.status(500).json({ error: 'No se pudo vincular el material' });
  }
});

// DELETE /api/conversations/:id/materials/:sourceId - Desvincular material
router.delete('/conversations/:id/materials/:sourceId', authenticateToken, async (req, res) => {
  try {
    const { id, sourceId } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;
    
    const conversation = await verifyConversationOwnership(id, userId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    const result = await db.query(
      `SELECT * FROM unlink_material_from_conversation($1, $2, $3)`,
      [id, sourceId, reason]
    );
    
    if (result.rows[0]) {
      res.json({ message: 'Material desvinculado correctamente' });
    } else {
      res.status(404).json({ error: 'Vinculación no encontrada' });
    }
  } catch (err) {
    console.error('Error al desvincular material:', err.message);
    res.status(500).json({ error: 'No se pudo desvincular el material' });
  }
});

// PUT /api/conversations/:id/materials/:sourceId - Actualizar vinculación
router.put('/conversations/:id/materials/:sourceId', authenticateToken, async (req, res) => {
  try {
    const { id, sourceId } = req.params;
    const userId = req.user.id;
    const { relevance_order, usage_category, status } = req.body;
    
    const conversation = await verifyConversationOwnership(id, userId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (relevance_order !== undefined) {
      updates.push(`relevance_order = $${paramCount++}`);
      values.push(relevance_order);
    }
    if (usage_category !== undefined && ['context', 'reference', 'consulted', 'primary'].includes(usage_category)) {
      updates.push(`usage_category = $${paramCount++}`);
      values.push(usage_category);
    }
    if (status !== undefined && ['active', 'inactive'].includes(status)) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }
    
    values.push(id, sourceId);
    
    const result = await db.query(
      `UPDATE conversation_materials 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE conversation_id = $${paramCount++} AND source_id = $${paramCount}
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vinculación no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar vinculación:', err.message);
    res.status(500).json({ error: 'No se pudo actualizar la vinculación' });
  }
});

// ============================================
// ENDPOINTS DE SESIONES DE CHAT
// ============================================

// GET /api/conversations/:id/sessions - Obtener sesiones de una conversación
router.get('/conversations/:id/sessions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const conversation = await verifyConversationOwnership(id, userId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    const result = await db.query(
      `SELECT 
        cs.id,
        cs.title,
        cs.llm_model,
        cs.temperature,
        cs.max_tokens,
        cs.status,
        cs.message_count,
        cs.total_tokens,
        cs.total_duration_seconds,
        cs.started_at,
        cs.ended_at
      FROM chat_sessions cs
      WHERE cs.conversation_id = $1
      ORDER BY cs.started_at DESC`,
      [id]
    );
    
    res.json({
      sessions: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    console.error('Error al obtener sesiones:', err.message);
    res.status(500).json({ error: 'No se pudieron obtener las sesiones' });
  }
});

// POST /api/conversations/:id/sessions - Iniciar nueva sesión
router.post('/conversations/:id/sessions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, llm_model, temperature, max_tokens, system_prompt } = req.body;
    
    const conversation = await verifyConversationOwnership(id, userId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    // Usar la función PostgreSQL para iniciar sesión
    const result = await db.query(
      `SELECT * FROM start_chat_session($1, $2, $3)`,
      [id, title || `Sesión ${new Date().toLocaleDateString()}`, llm_model || conversation.llm_model]
    );
    
    // Actualizar configuración si se proporciona
    if (temperature !== undefined || max_tokens !== undefined || system_prompt !== undefined) {
      const config = { ...conversation.conversation_config };
      if (temperature !== undefined) config.temperature = temperature;
      if (max_tokens !== undefined) config.max_tokens = max_tokens;
      if (system_prompt !== undefined) config.system_prompt_override = system_prompt;
      
      await db.query(
        'UPDATE chat_sessions SET system_prompt = $1, temperature = $2, max_tokens = $3 WHERE id = $4',
        [system_prompt, temperature || 0.7, max_tokens || 2048, result.rows[0].id]
      );
    }
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al iniciar sesión:', err.message);
    res.status(500).json({ error: 'No se pudo iniciar la sesión' });
  }
});

// GET /api/sessions/:id - Obtener detalles de una sesión
router.get('/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await db.query(
      `SELECT cs.*, c.title as conversation_title
       FROM chat_sessions cs
       INNER JOIN conversations c ON cs.conversation_id = c.id
       WHERE cs.id = $1 AND c.user_id = $2`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener sesión:', err.message);
    res.status(500).json({ error: 'No se pudo obtener la sesión' });
  }
});

// PUT /api/sessions/:id/end - Finalizar sesión
router.put('/sessions/:id/end', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'completed' } = req.body;
    
    const result = await db.query(
      `SELECT * FROM end_chat_session($1)`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    res.json({
      message: 'Sesión finalizada correctamente',
      session: result.rows[0]
    });
  } catch (err) {
    console.error('Error al finalizar sesión:', err.message);
    res.status(500).json({ error: 'No se pudo finalizar la sesión' });
  }
});

// ============================================
// ENDPOINT DE CHAT CON CONTEXTO DE CONVERSACIÓN
// ============================================

// POST /api/conversations/:id/chat - Enviar mensaje con RAG filtrado por conversación
router.post('/conversations/:id/chat', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { message, session_id } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'message es obligatorio' });
    }
    
    const conversation = await verifyConversationOwnership(id, userId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    if (conversation.status !== 'active') {
      return res.status(400).json({ error: 'La conversación no está activa' });
    }
    
    // Verificar que hay materiales vinculados
    const materialsCheck = await db.query(
      "SELECT COUNT(*) FROM conversation_materials WHERE conversation_id = $1 AND status = 'active'",
      [id]
    );
    
    if (parseInt(materialsCheck.rows[0].count) === 0) {
      return res.status(400).json({ 
        error: 'No hay materiales vinculados a esta conversación',
        hint: 'Vincula materiales antes de enviar mensajes'
      });
    }
    
    // Guardar mensaje del usuario
    const userMessageResult = await db.query(
      `INSERT INTO messages (conversation_id, role, content) 
       VALUES ($1, 'user', $2) 
       RETURNING id, created_at`,
      [id, message]
    );
    const userMessageId = userMessageResult.rows[0].id;
    
    // Obtener chunks relevantes usando el contexto de la conversación
    const relevantChunks = await getRelevantChunksForConversation(message, id, 0.5);
    
    // Construir contexto
    const context = relevantChunks.length > 0
      ? relevantChunks.map(chunk => `[${chunk.source_title}]: ${chunk.content}`).join('\n\n---\n\n')
      : '';
    
    // Obtener configuración de la conversación
    const config = conversation.conversation_config || {};
    const systemPrompt = config.system_prompt_override || 
      'Eres un asistente experto que responde preguntas basándose en el contexto proporcionado.';
    
    // Construir mensaje completo
    const fullMessage = context 
      ? `${systemPrompt}\n\n=== CONTEXTO ===\n${context}\n=== FIN CONTEXTO ===\n\n=== PREGUNTA ===\n${message}\n=== FIN PREGUNTA ===`
      : `${systemPrompt}\n\n${message}`;
    
    // Obtener o crear sesión
    let currentSession = session_id;
    if (!currentSession) {
      const sessionResult = await db.query(
        `SELECT id FROM chat_sessions 
         WHERE conversation_id = $1 AND status = 'active'
         ORDER BY started_at DESC LIMIT 1`,
        [id]
      );
      if (sessionResult.rows.length > 0) {
        currentSession = sessionResult.rows[0].id;
      }
    }
    
    // Enviar mensaje al modelo
    const reply = await sendMessage(null, fullMessage);
    
    // Guardar respuesta del asistente
    const assistantMessageResult = await db.query(
      `INSERT INTO messages (conversation_id, role, content) 
       VALUES ($1, 'assistant', $2) 
       RETURNING id, created_at`,
      [id, reply]
    );
    const assistantMessageId = assistantMessageResult.rows[0].id;
    
    // Registrar en rag_query_logs
    const endTime = Date.now();
    await db.query(
      `INSERT INTO rag_query_logs (
        conversation_id, message_id, original_query, rewritten_query,
        results_retrieved, results_used, source_ids, chunk_ids,
        retrieved_context, query_time_ms, total_tokens_used
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id, 
        assistantMessageId,
        message,
        context ? message : null,
        relevantChunks.length,
        relevantChunks.length,
        relevantChunks.map(c => c.source_id),
        relevantChunks.map(c => c.chunk_id),
        JSON.stringify(relevantChunks.map(c => ({
          source: c.source_title,
          content: c.content.substring(0, 500)
        }))),
        endTime - startTime,
        Math.ceil((message.length + reply.length) / 4) // Estimación de tokens
      ]
    );
    
    // Actualizar métricas de uso de materiales
    for (const chunk of relevantChunks) {
      await db.query(
        `SELECT update_material_usage_metrics($1, $2, $3)`,
        [id, chunk.source_id, Math.ceil(chunk.content.length / 4)]
      );
    }
    
    res.json({
      reply,
      user_message: userMessageResult.rows[0],
      assistant_message: assistantMessageResult.rows[0],
      message_id: assistantMessageId,
      context_used: relevantChunks.length,
      query_time_ms: endTime - startTime,
      sources: [...new Set(relevantChunks.map(c => ({
        id: c.source_id,
        title: c.source_title
      })))],
      // Chunks de contexto para verificación RAG
      context_chunks: relevantChunks.map(c => ({
        id: c.chunk_id,
        content: c.content,
        document_id: c.source_id,
        document_name: c.source_title,
        page: c.chunk_index,
        similarity: c.similarity,
        metadata: c.metadata
      }))
    });
  } catch (err) {
    console.error('Error en chat con contexto:', err.message);
    res.status(500).json({ error: 'No se pudo procesar el mensaje' });
  }
});

// ============================================
// ENDPOINT PARA OBTENER MATERIALES DISPONIBLES
// ============================================

// GET /api/conversations/:id/available-materials - Obtener materiales no vinculados
router.get('/conversations/:id/available-materials', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const conversation = await verifyConversationOwnership(id, userId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    // Obtener materiales del usuario que no están vinculados a esta conversación
    const result = await db.query(
      `SELECT 
        s.id,
        s.title,
        s.category,
        s.kind,
        s.author,
        s.created_at,
        (SELECT COUNT(*) FROM chunks WHERE source_id = s.id) as chunk_count
      FROM sources s
      WHERE s.user_id = $1 
        AND s.is_deleted = FALSE
        AND s.is_ai_accessible = TRUE
        AND s.id NOT IN (
          SELECT source_id FROM conversation_materials 
          WHERE conversation_id = $2 AND status != 'removed'
        )
      ORDER BY s.created_at DESC`,
      [userId, id]
    );
    
    res.json({
      materials: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    console.error('Error al obtener materiales disponibles:', err.message);
    res.status(500).json({ error: 'No se pudieron obtener los materiales disponibles' });
  }
});

export default router;
