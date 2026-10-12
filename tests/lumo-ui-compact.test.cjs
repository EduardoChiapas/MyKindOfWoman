'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// A small DOM fixture exercises the real public UI and its event handlers.
// Geometry checks here are functional; device rendering is checked separately.
function fixture({ reducedMotion = true, allowAI = false, consent = false, deferred = false } = {}) {
  let document;
  class Node {
    constructor(tag = 'div') {
      this.tagName = tag.toUpperCase(); this.children = []; this.parentNode = null;
      this.className = ''; this.id = ''; this.hidden = false; this.disabled = false;
      this.value = ''; this.dataset = {}; this.attributes = {}; this.listeners = {};
      this._text = ''; this.scrollTop = 0;
      this.style = { setProperty(name, value) { this[name] = String(value); } };
      this.classList = {
        contains: name => this.className.split(/\s+/).includes(name),
        toggle: (name, force) => {
          const items = new Set(this.className.split(/\s+/).filter(Boolean));
          const enabled = force === undefined ? !items.has(name) : force;
          if (enabled) items.add(name); else items.delete(name);
          this.className = [...items].join(' '); return enabled;
        },
        remove: name => this.classList.toggle(name, false)
      };
    }
    set textContent(value) { this._text = String(value); this.children = []; }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    append(...nodes) { for (const node of nodes) { node.parentNode = this; this.children.push(node); } }
    replaceChildren(...nodes) { this.children.forEach(node => { node.parentNode = null; }); this.children = []; this._text = ''; this.append(...nodes); }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    addEventListener(name, handler) { (this.listeners[name] ||= []).push(handler); }
    dispatchEvent(event) {
      event.target ||= this;
      for (const handler of this.listeners[event.type] || []) handler(event);
      if (event.bubbles) this.parentNode?.dispatchEvent(event);
      return true;
    }
    click() { if (!this.disabled) return Promise.all((this.listeners.click || []).map(handler => handler({ target: this, type: 'click' }))); }
    focus() { document.activeElement = this; this.dispatchEvent({ type: 'focus', target: this }); }
    blur() { if (document.activeElement === this) document.activeElement = document.body; }
    matches(selector) {
      return selector.split(',').some(part => {
        const query = part.trim();
        if (query === '[hidden]') return this.hidden;
        const enabled = !query.includes(':not(:disabled)') || !this.disabled;
        const clean = query.replace(':not(:disabled)', '');
        if (clean.startsWith('.')) return enabled && this.classList.contains(clean.slice(1));
        if (clean.startsWith('#')) return this.id === clean.slice(1);
        return enabled && this.tagName.toLowerCase() === clean.toLowerCase();
      });
    }
    querySelectorAll(selector) {
      const result = [];
      for (const child of this.children) { if (child.matches(selector)) result.push(child); result.push(...child.querySelectorAll(selector)); }
      return result;
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    closest(selector) { for (let current = this; current; current = current.parentNode) if (current.matches(selector)) return current; return null; }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    get isConnected() { return document.body.contains(this); }
    get clientWidth() { return this.classList.contains('lumo-text') ? 610 : 800; }
    get scrollHeight() { return this.children.length * 30; }
    getClientRects() { return this.closest('[hidden]') ? [] : [this.getBoundingClientRect()]; }
    getBoundingClientRect() {
      if (this.rect) return this.rect;
      const ui = document.getElementById('lumo-ui');
      const left = parseFloat(ui?.style['--lumo-left']) || 0, top = parseFloat(ui?.style['--lumo-top']) || 0;
      const width = parseFloat(ui?.style['--lumo-width']) || 800, height = parseFloat(ui?.style['--lumo-height']) || 180;
      return { left, top, right: left + width, bottom: top + height, width, height };
    }
    getContext() { return { clearRect() {}, drawImage() {}, measureText: value => ({ width: String(value).length * 10 }) }; }
  }
  document = {
    body: new Node('body'), activeElement: null,
    createElement: tag => new Node(tag), createTextNode: value => { const node = new Node('#text'); node.textContent = value; return node; },
    querySelector(selector) { return this.body.querySelector(selector); },
    getElementById(id) { return this.body.querySelector(`#${id}`); }
  };
  document.activeElement = document.body;
  const stage = new Node('div'); stage.id = 'game-stage';
  stage.rect = { left: 100, top: 50, right: 900, bottom: 750, width: 800, height: 700 };
  document.body.append(stage);
  const events = {};
  const viewport = { width: 1000, height: 800, offsetLeft: 0, offsetTop: 0, addEventListener: (type, fn) => { (events[`viewport:${type}`] ||= []).push(fn); } };
  const window = {
    innerWidth: 1000, innerHeight: 800, visualViewport: viewport,
    matchMedia: () => ({ matches: reducedMotion }),
    getComputedStyle: () => ({ fontSize: '24px', fontFamily: 'Undertale' }),
    addEventListener(type, handler) { (events[type] ||= []).push(handler); }
  };
  const modelState = { settings: { allowAI, aiConsent: consent, persistMemory: true, commentFrequency: 'normal' }, emotion: 'NORMAL', friendship: { stage: 'friends' }, history: [] };
  const messages = []; const chatOptions = []; const actCalls = []; const pauses = []; const privacyEvents = [];
  let resolveChat, chatSignal, personalClears = 0, historyClears = 0, consentRevocations = 0;
  const mind = {
    getState: () => modelState,
    configure(options) { Object.assign(modelState.settings, options); return modelState; },
    greet: current => ({ text: `Hola, Mira. Aquí en ${current.roomId} podemos charlar.`, emotion: 'NORMAL', source: 'local', suggestions: ['¿Cómo estás?', '¿Jugamos?'] }),
    act(kind) { actCalls.push(kind); return { text: 'Una caricia para la ciencia.', emotion: 'HAPPY', source: 'local' }; },
    chat(message, _context, { signal, allowAI }) {
      messages.push(message); chatOptions.push({ allowAI }); chatSignal = signal;
      if (deferred) return new Promise(resolve => { resolveChat = resolve; });
      return Promise.resolve({ text: `Te escucho, Mira. ${message}`, emotion: 'HAPPY', source: allowAI && modelState.settings.allowAI && modelState.settings.aiConsent ? 'ai' : 'local' });
    },
    resetHistory() { historyClears++; modelState.history = []; },
    clearPersonalMemories() { personalClears++; },
    revokeAIConsent() { consentRevocations++; modelState.settings.aiConsent = false; }
  };
  let timerId = 0;
  const timers = new Map();
  class CustomEvent { constructor(type, options = {}) { this.type = type; Object.assign(this, options); } }
  const sandbox = { window, document, AbortController, CustomEvent, Image: class {}, fetch: async () => ({ ok: false }), setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id), requestAnimationFrame: fn => fn() };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../lumo-ui.js'), 'utf8'), sandbox);
  const ui = window.LumoUI;
  ui.mount({ mind, stage, manifest: {}, getContext: () => ({ roomId: 'kitchen' }), pause: value => pauses.push(value), listGifts: () => [{ id: 'cookie', label: 'Galleta', count: 0 }], listGames: () => [{ id: 'memory', label: 'Memoria' }], startGame() {}, giveGift() {} });
  const get = selector => document.querySelector(selector);
  const button = label => get('#lumo-ui').querySelectorAll('button').find(node => node.textContent === label && !node.closest('[hidden]'));
  const event = (code, target, extras = {}) => ({ code, target, preventDefault() {}, stopImmediatePropagation() { this.stopped = true; }, ...extras });
  const key = (code, target, extras) => { const e = event(code, target, extras); for (const handler of events.keydown || []) handler(e); return e; };
  document.body.addEventListener('lumo:privacy', e => privacyEvents.push(e.detail));
  const ready = () => { for (let i = 0; i < 30 && get('#lumo-ui').dataset.phase !== 'reply'; i++) ui.advance(); assert.equal(get('#lumo-ui').dataset.phase, 'reply'); };
  const finishTyping = () => { for (let i = 0; i < 3000 && timers.size; i++) { const [id, fn] = timers.entries().next().value; timers.delete(id); fn(); } };
  return { ui, window, viewport, stage, document, get, button, key, ready, finishTyping, messages, chatOptions, actCalls, modelState, pauses, privacyEvents, events, resolve: value => resolveChat(value), get signal() { return chatSignal; }, get clearCounts() { return { personalClears, historyClears, consentRevocations }; } };
}

test('clean NPC greeting accelerates into its writing field without extra visible controls', () => {
  const f = fixture({ reducedMotion: false });
  f.ui.open();
  assert.equal(f.get('#lumo-ui').dataset.mode, 'conversation');
  assert.equal(f.get('.lumo-chat-form').hidden, true);
  assert.equal(f.messages.length, 0, 'greeting never contacts the conversational provider');
  const partial = f.get('.lumo-text').textContent;
  f.ui.advance();
  assert.ok(f.get('.lumo-text').textContent.length > partial.length, 'first press accelerates the text');
  f.ready();
  assert.equal(f.get('.lumo-chat-form').hidden, false);
  assert.equal(f.get('.lumo-suggestions'), null);
  assert.equal(f.document.activeElement, f.get('.lumo-input'));
  assert.equal(f.get('.lumo-history-list'), null);
  assert.equal(f.get('.lumo-header'), null);
  assert.equal(f.get('.lumo-source'), null);
  assert.equal(f.get('#lumo-ui').querySelectorAll('button').filter(node => !node.classList.contains('sr-only') && !node.closest('[hidden]')).length, 0);
  const height = parseFloat(f.get('#lumo-ui').style['--lumo-height']);
  assert.ok(height / f.stage.rect.height >= .25 && height / f.stage.rect.height <= .30);
  assert.ok(f.get('#lumo-ui').getBoundingClientRect().bottom <= f.stage.rect.bottom);
});

test('written messages continue naturally and Enter repetition cannot duplicate a request', async () => {
  const f = fixture(); f.ui.open(); f.ready();
  await f.ui.sendMessage('¿Cómo estás?');
  f.ready();
  assert.equal(f.ui.isOpen, true);
  f.get('.lumo-input').value = 'Quiero dibujar';
  assert.equal(f.key('Enter', f.get('.lumo-input')).stopped, true);
  f.key('Enter', f.get('.lumo-input'), { repeat: true });
  await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(f.messages, ['¿Cómo estás?', 'Quiero dibujar']);
  assert.equal(f.ui.aiConnected, false);
  assert.equal(f.button('DAR OBJETO'), undefined, 'empty gifts never appear');
});

test('externally opened activities retain pending conversation and draft; Escape cancels late responses', async () => {
  const f = fixture({ deferred: true }); f.ui.open(); f.ready();
  const sent = f.ui.sendMessage('Hola');
  f.get('.lumo-input').value = 'Borrador siguiente';
  assert.equal(f.get('.lumo-input').disabled, false);
  f.ui.openActions();
  assert.equal(f.ui.isPending, true);
  f.resolve({ text: 'Aquí sigo, Mira.', emotion: 'NORMAL', source: 'local' }); await sent;
  assert.equal(f.get('#lumo-ui').dataset.mode, 'menu');
  await f.button('VOLVER AL DIÁLOGO').click();
  assert.equal(f.get('.lumo-input').value, 'Borrador siguiente');
  assert.equal(f.get('.lumo-text').textContent, 'Aquí sigo, Mira.');
  const cancelled = f.ui.sendMessage('Segunda');
  f.key('Escape', f.get('.lumo-input'));
  assert.equal(f.signal.aborted, true);
  f.resolve({ text: 'Respuesta tardía.', source: 'local' }); await cancelled;
  assert.equal(f.ui.isOpen, false);
  assert.deepEqual(f.pauses, [true, false]);
});

test('chat stays local without consent and privacy controls are only reached through the external API', async () => {
  const f = fixture({ allowAI: true }); f.ui.open(); f.ready();
  await f.ui.sendMessage('Hola');
  assert.deepEqual(f.messages, ['Hola']);
  assert.equal(f.chatOptions[0].allowAI, false);
  assert.equal(f.modelState.settings.allowAI, true, 'local presentation never switches off the configured AI preference');
  assert.equal(f.get('#lumo-ui').dataset.mode, 'conversation');
  assert.equal(f.get('.lumo-settings').hidden, true);
  assert.equal(f.ui.aiConnected, false);
  f.ui.openSettings();
  assert.match(f.get('.lumo-settings').textContent, /Gemini, un proveedor externo/);
  await f.button('BORRAR MENSAJES RECIENTES').click();
  await f.button('BORRAR RECUERDOS PERSONALES').click();
  assert.deepEqual(f.clearCounts, { personalClears: 1, historyClears: 1, consentRevocations: 0 });
  const g = fixture({ allowAI: true, consent: true }); g.ui.openSettings();
  assert.doesNotMatch(g.get('.lumo-settings').textContent, /AUTORIZAR CONVERSACIONES EXTERNAS|REVOCAR PERMISO|Conversaciones externas|desactivar/i);
  assert.equal(g.modelState.settings.aiConsent, true);
  g.ui.close(); g.ui.open(); g.ready(); await g.ui.sendMessage('Probando');
  assert.deepEqual(g.messages, ['Probando']);
  assert.equal(g.get('.lumo-source'), null, 'provider status is absent from the conversation DOM');
  assert.equal(g.ui.aiConnected, true);
});

test('phone keyboard keeps the composer within its visual viewport and restores stage anchoring', () => {
  const f = fixture(); f.window.innerWidth = 390; f.window.innerHeight = 844;
  f.stage.rect = { left: 0, top: 275, right: 390, bottom: 567.5, width: 390, height: 292.5 };
  Object.assign(f.viewport, { width: 390, height: 844 });
  f.ui.open(); f.ready();
  const original = f.get('#lumo-ui').style['--lumo-top'];
  f.viewport.height = 430;
  for (const handler of f.events['viewport:resize']) handler();
  const rect = f.get('#lumo-ui').getBoundingClientRect();
  assert.ok(rect.bottom <= 430);
  assert.ok(rect.right <= 390);
  assert.equal(f.get('.lumo-chat-form').hidden, false);
  assert.equal(f.get('.lumo-input').disabled, false);
  f.viewport.height = 844;
  for (const handler of f.events['viewport:resize']) handler();
  assert.equal(f.get('#lumo-ui').style['--lumo-top'], original);
  assert.equal(f.stage.rect.top, 275, 'keyboard handling does not move the world');
});

test('clearing a pending private chat aborts it and prevents its late response restoring deleted messages', async () => {
  const f = fixture({ deferred: true }); f.ui.open(); f.ready();
  const sent = f.ui.sendMessage('Mensaje privado');
  f.ui.openSettings();
  await f.button('BORRAR MENSAJES RECIENTES').click();
  assert.equal(f.signal.aborted, true);
  f.resolve({ text: 'Respuesta privada tardía.', source: 'local' }); await sent;
  await f.button('VOLVER AL DIÁLOGO').click();
  assert.equal(f.get('.lumo-text').textContent, 'Aquí estoy, Mira.');
  assert.equal(f.get('.lumo-history-list'), null);
});

test('natural typewriter completion opens input only after the final page; scene dialogue awaits a text advance', async () => {
  const f = fixture({ reducedMotion: false }); f.ui.open();
  f.finishTyping();
  assert.equal(f.get('.lumo-chat-form').hidden, false, 'no continue click is needed after the greeting finishes');
  f.ui.speak({ boxes: ['Primera caja completa.', 'Segunda caja completa.'] }, { awaitClose: false });
  assert.equal(f.get('.lumo-chat-form').hidden, true);
  f.finishTyping();
  assert.equal(f.get('.lumo-chat-form').hidden, true, 'the composer waits while another page remains');
  assert.equal(f.get('.lumo-next').tagName, 'SPAN');
  assert.equal(f.get('.lumo-next').hidden, false);
  f.key('KeyE', f.get('.lumo-panel')); f.finishTyping();
  assert.equal(f.get('.lumo-chat-form').hidden, false);
  let complete = false;
  const scene = f.ui.speak('Una escena tranquila.', { after: 'scene' }).then(() => { complete = true; });
  f.finishTyping(); await Promise.resolve();
  assert.equal(f.get('.lumo-chat-form').hidden, true);
  assert.equal(complete, false);
  f.key('Enter', f.get('.lumo-panel')); await scene;
  assert.equal(complete, true);
});
