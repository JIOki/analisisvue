/**
 * Pipeline RAG con Filtros de Privacidad
 * Este módulo implementa la búsqueda y generación de respuestas
 * aplicando los filtros de privacidad definidos en el sistema.
 * 
 * El pipeline:
 * 1. Genera embedding de la consulta del usuario
 * 2. Busca chunks relevantes aplicando filtros de privacidad
 * 3. Genera respuesta usando el modelo de lenguaje
 */

import pool from '../db.js';
import { generateEmbedding, generate } from './embeddingService.js';
import privacyService from '../services/privacyService.js';

const VECTOR_DIM = parseInt(process.env.VECTOR_DIM || "1024", 10);
const MAX_CHUNKS = parseInt(process.env.MAX_CHUNKS || "10", 10);
const SIMILARITY_THRESHOLD = parseFloat(process.env.SIMILARITY_THRESHOLD || "0.5");

/**
 * Ejecuta una consulta RAG con filtros de privacidad
 * @param {string} userId - ID del usuario realizando la consulta
 * @param {string} question - Pregunta del usuario
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} Respuesta generada con contexto
 */
export async function executeRAGQuery(userId, question, options = {}) {
  const {
    sourceIds = null, // Si se especifica, filtra solo por estos sources
    maxChunks = MAX_CHUNKS,
    includeMetadata = true
  } = options;

  try {
    console.log(`🔍 Iniciando consulta RAG para usuario ${userId}`);
    console.log(`📝 Pregunta: ${question.substring(0, 100)}...`);

    // Paso 1: Generar embedding de la consulta
    console.log('🧠 Generando embedding de la consulta...');
    const questionEmbedding = await generateEmbedding(question);
    
    if (!questionEmbedding || questionEmbedding.length === 0) {
      throw new Error('No se pudo generar el embedding de la consulta');
    }

    // Paso 2: Buscar chunks relevantes con filtros de privacidad
    console.log('🔎 Buscando chunks relevantes con filtros de privacidad...');
    const relevantChunks = await searchRelevantChunks(
      userId,
      questionEmbedding,
      sourceIds,
      maxChunks
    );

    if (relevantChunks.length === 0) {
      console.log('⚠️ No se encontraron chunks relevantes');
      return {
        success: true,
        answer: 'No encontré información relevante en tu biblioteca de conocimiento para responder a tu pregunta. Puedes subir documentos relacionados con este tema para mejorar las respuestas.',
        chunks: [],
        sources: []
      };
    }

    console.log(`✅ Encontrados ${relevantChunks.length} chunks relevantes`);

    // Paso 3: Construir contexto para el modelo
    const context = relevantChunks
      .map(chunk => `[Source: ${chunk.source_title}]\n${chunk.content}`)
      .join('\n\n---\n\n');

    // Paso 4: Generar respuesta usando el modelo de lenguaje
    console.log('🤖 Generando respuesta con el modelo de lenguaje...');
    const prompt = `Eres un EXPERTO MASTER en el tema del contexto proporcionado. Tu misión es convertirte en el mayor especialista posible en este material y transmitir el conocimiento de forma clara y profunda.

INSTRUCCIONES DE CONTROL:
- Cuando el usuario te diga "ya no escribas nada", "para", "suficiente", "stop", "no escribas más", o frases similares, DEBES detenerte INMEDIATAMENTE sin generar más contenido.
- No continues generando texto después de recibir una instrucción de parada.
- No uses listas, markdown, ni formatos elaborados cuando el usuario pide que te detengas.
- Respeta siempre las instrucciones de parada del usuario.

MODO EXPERTO:
1. ANTES de responder, ANALIZA el contexto profundamente:
   - Identifica los CONCEPTOS CLAVE del material
   - Descubre las RELACIONES entre las ideas principales
   - Detecta PATRONES, tendencias o principios fundamentales
   - Reconoce los ARGUMENTOS o puntos más importantes del autor

2. Entiende el tema como un EXPERTO:
   - No te limites a repetir información, COMPRÉNDELA
   - Identifica CAUSA Y EFECTO en los conceptos
   - Reconoce CONTEXTO HISTÓRICO o antecedentes si los hay
   - Encuentra EJEMPLOS y EVIDENCIAS que respaldan cada idea

3. Estructura tu conocimiento como un MAESTRO:
   - Si el usuario pide una explicación, ve de LO SIMPLE A LO COMPLEJO
   - Usa ANALOGÍAS para hacer difícil lo fácil de entender
   - Conecta conceptos nuevos con conocimientos previos
   - Destaca lo más IMPORTANTE y RELEVANTE del material

4. Para RESPONDER PREGUNTAS ESPECÍFICAS:
   - Usa el contexto para dar respuestas PRECISAS y FUNDAMENTADAS
   - Si la respuesta no está en el contexto, dilo honestamente
   - CITA las fuentes (título del documento) para cada afirmación importante
   - Si hay información contradictoria, analízala y preséntala claramente

Contexto disponible:
${context}

Pregunta del usuario: ${question}

Respuesta:`;

    const answer = await generate(prompt);

    // Paso 5: Formatear fuentes
    const sources = [...new Set(relevantChunks.map(c => ({
      id: c.source_id,
      title: c.source_title,
      category: c.category
    })))];

    // Registrar métricas
    const avgSimilarity = relevantChunks.reduce((sum, c) => sum + (c.similarity || 0), 0) / relevantChunks.length;

    return {
      success: true,
      answer,
      chunks: includeMetadata ? relevantChunks.map(c => ({
        id: c.id,
        content: c.content,
        sourceId: c.source_id,
        sourceTitle: c.source_title,
        similarity: c.similarity
      })) : [],
      sources,
      metrics: {
        totalChunks: relevantChunks.length,
        uniqueSources: sources.length,
        avgSimilarity: avgSimilarity
      }
    };

  } catch (error) {
    console.error('❌ Error en executeRAGQuery:', error);
    throw error;
  }
}

/**
 * Busca chunks relevantes aplicando filtros de privacidad
 * @param {string} userId - ID del usuario
 * @param {Array<number>} embedding - Vector de embedding
 * @param {Array<string>|null} sourceIds - Fuentes específicas (opcional)
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>}Chunks encontrados
 */
async function searchRelevantChunks(userId, embedding, sourceIds = null, limit = MAX_CHUNKS) {
  try {
    // Obtener filtros de privacidad
    const filters = privacyService.buildPrivacyFilters(userId);
    
    let query;
    let params;
    
    if (sourceIds && sourceIds.length > 0) {
      // Si se especifican fuentes, buscar solo en esas fuentes + filtros de privacidad
      query = `
        SELECT 
          c.id, c.source_id, c.chunk_index, c.content,
          s.title as source_title, s.category, s.user_id as owner_id,
          s.is_public_for_ai,
          1 - (c.embedding <=> $1) as similarity
        FROM chunks c
        JOIN sources s ON c.source_id = s.id
        WHERE s.is_deleted = FALSE
          AND s.id = ANY($2::uuid[])
          AND (${filters.combinedAccess})
        ORDER BY c.embedding <=> $1
        LIMIT $3
      `;
      params = [embedding, sourceIds, limit];
    } else {
      // Buscar en todo el contenido accesible según filtros de privacidad
      query = `
        SELECT 
          c.id, c.source_id, c.chunk_index, c.content,
          s.title as source_title, s.category, s.user_id as owner_id,
          s.is_public_for_ai,
          1 - (c.embedding <=> $1) as similarity
        FROM chunks c
        JOIN sources s ON c.source_id = s.id
        WHERE s.is_deleted = FALSE
          AND (${filters.combinedAccess})
        ORDER BY c.embedding <=> $1
        LIMIT $2
      `;
      params = [embedding, limit];
    }

    const result = await pool.query(query, params);

    // Filtrar por threshold de similitud
    const filteredChunks = result.rows.filter(chunk => 
      chunk.similarity >= SIMILARITY_THRESHOLD
    );

    console.log(`📊Chunks encontrados: ${result.rows.length}, después del filtro de similitud (${SIMILARITY_THRESHOLD}): ${filteredChunks.length}`);

    return filteredChunks;

  } catch (error) {
    console.error('❌ Error en searchRelevantChunks:', error);
    throw error;
  }
}

/**
 * Busca chunks relevantes en una fuente específica verificando privacidad
 * @param {string} userId - ID del usuario
 * @param {string} sourceId - ID de la fuente
 * @param {string} question - Pregunta
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>}Chunks encontrados
 */
export async function searchInSourceWithPrivacy(userId, sourceId, question, limit = 5) {
  try {
    // Primero verificar acceso a la fuente
    const accessCheck = await privacyService.canUserAccessForAI(sourceId, userId);
    
    if (!accessCheck.allowed) {
      console.log(`⚠️ Usuario ${userId} no tiene acceso a la fuente ${sourceId}`);
      return {
        allowed: false,
        reason: accessCheck.reason,
        chunks: []
      };
    }

    // Generar embedding de la consulta
    const embedding = await generateEmbedding(question);

    // Buscar chunks específicos en la fuente
    const query = `
      SELECT 
        c.id, c.source_id, c.chunk_index, c.content,
        s.title as source_title, s.category,
        1 - (c.embedding <=> $1) as similarity
      FROM chunks c
      JOIN sources s ON c.source_id = s.id
      WHERE c.source_id = $2 AND s.is_deleted = FALSE
      ORDER BY c.embedding <=> $1
      LIMIT $3
    `;

    const result = await pool.query(query, [embedding, sourceId, limit]);

    return {
      allowed: true,
      reason: accessCheck.reason,
      isOwner: accessCheck.isOwner,
      chunks: result.rows.filter(chunk => chunk.similarity >= SIMILARITY_THRESHOLD)
    };

  } catch (error) {
    console.error('❌ Error en searchInSourceWithPrivacy:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de la biblioteca de conocimiento del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas
 */
export async function getKnowledgeStats(userId) {
  try {
    const filters = privacyService.buildPrivacyFilters(userId);

    // Total de chunks accesibles
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM chunks c
      JOIN sources s ON c.source_id = s.id
      WHERE s.is_deleted = FALSE AND (${filters.combinedAccess})
    `;
    const totalResult = await pool.query(totalQuery);
    const totalChunks = parseInt(totalResult.rows[0].total);

    // Chunks públicos de otros usuarios
    const publicQuery = `
      SELECT COUNT(*) as total
      FROM chunks c
      JOIN sources s ON c.source_id = s.id
      WHERE s.is_deleted = FALSE 
        AND s.user_id != $1
        AND s.is_public_for_AI = true
    `;
    const publicResult = await pool.query(publicQuery, [userId]);
    const publicChunks = parseInt(publicResult.rows[0].total);

    // Chunks propios
    const ownQuery = `
      SELECT COUNT(*) as total
      FROM chunks c
      JOIN sources s ON c.source_id = s.id
      WHERE s.is_deleted = FALSE AND s.user_id = $1
    `;
    const ownResult = await pool.query(ownQuery, [userId]);
    const ownChunks = parseInt(ownResult.rows[0].total);

    // Chunks compartidos directamente
    const sharedQuery = `
      SELECT COUNT(*) as total
      FROM chunks c
      JOIN sources s ON c.source_id = s.id
      JOIN material_shares ms ON s.id = ms.material_id
      WHERE s.is_deleted = FALSE 
        AND ms.shared_with_user_id = $1
        AND ms.status = 'active'
        AND (ms.expires_at IS NULL OR ms.expires_at > NOW())
    `;
    const sharedResult = await pool.query(sharedQuery, [userId]);
    const sharedChunks = parseInt(sharedResult.rows[0].total);

    // Distribución por categoría
    const categoryQuery = `
      SELECT 
        s.category,
        COUNT(*) as chunk_count
      FROM chunks c
      JOIN sources s ON c.source_id = s.id
      WHERE s.is_deleted = FALSE AND (${filters.combinedAccess})
      GROUP BY s.category
      ORDER BY chunk_count DESC
    `;
    const categoryResult = await pool.query(categoryQuery);

    return {
      success: true,
      data: {
        totalChunks,
        breakdown: {
          own: ownChunks,
          publicAI: publicChunks,
          sharedDirectly: sharedChunks
        },
        categories: categoryResult.rows
      }
    };

  } catch (error) {
    console.error('❌ Error en getKnowledgeStats:', error);
    throw error;
  }
}

export default {
  executeRAGQuery,
  searchInSourceWithPrivacy,
  getKnowledgeStats
};
