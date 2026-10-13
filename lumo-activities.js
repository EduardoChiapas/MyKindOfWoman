/* Optional HOME activities. Outcomes come from game input, never from chat. */
(function (global) {
  'use strict';
  let adapter, panel, timer, active = false, selected = [], matched = new Set(), cards = [], turns = 0, epoch = 0, buttons = [], finished = false;
  const names = ['corazón', 'estrella', 'luna', 'nota'];
  const pixels = [
    ['01100110','11111111','11111111','11111111','01111110','00111100','00011000'],
    ['00011000','00011000','11111111','01111110','00111100','01111110','11000011'],
    ['00111100','01110000','11100000','11100000','11100000','01110001','00111110'],
    ['00011110','00010010','00010010','00010010','00010010','01110010','11100110','01000100']
  ];
  function sound(name, fallback = 'confirm') {
    if (global.UndertaleAudio?.effect?.(name, { ui: true }) !== true) adapter.play?.(fallback);
  }
  function icon(pair, cover = false) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 12;
    canvas.setAttribute('aria-hidden', 'true');
    const brush = canvas.getContext('2d'); brush.imageSmoothingEnabled = false;
    brush.fillStyle = cover ? '#e2d4ac' : '#ffea81';
    if (cover) {
      for (let y = 1; y < 11; y += 2) for (let x = 1; x < 11; x += 2) if ((x + y) % 4 === 2) brush.fillRect(x, y, 1, 1);
      brush.fillRect(5, 4, 2, 4); brush.fillRect(3, 5, 6, 2);
    } else for (const [y, row] of pixels[pair].entries()) for (const [x, value] of [...row].entries()) if (value === '1') brush.fillRect(x + 2, y + 2, 1, 1);
    return canvas;
  }
  function close() {
    if (!active) return;
    const completed = finished, result = { turns };
    active = false; epoch++; clearTimeout(timer); panel.remove(); panel = null; buttons = [];
    adapter.pause(false); adapter.resumeFocus();
    // The result waits for the player's confirmation, never an automatic timer.
    if (completed) adapter.complete('memory', result);
  }
  function memory() {
    if (active) return;
    active = true; finished = false; epoch++; selected = []; matched = new Set(); turns = 0; buttons = [];
    cards = names.flatMap((symbol, pair) => [{ symbol, pair }, { symbol, pair }]);
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    panel = document.createElement('section'); panel.className = 'lumo-memory';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', 'Memoria con Lumo');
    const frame = document.createElement('div'); frame.className = 'lumo-memory-card'; panel.append(frame);
    const title = document.createElement('h2'); title.textContent = 'MEMORIA CON LUMO'; frame.append(title);
    const hint = document.createElement('p'); hint.textContent = 'Encuentra las cuatro parejas. Sin reloj, a tu ritmo.'; frame.append(hint);
    const grid = document.createElement('div'); grid.className = 'lumo-memory-grid'; frame.append(grid);
    const status = document.createElement('p'); status.className = 'lumo-memory-status'; status.setAttribute('role', 'status'); status.textContent = '0 / 4 parejas'; frame.append(status);
    const exit = document.createElement('button'); exit.type = 'button'; exit.className = 'lumo-memory-exit'; exit.textContent = 'VOLVER · ESC'; frame.append(exit);
    cards.forEach((card, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', `Carta ${index + 1}, oculta`);
      const inner = document.createElement('span'); inner.className = 'lumo-memory-inner';
      const back = document.createElement('span'); back.className = 'lumo-memory-cover'; back.append(icon(card.pair, true));
      const front = document.createElement('span'); front.className = 'lumo-memory-face'; front.append(icon(card.pair));
      inner.append(back, front); button.append(inner); buttons.push(button);
      button.addEventListener('click', () => reveal(index)); grid.append(button);
    });
    exit.addEventListener('click', close);
    panel.addEventListener('keydown', event => {
      const key = event.code || event.key;
      if (key === 'Escape' || key === 'KeyX') { event.preventDefault(); close(); return; }
      if (finished && key === 'Enter') { event.preventDefault(); close(); return; }
      const index = buttons.indexOf(document.activeElement), shifts = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 };
      if (index >= 0 && key in shifts) { event.preventDefault(); buttons[(index + shifts[key] + 8) % 8].focus(); sound('card', 'move'); }
      if (key === 'Tab') {
        const nodes = [...panel.querySelectorAll('button:not(:disabled)')], at = nodes.indexOf(document.activeElement);
        if (event.shiftKey && at <= 0) { event.preventDefault(); nodes.at(-1).focus(); }
        else if (!event.shiftKey && (at < 0 || at === nodes.length - 1)) { event.preventDefault(); nodes[0].focus(); }
      }
    });
    document.body.append(panel); adapter.pause(true); buttons[0].focus();
  }
  function reveal(index) {
    if (!active || finished || selected.length >= 2 || selected.includes(index) || matched.has(cards[index].pair)) return;
    sound('card'); selected.push(index); paint();
    if (selected.length !== 2) return;
    turns++; const ticket = epoch, [a, b] = selected;
    if (cards[a].pair === cards[b].pair) {
      matched.add(cards[a].pair); selected = []; finished = matched.size === 4; paint(); sound(finished ? 'success' : 'match');
      if (finished) {
        panel.querySelector('.lumo-memory-status').textContent = `¡Las cuatro parejas! ${turns} intentos. Lumo exige una revancha amistosa.`;
        const exit = panel.querySelector('.lumo-memory-exit'); exit.textContent = 'VOLVER CON LUMO · ENTER'; exit.focus();
      }
    } else {
      panel.querySelector('.lumo-memory-status').textContent = `${matched.size} / 4 parejas · Esas dos prefieren seguir buscando.`;
      sound('miss', 'move');
      timer = setTimeout(() => { if (ticket === epoch && active) { selected = []; paint(); } }, 750);
    }
  }
  function paint() {
    cards.forEach((card, index) => {
      const visible = selected.includes(index) || matched.has(card.pair), button = buttons[index];
      button.classList.toggle('is-visible', visible); button.classList.toggle('is-matched', matched.has(card.pair));
      button.setAttribute('aria-label', `Carta ${index + 1}, ${visible ? card.symbol : 'oculta'}${matched.has(card.pair) ? ', pareja encontrada' : ''}`);
      // Matched cards stay focusable; a reveal guard prevents duplicate results.
      button.setAttribute('aria-disabled', String(matched.has(card.pair)));
    });
    panel.querySelector('.lumo-memory-status').textContent = `${matched.size} / 4 parejas · ${turns} intentos`;
  }
  global.LumoActivities = Object.freeze({ mount(value) { adapter = value; }, start: memory, cancel: close, get active() { return active; } });
})(window);

