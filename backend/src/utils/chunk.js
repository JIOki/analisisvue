/*export function chunkText(text, maxChars = 1500, overlap = 200) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + maxChars, text.length);
    const slice = text.slice(i, end);
    chunks.push(slice.trim());
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks.filter(Boolean);
}

export default chunkText ;*/

export function chunkText(text, maxChars = 1500, overlap = 200, maxChunks = 1500) {
  const chunks = [];
  let i = 0;

  const MAX_TEXT_LENGTH = maxChars * maxChunks;
  const safeText = text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text;

  while (i < safeText.length) {
    console.log(`🔢 Procesando ${chunks.length} fMAX_TEXT_LENGTH ${MAX_TEXT_LENGTH}`);
    const end = Math.min(i + maxChars, safeText.length);
    const slice = safeText.slice(i, end);
    chunks.push(slice.trim());

    i += maxChars - overlap; // ✅ avance correcto
  }

  return chunks.filter(Boolean);
}

export default chunkText;
