import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
const MAX_CHARS_PER_CHUNK = 4000; // Límite seguro para evitar error de contexto
const EMBEDDING_DIM = parseInt(process.env.VECTOR_DIM || "768", 10);

/**
 * Divide el texto en chunks de tamaño seguro
 * @param {string} text - Texto a dividir
 * @param {number} maxChars - Máximo caracteres por chunk
 * @returns {Array} - Array de chunks
 */
function splitIntoChunks(text, maxChars = MAX_CHARS_PER_CHUNK) {
  if (!text || text.length <= maxChars) {
    return text ? [text] : [];
  }

  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Buscar un punto de corte natural (párrafo, oración, o espacio)
    let cutPoint = maxChars;

    // Si excede el límite, buscar corte en espacio cercano
    if (remaining.length > maxChars) {
      // Intentar cortar en el último salto de línea antes del límite
      const lastNewline = remaining.lastIndexOf('\n', maxChars);
      if (lastNewline > maxChars * 0.5) {
        cutPoint = lastNewline;
      } else {
        // Cortar en el último punto y seguido
        const lastPeriod = remaining.lastIndexOf('. ', maxChars);
        if (lastPeriod > maxChars * 0.5) {
          cutPoint = lastPeriod + 1;
        } else {
          // Cortar en el último espacio
          const lastSpace = remaining.lastIndexOf(' ', maxChars);
          if (lastSpace > maxChars * 0.5) {
            cutPoint = lastSpace;
          }
        }
      }
    }

    const chunk = remaining.slice(0, cutPoint).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    remaining = remaining.slice(cutPoint).trim();
  }

  console.log(`📦 Texto dividido en ${chunks.length} chunks`);
  return chunks;
}

/**
 * Calcula el promedio de múltiples vectores de embedding
 * @param {Array} embeddings - Array de embeddings
 * @returns {Array} - Embedding promediado
 */
function averageEmbeddings(embeddings) {
  if (!embeddings || embeddings.length === 0) {
    return Array(EMBEDDING_DIM).fill(0);
  }

  const result = new Array(embeddings[0].length).fill(0);

  for (const emb of embeddings) {
    for (let i = 0; i < emb.length; i++) {
      result[i] += emb[i];
    }
  }

  // Dividir por el número de embeddings
  for (let i = 0; i < result.length; i++) {
    result[i] /= embeddings.length;
  }

  return result;
}

export async function embed(text) {
  console.log(`🔍 Embedding: generando para texto de ${text?.length || 0} caracteres`);

  // Verificar si el texto es muy largo
  if (!text || text.trim().length === 0) {
    console.warn('⚠️ Texto vacío, retornando embedding cero');
    return Array(EMBEDDING_DIM).fill(0);
  }

  // Dividir en chunks si es necesario
  const chunks = splitIntoChunks(text, MAX_CHARS_PER_CHUNK);

  // Si solo hay un chunk, procesar normalmente
  if (chunks.length === 1) {
    const res = await fetch(`${BASE}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ Error en embedding API: ${errorText}`);
      throw new Error(`Embeddings error: ${errorText}`);
    }

    const data = await res.json();

    if (!data.embeddings || !Array.isArray(data.embeddings)) {
      console.error(`❌ Formato de respuesta inesperado:`, data);
      throw new Error(`Formato de respuesta inesperado: no hay embeddings`);
    }

    const embedding = data.embeddings?.[0];
    console.log(`✅ Embedding generado: dimensión ${embedding?.length || 'undefined'}`);
    return embedding;
  }

  // Si hay múltiples chunks, procesar cada uno y promediar
  console.log(`📊 Procesando ${chunks.length} chunks por texto largo...`);
  const embeddings = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`🧠 Generando embedding chunk ${i + 1}/${chunks.length}`);

    try {
      const res = await fetch(`${BASE}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: EMBEDDING_MODEL, input: chunks[i] })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`⚠️ Error en chunk ${i + 1}: ${errorText}`);
        continue; // Skip este chunk y continuar con los demás
      }

      const data = await res.json();
      const embedding = data.embeddings?.[0];

      if (embedding && Array.isArray(embedding)) {
        embeddings.push(embedding);
      }

      // Pequeña pausa entre chunks para no sobrecargar el servidor
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.warn(`⚠️ Error procesando chunk ${i + 1}: ${err.message}`);
      continue;
    }
  }

  if (embeddings.length === 0) {
    throw new Error('No se pudo generar ningún embedding para los chunks');
  }

  // Promediar todos los embeddings
  const finalEmbedding = averageEmbeddings(embeddings);
  console.log(`✅ Embedding promediado de ${embeddings.length} chunks: dimensión ${finalEmbedding.length}`);

  return finalEmbedding;
}



export async function generate(prompt) {
  const res = await fetch(`${BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      prompt,
      stream: false
    })
  });

  if (!res.ok) throw new Error(`LLM error: ${await res.text()}`);
  const data = await res.json();
  return data.response ?? data;
}


// backend/src/ollama.js

export async function sendMessage(message, context = null) {
  // Si hay contexto separado, usar sendMessageWithContext
  if (context) {
    return await sendMessageWithContext(message, context);
  }
  
  // Si el contexto viene embebido en el primer parámetro (como hace conversationRoutes)
  if (message && (message.includes('=== CONTEXTO ===') || message.includes('Contexto relevante:'))) {
    return await sendMessageWithContext(message, message);
  }

  // Simulación de respuesta del modelo (solo si no hay contexto)
  console.log("📨 Enviando mensaje al modelo:", message);

  // Aquí puedes integrar con Ollama, OpenAI, etc.
  // Por ahora devolvemos una respuesta simulada
  return `Respuesta simulada para: "${message}"`;
}

export async function sendMessageWithContext(message, context) {
  try {
    console.log("📨 Enviando mensaje con contexto:", { message, contextLength: context.length });

    // Formatear el prompt con el contexto proporcionado
    const formattedPrompt = `Contexto relevante:
${context}

Pregunta del usuario: ${message}

Responde basándote en el contexto proporcionado.`;

    // Usar el modelo LLM configurado (gemma3)
    const modelName = process.env.LLM_MODEL || 'llama3.2:1b';
    
    const res = await fetch(`${BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        prompt: formattedPrompt,
        stream: false
      })
    });

    if (!res.ok) {
      throw new Error(`LLM error: ${await res.text()}`);
    }

    const data = await res.json();
    const response = data.response ?? data;
    
    console.log("✅ Respuesta generada con contexto exitosamente");
    return response;

  } catch (error) {
    console.error("❌ Error en sendMessageWithContext:", error);
    // En caso de error, devolver mensaje de error pero mantener la funcionalidad
    return `Lo siento, hubo un error al procesar tu consulta con contexto: ${error.message}`;
  }
}