import dotenv from 'dotenv';
import fetch from 'node-fetch';
import multer from "multer";

const BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const upload = multer({
  dest: process.env.UPLOAD_DIR || "./uploads",
  limits: { fileSize: 10 * 1024 * 1024 } // ✅ Limita a 10MB
});

const VECTOR_DIM = parseInt(process.env.VECTOR_DIM || "1024", 10);
const MAX_CHUNKS = 500;
const BATCH_SIZE = 10;

dotenv.config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'mxbai-embed-large';

export async function generateEmbedding(text) {

  try {
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
      // Elimina llaves y comillas, convierte a array de floats
      embedding = embedding
        .replace(/^{|}$/g, '') // quita llaves
        .split(',')
        .map(v => parseFloat(v.replace(/"/g, ''))); // quita comillas y convierte
    }

    return embedding;

  } catch (err) {
    console.error('❌ Error al generar embedding:', err.message);
    return Array(1024).fill(0);
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

