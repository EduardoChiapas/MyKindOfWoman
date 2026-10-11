/* Optional HOME activities. Outcomes come from game input, never from chat. */
(function (global) {
  'use strict';
  let adapter, panel, timer, active = false, selected = [], matched = new Set(), cards = [], turns = 0, epoch = 0;
  const symbols = ['♥', '✦', '☾', '♪'];
  function close(completed = false) {
    if (!active) return;
    active = false; epoch++; clearTimeout(timer); panel.remove(); panel = null;
    adapter.pause(false);
    adapter.resumeFocus();
    if (completed) adapter.complete('memory', { turns });
  }
  function memory() {
    if (active) return;
    active = true; epoch++; selected = []; matched = new Set(); turns = 0;
    cards = symbols.flatMap((symbol, pair) => [{ symbol, pair }, { symbol, pair }]);
    // Fisher–Yates: every deal can differ; matching relies on a pair ID.
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    panel = document.createElement('section'); panel.className = 'lumo-memory';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Memoria con Lumo');
    panel.innerHTML = '<div class="lumo-memory-card"><h2>MEMORIA CON LUMO</h2><p>Encuentra las cuatro parejas. Sin reloj, a tu ritmo.</p><div class="lumo-memory-grid"></div><p class="lumo-memory-status" role="status">0 / 4 parejas</p><button type="button" class="lumo-memory-exit">VOLVER · ESC</button></div>';
    const grid = panel.querySelector('.lumo-memory-grid');
    cards.forEach((card, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = '?';
      button.setAttribute('aria-label', `Carta ${index + 1}, oculta`);
      button.addEventListener('click', () => reveal(index)); grid.append(button);
    });
    panel.querySelector('.lumo-memory-exit').addEventListener('click', () => close());
    panel.addEventListener('keydown', event => {
      if (event.code === 'Escape') { event.preventDefault(); close(); }
      if (event.code === 'Tab') {
        const nodes = [...panel.querySelectorAll('button:not(:disabled)')];
        const index = nodes.indexOf(document.activeElement);
        if (event.shiftKey && index <= 0) { event.preventDefault(); nodes.at(-1).focus(); }
        else if (!event.shiftKey && (index < 0 || index === nodes.length - 1)) { event.preventDefault(); nodes[0].focus(); }
      }
    });
    document.body.append(panel); adapter.pause(true); grid.firstElementChild.focus();
  }
  function reveal(index) {
    if (!active || selected.length >= 2 || selected.includes(index) || matched.has(cards[index].pair)) return;
    adapter.play('confirm'); selected.push(index); paint();
    if (selected.length !== 2) return;
    turns++; const ticket = epoch;
    const [a, b] = selected;
    if (cards[a].pair === cards[b].pair) {
      matched.add(cards[a].pair); selected = []; paint();
      if (matched.size === 4) {
        panel.querySelector('.lumo-memory-status').textContent = `¡Las cuatro parejas! ${turns} intentos.`;
        timer = setTimeout(() => { if (ticket === epoch) close(true); }, 800);
      }
    } else timer = setTimeout(() => { if (ticket === epoch && active) { selected = []; paint(); } }, 750);
  }
  function paint() {
    const buttons = panel.querySelectorAll('.lumo-memory-grid button');
    cards.forEach((card, index) => {
      const visible = selected.includes(index) || matched.has(card.pair);
      const button = buttons[index]; button.textContent = visible ? card.symbol : '?';
      button.classList.toggle('is-matched', matched.has(card.pair));
      button.setAttribute('aria-label', `Carta ${index + 1}, ${visible ? card.symbol : 'oculta'}${matched.has(card.pair) ? ', pareja encontrada' : ''}`);
      // Keep matched cards focusable so keyboard focus remains stable.
      button.setAttribute('aria-disabled', String(matched.has(card.pair)));
    });
    panel.querySelector('.lumo-memory-status').textContent = `${matched.size} / 4 parejas · ${turns} intentos`;
  }
  global.LumoActivities = Object.freeze({ mount(value) { adapter = value; }, start: memory, cancel: () => close(), get active() { return active; } });
})(window);
