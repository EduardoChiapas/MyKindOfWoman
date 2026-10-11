'use strict';
const { buildMessages, policy } = require('./lumo-home.cjs');

function configFromEnv(env = process.env) {
  const integer = (key, fallback, min, max) => Math.min(max, Math.max(min, parseInt(env[key], 10) || fallback));
  let base;
  try { base = new URL(env.LUMO_API_BASE_URL || 'https://api.openai.com/v1/'); } catch (_) { throw new Error('LUMO_API_BASE_URL must be a valid URL'); }
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname))) throw new Error('Provider requires HTTPS or loopback HTTP');
  if (base.username || base.password || base.search || base.hash) throw new Error('Provider URL must not contain credentials, query or fragment');
  base.pathname = base.pathname.replace(/\/$/, '') + '/';
  function originOnly(value) {
    if (value.includes('*')) throw new Error('Wildcard origins are not allowed');
    let url;
    try { url = new URL(value); } catch (_) { throw new Error('Origin must be an exact URL'); }
    if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Use an exact HTTPS origin, without path or wildcard');
    return url.origin;
  }
  const allowedOrigins = [...new Set((env.LUMO_ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean).map(originOnly))];
  if (allowedOrigins.length > 10) throw new Error('Too many allowed origins');
  return {
    apiKey: env.LUMO_API_KEY || '', model: env.LUMO_MODEL || '',
    endpoint: new URL('chat/completions', base).href,
    timeoutMs: integer('LUMO_TIMEOUT_MS', 11000, 1000, 20000),
    maxTokens: integer('LUMO_MAX_COMPLETION_TOKENS', 220, 100, 600),
    tokenField: env.LUMO_TOKEN_FIELD === 'max_tokens' ? 'max_tokens' : 'max_completion_tokens',
    jsonMode: env.LUMO_JSON_MODE !== 'false',
    maxPerMinute: integer('LUMO_REQUESTS_PER_MINUTE', 8, 1, 30),
    maxPerDay: integer('LUMO_REQUESTS_PER_DAY', 120, 1, 1000),
    maxConcurrency: integer('LUMO_MAX_CONCURRENCY', 2, 1, 4),
    allowedOrigins: Object.freeze(allowedOrigins),
    publicOrigin: env.LUMO_PUBLIC_ORIGIN ? originOnly(env.LUMO_PUBLIC_ORIGIN.trim()) : null
  };
}
async function readBoundedJson(response, limit = 32768) {
  if (!response.body) throw new Error('Empty provider response');
  const reader = response.body.getReader();
  let total = 0; const chunks = [];
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      total += value.byteLength;
      if (total > limit) throw new Error('Provider response too large');
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally { await reader.cancel().catch(() => {}); }
}
async function complete(body, config, { signal, fetchImpl = fetch } = {}) {
  const messages = buildMessages(body);
  const data = { model: config.model, messages, stream: false, store: false, [config.tokenField]: config.maxTokens };
  if (config.jsonMode) data.response_format = { type: 'json_object' };
  const res = await fetchImpl(config.endpoint, {
    method: 'POST', signal, redirect: 'error',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + config.apiKey },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Provider rejected request');
  const reply = await readBoundedJson(res);
  const raw = reply && reply.choices && reply.choices[0] && reply.choices[0].message && reply.choices[0].message.content;
  if (typeof raw !== 'string') throw new Error('Provider returned no dialogue');
  const validated = policy.validateResponse(JSON.parse(raw), body.context);
  if (!validated) throw new Error('Invalid or restricted dialogue');
  return validated;
}
module.exports = { configFromEnv, complete, readBoundedJson };
