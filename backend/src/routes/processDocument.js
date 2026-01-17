/**
 * Procesador de Documentos con Chunking Semántico
 * Este módulo procesa documentos de múltiples formatos y los fragmenta
 * en chunks semánticamente enriquecidos para el sistema RAG.
 */

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import xlsx from 'xlsx';
import pool from "../db.js";

import * as cheerio from 'cheerio';
import { fileTypeFromBuffer } from 'file-type';
import { parse } from 'csv-parse/sync';
import textract from 'textract';
import { XMLParser } from 'fast-xml-parser';
import { DOMParser } from 'xmldom';
import { kml } from '@tmcw/togeojson';
import { generateEmbedding } from '../routes/embeddingService.js';
import { fastChunking } from '../utils/simpleChunking.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const MAX_CHUNK_LENGTH = 1024;
const VECTOR_DIM = parseInt(process.env.VECTOR_DIM || "768", 10);
const MAX_CHUNKS = 500;
const BATCH_SIZE = 10; // Aumentado porque el chunking rápido genera más chunks pero menos procesamiento

const BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
console.log('🔧 OLLAMA_BASE_URL desde env:', process.env.OLLAMA_BASE_URL);
console.log('🔧 BASE final usado:', BASE);
console.log('🔧 EMBEDDING_MODEL:', process.env.EMBEDDING_MODEL);
console.log('🔧 LLM_MODEL:', process.env.LLM_MODEL);

/**
 * Procesa un documento extrayendo texto y creando chunks semánticos
 * @param {Buffer} buffer - Buffer del archivo
 * @param {UUID} sourceId - ID de la fuente en la base de datos
 * @param {object} client - Cliente de base de datos
 * @param {string} filename - Nombre del archivo
 */
export async function processDocument(buffer, sourceId, client, filename = 'documento') {
  console.log(`📄 Iniciando procesamiento semántico para: ${filename}`);

  const fileType = await fileTypeFromBuffer(buffer);
  const mimeType = fileType?.mime || 'application/octet-stream';
  let rawText = '';

  console.log("📄 fileType detectado:", fileType);

  try {
    // Extraer texto según el tipo de archivo
    rawText = await extractTextByType(buffer, mimeType);

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('El documento no contiene texto útil');
    }

    console.log(`📝 Texto extraído: ${rawText.length} caracteres`);

    // Chunking rápido (nuevo sistema optimizado)
    console.log('🚀 Iniciando chunking rápido optimizado...');
    const richChunks = await fastChunking(rawText, {
      filename: filename,
      mimeType: mimeType,
      sourceId: sourceId
    });

    console.log(`✅ Chunking completado: ${richChunks.length} chunks generados`);

    // Insertar chunks con metadata enriquecida
    const insertResult = await insertEnrichedChunks(client, sourceId, richChunks);

    if (!insertResult.success) {
      throw new Error(`❌ Falló la inserción de chunks enriquecidos`);
    }

    console.log(`🎉 Documento procesado exitosamente`);
    console.log(`   - Chunks creados: ${insertResult.inserted}`);
    console.log(`   - Conceptos extraídos: ${insertResult.concepts}`);
    console.log(`   - Tiempo de procesamiento: ${insertResult.time}ms`);

    return {
      success: true,
      chunks: insertResult.inserted,
      concepts: insertResult.concepts,
      categories: insertResult.categories
    };

  } catch (error) {
    console.error(`❌ Error procesando documento: ${error.message}`);
    throw error;
  }
}

/**
 * Extrae texto según el tipo de mime
 */
async function extractTextByType(buffer, mimeType) {
  switch (mimeType) {
    case 'application/pdf':
      return await extractPDF(buffer);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return await extractDOCX(buffer);
    case 'text/plain':
      return buffer.toString('utf-8');
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return await extractXLSX(buffer);
    case 'text/html':
      return await extractHTML(buffer);
    case 'text/markdown':
      return await extractMarkdown(buffer);
    case 'text/csv':
      return await extractCSV(buffer);
    case 'application/msword':
      return await extractDOC(buffer);
    case 'application/json':
      try {
        const json = JSON.parse(buffer.toString('utf-8'));
        return json?.features ? await extractGeoJSON(buffer) : await extractJSON(buffer);
      } catch (err) {
        throw new Error('Error al procesar JSON: ' + err.message);
      }
    case 'application/xml':
    case 'text/xml':
      return await extractXML(buffer);
    case 'application/vnd.google-earth.kml+xml':
      return await extractKML(buffer);
    default:
      throw new Error(`Formato no soportado: ${mimeType}`);
  }
}

// Extractores de texto

async function extractPDF(buffer) {
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractDOCX(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractXLSX(buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  let text = '';
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    rows.forEach(row => {
      text += row.join(' ') + '\n';
    });
  });
  return text;
}

async function extractHTML(buffer) {
  const html = buffer.toString('utf-8');
  const $ = cheerio.load(html);
  return $('body').text();
}

async function extractMarkdown(buffer) {
  return buffer.toString('utf-8');
}

async function extractCSV(buffer) {
  const text = buffer.toString('utf-8');
  const records = parse(text, { columns: false, skip_empty_lines: true });
  return records.map(row => row.join(', ')).join('\n');
}

async function extractDOC(buffer) {
  return new Promise((resolve, reject) => {
    textract.fromBufferWithMime('application/msword', buffer, (err, text) => {
      if (err) return reject(err);
      resolve(text);
    });
  });
}

async function extractJSON(buffer) {
  const json = JSON.parse(buffer.toString('utf-8'));
  return flattenObject(json);
}

async function extractXML(buffer) {
  const parser = new XMLParser({ ignoreAttributes: false });
  const xmlText = buffer.toString('utf-8');
  const parsed = parser.parse(xmlText);
  return flattenObject(parsed);
}

async function extractGeoJSON(buffer) {
  const geo = JSON.parse(buffer.toString('utf-8'));
  return flattenGeoFeatures(geo.features || []);
}

async function extractKML(buffer) {
  const xml = buffer.toString('utf-8');
  const dom = new DOMParser().parseFromString(xml);
  const geo = kml(dom);
  return flattenGeoFeatures(geo.features || []);
}

// Utilidades

function flattenObject(obj, prefix = '') {
  let text = '';
  for (const key in obj) {
    const value = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      text += flattenObject(value, path);
    } else {
      text += `${path}: ${value}\n`;
    }
  }
  return text;
}

function flattenGeoFeatures(features) {
  let text = '';
  for (const f of features) {
    const props = f.properties || {};
    const coords = JSON.stringify(f.geometry?.coordinates || {});
    text += `Tipo: ${f.geometry?.type}\nCoordenadas: ${coords}\n`;
    for (const key in props) {
      text += `${key}: ${props[key]}\n`;
    }
    text += '\n---\n';
  }
  return text;
}

/**
 * Inserta chunks enriquecidos con metadata semántica
 */
export async function insertEnrichedChunks(client, sourceId, richChunks) {
  const startTime = Date.now();
  let inserted = 0;
  let skipped = 0;
  let conceptsTotal = 0;
  const categories = {};

  try {
    for (let i = 0; i < richChunks.length; i += BATCH_SIZE) {
      const batch = richChunks.slice(i, i + BATCH_SIZE);

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        console.log(`💾 Insertando chunk ${i + j + 1} de ${richChunks.length}`);

        try {
          // El embedding ya viene generado del semanticChunking
          const embedding = chunk.embedding;

          if (!Array.isArray(embedding) || embedding.length === 0) {
            console.warn(`⚠️ Chunk ${i + j + 1} sin embedding válido, generando uno...`);
            // Intentar generar embedding como fallback (CON TRUNCAMIENTO)
            try {
              const truncatedText = chunk.content.length > 500
                ? chunk.content.substring(0, 500)
                : chunk.content;
              console.log(`🔄 Generando embedding con texto truncado a ${truncatedText.length} caracteres`);
              const newEmbedding = await embed(truncatedText);
              if (Array.isArray(newEmbedding) && newEmbedding.length > 0) {
                chunk.embedding = newEmbedding;
                console.log(`✅ Embedding fallback generado: ${newEmbedding.length} dimensiones`);
              } else {
                console.warn(`⚠️ Embedding fallback vacío`);
                skipped++;
                continue;
              }
            } catch (embErr) {
              console.warn(`⚠️ No se pudo generar embedding fallback: ${embErr.message}`);
              skipped++;
              continue;
            }
          }

          // Convertir embedding a formato vector
          const vectorString = `[${chunk.embedding.join(",")}]`;

          // Insertar con todas las columnas de metadata
          const result = await client.query(
            `INSERT INTO chunks (
              id,
              source_id,
              chunk_index,
              content,
              embedding,
              summary,
              key_concepts,
              chunk_category,
              abstraction_level,
              structural_context,
              chunk_metadata,
              created_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $4::vector, $5, $6, $7, $8, $9, $10, NOW()
            )`,
            [
              sourceId,
              i + j,
              chunk.content,
              vectorString,
              chunk.metadata.summary,
              chunk.metadata.key_concepts,
              chunk.metadata.chunk_category,
              chunk.metadata.abstraction_level,
              JSON.stringify(chunk.metadata.structural_context),
              JSON.stringify(chunk.metadata.chunk_metadata)
            ]
          );

          if (result.rowCount !== 1) {
            throw new Error("Insert falló");
          }

          inserted++;
          conceptsTotal += chunk.metadata.key_concepts.length;

          // Contar por categoría
          const cat = chunk.metadata.chunk_category;
          categories[cat] = (categories[cat] || 0) + 1;

        } catch (err) {
          console.warn(`⚠️ Error insertando chunk ${i + j + 1}:`, err.message);
          skipped++;
        }

        // Pausa breve entre chunks
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Pausa entre batches
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const totalTime = Date.now() - startTime;

    console.log(`✅ Inserción completada`);
    console.log(`   - Insertados: ${inserted}`);
    console.log(`   - Omitidos: ${skipped}`);
    console.log(`   - Conceptos totales: ${conceptsTotal}`);

    return {
      success: true,
      inserted: inserted,
      skipped: skipped,
      concepts: conceptsTotal,
      categories: categories,
      time: totalTime
    };

  } catch (err) {
    console.error(`❌ Error en insertEnrichedChunks: ${err.message}`);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Función legacy para chunking simple (mantenida para compatibilidad)
 * @deprecated Usar semanticChunking en su lugar
 */
export function chunkTextLegacy(text, maxLength) {
  const sentences = text.split(/(?<=[.?!])\s+/);
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += ' ' + sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

dotenv.config();

/**
 * Genera embedding para un texto (función auxiliar)
 */
export async function embed(text) {
  if (!text || text.trim().length < 50) {
    console.warn('⚠️ Texto demasiado corto para generar embedding');
    return [];
  }

  console.log('🌐 Conectando a Ollama en:', `${BASE}/api/embed`);
  console.log('🤖 Modelo solicitado:', process.env.EMBEDDING_MODEL);

  const res = await fetch(`${BASE}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.EMBEDDING_MODEL, input: text })
  });

  console.log('📡 Estado respuesta Ollama:', res.status);

  if (!res.ok) throw new Error(`Embeddings error: ${await res.text()}`);
  const data = await res.json();

  console.log("Respuesta completa del modelo de embeddings:", data);

  if (!data.embeddings || !Array.isArray(data.embeddings) || data.embeddings.length === 0) {
    console.warn('⚠️ Modelo no devolvió embeddings válidos');
    return [];
  }

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
