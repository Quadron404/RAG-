-- Run this once to create the table in your D1 database:
-- wrangler d1 execute rag-genesis-db --remote --file=d1-schema.sql

CREATE TABLE IF NOT EXISTS rag_entries (
  id         TEXT PRIMARY KEY,
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL
);
