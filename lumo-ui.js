'use strict';

// Lumo's dialogue stays separate from the house and PC dialogue controllers.
(function createLumoUI(global) {
  const MAX_HISTORY = 10;
  const EXPRESSIONS = {
    NORMAL: 'normal', HAPPY: 'happy', PLAYFUL: 'mocking', ANNOYED: 'angry',
    SLEEPY: 'sleepy', CURIOUS: 'curious', SCARED: 'scared', CONFUSED: 'confused',
    SAD: 'sad', SUPPORTIVE: 'supportive'
  };
  let adapter = {};
  let root, panel, line, text, portrait, next, actions, form, input, tools;
  let opened = false;
  let mode = 'conversation';
  let phase = 'speaking';
  let afterSpeech = 'reply';
  let composerStarted = false;
  let externalPanel = false;
  let layout = { height: 180, width: 800, textLines: 3 };
  let mounted = false;
  let request = null;
  let epoch = 0;
  let typingTimer = null;
  let toastTimer = null;
  let toastNode = null;
  let response = null;
  let pages = [];
  let pageIndex = 0;
  let characterIndex = 0;
  let characters = [];
  let typing = false;
  let pending = false;
  let finishSpeech = null;
  let recent = [];
  let previousFocus = null;
  let portraitManifest = null;
  let portraitTicket = 0;
  let source = 'local';
  let frequency = 'normal';
  const reduceMotion = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function button(label, action, className = '') {
    const node = element('button', `lumo-button ${className}`, label);
    node.type = 'button';
    node.addEventListener('click', action);
    node.addEventListener('pointerenter', () => play('move'));
    return node;
  }

  function mind() { return adapter.mind || global.LumoMind; }

  function state() {
    try { return mind()?.getState?.() || {}; } catch { return {}; }
  }

  function context() {
    let current = {};
    try { current = adapter.getContext?.() || {}; } catch { /* A missing context keeps local dialogue usable. */ }
    return { ...current, playerName: 'Mira' };
  }

  function play(kind) {
    if (kind === 'text' && adapter.playText) adapter.playText();
    else if (adapter.play) adapter.play(kind);
    else global.UndertaleAudio?.play(kind, { ui: true });
  }

  function stopTyping() {
    clearTimeout(typingTimer);
    typingTimer = null;
    typing = false;
    global.UndertaleAudio?.stop('text');
  }

  function normalize(value) {
    if (typeof value === 'string') return { text: value, emotion: 'NORMAL', source: 'local' };
    return { text: 'Aquí estoy, Mira.', emotion: 'NORMAL', source: 'local', ...(value || {}) };
  }

  function announce(message) {
    root.querySelector('.lumo-announcer').textContent = message;
  }

  function setSource(value, error = false) {
    source = value === 'ai' && !error ? 'ai' : 'local';
    root.dataset.aiConnected = String(source === 'ai');
  }

  function syncViewport() {
    if (!root) return;
    const viewport = global.visualViewport;
    const vh = viewport?.height || global.innerHeight;
    const vw = viewport?.width || global.innerWidth;
    const vt = viewport?.offsetTop || 0;
    const vl = viewport?.offsetLeft || 0;
    let stage = typeof adapter.stage === 'function' ? adapter.stage() : adapter.stage;
    if (typeof stage === 'string') stage = document.querySelector(stage);
    stage ||= document.getElementById('game-stage');
    const rect = stage?.getBoundingClientRect?.();
    const valid = rect && rect.width > 0 && rect.height > 0;
    const left = Math.max(vl + 6, valid ? rect.left + 6 : vl + 6);
    const right = Math.min(vl + vw - 6, valid ? rect.right - 6 : vl + vw - 6);
    const width = Math.max(180, right - left);
    const keyboardOpen = Boolean(viewport && global.innerHeight - viewport.height > 150);
    const secondary = mode !== 'conversation';
    const withComposer = composerStarted && mode === 'conversation';
    const small = width < 600;
    const minimum = secondary ? 210 : withComposer ? (small ? 144 : 134) : (small ? 100 : 106);
    const desired = secondary ? Math.min(390, vh * .65) : Math.max(minimum, (valid ? rect.height : vh) * .28);
    const height = Math.max(100, Math.min(desired, vh - 12));
    const bottom = Math.min(vt + vh - 6, valid ? rect.bottom - 6 : vt + vh - 6);
    const top = Math.max(vt + 6, bottom - height);
    layout = { width, height, textLines: Math.max(1, Math.min(4, Math.floor((height - (withComposer ? 64 : 25)) / (small ? 22 : 26)))) };
    root.style.setProperty('--lumo-left', `${Math.round(left)}px`);
    root.style.setProperty('--lumo-top', `${Math.round(top)}px`);
    root.style.setProperty('--lumo-width', `${Math.round(width)}px`);
    root.style.setProperty('--lumo-height', `${Math.round(Math.min(height, vt + vh - 6 - top))}px`);
    root.style.setProperty('--lumo-text-lines', layout.textLines);
    root.classList.toggle('lumo-keyboard-open', keyboardOpen);
    root.classList.toggle('lumo-small', small);
  }

  function adoptHistory() {
    recent = (state().history || []).filter(entry => entry && typeof entry.content === 'string')
      .slice(-MAX_HISTORY).map(entry => ({ role: entry.role === 'user' ? 'user' : 'assistant', content: entry.content }));
  }

  function addHistory(role, content) {
    recent.push({ role, content });
    recent = recent.slice(-MAX_HISTORY);
  }

  function giftList() {
    try { return (adapter.listGifts?.() || []).filter(item => item?.id && item.count > 0); } catch { return []; }
  }

  function gameList() {
    try { return (adapter.listGames?.() || []).filter(item => item?.id && item.available !== false); } catch { return []; }
  }

  function setMode(nextMode) {
    mode = ['menu', 'gifts', 'games', 'settings'].includes(nextMode) ? nextMode : 'conversation';
    root.dataset.mode = mode;
    root.dataset.phase = phase;
    line.hidden = mode !== 'conversation';
    form.hidden = mode !== 'conversation' || !composerStarted;
    tools.hidden = mode !== 'settings';
    actions.replaceChildren();
    if (mode === 'menu') {
      if (!externalPanel) actions.append(button('VOLVER AL DIÁLOGO', returnConversation));
      const petButton = button('ACARICIAR', pet); petButton.disabled = pending; actions.append(petButton);
      if (adapter.giveGift && giftList().length) { const giftButton = button('DAR OBJETO', () => setMode('gifts')); giftButton.disabled = pending; actions.append(giftButton); }
      if (adapter.startGame && gameList().length) { const gameButton = button('JUGAR', () => setMode('games')); gameButton.disabled = pending; actions.append(gameButton); }
      actions.append(button('CERRAR', close));
    } else if (mode === 'gifts') {
      const gifts = giftList();
      for (const item of gifts) { const giftButton = button(`${item.label || item.id} ×${item.count}`, () => give(item.id)); giftButton.disabled = pending; actions.append(giftButton); }
      if (!gifts.length) actions.append(element('p', 'lumo-note', 'No llevas objetos para darle.'));
      actions.append(button('VOLVER', () => setMode('menu')));
    } else if (mode === 'games') {
      for (const item of gameList()) { const gameButton = button(item.label || item.id, () => startGame(item.id)); gameButton.disabled = pending; actions.append(gameButton); }
      actions.append(button('VOLVER', () => setMode('menu')));
    } else if (mode !== 'conversation') {
      actions.append(button(externalPanel ? 'CERRAR' : 'VOLVER AL DIÁLOGO', externalPanel ? close : returnConversation));
    }
    if (mode === 'settings') renderSettings();
    syncViewport();
  }

  function returnConversation() {
    setMode('conversation');
    if (composerStarted) input.focus({ preventScroll: true });
    else panel.focus({ preventScroll: true });
  }

  function paginate(message) {
    const probe = document.createElement('canvas').getContext('2d');
    const computed = global.getComputedStyle(text);
    if (probe) probe.font = `${computed.fontSize} ${computed.fontFamily}`;
    const width = Math.max(100, text.clientWidth - 10);
    const maxLines = layout.textLines;
    const words = String(message || '').match(/\S+\s*|\n/g) || ['...'];
    const result = [];
    let page = '', line = '', lines = 1;
    for (const word of words) {
      const normalized = word.replace(/\s+/g, ' ');
      const measured = probe ? probe.measureText(line + normalized.trimEnd()).width : (line.length + normalized.length) * 14;
      const explicitBreak = word.includes('\n');
      if (line && measured > width) {
        if (lines >= maxLines) { result.push(page.trim()); page = ''; lines = 1; }
        else lines += 1;
        line = '';
      }
      page += normalized;
      line += normalized;
      if (explicitBreak && line) {
        if (lines >= maxLines) { result.push(page.trim()); page = ''; lines = 1; }
        else lines += 1;
        line = '';
      }
    }
    if (page.trim()) result.push(page.trim());
    return result.length ? result : ['...'];
  }

  function updateNext() {
    next.hidden = typing || pending || pageIndex + 1 >= pages.length;
    next.textContent = '▾';
    next.parentNode.hidden = next.hidden;
  }

  function completePage() {
    updateNext();
    announce(`Lumo: ${pages[pageIndex]}`);
    if (pageIndex + 1 < pages.length) return;
    if (afterSpeech === 'scene') {
      phase = 'scene'; composerStarted = false;
      setMode(mode);
      return;
    }
    phase = 'reply'; composerStarted = true;
    setMode(mode);
    if (mode === 'conversation') input.focus({ preventScroll: true });
    if (finishSpeech) { const done = finishSpeech; finishSpeech = null; done(true); }
  }

  function startPage() {
    stopTyping();
    characters = Array.from(pages[pageIndex] || '');
    characterIndex = 0;
    text.textContent = '';
    const quietEffects = reduceMotion.matches || adapter.reducedMotion?.() || global.HouseExperience?.reducedMotion === true;
    root.classList.toggle('lumo-reduced-motion', quietEffects);
    typing = !quietEffects;
    updateNext();
    if (!typing) { text.textContent = characters.join(''); completePage(); return; }
    function tick() {
      if (!opened || !typing) return;
      const character = characters[characterIndex++];
      text.textContent += character || '';
      if (character && /\S/.test(character) && characterIndex % 2 === 1) play('text');
      if (characterIndex >= characters.length) {
        stopTyping();
        completePage();
        return;
      }
      typingTimer = setTimeout(tick, /[.!?]/.test(character) ? 115 : /[,;:]/.test(character) ? 70 : 25);
    }
    tick();
  }

  function advance() {
    if (pending || mode !== 'conversation' || phase === 'reply') return;
    play('confirm');
    if (typing) {
      stopTyping();
      text.textContent = characters.join('');
      completePage();
    } else if (pageIndex + 1 < pages.length) {
      pageIndex += 1;
      startPage();
    } else {
      next.hidden = true;
      if (finishSpeech) { const done = finishSpeech; finishSpeech = null; done(true); }
      if (afterSpeech !== 'scene') completePage();
    }
  }

  async function loadPortraitManifest() {
    if (adapter.manifest) { portraitManifest = adapter.manifest; return; }
    try {
      const result = await fetch('assets/lumo/manifest.json', { cache: 'no-cache' });
      if (result.ok) portraitManifest = await result.json();
    } catch { /* Actor may provide an embedded manifest for file:// play. */ }
    portraitManifest ||= global.LUMO_ASSETS || global.LumoAssets || global.LumoActor?.manifest || null;
    if (response) drawPortrait(response.emotion);
  }

  function drawPortrait(emotion = 'NORMAL') {
    const ticket = ++portraitTicket;
    const ctx = portrait.getContext('2d');
    ctx.clearRect(0, 0, portrait.width, portrait.height);
    ctx.imageSmoothingEnabled = false;
    const manifest = adapter.manifest || portraitManifest || adapter.actor?.manifest || global.LUMO_ASSETS || global.LumoAssets;
    const name = EXPRESSIONS[String(emotion).toUpperCase()] || 'normal';
    const entry = manifest?.portraits?.animations?.[response?.animation] || manifest?.portraits?.emotions?.[String(emotion).toUpperCase()] || manifest?.portraits?.[name] || manifest?.portraits?.[String(emotion).toLowerCase()] || manifest?.portraits?.normal;
    if (!entry) return;
    const src = typeof entry === 'string' ? entry : entry.sheet || entry.src || entry.path || entry.image || manifest?.portraitSheet;
    if (!src) return;
    const image = new Image();
    image.onload = () => {
      if (ticket !== portraitTicket) return;
      const frame = typeof entry === 'object' ? (entry.rect || entry) : {};
      const sx = frame.x || 0, sy = frame.y || 0;
      const sw = frame.width || frame.w || image.naturalWidth, sh = frame.height || frame.h || image.naturalHeight;
      const fit = Math.min(portrait.width / sw, portrait.height / sh);
      const scale = fit >= 1 ? Math.floor(fit) : fit;
      const dw = Math.round(sw * scale), dh = Math.round(sh * scale);
      ctx.drawImage(image, sx, sy, sw, sh, Math.floor((portrait.width - dw) / 2), Math.floor((portrait.height - dh) / 2), dw, dh);
    };
    image.src = src;
  }

  function react(value) {
    try {
      if (adapter.actor?.react) adapter.actor.react(value);
      else if (adapter.actor?.perform) adapter.actor.perform(value.animation || 'idle');
      else adapter.actor?.setEmotion?.(value.emotion || 'NORMAL');
    } catch { /* Dialogue must remain available if a world animation is missing. */ }
  }

  function showResponse(value, options = {}) {
    stopTyping();
    if (finishSpeech) { const done = finishSpeech; finishSpeech = null; done(false); }
    response = normalize(value);
    response.text = String(response.text || '...');
    phase = 'speaking';
    composerStarted = false;
    afterSpeech = options.after === 'scene' ? 'scene' : 'reply';
    setSource(response.source, Boolean(response.error || response.fallback || options.error));
    drawPortrait(response.emotion);
    react(response);
    setMode(mode);
    pages = Array.isArray(response.boxes) && response.boxes.length ? response.boxes.flatMap(paginate) : paginate(response.text);
    pageIndex = 0;
    startPage();
  }

  function setPending(value) {
    pending = value;
    root.classList.toggle('lumo-thinking', value);
    root.setAttribute('aria-busy', String(value));
    form.querySelector('button').disabled = value;
    // The draft remains editable while thinking; Android's keyboard stays open.
    phase = value ? 'pending' : phase;
    root.dataset.phase = phase;
    if (value) {
      stopTyping();
      text.textContent = '...';
      next.hidden = true;
      next.parentNode.hidden = true;
      announce('Lumo está pensando.');
      react({ emotion: 'CURIOUS', animation: 'think' });
      drawPortrait('CURIOUS');
    }
  }

  async function runAction(task, options = {}) {
    if (pending || !opened) return null;
    const activeEpoch = epoch;
    request = new AbortController();
    const signal = request.signal;
    setPending(true);
    let result;
    try { result = await task(signal); }
    catch (error) {
      if (signal.aborted || error?.name === 'AbortError') return null;
      result = { text: 'Eh... se me cruzaron los cables. ¿Me repites eso? xd', emotion: 'CONFUSED', animation: 'confused', source: 'local', error: true };
    } finally {
      if (epoch === activeEpoch) { request = null; setPending(false); }
    }
    if (!opened || epoch !== activeEpoch || signal.aborted || result == null) return null;
    showResponse(result, options);
    return normalize(result);
  }

  async function submit(event) {
    event?.preventDefault();
    return sendMessage(input.value);
  }

  async function sendMessage(value) {
    if (!opened || pending) return null;
    const message = String(value || '').trim().slice(0, 600);
    if (!message) { input.focus({ preventScroll: true }); return null; }
    const settings = state().settings || {};
    const allowAI = settings.allowAI === true && settings.aiConsent === true;
    stopTyping();
    input.value = '';
    composerStarted = true;
    setMode('conversation');
    addHistory('user', message);
    play('confirm');
    const result = await runAction(signal => mind()?.chat ? mind().chat(message, context(), { signal, allowAI }) : { text: 'Mi conexión anda haciendo parkour. Igual puedo acompañarte por la casa, Mira.', emotion: 'CONFUSED', animation: 'confused', source: 'local' });
    if (result) addHistory('assistant', result.text);
    // Focus belongs to the text field after a reply, without opening a keyboard
    // unexpectedly after a player has switched to another menu.
    return result;
  }

  async function pet() {
    if (pending) return;
    play('confirm');
    setMode('conversation');
    await runAction(() => mind()?.act ? mind().act('pet', {}, context()) : { text: 'Bueno. Una caricia más. Por motivos científicos.', emotion: 'HAPPY', animation: 'pet', source: 'local' });
  }

  async function give(id) {
    if (pending || !giftList().some(item => item.id === id)) return;
    setMode('conversation');
    await runAction(async () => {
      const accepted = await adapter.giveGift(id);
      if (!accepted) return { text: 'Ese objeto se nos escapó. Tremendo inventario ninja.', emotion: 'CONFUSED', animation: 'confused', source: 'local' };
      const kind = id === 'cookie' ? 'feed' : 'gift';
      return mind()?.act ? mind().act(kind, { item: id, id }, context()) : { text: '¿Para mí? Bueno, ya perdiste el derecho a decir que no eres amable.', emotion: 'HAPPY', animation: kind === 'feed' ? 'eat' : 'celebrate', source: 'local' };
    });
  }

  function startGame(id) {
    if (pending || !gameList().some(item => item.id === id)) return;
    play('confirm');
    close({ sound: false });
    try { adapter.startGame(id); } catch { toast({ text: 'Se tropezó el juego. Yo no fui. Probablemente.', source: 'local', emotion: 'CONFUSED' }); }
  }

  function configure(settings) {
    try { return mind()?.configure?.(settings) ?? mind()?.config?.(settings); } catch { return false; }
  }

  function cancelPending() {
    if (!pending) return;
    epoch += 1;
    request?.abort(); request = null;
    setPending(false);
    phase = 'reply'; composerStarted = true;
    root.dataset.phase = phase;
  }

  function clearVisibleConversation() {
    cancelPending(); stopTyping();
    if (finishSpeech) { const done = finishSpeech; finishSpeech = null; done(false); }
    response = normalize('Aquí estoy, Mira.');
    text.textContent = response.text;
    pages = []; next.hidden = true;
    phase = 'reply'; composerStarted = true;
    root.dataset.phase = phase;
    input.value = '';
    setSource('local');
  }

  function renderSettings() {
    tools.replaceChildren();
    const settings = state().settings || {};
    const note = element('p', 'lumo-note', 'La amistad sigue a su ritmo. Puedes volver a la casa cuando quieras.');
    tools.append(note);
    const frequencyLabel = element('label', 'lumo-setting', 'Comentarios al explorar');
    const frequencySelect = element('select');
    frequencySelect.setAttribute('aria-label', 'Frecuencia de comentarios de Lumo');
    for (const [value, label] of [['off', 'Apagados'], ['low', 'Pocos'], ['normal', 'Normal']]) {
      const option = element('option', '', label); option.value = value; frequencySelect.append(option);
    }
    frequencySelect.value = adapter.getCommentFrequency?.() || settings.commentFrequency || frequency;
    frequencySelect.addEventListener('change', () => {
      frequency = frequencySelect.value;
      configure({ commentFrequency: frequency });
      adapter.setCommentFrequency?.(frequency);
      root.dispatchEvent(new CustomEvent('lumo:frequency', { detail: frequency, bubbles: true }));
      play('toggle');
    });
    frequencyLabel.append(frequencySelect); tools.append(frequencyLabel);

    const aiLabel = element('label', 'lumo-setting', 'Conversaciones externas');
    const aiToggle = element('input'); aiToggle.type = 'checkbox'; aiToggle.checked = Boolean(settings.allowAI);
    aiToggle.addEventListener('change', () => { configure({ allowAI: aiToggle.checked }); renderSettings(); });
    aiLabel.append(aiToggle); tools.append(aiLabel);
    tools.append(element('p', 'lumo-note', settings.aiConsent === true ? 'Permiso para el proveedor externo concedido. La conexión se configura fuera del juego; aquí no se piden claves.' : 'Sin permiso se usan diálogos locales. Si autorizas la IA, tus mensajes, contexto de HOME y recuerdos pertinentes se procesan mediante Gemini, un proveedor externo con sus propias condiciones de datos. Aquí no se piden claves.'));
    if (settings.aiConsent !== true) tools.append(button('AUTORIZAR CONVERSACIONES EXTERNAS', () => {
      configure({ allowAI: true, aiConsent: true });
      renderSettings();
      announce('Preferencia de conversación actualizada.');
    }));
    if (settings.aiConsent === true) tools.append(button('REVOCAR PERMISO', async () => {
      cancelPending();
      configure({ allowAI: false, aiConsent: false });
      try { await mind()?.revokeAIConsent?.(); } catch { /* Local revocation already prevents sending. */ }
      if (opened && mode === 'settings') renderSettings();
      announce('Permiso de IA revocado. Puedes seguir con diálogos locales.');
    }));
    const privacy = element('label', 'lumo-setting', 'Guardar recuerdos entre sesiones');
    const memoryToggle = element('input'); memoryToggle.type = 'checkbox'; memoryToggle.checked = settings.persistMemory !== false;
    memoryToggle.addEventListener('change', () => {
      configure({ persistMemory: memoryToggle.checked });
      root.dispatchEvent(new CustomEvent('lumo:privacy', { detail: { persistMemory: state().settings?.persistMemory !== false }, bubbles: true }));
      play('toggle');
    });
    privacy.append(memoryToggle); tools.append(privacy);
    tools.append(button('BORRAR MENSAJES RECIENTES', async () => {
      clearVisibleConversation();
      try { await mind()?.resetHistory?.(); } catch { /* The UI's session history is cleared below. */ }
      recent = [];
      root.dispatchEvent(new CustomEvent('lumo:history-cleared', { bubbles: true }));
      announce('Mensajes recientes borrados. Los regalos y la partida se conservan.');
      const notice = root.querySelector('.lumo-settings-notice');
      if (notice) notice.textContent = 'Mensajes recientes borrados. Los regalos y la partida se conservan.';
      play('confirm');
    }));
    const clearPersonal = button('BORRAR RECUERDOS PERSONALES', async () => {
      cancelPending();
      try {
        await mind().clearPersonalMemories();
        root.dispatchEvent(new CustomEvent('lumo:personal-memories-cleared', { bubbles: true }));
        const notice = root.querySelector('.lumo-settings-notice');
        if (notice) notice.textContent = 'Recuerdos personales borrados. Los regalos y las aventuras se conservan.';
        announce('Recuerdos personales borrados. Los regalos y las aventuras se conservan.');
      } catch { announce('No se pudieron borrar los recuerdos personales.'); }
    });
    clearPersonal.disabled = typeof mind()?.clearPersonalMemories !== 'function';
    tools.append(clearPersonal);
    tools.append(element('p', 'lumo-note lumo-settings-notice', 'Se conserva un historial reciente limitado. Borrar mensajes o recuerdos personales no reinicia tu partida.'));
    if (state().storageAvailable === false) tools.append(element('p', 'lumo-note', 'Este navegador no permite guardar recuerdos entre sesiones.'));
  }

  function keydown(event) {
    if (!opened) return;
    const target = event.target;
    const editing = target?.matches?.('input, textarea, select');
    if (event.code === 'Escape') {
      event.preventDefault(); close();
    } else if (event.code === 'Tab') {
      const focusable = [...panel.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), summary, textarea:not(:disabled)')]
        .filter(node => node.getClientRects().length && !node.closest('[hidden]'));
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!focusable.length) { event.preventDefault(); panel.focus({ preventScroll: true }); }
      else if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
    } else if (editing && target === input && event.code === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (!event.repeat) submit();
    } else if (target?.classList?.contains('lumo-send') && ['Enter', 'Space'].includes(event.code)) {
      event.preventDefault(); if (!event.repeat) submit();
    } else if (mode === 'conversation' && !editing && ['KeyZ', 'KeyE', 'Enter', 'Space'].includes(event.code)) {
      event.preventDefault(); if (!event.repeat) advance();
    } else if (!editing && event.code === 'KeyX') { event.preventDefault(); close(); }
    // Stop all keyboard input reaching movement and house dialogue handlers;
    // browser defaults still edit text and activate the focused controls.
    event.stopImmediatePropagation();
  }

  function mount(value = {}) {
    adapter = value;
    if (mounted) { loadPortraitManifest(); return api; }
    mounted = true;
    root = element('div', 'lumo-overlay'); root.id = 'lumo-ui'; root.hidden = true;
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Conversación con Lumo');
    panel = element('section', 'lumo-panel');
    panel.tabIndex = -1;
    line = element('div', 'lumo-line');
    portrait = element('canvas', 'lumo-portrait'); portrait.width = 112; portrait.height = 112; portrait.setAttribute('aria-hidden', 'true');
    const speech = element('div', 'lumo-speech');
    text = element('p', 'lumo-text'); text.setAttribute('aria-hidden', 'true');
    const footer = element('div', 'lumo-speech-footer');
    next = element('span', 'lumo-next', '▾'); next.setAttribute('aria-hidden', 'true'); footer.append(next); speech.append(text, footer);
    line.append(portrait, speech);
    line.addEventListener('click', advance);
    form = element('form', 'lumo-chat-form'); form.hidden = true;
    const label = element('label', 'sr-only', 'Mensaje de Mira para Lumo'); label.htmlFor = 'lumo-message';
    input = element('textarea', 'lumo-input'); input.id = 'lumo-message'; input.rows = 1; input.maxLength = 600; input.placeholder = 'Habla con Lumo...'; input.autocomplete = 'off'; input.spellcheck = true;
    input.setAttribute('enterkeyhint', 'send'); input.setAttribute('aria-describedby', 'lumo-chat-help');
    const send = element('button', 'sr-only lumo-send', 'Enviar mensaje'); send.type = 'submit';
    form.append(label, input, send); form.addEventListener('submit', event => { event.preventDefault(); submit(); });
    const help = element('p', 'sr-only lumo-chat-help', 'Enter envía. Shift más Enter crea una línea. Escape cierra. Toca el texto para avanzar.'); help.id = 'lumo-chat-help';
    actions = element('nav', 'lumo-actions'); actions.setAttribute('aria-label', 'Interacciones con Lumo');
    tools = element('div', 'lumo-settings'); tools.hidden = true;
    const announcer = element('span', 'sr-only lumo-announcer'); announcer.setAttribute('role', 'status'); announcer.setAttribute('aria-live', 'polite');
    panel.append(line, form, help, tools, actions, announcer); root.append(panel); document.body.append(root);
    global.addEventListener('keydown', keydown, true);
    global.addEventListener('keyup', event => { if (opened) event.stopImmediatePropagation(); }, true);
    global.addEventListener('pointerdown', event => {
      if (opened && mode === 'conversation' && !panel.contains(event.target)) {
        event.preventDefault(); event.stopImmediatePropagation(); close();
      }
    }, true);
    global.addEventListener('resize', syncViewport);
    global.visualViewport?.addEventListener('resize', syncViewport);
    global.visualViewport?.addEventListener('scroll', syncViewport);
    input.addEventListener('focus', syncViewport);
    if (global.ResizeObserver) new global.ResizeObserver(syncViewport).observe(typeof adapter.stage === 'object' ? adapter.stage : document.getElementById('game-stage') || document.body);
    root.addEventListener('pointerdown', event => { if (event.target === root) event.preventDefault(); });
    loadPortraitManifest(); syncViewport();
    return api;
  }

  function greeting() {
    const current = context();
    try {
      const supplied = adapter.greet?.(current) || adapter.getGreeting?.(current) || mind()?.greet?.(current);
      if (supplied && typeof supplied.then !== 'function') return supplied;
    } catch { /* Greeting always works locally, without sending a message. */ }
    const room = String(current.roomId || current.room || '');
    const message = /kitchen|cocina/i.test(room) ? 'Mira, si algo huele rico, estoy investigando. Con muchísimo rigor.'
      : /bedroom|dormitorio/i.test(room) ? 'Hola, Mira. Aquí hasta el silencio tiene cara de sueño.'
      : /lumo|hideout/i.test(room) ? 'Mira, bienvenida. Puedes quedarte un ratito conmigo.'
      : 'Hola, Mira. ¿Qué te gustaría hacer por aquí?';
    return { text: message, emotion: state().emotion || 'NORMAL', source: 'local' };
  }

  function open(options = {}) {
    if (!mounted) mount();
    if (opened) return api;
    epoch += 1;
    opened = true;
    previousFocus = document.activeElement;
    root.hidden = false;
    mode = 'conversation'; phase = 'speaking'; composerStarted = false; externalPanel = false;
    pages = []; text.textContent = ''; next.hidden = true; next.parentNode.hidden = true;
    input.value = '';
    toastNode && (toastNode.hidden = true);
    adapter.pause?.(true);
    adoptHistory();
    setMode('conversation');
    syncViewport();
    if (options.greeting !== false) showResponse(options.greeting || greeting(), options);
    if (phase === 'reply') input.focus({ preventScroll: true });
    else panel.focus({ preventScroll: true });
    play('confirm');
    return api;
  }

  function close(options = {}) {
    if (!opened) return;
    epoch += 1;
    opened = false;
    request?.abort(); request = null;
    stopTyping();
    pending = false;
    root.classList.remove('lumo-thinking');
    root.hidden = true;
    root.setAttribute('aria-busy', 'false');
    input.disabled = false;
    form.querySelector('button').disabled = false;
    input.blur();
    if (finishSpeech) { const done = finishSpeech; finishSpeech = null; done(false); }
    if (options.sound !== false) play('cancel');
    adapter.pause?.(false);
    if (adapter.resumeFocus) adapter.resumeFocus();
    else if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }

  function speak(value, options = {}) {
    if (options.bubble || options.modal === false) { toast(value, options); return Promise.resolve(true); }
    if (!opened) open({ greeting: false });
    if (pending) { epoch += 1; request?.abort(); request = null; setPending(false); }
    setMode('conversation');
    showResponse(value, options);
    if (options.awaitClose === false || phase === 'reply') return Promise.resolve(true);
    panel.focus({ preventScroll: true });
    return new Promise(resolve => { finishSpeech = resolve; });
  }

  function openSettings() {
    const wasOpen = opened;
    if (!wasOpen) open({ greeting: false });
    externalPanel = !wasOpen || externalPanel;
    setMode('settings');
    tools.querySelector('select')?.focus({ preventScroll: true });
    return api;
  }

  function openActions() {
    const wasOpen = opened;
    if (!wasOpen) open({ greeting: false });
    externalPanel = !wasOpen || externalPanel;
    setMode('menu');
    actions.querySelector('button')?.focus({ preventScroll: true });
    return api;
  }

  function toast(value, options = {}) {
    if (!mounted) mount();
    if (opened || !options.force && (adapter.getCommentFrequency?.() || state().settings?.commentFrequency || frequency) === 'off') return false;
    clearTimeout(toastTimer);
    if (!toastNode) { toastNode = element('div', 'lumo-toast'); toastNode.setAttribute('role', 'status'); toastNode.setAttribute('aria-live', 'polite'); document.body.append(toastNode); }
    const item = normalize(value);
    toastNode.replaceChildren(element('span', 'lumo-toast-name', 'LUMO'), element('span', '', item.text));
    toastNode.hidden = false;
    const anchor = options.anchor || adapter.getBubbleAnchor?.();
    toastNode.classList.toggle('lumo-bubble', Boolean(anchor));
    if (anchor) {
      const viewport = global.visualViewport;
      const width = Math.min(300, (viewport?.width || global.innerWidth) - 24);
      const x = Math.max((viewport?.offsetLeft || 0) + 12, Math.min(anchor.x - width / 2, (viewport?.offsetLeft || 0) + (viewport?.width || global.innerWidth) - width - 12));
      toastNode.style.left = `${Math.round(x)}px`;
      toastNode.style.top = `${Math.round(Math.max((viewport?.offsetTop || 0) + 12, anchor.y - 90))}px`;
      toastNode.style.width = `${width}px`;
    } else { toastNode.style.left = ''; toastNode.style.top = ''; toastNode.style.width = ''; }
    react(item);
    toastTimer = setTimeout(() => { toastNode.hidden = true; }, options.duration || Math.min(8500, Math.max(3800, item.text.length * 55)));
    return true;
  }

  function bubble(value, options = {}) {
    // Explicit world reactions remain visible when ambient comments are off.
    const duration = options.duration && options.duration <= 30 ? options.duration * 1000 : options.duration;
    return toast(value, { ...options, duration, force: true });
  }

  const api = Object.freeze({ mount, open, close, speak, toast, bubble, advance, sendMessage, openSettings, openActions, refresh: () => { if (opened) setMode(mode); }, get isOpen() { return opened; }, get isPending() { return pending; }, get aiConnected() { return source === 'ai'; } });
  global.LumoUI = api;
})(window);
