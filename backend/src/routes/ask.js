const { Router } = require("express");
const { pool } = require("../db.js");
const { embed, generate } = require("../ollama.js");

const router = Router();

async function searchChunks(queryEmb, k = 8) {
  const { rows } = await pool.query(
    `SELECT content, 1 - (embedding <=> $1) AS score
     FROM chunks
     ORDER BY embedding <=> $1
     LIMIT $2`,
    [queryEmb, k]
  );
  return rows;
}

async function searchRecords(queryEmb, k = 5) {
  const { rows } = await pool.query(
    `SELECT text_for_embedding AS content, 1 - (embedding <=> $1) AS score
     FROM records
     ORDER BY embedding <=> $1
     LIMIT $2`,
    [queryEmb, k]
  );
  return rows;
}

router.post("/", async (req, res) => {
  try {
    const { topic, questionnaire, topKDocs = 8, topKRecords = 5 } = req.body;
    if (!questionnaire || !Array.isArray(questionnaire) || questionnaire.length === 0) {
      return res.status(400).json({ error: "questionnaire[] requerido" });
    }

    const queryText = [topic, ...questionnaire].filter(Boolean).join("\n");
    const qEmb = await embed(queryText);

    const docHits = await searchChunks(qEmb, topKDocs);
    const recordHits = await searchRecords(qEmb, topKRecords);

    const context = [
      "=== FRAGMENTOS BIBLIOGRÁFICOS ===",
      ...docHits.map((r, i) => `(${i+1}) ${r.content}`),
      "=== REGISTROS RELEVANTES ===",
      ...recordHits.map((r, i) => `(${i+1}) ${r.content}`)
    ].join("\n\n");

    const prompt = `
Eres un analista. Responde SOLO con la información del CONTEXTO.
Si algo no está en el contexto, indícalo claramente.

TEMA: ${topic || "N/A"}

CUESTIONARIO:
${questionnaire.map((q,i)=>`${i+1}. ${q}`).join("\n")}

CONTEXTO:
${context}

FORMATO DE RESPUESTA (obligatorio):
- Resumen ejecutivo
- Desarrollo por cada pregunta (1..n)
- Hallazgos clave
- Vacíos de información
- Recomendaciones y próximos pasos
    `.trim();

    const answer = await generate(prompt);
    res.json({ answer, used: { docHits, recordHits } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  }
});

module.exports = router;