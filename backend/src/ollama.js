/*import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export async function embed(text) {
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
}*/

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export async function embed(text) {
  console.log(`🔍 Embedding: generando para texto de ${text?.length || 0} caracteres`);
  
  const res = await fetch(`${BASE}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.EMBEDDING_MODEL, input: text })
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`❌ Error en embedding API: ${errorText}`);
    throw new Error(`Embeddings error: ${errorText}`);
  }
  
  const data = await res.json();
  console.log(`📊 Respuesta embedding:`, JSON.stringify(data, null, 2));

  // Verificar si embeddings existe
  if (!data.embeddings) {
    console.error(`❌ No se encontró 'embeddings' en la respuesta:`, data);
    throw new Error(`Formato de respuesta inesperado: no hay embeddings`);
  }

  // ✅ Accede correctamente al primer vector
  const embedding = data.embeddings?.[0];
  console.log(`✅ Embedding generado: dimensión ${embedding?.length || 'undefined'}`);
  
  return embedding;
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