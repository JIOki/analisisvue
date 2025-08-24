const dotenv = require("dotenv");
dotenv.config();

const BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

async function embed(text) {
  const res = await fetch(`${BASE}/api/embeddings`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ model: process.env.EMBEDDING_MODEL, input: text })
  });
  if (!res.ok) throw new Error(`Embeddings error: ${await res.text()}`);
  const data = await res.json();
  // Ollama devuelve { embedding: number[] } o { data: [{embedding:[]}, ...] } según versión
  return data.embedding ?? data.data?.[0]?.embedding;
}

async function generate(prompt) {
  const res = await fetch(`${BASE}/api/generate`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
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

module.exports = { embed, generate };