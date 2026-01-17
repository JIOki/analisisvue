/**
 * Intelligent Query Router for RAG System
 * Clasifica consultas como "general_chat" o "document_query"
 * antes de ejecutar la acción correspondiente
 */

import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

const BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const LLM_MODEL = process.env.LLM_MODEL || "gemma3";

/**
 * Clasifica la intención del usuario usando el modelo LLM
 * @param {string} userQuery - Consulta del usuario
 * @param {Array} chatHistory - Historial de conversación (últimos 2 turnos)
 * @returns {Object} - { classification, reasoning, search_keywords }
 */
export async function classifyQueryIntent(userQuery, chatHistory = []) {
  const startTime = Date.now();

  // Construir contexto del historial
  const historyContext = chatHistory.length > 0
    ? `\nHISTORIAL RECIENTE:\n${chatHistory.slice(-4).map(m => `${m.role}: ${m.content.substring(0, 200)}`).join('\n')}`
    : '';

  const prompt = `Eres un enrutador inteligente para un sistema RAG. Tu ÚNICA tarea es clasificar la consulta del usuario.

**INSTRUCCIONES:**
1. Analiza la consulta considerando el historial si existe
2. Clasifica en una de dos categorías:
   - "general_chat": Saludos, agradecimientos, cumplidos, o preguntas de conocimiento general que NO están relacionadas con documentos específicos (ej: "Hola", "Escribe un poema", "¿Quién es el presidente de Francia?")
   - "document_query": Preguntas que piden información específica, datos, resúmenes o detalles que probablemente estarían en una base de conocimiento corporativa o archivo subido (ej: "¿Cuáles son los términos de pago?", "¿Qué dice la política de vacaciones?", "Resume el contenido del documento")

3. Si es "document_query", extrae palabras clave para búsqueda

**FORMATO DE RESPUESTA (JSON OBLIGATORIO):**
{
  "classification": "general_chat" | "document_query",
  "reasoning": "Explicación breve de por qué se clasificó así",
  "search_keywords": ["palabra1", "palabra2"] // Dejar vacío si es general_chat
}

**CONSULTA DEL USUARIO:**
${userQuery}${historyContext}

Responde SOLO con JSON, sin comentarios ni texto adicional:`;

  try {
    const response = await fetch(`${BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LLM_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1, // Baja temperatura para consistencia
          top_k: 10
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Router error: ${await response.text()}`);
    }

    const data = await response.json();
    const rawResponse = data.response || data.text || JSON.stringify(data);

    // Extraer JSON de la respuesta
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ Router no devolvió JSON válido, clasificando como document_query por defecto');
      return {
        classification: "document_query",
        reasoning: "Fallback: no se pudo parsear respuesta del router",
        search_keywords: userQuery.split(' ').slice(0, 5)
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    console.log(`🎯 Router: "${userQuery.substring(0, 50)}..." → ${parsed.classification} (${Date.now() - startTime}ms)`);

    return {
      classification: parsed.classification || "document_query",
      reasoning: parsed.reasoning || "",
      search_keywords: parsed.search_keywords || (parsed.classification === "document_query" ? userQuery.split(' ').slice(0, 5) : [])
    };

  } catch (error) {
    console.error('❌ Error en classifyQueryIntent:', error.message);
    // En caso de error, asumir que es consulta de documento
    return {
      classification: "document_query",
      reasoning: "Fallback: error en router",
      search_keywords: userQuery.split(' ').slice(0, 5)
    };
  }
}

/**
 * Genera respuesta para chat general (sin contexto RAG)
 */
export async function generateGeneralResponse(userQuery, chatHistory) {
  const historyContext = chatHistory.length > 0
    ? `\nContexto de la conversación:\n${chatHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')}`
    : '';

  const systemPrompt = `Eres un asistente amable y serviente. Responde de manera conversacional y natural.

- Mantén un tono amigable y profesional
- Sé conciso pero útil
- Si el usuario pregunta sobre tus capacidades, menciónale que puedes ayudar a responder preguntas sobre documentos subidos al sistema
- No inventes información técnica ni datos específicos` + historyContext;

  const response = await fetch(`${BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL,
      prompt: `${systemPrompt}\n\nUSUARIO: ${userQuery}`,
      stream: false
    })
  });

  if (!response.ok) throw new Error(`General chat error: ${await response.text()}`);
  
  const data = await response.json();
  return data.response || data.text || JSON.stringify(data);
}

/**
 * Genera respuesta usando Strict Context Synthesizer
 * Responderá SOLO usando el contexto proporcionado
 */
export async function generateContextualResponse(userQuery, contextChunks) {
  const contextText = contextChunks.length > 0
    ? contextChunks.map((chunk, i) => 
        `[Fuente ${i + 1} - ${chunk.source_title || 'Documento'}]:\n${chunk.content}`
      ).join('\n\n---\n\n')
    : '';

  if (!contextText) {
    return {
      response: "No se encontró información relevante en los documentos vinculados a esta conversación.",
      chunks_used: 0,
      context_available: false
    };
  }

  const systemPrompt = `Eres un asistente de preguntas y respuestas MUY ESTRICTO. Tienes UNA ÚNICA función: responder basándote EXCLUSIVAMENTE en el contexto proporcionado.

### REGLAS ABSOLUTAS:
1. Usa SOLO la información del CONTEXTO para responder
2. NO uses conocimiento externo bajo ninguna circunstancia
3. Si el CONTEXTO no contiene la respuesta, di exactamente: "No puedo responder esta pregunta basándome en los documentos proporcionados."
4. No menciones "Según el contexto" - responde naturalmente
5. Si el contexto tiene información contradictoria, usa la más reciente o específica

### CONTEXTO:
${contextText}

### PREGUNTA DEL USUARIO:
${userQuery}

Responde de manera clara y directa, usando solo la información del contexto acima.`;

  const response = await fetch(`${BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL,
      prompt: systemPrompt,
      stream: false,
      options: {
        temperature: 0.1, // Temperatura muy baja para evitar alucinaciones
        top_k: 5,
        num_predict: 512
      }
    })
  });

  if (!response.ok) throw new Error(`Context response error: ${await response.text()}`);
  
  const data = await response.json();
  
  return {
    response: data.response || data.text || JSON.stringify(data),
    chunks_used: contextChunks.length,
    context_available: true
  };
}

/**
 * Endpoint de prueba del router
 * GET /api/router/test
 */
router.get('/router/test', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Parámetro "query" es requerido',
        ejemplo: '/api/router/test?query=¿Cuáles%20son%20los%20términos%20de%20pago?'
      });
    }

    const result = await classifyQueryIntent(query, []);
    
    res.json({
      query,
      ...result,
      next_step: result.classification === 'general_chat' 
        ? 'Responder directamente sin RAG' 
        : 'Ejecutar búsqueda en vector DB'
    });

  } catch (error) {
    console.error('Error en router test:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
