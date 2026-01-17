import dotenv from 'dotenv';
import fetch from 'node-fetch';
import multer from "multer";

const BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const upload = multer({
  dest: process.env.UPLOAD_DIR || "./uploads",
  limits: { fileSize: 10 * 1024 * 1024 } // ✅ Limita a 10MB
});

const VECTOR_DIM = parseInt(process.env.VECTOR_DIM || "768", 10);
const MAX_CHUNKS = 500;
const BATCH_SIZE = 10;
const MAX_CHARS_PER_CHUNK = 4000; // Límite seguro para embeddings

dotenv.config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';

/**
 * Divide el texto en chunks de tamaño seguro
 */
function splitIntoChunks(text, maxChars = MAX_CHARS_PER_CHUNK) {
  if (!text || text.length <= maxChars) {
    return text ? [text] : [];
  }

  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    let cutPoint = maxChars;

    if (remaining.length > maxChars) {
      const lastNewline = remaining.lastIndexOf('\n', maxChars);
      if (lastNewline > maxChars * 0.5) {
        cutPoint = lastNewline;
      } else {
        const lastPeriod = remaining.lastIndexOf('. ', maxChars);
        if (lastPeriod > maxChars * 0.5) {
          cutPoint = lastPeriod + 1;
        } else {
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
 */
function averageEmbeddings(embeddings) {
  if (!embeddings || embeddings.length === 0) {
    return Array(VECTOR_DIM).fill(0);
  }

  const result = new Array(embeddings[0].length).fill(0);

  for (const emb of embeddings) {
    for (let i = 0; i < emb.length; i++) {
      result[i] += emb[i];
    }
  }

  for (let i = 0; i < result.length; i++) {
    result[i] /= embeddings.length;
  }

  return result;
}

export async function generateEmbedding(text) {
  try {
    console.log(`🔍 Embedding: generando para texto de ${text?.length || 0} caracteres`);

    if (!text || text.trim().length === 0) {
      console.warn('⚠️ Texto vacío');
      return Array(VECTOR_DIM).fill(0);
    }

    // Dividir en chunks si es necesario
    const chunks = splitIntoChunks(text, MAX_CHARS_PER_CHUNK);

    // Si solo hay un chunk, procesar normalmente
    if (chunks.length === 1) {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          prompt: text
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en Ollama: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      let embedding = data.embeddings?.[0];

      if (typeof embedding === 'string') {
        embedding = embedding
          .replace(/^{|}$/g, '')
          .split(',')
          .map(v => parseFloat(v.replace(/"/g, '')));
      }

      console.log(`✅ Embedding generado: dimensión ${embedding?.length || 'undefined'}`);
      return embedding;
    }

    // Múltiples chunks
    console.log(`📊 Procesando ${chunks.length} chunks...`);
    const embeddings = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`🧠 Generando embedding chunk ${i + 1}/${chunks.length}`);

      try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: EMBEDDING_MODEL,
            prompt: chunks[i]
          })
        });

        if (!response.ok) {
          console.warn(`⚠️ Error en chunk ${i + 1}`);
          continue;
        }

        const data = await response.json();
        let embedding = data.embeddings?.[0];

        if (typeof embedding === 'string') {
          embedding = embedding
            .replace(/^{|}$/g, '')
            .split(',')
            .map(v => parseFloat(v.replace(/"/g, '')));
        }

        if (embedding && Array.isArray(embedding)) {
          embeddings.push(embedding);
        }

        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        console.warn(`⚠️ Error chunk ${i + 1}: ${err.message}`);
        continue;
      }
    }

    if (embeddings.length === 0) {
      throw new Error('No se pudo generar ningún embedding');
    }

    const finalEmbedding = averageEmbeddings(embeddings);
    console.log(`✅ Embedding promediado de ${embeddings.length} chunks`);
    return finalEmbedding;

  } catch (err) {
    console.error('❌ Error al generar embedding:', err.message);
    return Array(VECTOR_DIM).fill(0);
  }
}



export async function generateEmbedding2(text) {
  const res = await fetch(`${BASE}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.EMBEDDING_MODEL, input: text })
  });

  if (!res.ok) throw new Error(`Embeddings error: ${await res.text()}`);
  const data = await res.json();

  console.log("Respuesta completa del modelo de embeddings:", data);

  // ✅ Accede correctamente al primer vector
  return data.embeddings?.[0];
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

