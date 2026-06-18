-- Run once on your D1 database:
-- wrangler d1 execute rag-genesis-db --remote --file=d1-schema.sql

CREATE TABLE IF NOT EXISTS rag_entries (
  id         TEXT    PRIMARY KEY,
  class_num  INTEGER NOT NULL CHECK (class_num BETWEEN 1 AND 12),
  section    TEXT    NOT NULL CHECK (section GLOB '[A-Z]'),
  content    TEXT    NOT NULL,
  created_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rag_class_section
  ON rag_entries (class_num, section);

-- Migration from legacy schema (no class/section columns):
-- ALTER TABLE rag_entries ADD COLUMN class_num INTEGER DEFAULT 1;
-- ALTER TABLE rag_entries ADD COLUMN section TEXT DEFAULT 'A';
