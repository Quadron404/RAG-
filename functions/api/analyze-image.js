/**
 * Cloudflare Pages Function — POST /api/analyze-image
 * Uses Groq secret "RAG" and Qwen2.5-VL for OCR-style text extraction.
 */

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MODEL = 'qwen/qwen2.5-vl-72b-instruct';
const PROMPT =
  'Extract ONLY the written text visible in this image. ' +
  'Return the exact text with exact spacing, line breaks, and punctuation as shown. ' +
  'Do not add explanations, labels, markdown, or any other content. ' +
  'If there is no text, return an empty string.';

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
  const apiKey = env.RAG;
  if (!apiKey) return json({ error: 'Secret RAG not configured' }, 500);

  let image;
  try {
    ({ image } = await request.json());
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!image || typeof image !== 'string') {
    return json({ error: 'image (base64 data URL) is required' }, 400);
  }

  const dataUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        }],
        temperature: 0,
        max_completion_tokens: 4096,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return json({ error: data?.error?.message || 'Groq API error' }, res.status);
    }

    const text = (data.choices?.[0]?.message?.content || '').trim();
    return json({ success: true, text });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
}
