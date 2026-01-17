/**
 * Módulo de Chunking Rápido con RecursiveCharacterTextSplitter
 * Implementa fragmentación de texto rápida y eficiente para el sistema RAG.
 * Este enfoque es significativamente más rápido que el chunking semántico
 * ya que no requiere llamadas al LLM para cada segmento.
 */

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || "1000", 10);
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP || "200", 10);

/**
 * Crea el divisor de texto con configuración optimizada
 * Los separadores se probarán en orden para encontrar la mejor fragmentación
 */
function createTextSplitter() {
  return new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: [
      "\n\n",  // Párrafos (primero intentar dividir por bloques de párrafo)
      "\n",    // Saltos de línea
      ". ",    // Oraciones
      ", ",    // Frases separadas por comas
      " ",     // Palabras individuales (último recurso)
      ""       // Caracteres individuales (nunca debería llegar aquí)
    ],
    keepSeparator: false
  });
}

/**
 * Chunking rápido usando RecursiveCharacterTextSplitter
 * @param {string} fullText - Texto completo extraído del documento
 * @param {object} docMetadata - Metadatos base del archivo
 * @returns {Promise<Array>} Array de chunks
 */
export async function fastChunking(fullText, docMetadata = {}) {
  console.log('🚀 Iniciando chunking rápido...');
  
  const startTime = Date.now();
  
  try {
    const splitter = createTextSplitter();
    
    // Crear los documentos divididos
    const chunks = await splitter.createDocuments([fullText]);
    
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Chunking completado: ${chunks.length} chunks generados en ${processingTime}ms`);
    
    // Transformar al formato esperado por el sistema
    return chunks.map((chunk, index) => ({
      content: chunk.pageContent,
      metadata: {
        chunk_index: index,
        source_name: docMetadata.filename || 'documento',
        source_type: docMetadata.mimeType || 'text/plain',
        processed_at: new Date().toISOString(),
        chunk_size: chunk.pageContent.length,
        // Metadatos básicos para compatibilidad
        summary: chunk.pageContent.substring(0, 150) + (chunk.pageContent.length > 150 ? '...' : ''),
        key_concepts: extractBasicConcepts(chunk.pageContent),
        chunk_category: 'General',
        abstraction_level: 'Conceptual',
        structural_context: {
          original_length: fullText.length,
          chunk_position: index
        },
        chunk_metadata: {
          source_name: docMetadata.filename || 'documento',
          source_type: docMetadata.mimeType || 'text/plain',
          processed_at: new Date().toISOString()
        }
      }
    }));
    
  } catch (error) {
    console.error('❌ Error en chunking con LangChain:', error.message);
    
    // Fallback: chunking manual sin dependencias
    console.log('🔄 Usando chunking manual como fallback...');
    return manualChunking(fullText, docMetadata);
  }
}

/**
 * Chunking manual como fallback (sin dependencias de LangChain)
 * @param {string} text - Texto a fragmentar
 * @param {object} docMetadata - Metadatos del documento
 * @returns {Array} Array de chunks
 */
function manualChunking(text, docMetadata = {}) {
  const chunks = [];
  const separators = ["\n\n", "\n", ". ", ", ", " "];
  const chunkSize = CHUNK_SIZE;
  const chunkOverlap = CHUNK_OVERLAP;
  
  let currentChunk = "";
  
  for (let i = 0; i < text.length; ) {
    // Encontrar el mejor separador hacia adelante
    let bestSeparator = null;
    let bestSeparatorIndex = -1;
    
    for (const separator of separators) {
      const idx = text.indexOf(separator, i);
      if (idx !== -1 && idx < i + chunkSize) {
        if (bestSeparatorIndex === -1 || idx < bestSeparatorIndex) {
          bestSeparator = separator;
          bestSeparatorIndex = idx;
        }
      }
    }
    
    // Determinar el final del chunk
    let chunkEnd = i + chunkSize;
    
    if (bestSeparatorIndex !== -1 && bestSeparatorIndex < i + chunkSize) {
      chunkEnd = bestSeparatorIndex + bestSeparator.length;
    } else {
      // Buscar el último espacio dentro del límite
      const lastSpace = text.lastIndexOf(" ", i + chunkSize);
      if (lastSpace > i + chunkSize * 0.8) {
        chunkEnd = lastSpace;
      }
    }
    
    const chunkText = text.slice(i, chunkEnd).trim();
    
    if (chunkText.length > 0) {
      chunks.push({
        content: chunkText,
        metadata: {
          chunk_index: chunks.length,
          source_name: docMetadata.filename || 'documento',
          source_type: docMetadata.mimeType || 'text/plain',
          processed_at: new Date().toISOString(),
          chunk_size: chunkText.length,
          summary: chunkText.substring(0, 150) + (chunkText.length > 150 ? '...' : ''),
          key_concepts: extractBasicConcepts(chunkText),
          chunk_category: 'General',
          abstraction_level: 'Conceptual',
          structural_context: {
            original_length: text.length,
            chunk_position: chunks.length
          },
          chunk_metadata: {
            source_name: docMetadata.filename || 'documento',
            source_type: docMetadata.mimeType || 'text/plain',
            processed_at: new Date().toISOString()
          }
        }
      });
    }
    
    // Mover al siguiente chunk (con overlap)
    i = chunkEnd - chunkOverlap;
    
    // Evitar bucle infinito
    if (i < 0) i = chunkEnd;
    if (i >= text.length) break;
  }
  
  console.log(`✅ Chunking manual completado: ${chunks.length} chunks`);
  return chunks;
}

/**
 * Extrae conceptos básicos mediante análisis de frecuencia
 * @param {string} text - Texto a analizar
 * @returns {Array<string>} Array de conceptos clave
 */
function extractBasicConcepts(text) {
  const words = text.toLowerCase()
    .replace(/[^\w\sáéíóúñü]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4);
  
  const stopwords = new Set([
    'que', 'para', 'con', 'los', 'las', 'una', 'pero', 'este', 'esta',
    'como', 'más', 'por', 'donde', 'cuando', 'aunque', 'solo', 'tiene',
    'tienen', 'puede', 'pueden', 'ser', 'estar', 'hacer', 'hace', 'hacen',
    'cada', 'entre', 'sobre', 'todo', 'todos', 'unas', 'unos', 'según',
    'durante', 'hasta', 'mediante', 'hacia', 'contra', 'after', 'before',
    'because', 'been', 'being', 'does', 'doing', 'done', 'having'
  ]);
  
  const freq = {};
  for (const word of words) {
    if (!stopwords.has(word)) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }
  
  const concepts = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([word]) => word);
  
  return concepts;
}

export default {
  fastChunking,
  manualChunking,
  extractBasicConcepts
};
