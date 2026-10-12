'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createMind } = require('../lumo-mind.js');
const Local = require('../lumo-local.js');
const endpoint = 'https://backend.example/api/chat';
const good = { text:'Me alegra seguir conversando contigo, Mira. Mi departamento de ocurrencias acaba de encontrar una idea y está intentando no perderla por el pasillo.', emotion:'PLAYFUL', animation:'laugh', memory_reference:null, narrative_intent:null, source:'ai' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers:{'Content-Type':'application/json'} });
const settle = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function fixture(t, options = {}) {
  const saved = new Map(), requests = [], probes = [];
  let time = Date.parse('2026-10-12T18:00:00Z'), sequence = 0, sessionCount = 0;
  const plans = [...(options.models || [])];
  const env = {
    location:{ href:'https://pages.example/game/' },
    LUMO_CONFIG:{ endpoint },
    crypto:{ randomUUID:() => 'cold-chat-request-' + (++sequence) },
    localStorage:{ getItem:key => saved.get(key) || null, setItem:(key, value) => saved.set(key, String(value)), removeItem:key => saved.delete(key) },
    fetch:(url, init = {}) => {
      const request = { url:String(url), method:init.method, signal:init.signal, credentials:init.credentials, headers:init.headers, body:init.body ? JSON.parse(init.body) : null };
      requests.push(request);
      if (url === 'https://backend.example/api/ready') {
        assert.equal(init.method, 'GET'); assert.equal(init.credentials, 'omit'); assert.equal(init.body, undefined);
        const probe = { ...deferred(), request, completed:false };
        probes.push(probe);
        if (options.autoReady) { probe.completed = true; probe.resolve(json({ready:true,providerReady:true})); }
        return probe.promise;
      }
      if (url === 'https://backend.example/api/session') {
        sessionCount++;
        return Promise.resolve(json({csrfToken:'mock-csrf-' + sessionCount,consent:false,expiresIn:7200}));
      }
      if (url === 'https://backend.example/api/session/consent') return Promise.resolve(json({consent:request.body.consent}));
      if (url === 'https://backend.example/api/session/clear') return Promise.resolve(json({cleared:request.body.scope}));
      assert.equal(url, endpoint);
      const plan = plans.shift();
      return plan ? plan(request) : Promise.resolve(json(good));
    }
  };
  const mind = createMind(env, { now:() => time, random:() => .31 });
  const count = suffix => requests.filter(request => request.url === 'https://backend.example/api/' + suffix).length;
  const probeResult = (body = {ready:true,providerReady:true}, index = probes.length - 1) => {
    assert.ok(probes[index], 'A readiness request must exist before it can finish');
    probes[index].completed = true; probes[index].resolve(json(body));
  };
  t.after(async () => {
    await mind.revokeAIConsent();
    for (const probe of probes) if (!probe.completed) { probe.completed = true; probe.resolve(json({ready:false,providerReady:false})); }
    await settle();
  });
  return { mind, env, requests, probes, count, probeResult, advance:ms => { time += ms; } };
}
function catalog(reply) {
  assert.equal(reply.source, 'local');
  assert.ok(Local.decode(reply.localReplyId), 'Fallback must be an approved catalog response');
  assert.equal(reply.text, Local.render(reply.localReplyId).text);
  assert.equal(reply.narrative_intent, null);
  return reply.localReplyId;
}

test('cold greeting and typed replies finish locally while one readiness GET waits; only confirmation enables Gemini', {timeout:4000}, async t => {
  const f = fixture(t);
  const greeting = f.mind.act('meet', {}, {room:'bedroom'});
  assert.equal(greeting.source, 'local');
  assert.match(greeting.text, /Mira/);
  await settle();
  assert.equal(f.count('ready'), 1);
  assert.equal(f.count('session'), 0);
  const first = await f.mind.chat('¿Quién es Xavier?');
  const firstId = catalog(first);
  const laugh = await f.mind.chat('JAJAJA me hizo reir');
  catalog(laugh);
  const third = await f.mind.chat('Cuéntame otro chiste');
  catalog(third);
  assert.equal(f.count('ready'), 1);
  assert.equal(f.count('session'), 0);
  assert.equal(f.count('session/consent'), 0);
  assert.equal(f.count('chat'), 0);

  f.advance(60000);
  const afterMinute = await f.mind.chat('¿Qué opinas de las nubes?');
  catalog(afterMinute);
  assert.equal(f.count('ready'), 1);
  assert.equal(f.count('chat'), 0, 'Elapsed time cannot manufacture readiness');
  assert.equal(f.count('session'), 0);
  const warming = f.mind.prepareConnection();
  f.probeResult();
  assert.equal(await warming, true);

  const recovered = await f.mind.chat('Seguimos con otra idea');
  assert.equal(recovered.source, 'ai');
  assert.equal(f.count('ready'), 1);
  assert.equal(f.count('session'), 1);
  assert.equal(f.count('session/consent'), 1);
  assert.equal(f.count('chat'), 1);
  const paid = f.requests.find(request => request.url === endpoint);
  assert.equal(paid.credentials, 'include');
  assert.equal(paid.headers['X-CSRF-Token'], 'mock-csrf-1');
  assert.equal(paid.body.context.chapter, 'HOME');
  assert.equal(paid.body.context.player, 'Mira');
  assert.ok(paid.body.context.localReplies.includes(firstId));
  assert.ok(paid.body.context.localReplies.every(id => Local.decode(id)));
  assert.ok(paid.body.context.localLaughter.includes(firstId));
  assert.equal(paid.body.context.localSubject, 'xavier');
  assert.ok(!('history' in paid.body));
  assert.equal(f.mind.getState().localDialogue.lastLocalId, null);
});

test('ready and providerReady must both be true booleans before a typed message can use the provider', {timeout:4000}, async t => {
  for (const refused of [{ready:true,providerReady:false}, {ready:false,providerReady:true}, {ready:'true',providerReady:true}, {ready:true,providerReady:'true'}]) {
    const f = fixture(t);
    const warming = f.mind.prepareConnection();
    await settle(); f.probeResult(refused);
    assert.equal(await warming, false);
    catalog(await f.mind.chat('¿Quién es David?'));
    assert.equal(f.count('session'), 0);
    assert.equal(f.count('chat'), 0);
    f.advance(21000);
    const retry = f.mind.prepareConnection();
    await settle(); f.probeResult({ready:true,providerReady:true});
    assert.equal(await retry, true);
    assert.equal((await f.mind.chat('Ahora podemos conversar')).source, 'ai');
    assert.equal(f.count('chat'), 1);
  }
});

test('over fifteen minutes without chat returns locally and requires a fresh probe and session despite cached credentials', {timeout:4000}, async t => {
  const f = fixture(t);
  const firstWarm = f.mind.prepareConnection();
  await settle(); f.probeResult(); await firstWarm;
  assert.equal((await f.mind.chat('Hablemos un momento')).source, 'ai');
  assert.equal(f.count('session'), 1);
  assert.equal(f.count('chat'), 1);
  f.advance(15 * 60000 + 1);
  const cold = await f.mind.chat('Cuéntame otro chiste');
  const id = catalog(cold);
  await settle();
  assert.equal(f.count('ready'), 2);
  assert.equal(f.count('session'), 1, 'A cached session is not permission to call a cold backend');
  assert.equal(f.count('chat'), 1);
  catalog(await f.mind.chat('¿Quién es Xavier?'));
  assert.equal(f.count('ready'), 2);
  assert.equal(f.count('session'), 1);
  const newWarm = f.mind.prepareConnection();
  f.probeResult(); await newWarm;
  assert.equal((await f.mind.chat('Ya tengo otra idea')).source, 'ai');
  assert.equal(f.count('session'), 2);
  assert.equal(f.count('session/consent'), 2);
  assert.equal(f.count('chat'), 2);
  const paid = f.requests.filter(request => request.url === endpoint).at(-1);
  assert.equal(paid.headers['X-CSRF-Token'], 'mock-csrf-2');
  assert.ok(paid.body.context.localReplies.includes(id));
});

test('network, HTTP, provider-local and invalid output failures produce varied approved dialogue instead of placeholders', {timeout:4000}, async t => {
  const f = fixture(t, {autoReady:true, models:[
    async () => { throw Error('PRIVATE_PROVIDER_ERROR'); },
    async () => json({error:'PRIVATE_PROVIDER_ERROR'}, 503),
    async () => json({source:'local',reason:'timeout',text:'PLACEHOLDER_NEVER_DISPLAYED'}),
    async () => json({...good,narrative_intent:{command:'open_basement'}})
  ]});
  const fallbackIds = [], fallbackText = [];
  for (let index = 0; index < 4; index++) {
    if (index) f.advance(21000);
    assert.equal(await f.mind.prepareConnection(), true);
    const reply = await f.mind.chat('Cuéntame otro chiste');
    fallbackIds.push(catalog(reply)); fallbackText.push(reply.text);
    assert.equal(reply.error, true);
    assert.ok(!/PRIVATE_PROVIDER_ERROR|PLACEHOLDER_NEVER_DISPLAYED/.test(reply.text));
    const paidBefore = f.count('chat');
    catalog(await f.mind.chat('Tengo otra pregunta'));
    assert.equal(f.count('chat'), paidBefore, 'Provider failures cannot immediately retry a paid conversation');
  }
  assert.equal(new Set(fallbackIds).size, 4);
  assert.equal(new Set(fallbackText).size, 4);
  assert.equal(f.count('chat'), 4);
  assert.ok(!/PRIVATE_PROVIDER_ERROR|PLACEHOLDER_NEVER_DISPLAYED/.test(JSON.stringify(f.mind.getState().history)));
});

test('a cancelled provider request cannot deliver its late answer or append it to recent dialogue', {timeout:4000}, async t => {
  const late = deferred();
  const f = fixture(t, {autoReady:true,models:[() => late.promise]});
  await f.mind.prepareConnection();
  const controller = new AbortController();
  const previous = f.mind.getState().history;
  const chatting = f.mind.chat('Tengo una idea para conversar', {}, {signal:controller.signal});
  const outcome = chatting.then(value => ({value}), error => ({error}));
  await settle();
  assert.equal(f.count('chat'), 1);
  controller.abort();
  assert.equal(f.requests.find(request => request.url === endpoint).signal.aborted, true);
  late.resolve(json({...good,text:'LATE_ANSWER Me alegra compartir esta conversación contigo, Mira, mientras mis ideas intentan organizarse por el pasillo.'}));
  assert.equal((await outcome).error.name, 'AbortError');
  assert.deepEqual(f.mind.getState().history, previous);
  assert.ok(!JSON.stringify(f.mind.getState()).includes('LATE_ANSWER'));
  await assert.rejects(f.mind.chat('No se envía este mensaje', {}, {signal:controller.signal}), {name:'AbortError'});
  assert.equal(f.count('chat'), 1);
});

test('revoking during warm-up prevents a late readiness confirmation from enabling AI', {timeout:4000}, async t => {
  const f = fixture(t);
  const warming = f.mind.prepareConnection();
  await settle();
  const signal = f.probes[0].request.signal;
  await f.mind.revokeAIConsent();
  assert.equal(signal.aborted, true);
  f.probeResult();
  assert.equal(await warming, false);
  catalog(await f.mind.chat('Cuéntame otro chiste'));
  assert.equal(await f.mind.prepareConnection(), false);
  assert.equal(f.count('ready'), 1);
  assert.equal(f.count('session'), 0);
  assert.equal(f.count('chat'), 0);
  assert.equal(f.mind.getState().settings.aiConsent, false);
});

test('revoking during a provider call discards late AI and keeps later chat local', {timeout:4000}, async t => {
  const late = deferred();
  const f = fixture(t, {autoReady:true,models:[() => late.promise]});
  await f.mind.prepareConnection();
  const chatting = f.mind.chat('Me gustaría conversar un rato');
  await settle();
  assert.equal(f.count('chat'), 1);
  await f.mind.revokeAIConsent();
  assert.equal(f.requests.find(request => request.url === endpoint).signal.aborted, true);
  late.resolve(json({...good,text:'LATE_ANSWER Mi departamento de ocurrencias todavía tiene una idea para comentar contigo mientras paseamos tranquilamente por la casa.'}));
  catalog(await chatting);
  catalog(await f.mind.chat('Cuéntame otro chiste'));
  assert.equal(f.count('chat'), 1);
  assert.equal(f.count('session'), 1);
  assert.equal(f.count('ready'), 1);
  assert.equal(await f.mind.prepareConnection(), false);
  assert.ok(!JSON.stringify(f.mind.getState().history).includes('LATE_ANSWER'));
  assert.equal(f.mind.getState().settings.allowAI, false);
});
