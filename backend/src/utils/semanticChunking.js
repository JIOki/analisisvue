/**
 * Módulo de Chunking Semántico Inteligente
 * Este módulo implementa la fragmentación de documentos basada en unidades
 * de significado completo, añadiendo metadata enriquecida para mejorar
 * la calidad de las búsquedas y la generación de respuestas.
 */

import { generateEmbedding } from '../routes/embeddingService.js';

const BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const LLM_MODEL = process.env.LLM_MODEL || 'llama3.2:1b';

// Límites conservadoras para el modelo nomic-embed-text
// Aproximadamente: 1 token ≈ 4 caracteres, modelo típico tiene 512 tokens
const EMBEDDING_MAX_CHARS = 1500;  // Aprox 375 tokens - muy seguro
const ANALYSIS_MAX_CHARS = 800;    // Aprox 200 tokens - muy seguro
// const MAX_SEGMENT_CHARS = 2000;    // Límite para segmentos antes de dividir (eliminado para evitar redeclaración)

/**
 * Función principal de chunking semántico
 * @param {string} fullText - Texto completo extraído del documento
 * @param {object} docMetadata - Metadatos base del archivo
 * @returns {Promise<Array>} Array de chunks enriquecidos
 */
export async function semanticChunking(fullText, docMetadata) {
  console.log('🔍 Iniciando chunking semántico...');

  // Paso 1: Pre-procesamiento - Dividir por estructura de párrafos
  const rawSegments = splitByStructure(fullText);
  console.log(`📄 Segmentos estructurales detectados: ${rawSegments.length}`);

  const processedChunks = [];

  // Paso 2: Procesar cada segmento para generar metadata
  for (let i = 0; i < rawSegments.length; i++) {
    const segment = rawSegments[i];

    // Filtrar segmentos demasiado cortos o ruido
    if (segment.trim().length < 30) continue;

    console.log(`🧠 Analizando segmento ${i + 1}/${rawSegments.length}...`);

    // Analizar y enriquecer con el LLM
    const analysis = await analyzeSegment(segment, docMetadata);

    // Generar embedding para el contenido (con división automática si es muy largo)
    let embedding = [];
    try {
      const truncatedForEmbedding = segment.length > EMBEDDING_MAX_CHARS
        ? segment.substring(0, EMBEDDING_MAX_CHARS)
        : segment;
      
      console.log(`📏 Largo del segmento: ${segment.length} chars, truncado a: ${truncatedForEmbedding.length} chars`);
      embedding = await generateEmbedding(truncatedForEmbedding);
      console.log(`✅ Embedding generado exitosamente (${embedding.length} dimensiones)`);
    } catch (err) {
      console.warn(`⚠️ Error generando embedding para chunk ${i + 1}:`, err.message);
      
      // Si falla, intentar con texto aún más pequeño
      try {
        const smallerText = segment.substring(0, 500);
        console.log(`🔄 Reintentando con texto reducido a 500 caracteres`);
        embedding = await generateEmbedding(smallerText);
        console.log(`✅ Embedding generado con texto reducido`);
      } catch (err2) {
        console.warn(`⚠️ Fallo también con texto reducido:`, err2.message);
        // Si todo falla, crear embedding vacío pero continuar
        console.log(`⚠️ No se pudo generar embedding, el chunk se guardará sin vector`);
      }
    }

    const chunk = {
      content: segment.trim(),
      embedding: embedding,
      metadata: {
        summary: analysis.summary,
        key_concepts: analysis.key_concepts,
        chunk_category: analysis.category,
        abstraction_level: analysis.abstraction_level,
        structural_context: {
          segment_index: i,
          original_length: segment.length,
          detected_structure: analysis.detected_structure
        },
        chunk_metadata: {
          source_name: docMetadata.filename,
          source_type: docMetadata.mimeType,
          processed_at: new Date().toISOString()
        }
      }
    };

    processedChunks.push(chunk);

    // Pequeña pausa para no saturar el LLM
    if (i < rawSegments.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`✅ Chunking semántico completado: ${processedChunks.length} chunks generados`);
  console.log(`📊 Conceptos clave extraídos: ${processedChunks.reduce((acc, c) => acc + c.metadata.key_concepts.length, 0)}`);

  return processedChunks;
}

/**
 * Divide el texto por estructura natural (párrafos, secciones)
 * @param {string} text - Texto a segmentar
 * @returns {Array<string>} Array de segmentos
 */
// Límite conservado para que los chunks finales sean procesables
const MAX_SEGMENT_CHARS = 1500; // Reducido para evitar problemas de contexto

function splitByStructure(text) {
  const segments = [];

  // Dividir por saltos de línea dobles (párrafos)
  const paragraphs = text.split(/\n\s*\n/);

  let currentSection = '';
  let currentParagraphs = [];
  let currentLength = 0;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();

    if (!trimmed) continue;

    // Si el párrafo individual es muy largo, dividirlo
    const paraChunks = splitLongParagraph(trimmed);

    for (const paraChunk of paraChunks) {
      const chunkLength = paraChunk.length + currentSection.length + currentParagraphs.length * 50;

      // Si excede el límite, guardar segmento actual y empezar nuevo
      if (chunkLength > MAX_SEGMENT_CHARS && (currentSection || currentParagraphs.length > 0)) {
        // Guardar sección actual
        if (currentSection) {
          segments.push(currentSection + '\n\n' + currentParagraphs.join('\n\n'));
        } else {
          segments.push(currentParagraphs.join('\n\n'));
        }
        currentParagraphs = [];
        currentSection = '';
        currentLength = 0;
      }

      // Detectar si es un encabezado
      const isHeader = detectHeader(paraChunk);

      if (isHeader) {
        // Guardar contenido previo si existe
        if (currentParagraphs.length > 0) {
          segments.push(currentSection + '\n\n' + currentParagraphs.join('\n\n'));
          currentParagraphs = [];
        }
        currentSection = paraChunk;
      } else {
        currentParagraphs.push(paraChunk);
      }
    }
  }

  // Agregar el último segmento
  if (currentSection || currentParagraphs.length > 0) {
    if (currentSection && currentParagraphs.length === 0) {
      segments.push(currentSection);
    } else if (currentParagraphs.length > 0) {
      if (currentSection) {
        segments.push(currentSection + '\n\n' + currentParagraphs.join('\n\n'));
      } else {
        segments.push(currentParagraphs.join('\n\n'));
      }
    }
  }

  // Si no se detectaron secciones, usar los párrafos individuales
  if (segments.length === 0 && paragraphs.length > 0) {
    const filtered = paragraphs.filter(p => p.trim().length >= 30);
    // Dividir párrafos largos
    return filtered.flatMap(p => splitLongParagraph(p.trim()));
  }

  return segments.length > 0 ? segments : paragraphs.filter(p => p.trim().length >= 30);
}

/**
 * Divide un párrafo largo en sub-chunks más pequeños
 * @param {string} paragraph - Párrafo a dividir
 * @returns {Array<string>} Array de sub-chunks
 */
function splitLongParagraph(paragraph) {
  if (paragraph.length <= MAX_SEGMENT_CHARS) {
    return [paragraph];
  }

  // Dividir por oraciones
  const sentences = paragraph.split(/(?<=[.?!])\s+/);
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > MAX_SEGMENT_CHARS) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [paragraph.substring(0, MAX_SEGMENT_CHARS)];
}

/**
 * Detecta si una línea es un encabezado
 * @param {string} line - Línea a evaluar
 * @returns {boolean}
 */
function detectHeader(line) {
  const trimmed = line.trim();

  // Encabezado si: muy corto, mayormente mayúsculas, o tiene patrón de número de sección
  const isShort = trimmed.length < 100;
  const isUppercase = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
  const hasSectionNumber = /^\d+(\.\d+)*\s/.test(trimmed) || /^[IVXLC]+\.\s/.test(trimmed);
  const isMarkdownHeader = /^#{1,6}\s/.test(trimmed);

  return isShort && (isUppercase || hasSectionNumber || isMarkdownHeader);
}

/**
 * Analiza un segmento de texto usando el LLM para extraer metadata
 * @param {string} textBlock - Texto a analizar
 * @param {object} docMetadata - Metadatos del documento
 * @returns {Promise<object>} Metadata extraída
 */
async function analyzeSegment(textBlock, docMetadata) {
  // Truncar texto si es muy largo para el prompt
  const truncatedText = textBlock.length > ANALYSIS_MAX_CHARS
    ? textBlock.substring(0, ANALYSIS_MAX_CHARS) + '... [contenido truncado]'
    : textBlock;

  const prompt = `Analiza el siguiente fragmento de texto y extrae metadata semántica.
El texto puede estar truncado, analízalo parcialmente si es necesario.

Texto del fragmento:
"""
${truncatedText}
"""

Responde ÚNICAMENTE con un objeto JSON con esta estructura:
{
  "summary": "Un resumen de una frase que capture la esencia del fragmento",
  "key_concepts": ["concepto1", "concepto2", "concepto3", "concepto4"],
  "category": "Una de estas categorías: Introducción, Marco Teórico, Caso de Uso, Procedimiento, Definición, Ejemplo, Conclusión, Referencia, Otro",
  "abstraction_level": " Conceptual (teoría/principios), Procedimental (pasos/instrucciones), o Analítico (comparaciones/evaluaciones)",
  "detected_structure": "párrafo, lista, encabezado, código, o tabla"
}`;

  try {
    const response = await fetch(`${BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LLM_MODEL,
        prompt: prompt,
        stream: false,
        format: 'json'
      })
    });

    if (!response.ok) {
      throw new Error(`Error del LLM: ${await response.text()}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.response || data.text || '{}');

    // Validar y sanitizar la respuesta
    return {
      summary: analysis.summary || 'Sin resumen disponible',
      key_concepts: Array.isArray(analysis.key_concepts) ? analysis.key_concepts : [],
      category: validateCategory(analysis.category),
      abstraction_level: validateAbstractionLevel(analysis.abstraction_level),
      detected_structure: analysis.detected_structure || 'párrafo'
    };

  } catch (error) {
    console.warn(`⚠️ Error en análisis semántico, usando valores por defecto: ${error.message}`);

    // Fallback: extraer conceptos básicos mediante keyword detection
    const basicConcepts = extractBasicConcepts(textBlock);

    return {
      summary: textBlock.substring(0, 150) + (textBlock.length > 150 ? '...' : ''),
      key_concepts: basicConcepts,
      category: 'Otro',
      abstraction_level: 'Conceptual',
      detected_structure: detectStructureType(textBlock)
    };
  }
}

/**
 * Valida y corrige la categoría
 */
function validateCategory(category) {
  const validCategories = [
    'Introducción', 'Marco Teórico', 'Caso de Uso', 'Procedimiento',
    'Definición', 'Ejemplo', 'Conclusión', 'Referencia', 'Otro'
  ];

  const normalized = category?.trim();
  if (validCategories.includes(normalized)) {
    return normalized;
  }

  // Detectar categoría basada en keywords
  const lowerCat = normalized?.toLowerCase() || '';

  if (lowerCat.includes('introduc') || lowerCat.includes('overview')) return 'Introducción';
  if (lowerCat.includes('teórico') || lowerCat.includes('fundamento') || lowerCat.includes('concept')) return 'Marco Teórico';
  if (lowerCat.includes('caso') || lowerCat.includes('ejemplo') || lowerCat.includes('implement')) return 'Caso de Uso';
  if (lowerCat.includes('proced') || lowerCat.includes('paso') || lowerCat.includes('instruc')) return 'Procedimiento';
  if (lowerCat.includes('defin')) return 'Definición';
  if (lowerCat.includes('conclu')) return 'Conclusión';

  return 'Otro';
}

/**
 * Valida y corrige el nivel de abstracción
 */
function validateAbstractionLevel(level) {
  const normalized = level?.toLowerCase() || '';

  if (normalized.includes('concept')) return 'Conceptual';
  if (normalized.includes('proced') || normalized.includes('instruc')) return 'Procedimental';
  if (normalized.includes('analít') || normalized.includes('compar')) return 'Analítico';

  return 'Conceptual';
}

/**
 * Detecta el tipo de estructura del texto
 */
function detectStructureType(text) {
  if (/^\d+\.\s+\d+\.\s+\d+\.\s/m.test(text)) return 'lista';
  if (/^(const|var|let|function|class|def|import|from)/m.test(text)) return 'código';
  if (/^#{1,6}\s/.test(text)) return 'encabezado';
  if (text.includes('\n- ') || text.includes('\n* ')) return 'lista';
  if (text.split('\n').length > 5) return 'párrafo largo';

  return 'párrafo';
}

/**
 * Extrae conceptos básicos mediante análisis de frecuencia
 */
function extractBasicConcepts(text) {
  // Limpiar y tokenizar
  const words = text.toLowerCase()
    .replace(/[^\w\sáéíóúñü]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4);

  // Contar frecuencia (excluyendo stopwords)
  const stopwords = new Set([
    'que', 'para', 'con', 'los', 'las', 'una', 'pero', 'este', 'esta',
    'como', 'más', 'por', 'donde', 'cuando', 'aunque', 'solo', 'tiene',
    'tienen', 'puede', 'pueden', 'ser', 'estar', 'hacer', 'hace', 'hacen'
  ]);

  const freq = {};
  for (const word of words) {
    if (!stopwords.has(word)) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }

  // Ordenar por frecuencia y tomar los top 4
  const concepts = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([word]) => word);

  return concepts;
}

export default {
  semanticChunking,
  splitByStructure,
  analyzeSegment,
  splitLongParagraph
};
