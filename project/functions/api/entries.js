/**
 * Cloudflare Pages Function — POST /api/entries
 * Requires a D1 binding named RAG_DB (set in Cloudflare Pages dashboard).
 * Create the table first: see d1-schema.sql
 */

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 200, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const db = env.RAG_DB;
  if (!db) return json({ error: 'D1 binding RAG_DB not configured' }, 500);

  let content;
  try {
    ({ content } = await request.json());
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return json({ error: 'content is required' }, 400);
  }

  const id        = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    await db
      .prepare('INSERT INTO rag_entries (id, content, created_at) VALUES (?, ?, ?)')
      .bind(id, content.trim(), createdAt)
      .run();

    return json({ success: true, id, created_at: createdAt });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
}
