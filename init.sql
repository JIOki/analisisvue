-- Habilitar la extensión vector (se ejecuta automáticamente al iniciar)
CREATE EXTENSION IF NOT EXISTS vector;

-- Crear tablas y índices
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  author TEXT,
  tags TEXT[],
  owner TEXT,
  kind TEXT,               -- pdf, docx, csv, xlsx, txt
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
  chunk_index INT,
  content TEXT,
  embedding VECTOR(1024)
);

CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE IF NOT EXISTS records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw JSONB,               -- fila original (excel/csv)
  text_for_embedding TEXT, -- concatenación campos relevantes
  embedding VECTOR(1024),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_records_embedding ON records USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Opcional: Crear usuario específico si es necesario
-- CREATE USER raguser WITH PASSWORD 'ragpass';
-- GRANT ALL PRIVILEGES ON DATABASE ragdb TO raguser;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO raguser;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO raguser;