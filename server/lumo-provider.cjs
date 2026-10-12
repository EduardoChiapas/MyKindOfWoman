'use strict';
const { buildMessages, policy } = require('./lumo-home.cjs');
const { RYON_HOME_PROMPT } = require('./ryon-home.cjs');

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
  const provider = env.AI_PROVIDER || 'gemini';
  if (!['gemini', 'openai-compatible'].includes(provider)) throw new Error('AI_PROVIDER must be gemini or openai-compatible');
  const model = (provider === 'gemini' ? env.GEMINI_MODEL : env.LUMO_MODEL) || '';
  if (model && !/^[a-zA-Z0-9_.-]{1,120}$/.test(model)) throw new Error('Use a model identifier without URL or path');
  return {
    provider, enabled: env.AI_ENABLED === 'true',
    apiKey: provider === 'gemini' ? env.GEMINI_API_KEY || env.GOOGLE_GEMINI_API_KEY || '' : env.LUMO_API_KEY || '', model,
    endpoint: provider === 'gemini' ? 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent' : new URL('chat/completions', base).href,
    timeoutMs: integer(env.AI_REQUEST_TIMEOUT ? 'AI_REQUEST_TIMEOUT' : 'LUMO_TIMEOUT_MS', 14000, 1000, 20000),
    maxTokens: integer(env.AI_MAX_OUTPUT_TOKENS ? 'AI_MAX_OUTPUT_TOKENS' : 'LUMO_MAX_COMPLETION_TOKENS', 600, 100, 2000),
    tokenField: env.LUMO_TOKEN_FIELD === 'max_tokens' ? 'max_tokens' : 'max_completion_tokens',
    jsonMode: env.LUMO_JSON_MODE !== 'false',
    maxPerMinute: integer('LUMO_REQUESTS_PER_MINUTE', 8, 1, 30),
    maxPerDay: integer('LUMO_REQUESTS_PER_DAY', 120, 1, 1000),
    maxConcurrency: integer('LUMO_MAX_CONCURRENCY', 4, 1, 8),
    sessionPerMinute: integer('LUMO_SESSION_REQUESTS_PER_MINUTE', 4, 1, 20),
    sessionPerDay: integer('LUMO_SESSION_REQUESTS_PER_DAY', 40, 1, 500),
    sessionTtlMs: integer('LUMO_SESSION_TTL_SECONDS', 7200, 60, 86400) * 1000,
    maxSessions: integer('LUMO_MAX_SESSIONS', 100, 3, 1000),
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
  const character = body.character === 'ryon' ? 'ryon' : 'lumo';
  const messages = buildMessages(body, character === 'ryon' ? RYON_HOME_PROMPT : undefined);
  let data, headers;
  if (config.provider === 'gemini') {
    const contents = [];
    for (const message of messages.filter(m => m.role !== 'system')) {
      const role = message.role === 'assistant' ? 'model' : 'user';
      if (contents.length && contents[contents.length - 1].role === role) contents[contents.length - 1].parts.push({ text: message.content });
      else contents.push({ role, parts: [{ text: message.content }] });
    }
    const schema = { type:'object', additionalProperties:false, properties:{ text:{type:'string'}, emotion:{type:'string',enum:policy.EMOTIONS}, animation:{type:'string',enum:policy.ANIMATIONS}, memory_reference:{type:['string','null']}, narrative_intent:{type:'null'} }, required:['text','emotion','animation','memory_reference','narrative_intent'] };
    data = { systemInstruction:{ parts:messages.filter(m => m.role === 'system').map(m => ({text:m.content})) }, contents, generationConfig:{ maxOutputTokens:config.maxTokens, responseMimeType:'application/json', responseJsonSchema:schema } };
    headers = { 'Content-Type':'application/json', 'x-goog-api-key':config.apiKey };
  } else {
    data = { model:config.model, messages, stream:false, store:false, [config.tokenField]:config.maxTokens };
    if (config.jsonMode) data.response_format = { type:'json_object' };
    headers = { 'Content-Type':'application/json', Authorization:'Bearer ' + config.apiKey };
  }
  const res = await fetchImpl(config.endpoint, {
    method: 'POST', signal, redirect: 'error',
    headers,
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Provider rejected request');
  const reply = await readBoundedJson(res);
  let raw;
  if (config.provider === 'gemini') {
    const candidate = reply && reply.candidates && reply.candidates[0];
    if (!candidate || candidate.finishReason !== 'STOP' || (reply.promptFeedback && reply.promptFeedback.blockReason)) throw new Error('Blocked or incomplete dialogue');
    raw = candidate.content && Array.isArray(candidate.content.parts) ? candidate.content.parts.filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join('') : null;
  } else {
    const choice = reply && reply.choices && reply.choices[0];
    if (choice && choice.finish_reason && choice.finish_reason !== 'stop') throw new Error('Incomplete dialogue');
    raw = choice && choice.message && choice.message.content;
  }
  if (typeof raw !== 'string') throw new Error('Provider returned no dialogue');
  const validated = policy.validateResponse(JSON.parse(raw), body.context, character);
  if (!validated) throw new Error('Invalid or restricted dialogue');
  return validated;
}
module.exports = { configFromEnv, complete, readBoundedJson };
