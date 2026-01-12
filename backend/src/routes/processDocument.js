
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
import { generateEmbedding2 } from '../routes/embeddingService.js';
// Al inicio de tu archivo, asegúrate de tener:
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';


dotenv.config();

const MAX_CHUNK_LENGTH = 1024;
const VECTOR_DIM = parseInt(process.env.VECTOR_DIM || "1024", 10);
const MAX_CHUNKS = 500;
const BATCH_SIZE = 10;

const BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
console.log('🔧 OLLAMA_BASE_URL desde env:', process.env.OLLAMA_BASE_URL);
console.log('🔧 BASE final usado:', BASE);
console.log('🔧 EMBEDDING_MODEL:', process.env.EMBEDDING_MODEL);


export async function processDocument(buffer, sourceId, client) {
  console.log("🧠 generateEmbedding está definido:", typeof generateEmbedding);


  const fileType = await fileTypeFromBuffer(buffer);
  const mimeType = fileType?.mime || 'application/octet-stream';
  let rawText = '';

  console.log("📄 fileType detectado:", fileType);

  switch (mimeType) {
    case 'application/pdf':
      rawText = await extractPDF(buffer);
      break;
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      rawText = await extractDOCX(buffer);
      break;
    case 'text/plain':
      rawText = buffer.toString('utf-8');
      break;
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      rawText = await extractXLSX(buffer);
      break;
    case 'text/html':
      rawText = await extractHTML(buffer);
      break;
    case 'text/markdown':
      rawText = await extractMarkdown(buffer);
      break;
    case 'text/csv':
      rawText = await extractCSV(buffer);
      break;
    case 'application/msword':
      rawText = await extractDOC(buffer);
      break;
    case 'application/json':
      try {
        const json = JSON.parse(buffer.toString('utf-8'));
        rawText = json?.features
          ? await extractGeoJSON(buffer)
          : await extractJSON(buffer);
      } catch (err) {
        throw new Error('Error al procesar JSON: ' + err.message);
      }
      break;
    case 'application/xml':
    case 'text/xml':
      rawText = await extractXML(buffer);
      break;
    case 'application/vnd.google-earth.kml+xml':
      rawText = await extractKML(buffer);
      break;
    default:
      throw new Error(`Formato no soportado: ${mimeType}`);
  }

  if (!rawText || rawText.trim().length === 0) {
    throw new Error('El documento no contiene texto útil');
  }

  const chunks = chunkText(rawText, MAX_CHUNK_LENGTH);
  console.log(`✂️ Chunks generados: ${chunks.length}`);

  let inserted = 0;

  /*for (let index = 0; index < 2; index++) {
    const chunk = chunks[index];

    const embedding = await generateEmbedding2(chunk);*/
  const success = await insertChunkSafely(client, sourceId, chunks, mimeType);
  if (!success) {
    throw new Error(`❌ Falló el insert del chunk, abortando transacción`);
  }
  // }

  // console.log(`📥 Chunks insertados exitosamente: ${inserted} de ${chunks.length}`);
  //console.log(`✅ Chunks insertados en BD: ${inserted}`);
}

// Extractores

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

function chunkText(text, maxLength) {
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




export async function insertChunkSafely(client, sourceId, chunks, mimeType) {
  /*console.log('🧪 typeof embedding:', typeof embedding);
  console.log('🧪 isArray:', Array.isArray(embedding));
  console.log('🧪 sample:', embedding.slice(0, 5));*/


  try {

    let emb;
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      //if (!req.file) return res.status(400).json({ error: "Falta archivo" });

      for (let j = 0; j < batch.length; j++) {
        console.log(`🧠 Generando embedding ${i + j + 1} de ${chunks.length}`);
        try {
          emb = await embed(batch[j]);
        } catch (err) {
          console.warn(`⚠️ Error al generar embedding para chunk ${i + j + 1}:`, err.message);
          continue; // omitir este chunk
        }
        //emb = await embed(batch[j]);
        if (!Array.isArray(emb) || emb.length !== VECTOR_DIM) {
          console.warn(`⚠️ Chunk omitido:`, batch[j].slice(0, 100));
          skipped++;
          continue;
        }



        console.log("🧪 Primeros 5 valores del embedding:", emb.slice(0, 5));

        const vectorString = `[${emb.join(",")}]`;
        console.log("🧪 vectorString1", vectorString.slice(0, 5));



        const result = await client.query(
          `INSERT INTO chunks(
            id,
            source_id,
            chunk_index,
            content,
            embedding,
          
            created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4::vector, NOW()
          )`,
          [sourceId, i + j, batch[j], vectorString]
        );
        if (result.rowCount !== 1) throw new Error("❌ Insert en sources falló");
       inserted++;
      }
      // 🔄 Pausa breve para liberar memoria
      await new Promise(resolve => setTimeout(resolve, 200));
      // 🧹 Fuerza recolección de basura si está disponible
      if (global.gc) {
        global.gc();
      }


    }
    console.log(`✅ Chunks insertados: ${inserted}`);
    console.log(`⚠️ Chunks omitidos: ${skipped}`);

    //res.json({ ok: true, sourceId, chunks: chunks.length });
    //console.log(`✅ Chunk ${inserted} insertado correctamente`);
    return true;

  } catch (err) {
    console.error(`❌ Error al insertar :`, err.message);
    return false;
  }
}

dotenv.config();


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
