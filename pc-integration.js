/* Connects the room/desktop to the compiled original FNF engine. */
(() => {
  'use strict';
  const desktop = document.querySelector('gaming-desktop');
  const game = document.createElement('fnf-original-host');
  desktop.setGame(game);
  const storageKey = 'toriel.pc.original.bad-bunny.progress.v1';
  const order = Object.freeze(['date-whitroll','date-perfume','date-heartbass','celoso','palmas','amarre']);
  let progress = {};
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      progress = saved;
      // Key rewards are reserved for a later quest step. Retire this host's
      // earlier reward flag while keeping completed songs and their stats.
      if (Object.prototype.hasOwnProperty.call(progress,'key3')) {
        delete progress.key3;
        localStorage.setItem(storageKey,JSON.stringify(progress));
      }
    }
  } catch {}
  let active = false;
  let launchToken = 0;
  const nameOf = id => ({tutorial:'Tutorial','date-whitroll':'Whitroll · The Date Week','date-perfume':'Perfume · The Date Week','date-heartbass':'Heartbass · The Date Week',celoso:'Celoso',palmas:'Palmas',amarre:'Amarre'})[id] || id;

  function syncSongs() {
    desktop.setSongs(order.map(id => ({id,name:nameOf(id),completed:Boolean(progress[id]?.won)})));
  }

  function save() {
    try { localStorage.setItem(storageKey,JSON.stringify(progress)); } catch {}
    syncSongs();
  }

  function returnToDesktop(message) {
    ++launchToken;
    game.stop();
    desktop.showDesktop();
    if (message) desktop.notify(message);
  }

  function open() {
    if (active || gameState !== 'PLAYING') return;
    active = true;
    gameState = 'PC';
    gameContainer.inert = true;
    resetMovementInput();
    resetJoystick();
    document.getElementById('interaction-hint').classList.add('hidden');
    HouseExperience.setExternalScreen(true);
    syncSongs();
    desktop.open();
    window.HomeProgress?.record('pc_found');
    const notice=window.HomeStory?.onPCopen();if(notice)desktop.notify(notice);
    window.FnfPreload?.enable();
    game.setVolume(desktop.volume);
  }

  function close() {
    if (!active) return;
    returnToDesktop();
    active = false;
    desktop.close();
    gameState = 'PLAYING';
    gameContainer.inert = false;
    resetMovementInput();
    resetJoystick();
    HouseExperience.setExternalScreen(false);
    canvas.focus({preventScroll:true});
  }

  async function launchGame() {
    if (!active || desktop.gameActive) return;
    const token = ++launchToken;
    desktop.setNowPlaying('Friday Night Funkin’');
    desktop.setGameVisible(true);
    // The original engine stays inside the monitor. Expanding the PC is a
    // separate user action and never starts, resets or replaces its session.
    game.setVolume(desktop.volume);
    try { await game.start(); }
    catch(error) {
      if (token === launchToken) returnToDesktop(error?.message || 'No se pudo cargar el juego original.');
    }
  }

  desktop.addEventListener('pc:launch-game',launchGame);
  desktop.addEventListener('pc:close',close);
  desktop.addEventListener('pc:volume',event => game.setVolume(event.detail.volume));
  game.addEventListener('fnf-original:win',event => {
    const {songId,stats} = event.detail;
    const isModSong = order.includes(songId);
    if (!active || !desktop.gameActive || (!isModSong && songId !== 'tutorial')) return;
    // Victories record song progress while the original game stays open.
    // Its own Story Mode playlist and week menu handle the next screen.
    if (isModSong) {
      progress[songId] = {won:true,engine:'original',stats,completedAt:new Date().toISOString()};
      save();
    }
  });
  game.addEventListener('fnf-original:exit',() => returnToDesktop());
  game.addEventListener('fnf-original:error',event => {
    if (active) returnToDesktop(event.detail?.message || 'No se pudo cargar el juego original.');
  });
  document.getElementById('btn-pc-demo').addEventListener('click',() => startGame('torielRoom'));
  syncSongs();
  window.GamingPC = Object.freeze({
    open,close,launchGame,
    getState:() => ({active,playing:desktop.gameActive,progress:JSON.parse(JSON.stringify(progress)),game:game.getState()})
  });
})();
