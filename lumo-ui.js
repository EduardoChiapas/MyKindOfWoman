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
  let root, panel, text, portrait, next, status, actions, form, input, history, tools;
  let opened = false;
  let mode = 'menu';
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
    source = value === 'ai' || value === 'remote' ? 'ai' : 'local';
    status.textContent = source === 'ai' ? 'IA conectada' : error ? 'Diálogo local · conexión no disponible' : 'Diálogo local';
    status.dataset.source = source;
  }

  function syncViewport() {
    if (!root) return;
    const viewport = global.visualViewport;
    root.style.setProperty('--lumo-vh', `${Math.round(viewport?.height || global.innerHeight)}px`);
    root.style.setProperty('--lumo-vw', `${Math.round(viewport?.width || global.innerWidth)}px`);
    root.style.setProperty('--lumo-top', `${Math.round(viewport?.offsetTop || 0)}px`);
    root.style.setProperty('--lumo-left', `${Math.round(viewport?.offsetLeft || 0)}px`);
    const keyboardOpen = Boolean(viewport && global.innerHeight - viewport.height > 150);
    root.classList.toggle('lumo-keyboard-open', keyboardOpen);
    if (keyboardOpen && document.activeElement === input) {
      // Keep the composer visible as Android changes the visual viewport.
      // Only the panel scrolls; the world camera does not move.
      requestAnimationFrame(() => {
        if (!opened || document.activeElement !== input) return;
        const fieldRect = input.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        if (fieldRect.bottom > panelRect.bottom - 12) panel.scrollTop += fieldRect.bottom - panelRect.bottom + 12;
      });
    }
  }

  function adoptHistory() {
    recent = (state().history || []).filter(entry => entry && typeof entry.content === 'string')
      .slice(-MAX_HISTORY).map(entry => ({ role: entry.role === 'user' ? 'user' : 'assistant', content: entry.content }));
    renderHistory();
  }

  function renderHistory() {
    history.replaceChildren();
    for (const entry of recent) {
      const row = element('p', 'lumo-history-entry');
      row.append(element('span', 'lumo-history-name', entry.role === 'user' ? 'MIRA' : 'LUMO'), document.createTextNode(entry.content));
      history.append(row);
    }
    if (!recent.length) history.append(element('p', 'lumo-note', 'Todavía no hay mensajes recientes.'));
    history.scrollTop = history.scrollHeight;
  }

  function addHistory(role, content) {
    recent.push({ role, content });
    recent = recent.slice(-MAX_HISTORY);
    renderHistory();
  }

  function giftList() {
    try { return (adapter.listGifts?.() || []).filter(item => item?.id && item.count > 0); } catch { return []; }
  }

  function gameList() {
    try { return (adapter.listGames?.() || []).filter(item => item?.id && item.available !== false); } catch { return []; }
  }

  function refreshFriendship() {
    const stage = state().friendship?.stage;
    const labels = { strangers: 'Nos estamos conociendo', desconocidos: 'Nos estamos conociendo', companions: 'Compañeros', compañeros: 'Compañeros', companeros: 'Compañeros', friends: 'Amigos', amigos: 'Amigos', best_friends: 'Mejores amigos', mejores_amigos: 'Mejores amigos', adventure_companions: 'Compañeros de aventura' };
    const named = typeof stage === 'string' ? (labels[stage.toLowerCase()] || stage.replace(/_/g, ' ')) : 'Compañeros';
    root.querySelector('.lumo-friendship').textContent = named;
  }

  function setMode(nextMode) {
    mode = nextMode;
    root.dataset.mode = mode;
    form.hidden = mode !== 'talk';
    tools.hidden = mode !== 'settings';
    root.querySelector('.lumo-history').hidden = mode !== 'talk';
    actions.replaceChildren();
    if (mode === 'menu') {
      actions.append(button('HABLAR', () => {
        setMode('talk');
        if (!typing && !pending) showResponse({ text: 'Te escucho. Pero si es un examen, voy a fingir que se cortó la luz.', source: 'local' });
        input.focus({ preventScroll: true });
      }));
      actions.append(button('ACARICIAR', pet));
      if (adapter.giveGift && giftList().length) actions.append(button('DAR OBJETO', () => setMode('gifts')));
      if (adapter.startGame && gameList().length) actions.append(button('JUGAR', () => setMode('games')));
      actions.append(button('CERRAR', close));
    } else if (mode === 'gifts') {
      const gifts = giftList();
      for (const item of gifts) actions.append(button(`${item.label || item.id} ×${item.count}`, () => give(item.id)));
      if (!gifts.length) actions.append(element('p', 'lumo-note', 'No llevas objetos para darle.'));
      actions.append(button('VOLVER', () => setMode('menu')));
    } else if (mode === 'games') {
      for (const item of gameList()) actions.append(button(item.label || item.id, () => startGame(item.id)));
      actions.append(button('VOLVER', () => setMode('menu')));
    } else {
      actions.append(button('VOLVER', () => setMode('menu')));
    }
    if (mode === 'settings') renderSettings();
    refreshFriendship();
    syncViewport();
  }

  function paginate(message) {
    const probe = document.createElement('canvas').getContext('2d');
    const computed = global.getComputedStyle(text);
    if (probe) probe.font = `${computed.fontSize} ${computed.fontFamily}`;
    const width = Math.max(100, text.clientWidth - 10);
    const maxLines = global.visualViewport?.height < 340 ? 3 : 4;
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
    next.hidden = !pages.length || pending;
    next.textContent = typing ? 'MOSTRAR TODO ▾' : pageIndex + 1 < pages.length ? 'CONTINUAR ▾' : 'LISTO ▾';
    root.querySelector('.lumo-page').textContent = pages.length > 1 ? `${pageIndex + 1} / ${pages.length}` : '';
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
    if (!typing) { text.textContent = characters.join(''); announce(`Lumo: ${pages[pageIndex]}`); return; }
    function tick() {
      if (!opened || !typing) return;
      const character = characters[characterIndex++];
      text.textContent += character || '';
      if (character && /\S/.test(character) && characterIndex % 2 === 1) play('text');
      if (characterIndex >= characters.length) {
        stopTyping();
        updateNext();
        announce(`Lumo: ${pages[pageIndex]}`);
        return;
      }
      typingTimer = setTimeout(tick, /[.!?]/.test(character) ? 115 : /[,;:]/.test(character) ? 70 : 25);
    }
    tick();
  }

  function advance() {
    if (pending) return;
    play('confirm');
    if (typing) {
      stopTyping();
      text.textContent = characters.join('');
      updateNext();
      announce(`Lumo: ${pages[pageIndex]}`);
    } else if (pageIndex + 1 < pages.length) {
      pageIndex += 1;
      startPage();
    } else {
      next.hidden = true;
      if (finishSpeech) { const done = finishSpeech; finishSpeech = null; done(true); }
      if (mode === 'talk') input.focus({ preventScroll: true });
      else actions.querySelector('button')?.focus({ preventScroll: true });
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
    setSource(response.source, Boolean(response.error || response.fallback || options.error));
    drawPortrait(response.emotion);
    react(response);
    pages = Array.isArray(response.boxes) && response.boxes.length ? response.boxes.flatMap(paginate) : paginate(response.text);
    pageIndex = 0;
    startPage();
    refreshFriendship();
  }

  function setPending(value) {
    pending = value;
    root.classList.toggle('lumo-thinking', value);
    root.setAttribute('aria-busy', String(value));
    input.disabled = value;
    form.querySelector('button').disabled = value;
    for (const node of actions.querySelectorAll('button')) node.disabled = value;
    if (value) {
      stopTyping();
      text.textContent = '...';
      next.hidden = true;
      root.querySelector('.lumo-page').textContent = '';
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
    if (!opened || pending) return;
    const message = input.value.trim();
    if (!message) { input.focus({ preventScroll: true }); return; }
    stopTyping();
    input.value = '';
    addHistory('user', message);
    play('confirm');
    const result = await runAction(signal => mind()?.chat ? mind().chat(message, context(), { signal }) : { text: 'Mi conexión anda haciendo parkour. Igual puedo acompañarte por la casa, Mira.', emotion: 'CONFUSED', animation: 'confused', source: 'local' });
    if (result) addHistory('assistant', result.text);
    // Focus belongs to the text field after a reply, without opening a keyboard
    // unexpectedly after a player has switched to another menu.
    if (opened && mode === 'talk' && !pending) input.focus({ preventScroll: true });
  }

  async function pet() {
    play('confirm');
    await runAction(() => mind()?.act ? mind().act('pet', {}, context()) : { text: 'Bueno. Una caricia más. Por motivos científicos.', emotion: 'HAPPY', animation: 'pet', source: 'local' });
  }

  async function give(id) {
    if (pending || !giftList().some(item => item.id === id)) return;
    await runAction(async () => {
      const accepted = await adapter.giveGift(id);
      if (!accepted) return { text: 'Ese objeto se nos escapó. Tremendo inventario ninja.', emotion: 'CONFUSED', animation: 'confused', source: 'local' };
      const kind = id === 'cookie' ? 'feed' : 'gift';
      return mind()?.act ? mind().act(kind, { item: id, id }, context()) : { text: '¿Para mí? Bueno, ya perdiste el derecho a decir que no eres amable.', emotion: 'HAPPY', animation: kind === 'feed' ? 'eat' : 'celebrate', source: 'local' };
    });
    if (opened) setMode('menu');
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

    const aiLabel = element('label', 'lumo-setting', 'Usar IA conectada');
    const aiToggle = element('input'); aiToggle.type = 'checkbox'; aiToggle.checked = Boolean(settings.allowAI);
    aiToggle.addEventListener('change', () => { configure({ allowAI: aiToggle.checked }); renderSettings(); });
    aiLabel.append(aiToggle); tools.append(aiLabel);
    const endpointLabel = element('label', 'lumo-setting lumo-setting-stack', 'Ruta de conversación');
    const endpoint = element('input'); endpoint.type = 'text'; endpoint.value = settings.endpoint || '/api/chat'; endpoint.readOnly = true;
    endpoint.setAttribute('aria-label', 'Ruta del servidor de conversación, configurada fuera del juego');
    endpointLabel.append(endpoint); tools.append(endpointLabel);
    tools.append(element('p', 'lumo-note', 'La conexión se configura en el servidor. Este juego no pide ni guarda claves de API. Si falla, aparece “Diálogo local”.'));
    const privacy = element('label', 'lumo-setting', 'Guardar recuerdos entre sesiones');
    const memoryToggle = element('input'); memoryToggle.type = 'checkbox'; memoryToggle.checked = settings.persistMemory !== false;
    memoryToggle.addEventListener('change', () => {
      configure({ persistMemory: memoryToggle.checked });
      root.dispatchEvent(new CustomEvent('lumo:privacy', { detail: { persistMemory: state().settings?.persistMemory !== false }, bubbles: true }));
      play('toggle');
    });
    privacy.append(memoryToggle); tools.append(privacy);
    tools.append(button('BORRAR HISTORIAL DEL CHAT', () => {
      mind()?.resetHistory?.(); recent = []; renderHistory();
      root.dispatchEvent(new CustomEvent('lumo:history-cleared', { bubbles: true }));
      announce('Historial del chat borrado. Las aventuras y los regalos se conservan.');
      root.querySelector('.lumo-settings-notice').textContent = 'Historial borrado. Los regalos y las aventuras se conservan.';
      play('confirm');
    }));
    tools.append(element('p', 'lumo-note lumo-settings-notice', 'Se conserva solo el historial reciente y recuerdos seleccionados.'));
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
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
    } else if (editing && target === input && event.code === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (!event.repeat) submit();
    } else if (!editing && (event.code === 'KeyZ' || ['Enter', 'Space'].includes(event.code) && target === next)) {
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
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'lumo-title');
    panel = element('section', 'lumo-panel');
    const header = element('header', 'lumo-header');
    const heading = element('h2', '', 'LUMO'); heading.id = 'lumo-title';
    const friendship = element('span', 'lumo-friendship', 'Compañeros');
    const settingsButton = button('OPCIONES', () => { setMode('settings'); tools.querySelector('select')?.focus(); }, 'lumo-small-button');
    const closeButton = button('×', close, 'lumo-close'); closeButton.setAttribute('aria-label', 'Cerrar diálogo con Lumo');
    header.append(heading, friendship, settingsButton, closeButton);
    const line = element('div', 'lumo-line');
    portrait = element('canvas', 'lumo-portrait'); portrait.width = 112; portrait.height = 112; portrait.setAttribute('aria-hidden', 'true');
    const speech = element('div', 'lumo-speech');
    text = element('p', 'lumo-text'); text.setAttribute('aria-hidden', 'true');
    const footer = element('div', 'lumo-speech-footer');
    const page = element('span', 'lumo-page'); page.setAttribute('aria-hidden', 'true');
    next = button('CONTINUAR ▾', advance, 'lumo-next'); footer.append(page, next); speech.append(text, footer);
    line.append(portrait, speech);
    status = element('p', 'lumo-source', 'Diálogo local');
    const details = element('details', 'lumo-history'); details.hidden = true;
    details.append(element('summary', '', 'MENSAJES RECIENTES'));
    history = element('div', 'lumo-history-list'); history.setAttribute('role', 'log'); history.setAttribute('aria-label', 'Mensajes recientes de Mira y Lumo'); details.append(history);
    form = element('form', 'lumo-chat-form'); form.hidden = true;
    const label = element('label', 'sr-only', 'Mensaje de Mira para Lumo'); label.htmlFor = 'lumo-message';
    input = element('textarea', 'lumo-input'); input.id = 'lumo-message'; input.rows = 1; input.maxLength = 600; input.placeholder = 'Habla con Lumo...'; input.autocomplete = 'off'; input.spellcheck = true;
    input.setAttribute('enterkeyhint', 'send'); input.setAttribute('aria-describedby', 'lumo-chat-help');
    const send = element('button', 'lumo-button', 'ENVIAR'); send.type = 'submit';
    send.addEventListener('pointerenter', () => play('move'));
    form.append(label, input, send); form.addEventListener('submit', event => { event.preventDefault(); submit(); });
    const help = element('p', 'lumo-chat-help', 'Enter · enviar    Shift + Enter · nueva línea    Esc · cerrar'); help.id = 'lumo-chat-help';
    actions = element('nav', 'lumo-actions'); actions.setAttribute('aria-label', 'Interacciones con Lumo');
    tools = element('div', 'lumo-settings'); tools.hidden = true;
    const announcer = element('span', 'sr-only lumo-announcer'); announcer.setAttribute('role', 'status'); announcer.setAttribute('aria-live', 'polite');
    panel.append(header, line, status, details, form, help, tools, actions, announcer); root.append(panel); document.body.append(root);
    global.addEventListener('keydown', keydown, true);
    global.addEventListener('keyup', event => { if (opened) event.stopImmediatePropagation(); }, true);
    global.addEventListener('resize', syncViewport);
    global.visualViewport?.addEventListener('resize', syncViewport);
    global.visualViewport?.addEventListener('scroll', syncViewport);
    input.addEventListener('focus', syncViewport);
    root.addEventListener('pointerdown', event => { if (event.target === root) event.preventDefault(); });
    loadPortraitManifest(); syncViewport();
    return api;
  }

  function open() {
    if (!mounted) mount();
    if (opened) return api;
    epoch += 1;
    opened = true;
    previousFocus = document.activeElement;
    root.hidden = false;
    root.dataset.mode = 'menu';
    toastNode && (toastNode.hidden = true);
    adapter.pause?.(true);
    adoptHistory();
    setMode('menu');
    syncViewport();
    showResponse({ text: '¿Qué tramamos, Mira?', emotion: state().emotion || 'NORMAL', source: 'local' });
    actions.querySelector('button')?.focus({ preventScroll: true });
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
    if (!opened) open();
    if (options.mode) setMode(options.mode);
    showResponse(value, options);
    if (options.awaitClose === false) return Promise.resolve(true);
    next.focus({ preventScroll: true });
    return new Promise(resolve => { finishSpeech = resolve; });
  }

  function toast(value, options = {}) {
    if (!mounted) mount();
    if (opened || (adapter.getCommentFrequency?.() || state().settings?.commentFrequency || frequency) === 'off') return false;
    clearTimeout(toastTimer);
    if (!toastNode) { toastNode = element('div', 'lumo-toast'); toastNode.setAttribute('role', 'status'); toastNode.setAttribute('aria-live', 'polite'); document.body.append(toastNode); }
    const item = normalize(value);
    toastNode.replaceChildren(element('span', 'lumo-toast-name', 'LUMO'), element('span', '', item.text));
    toastNode.hidden = false;
    react(item);
    toastTimer = setTimeout(() => { toastNode.hidden = true; }, options.duration || Math.min(8500, Math.max(3800, item.text.length * 55)));
    return true;
  }

  const api = Object.freeze({ mount, open, close, speak, toast, advance, refresh: () => { if (opened) setMode(mode); }, get isOpen() { return opened; }, get isPending() { return pending; } });
  global.LumoUI = api;
})(window);
