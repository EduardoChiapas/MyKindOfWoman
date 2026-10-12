'use strict';
const crypto = require('node:crypto');
const { policy } = require('./lumo-home.cjs');
const LAUGH = /(?:\bja(?:ja)+\b|\bha(?:ha)+\b|\bxd\b|me (?:rei|rio)|me hizo reir)/i;
function createSessions(config, now = Date.now) {
  const sessions = new Map();
  const secure = !!config.publicOrigin && config.publicOrigin.startsWith('https:');
  const cookieName = secure ? '__Host-mkw_session' : 'mkw_session';
  const freshCharacter = () => ({ history:[], memories:[], mentions:[], events:[], gifts:[], inventory:[], localActions:[], lastJokeId:null, turns:0, emotion:'NORMAL', friendship:0, summary:{version:1,facts:[]} });
  function cookie(id, remove = false) { return cookieName + '=' + id + '; Path=/; HttpOnly; SameSite=' + (secure ? 'None; Secure' : 'Strict') + '; Max-Age=' + (remove ? 0 : Math.floor(config.sessionTtlMs / 1000)); }
  function erase(session) { if (session.active) session.active.controller.abort(); sessions.delete(session.id); }
  function prune() { for (const session of sessions.values()) if (session.expiresAt <= now()) erase(session); }
  const cleanup = setInterval(prune, Math.min(config.sessionTtlMs, 60000)); cleanup.unref();
  function get(req) {
    prune(); const raw = String(req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(cookieName + '='));
    if (!raw) return null; const id = raw.slice(cookieName.length + 1);
    return /^[a-zA-Z0-9_-]{43}$/.test(id) ? sessions.get(id) || null : null;
  }
  function issue(req) {
    const existing = get(req); if (existing) return existing;
    prune(); if (sessions.size >= config.maxSessions) return null;
    const session = { id:crypto.randomBytes(32).toString('base64url'), csrf:crypto.randomBytes(32).toString('base64url'), expiresAt:now() + config.sessionTtlMs, consent:false, revision:0, characters:{lumo:freshCharacter(),ryon:freshCharacter()}, cache:new Map(), active:null, minute:0, minuteCount:0, day:0, dayCount:0 };
    sessions.set(session.id, session); return session;
  }
  function csrf(req, session) {
    const token = req.headers['x-csrf-token'];
    return typeof token === 'string' && Buffer.byteLength(token) === Buffer.byteLength(session.csrf) && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(session.csrf));
  }
  function remember(data, id, provenance) {
    if (!policy.MEMORY_IDS.includes(id)) return;
    const category = id.startsWith('favorite_color_') ? 'favorite_color_' : id.startsWith('favorite_activity_') ? 'favorite_activity_' : null;
    if (category) data.memories = data.memories.filter(m => !m.id.startsWith(category) || m.id === id);
    if (!data.memories.some(m => m.id === id)) data.memories.push({id,version:1,priority:policy.memoryPriority(id),provenance});
    if (data.memories.length > 32) { let index = data.memories.findIndex(m => m.priority === 'LOW'); if(index < 0) index = data.memories.findIndex(m=>m.priority==='MEDIUM'); if(index < 0) data.memories.pop(); else data.memories.splice(index,1); }
  }
  function prepare(session, character, message, rawContext) {
    const data = session.characters[character], context = policy.safeContext(rawContext);
    // Browser event declarations are allowlisted but never authoritative server progression.
    data.events = [...new Set([...data.events, ...context.events])].slice(-80);
    data.inventory=context.inventory;
    if (character === 'lumo') data.gifts = [...new Set([...data.gifts, ...context.gifts])].slice(-4);
    for (const id of context.memories) if (character === 'lumo' || !/^(gift_|drawing_friendship|hummed_melody|size_teasing|reaction_laughed_)/.test(id)) remember(data, id, 'local_save_report');
    policy.extractFacts(message).forEach(id => remember(data, id, 'player_statement'));
    if (character === 'lumo' && context.localActions.length) {
      data.localActions = context.localActions;
      const last = context.localActions[context.localActions.length - 1]; data.lastJokeId = last.startsWith('joke:') ? last.slice(5) : null;
    }
    if (data.lastJokeId && LAUGH.test(policy.normalize(message))) remember(data, 'reaction_laughed_' + data.lastJokeId, 'observed_reaction');
    const n = policy.normalize(message);
    const relevant = data.memories.filter(m => /recuerd|gusto|prefer|conoces|jaja|chiste|risa/.test(n) || m.id.startsWith('favorite_color_') && /color/.test(n) || m.id === 'fear_spiders' && /arana|miedo/.test(n) || m.id.startsWith('gift_') && /regalo|flor|galleta|dibujo/.test(n) || m.id === 'interest_minecraft' && /minecraft/.test(n) || m.id === 'compliment_received' && /cumplido|increible|guap/.test(n));
    const eligible = relevant.filter(m => !data.mentions.some(x => x.id === m.id && data.turns - x.turn < 16)).slice(-8).map(m => m.id);
    const relevantEvents=data.events.filter(id=> /escond|hide/.test(n)&&['game:hide_seek','played_hide_seek'].includes(id)||/fnf/.test(n)&&['game:fnf','played_fnf'].includes(id)||/memoria|memory/.test(n)&&['game:memory','played_memory'].includes(id));
    return { message, character, history:data.history.slice(-6), memoryProvenance:Object.fromEntries(data.memories.map(m=>[m.id,m.provenance])), context:{...context, inventory:data.inventory, events:[...new Set([...data.events.slice(-12),...relevantEvents])].slice(-16), gifts:data.gifts, memories:eligible, localActions:character === 'lumo' ? data.localActions : [], lastJokeId:character === 'lumo' ? data.lastJokeId : null, recentMentions:data.mentions.filter(x => data.turns - x.turn < 16).map(x => x.id)} };
  }
  function finish(session, character, body, result) {
    const data = session.characters[character];
    data.history.push({role:'user',content:body.message},{role:'assistant',content:result.text}); data.history = data.history.slice(-8);
    data.turns = Math.min(1000000, data.turns + 1); data.emotion = result.emotion;
    data.friendship = body.context.friendship;
    if (result.memory_reference) { data.mentions = data.mentions.filter(m => m.id !== result.memory_reference); data.mentions.push({id:result.memory_reference,turn:data.turns}); data.mentions = data.mentions.slice(-32); }
    if (data.turns % 12 === 0) data.summary = {version:1, facts:[...data.events, ...data.memories.map(m => 'memory:' + m.id)].slice(-64)};
    data.lastJokeId = null; data.localActions = [];
  }
  function clear(session, scope) {
    session.revision++; if (session.active) session.active.controller.abort(); session.cache.clear();
    for (const data of Object.values(session.characters)) {
      data.history = []; data.localActions = []; data.lastJokeId = null;
      if (scope === 'personal') { data.memories = data.memories.filter(m => /^(gift_|drawing_friendship|hummed_melody)/.test(m.id)); data.mentions = []; data.summary = {version:1,facts:[...data.events, ...data.memories.map(m => 'memory:' + m.id)].slice(-64)}; }
    }
    if (scope === 'all') erase(session);
  }
  function reserve(session, id, fingerprint) {
    const prior = session.cache.get(id);
    if (prior) return prior.fingerprint === fingerprint ? {cached:prior} : {conflict:true};
    if (session.active) return {conflict:true};
    return {};
  }
  function cache(session, id, fingerprint, result, status) {
    session.cache.set(id, {fingerprint,result,status}); while (session.cache.size > 16) session.cache.delete(session.cache.keys().next().value);
  }
  function rate(session) {
    const minute = Math.floor(now()/60000), day = Math.floor(now()/86400000);
    if (session.minute !== minute) {session.minute=minute;session.minuteCount=0;}
    if (session.day !== day) {session.day=day;session.dayCount=0;}
    if (session.minuteCount >= config.sessionPerMinute || session.dayCount >= config.sessionPerDay) return false;
    session.minuteCount++;session.dayCount++;return true;
  }
  return {get,issue,csrf,cookie,prepare,finish,clear,reserve,cache,rate, close(){clearInterval(cleanup); for(const s of sessions.values()) erase(s);}, stats(){prune();return {activeSessions:sessions.size};}};
}
module.exports = {createSessions};
