function chunkText(text, maxChars = 1500, overlap = 200) {
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

module.exports = { chunkText };