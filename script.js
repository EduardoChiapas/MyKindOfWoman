'use strict';

// ============================================================
// DOM / CANVAS
// ============================================================
const introContainer = document.getElementById('video-intro-container');
const gameContainer = document.getElementById('game-container');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const dialogBox = document.getElementById('dialog-box');
const dialogText = document.getElementById('dialog-text');
const interactiveBook = document.getElementById('interactive-book');
const roomNameLabel = document.getElementById('room-name');

const VIEW_W = canvas.width;
const VIEW_H = canvas.height;

// La oscuridad tiene su propio búfer: destination-out debe borrar únicamente
// esta capa, nunca los píxeles del mapa ni del jugador ya dibujados.
const lightingCanvas = document.createElement('canvas');
lightingCanvas.width = VIEW_W;
lightingCanvas.height = VIEW_H;
const lightingCtx = lightingCanvas.getContext('2d');
const TORCH_RADIUS = 440;

// No se reproduce al cargar: play() se llama dentro del gesto que inicia el juego.
const bgm = new Audio('assets/audio/undertale.mp3');
bgm.loop = true;
bgm.preload = 'auto';

const bgmDown = new Audio('assets/audio/undertale_down.mp3');
bgmDown.loop = true;
bgmDown.preload = 'auto';

// Los fondos extraídos de la hoja se dibujan a 2x.
// Así conservamos el pixel-art y el corredor puede desplazarse con cámara.
const ROOM_SCALE = 2;
const NOMINAL_FPS = 60;
const JOYSTICK_DEADZONE = 0.15;

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

const playerSprite = loadImage('assets/player/frisk.png');

const roomImages = {
  livingRoom: loadImage('assets/rooms/living_room.png'),
  entrance: loadImage('assets/rooms/entrance.png'),
  hallway: loadImage('assets/rooms/hallway.png'),
  friskRoom: loadImage('assets/rooms/frisk_room.png'),
  torielRoom: loadImage('assets/rooms/toriel_room.png'),
  kitchen: loadImage('assets/rooms/kitchen.png'),
  basementHallway: loadImage('assets/rooms/basement.png')
};

// Convierte medidas tomadas directamente sobre el PNG original
// a coordenadas del mundo del juego (2x).
const R = (x, y, width, height) => ({
  x: x * ROOM_SCALE,
  y: y * ROOM_SCALE,
  width: width * ROOM_SCALE,
  height: height * ROOM_SCALE
});

// ============================================================
// ESTADO / JUGADOR
// ============================================================
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

let gameState = 'INTRO';
let currentRoom = 'entrance';
let gameFrame = 0;
let debugCollisions = false;

const player = {
  x: 0,
  y: 0,
  width: 48,
  height: 68,
  speed: 2.85,
  frameX: 0,
  frameY: 0,
  direction: 'down',
  isMoving: false
};

// La caja de choque ocupa solo la zona de los pies, como conviene en un RPG top-down.
const PLAYER_HITBOX = {
  offsetX: 14,
  offsetY: 53,
  width: 20,
  height: 12
};

const camera = { x: 0, y: 0 };
const STAGGER_FRAMES = 9;
const SPAWN_CLEARANCE_NATIVE = 14;
const TRANSITION_GRACE_FRAMES = 10;
let transitionGraceFrames = 0;
let lastFrameTime = null;
let animationElapsed = 0;
// Cristal del espejo: el marco del PNG permanece intacto.
const MIRROR_GLASS = R(649, 38, 45, 18);

// Medidas nativas del pasamanos inferior y sus postes en entrance.png.
// La apertura queda entre dos postes completos, sin partir sus hitboxes.
const STAIR_LOWER_RAIL = Object.freeze({
  x: 68,
  y: 128,
  width: 158,
  height: 13,
  openingLeft: 121,
  openingRight: 199
});

// Descanso y ambas ramas de madera. El vacío central queda fuera de esta unión.
const STAIR_WALKABLE = [
  R(78, 74, 39, 54),
  R(117, 74, 10, 24),
  ...Array.from({ length: 11 }, (_, i) => R(125 + 8 * i, 74 - i, 8, 27)),
  R(205, 64, 10, 27),
  R(213, 64, 19, 18),

  R(117, 108, 8, 20),
  ...Array.from({ length: 11 }, (_, i) =>
    R(125 + 8 * i, 108 + i, 8, 20 - i)
  ),
  R(213, 118, 2, 10),

  // Paso bajo el barandal, hasta el suelo delantero en y=141.
  R(
    STAIR_LOWER_RAIL.openingLeft,
    STAIR_LOWER_RAIL.y - 1,
    STAIR_LOWER_RAIL.openingRight - STAIR_LOWER_RAIL.openingLeft,
    STAIR_LOWER_RAIL.height + 1
  )
];

// ============================================================
// CASA DE TORIEL
//
// walkable: zonas donde pueden estar los pies de Frisk
// solids: muebles/objetos que no se atraviesan
// exits: puertas o bordes que cambian de habitación
// interactives: objetos examinables con Z/Enter
//
// Las coordenadas están basadas en los PNG recortados de la hoja que subiste.
// ============================================================
// Una única fuente de datos para el lore; convertir a mundo sólo al cargar.
function houseInteractives(roomId) {
  return HOUSE_LORE[roomId].map(item => ({
    ...item, ...R(item.x, item.y, item.width, item.height)
  }));
}

const rooms = {
  entrance: {
    label: 'Entrada',
    image: roomImages.entrance,
    nativeWidth: 320,
    nativeHeight: 240,
    walkable: [
      // 1. Suelo principal de la habitación
      R(37, 141, 245, 77),
      R(226, 58, 16, 20),
      R(226, 78, 56, 63),
      R(0, 145, 45, 72),
      R(275, 145, 45, 72),
      R(139, 214, 42, 26),

      // 2. Acceso superior derecho hacia los escalones de subida
      R(213, 64, 19, 18),

      // 3. Rampa de escalones superiores (subida hacia la izquierda)
      ...Array.from({ length: 11 }, (_, i) => R(125 + 8 * i, 74 - i, 8, 27)),
      R(117, 74, 10, 24),

      // 4. Descanso lateral izquierdo (giro en U)
      R(78, 74, 39, 54),

      // 5. Rampa de escalones inferiores (bajada hacia la derecha al sótano)
      R(117, 105, 98, 23)
    ],
    solids: [
      // Barandal vertical izquierdo completo (desde y=55 hasta y=128 para evitar que Frisk lo atraviese)
      R(73, 55, 5, 73),

      // Barandal/pared vertical derecha
      R(223, 83, 5, 45),

      // Vacío negro del PNG: franjas de 1 px que siguen ambas rampas sin invadir la madera.
      ...Array.from({ length: 10 }, (_, i) => R(207 - 8 * i, 94 + i, 8 + 8 * i, 1)),
      R(127, 104, 88, 3),
      ...Array.from({ length: 11 }, (_, i) => R(134 + 8 * i, 107 + i, 81 - 8 * i, 1)),

      // Barandal horizontal frontal inferior
      R(68, 128, 160, 12)
    ],
    exits: [
      { ...R(0, 147, 12, 59), dir: 'left', target: 'livingRoom', spawn: [287, 178], facing: 'left' },
      { ...R(308, 147, 12, 59), dir: 'right', target: 'hallway', spawn: [20, 105], facing: 'right' },

      // Entrada al sótano (al final de los escalones inferiores, en la pared derecha)
      {
        ...R(205, 95, 15, 33),
        activation: 'feetCenter',
        target: 'basementHallway',
        spawn: (typeof BasementMaze !== 'undefined') ? BasementMaze.spawnNative : [100, 100],
        facing: 'right'
      }
    ],
    interactives: houseInteractives('entrance'),

    drawForeground: function(ctx, camera) {
      const image = roomImages.entranceFg || roomImages.entrance;
      if (!image || !image.complete || image.naturalWidth <= 0) return;

      const feet = getPlayerHitbox();

      // Solo se dibuja el barandal sobre el jugador si está detrás de él (dentro de la rampa inferior).
      // Si ya pisó el suelo inferior (Y >= 141) o si está arriba, no debe taparlo.
      if (feet.y + feet.height >= 141 * ROOM_SCALE || feet.y + feet.height / 2 < 95 * ROOM_SCALE) return;

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // Recorte exacto de la madera del barandal frontal (Y=127, alto=13) para no cortar al sprite en los pies
      const srcX = 68;
      const srcY = 127;
      const srcW = 158;
      const srcH = 13;

      const destY = srcY * ROOM_SCALE - camera.y;

      ctx.drawImage(
        image,
        srcX, srcY, srcW, srcH,
        Math.round(srcX * ROOM_SCALE - camera.x),
        Math.round(destY),
        srcW * ROOM_SCALE,
        srcH * ROOM_SCALE
      );

      ctx.restore();
    }
  },

  livingRoom: {
    label: 'Sala',
    image: roomImages.livingRoom,
    nativeWidth: 320,
    nativeHeight: 240,
    walkable: [
      R(20, 55, 280, 165),
      R(40, 0, 45, 60),
      R(298, 95, 22, 105)
    ],
    solids: [
      R(131, 40, 74, 40),
      R(210, 14, 64, 58),
      R(279, 28, 22, 49)
    ],
    exits: [
      { ...R(301, 104, 19, 86), dir: 'right', target: 'entrance', spawn: [32, 178], facing: 'right' },
      { ...R(46, 0, 40, 14), dir: 'up', target: 'kitchen', spawn: [66, 145], facing: 'up' }
    ],
    interactives: houseInteractives('livingRoom')
  },

  hallway: {
    label: 'Corredor',
    image: roomImages.hallway,
    nativeWidth: 745,
    nativeHeight: 156,
    walkable: [
      // El sprite termina 3 px de mundo debajo de su hitbox de pies.
      // El límite exacto de los pies es y=264; el sprite queda en y<=267.
      R(0, 72, 745, 60),
      R(153, 20, 35, 64),
      R(363, 20, 35, 64),
      R(573, 20, 35, 64)
    ],
    solids: [
      R(207, 36, 42, 49),
      R(322, 34, 31, 50),
      R(522, 38, 40, 47),
      R(710, 38, 32, 47),
      // La tercera puerta no tiene una habitación correspondiente en esta hoja.
      R(574, 20, 33, 39)
    ],
    exits: [
      { ...R(0, 81, 12, 51), dir: 'left', target: 'entrance', spawn: [288, 178], facing: 'left' },
      { ...R(158, 63, 24, 13), dir: 'up', target: 'friskRoom', spawn: [88, 205], facing: 'up' },
      { ...R(368, 63, 24, 13), dir: 'up', target: 'torielRoom', spawn: [150, 205], facing: 'up' }
    ],
    interactives: houseInteractives('hallway')
  },
  friskRoom: {
    label: 'Tu habitación',
    image: roomImages.friskRoom,
    nativeWidth: 239,
    nativeHeight: 234,
    walkable: [
      R(18, 57, 203, 157),
      R(68, 214, 42, 20)
    ],
    solids: [
      // Cama.
      R(18, 57, 64, 77),
      // Paragüero/planta entre la cama y el librero.
      R(82, 36, 22, 52),
      // Librero.
      R(103, 28, 59, 60),
      // Cómoda de la pared derecha.
      R(165, 52, 54, 33),
      // Escritorio inferior izquierdo.
      R(25, 131, 35, 61),
      // Silla.
      R(67, 143, 16, 27),
      // Papelera.
      R(39, 194, 14, 18),
      // Planta grande de la esquina.
      R(185, 166, 36, 48)
    ],
    exits: [
      { ...R(70, 219, 38, 15), dir: 'down', target: 'hallway', spawn: [170, 84], facing: 'down' }
    ],
    interactives: houseInteractives('friskRoom')
  },
  torielRoom: {
    label: 'Habitación de Toriel',
    image: roomImages.torielRoom,
    nativeWidth: 227,
    nativeHeight: 234,
    walkable: [
      R(18, 58, 202, 105),
      R(111, 163, 109, 51),
      R(130, 214, 41, 20)
    ],
    solids: [
      // Cómoda izquierda.
      R(20, 52, 54, 31),
      // Armario alto con la flor.
      R(86, 28, 31, 55),
      // La alfombra a la izquierda de la cama es únicamente visual.
      // Cama.
      R(151, 59, 64, 72),
      // Silla del escritorio.
      R(157, 142, 18, 25),
      // Escritorio.
      R(180, 141, 33, 58)
    ],
    exits: [
      { ...R(132, 219, 36, 15), dir: 'down', target: 'hallway', spawn: [380, 84], facing: 'down' }
    ],
    interactives: houseInteractives('torielRoom')
  },
  kitchen: {
    label: 'Cocina',
    image: roomImages.kitchen,
    nativeWidth: 196,
    nativeHeight: 163,
    walkable: [
      R(18, 79, 160, 63),
      R(45, 142, 43, 21)
    ],
    solids: [
      // Refrigerador.
      R(20, 23, 39, 60),
      // Fregadero/mesita superior izquierda.
      R(59, 47, 31, 19),
      // La alfombra bajo el fregadero no tiene colisión.
      // Encimera y gabinetes centrales.
      R(91, 49, 54, 33),
      // Estufa/horno.
      R(147, 42, 30, 41)
    ],
    exits: [
      { ...R(46, 153, 40, 10), dir: 'down', target: 'livingRoom', spawn: [66, 57], facing: 'down' }
    ],
    interactives: houseInteractives('kitchen')
  },

  basementHallway: {
    label: 'Laberinto del sótano',
    image: roomImages.basementHallway,
    nativeWidth: BasementMaze.nativeWidth,
    nativeHeight: BasementMaze.nativeHeight,
    walkable: BasementMaze.walkable,
    solids: BasementMaze.solids,
    exits: BasementMaze.exits,
    interactives: BasementMaze.interactives,
    render: BasementMaze.draw
  }

};

// ============================================================
// INPUT
// ============================================================
window.addEventListener('keydown', (event) => {
  if (event.code in keys || event.code === 'Space') event.preventDefault();

  if (event.code in keys) keys[event.code] = true;

  if (gameState === 'INTRO' && event.code === 'Space') {
    startGame();
    return;
  }

  if (event.repeat) return;

  if (event.code === 'F2') {
    event.preventDefault();
    debugCollisions = !debugCollisions;
  }

  if (gameState === 'PLAYING' && (event.code === 'KeyZ' || event.code === 'Enter')) {
    checkInteraction();
  }

  if ((gameState === 'DIALOG' || gameState === 'BOOK') && (event.code === 'KeyX' || event.code === 'Escape')) {
    closeInteraction();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code in keys) keys[event.code] = false;
});

window.addEventListener('blur', () => {
  Object.keys(keys).forEach((key) => { keys[key] = false; });
});


// ============================================================
// CONTROLES TÁCTILES MÓVILES — JOYSTICK ANALÓGICO
// ============================================================
const joystickBase = document.getElementById('joystick-base');
const joystickKnob = document.getElementById('joystick-knob');
const btnZ = document.getElementById('btn-z');
const btnX = document.getElementById('btn-x');
const btnFullscreen = document.getElementById('btn-fullscreen');
const btnExitFullscreen = document.getElementById('btn-exit-fullscreen');

const joystickData = { x: 0, y: 0, active: false };
let joystickTouchId = null;

function resetJoystick() {
  joystickTouchId = null;
  joystickData.x = 0;
  joystickData.y = 0;
  joystickData.active = false;

  if (joystickKnob) {
    joystickKnob.style.transform = 'translate(0px, 0px)';
  }
}

function getTouchByIdentifier(touchList, identifier) {
  for (const touch of touchList) {
    if (touch.identifier === identifier) return touch;
  }

  return null;
}

function updateJoystickFromTouch(touch) {
  if (!joystickBase || !joystickKnob || !touch) return;

  const rect = joystickBase.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const dx = touch.clientX - centerX;
  const dy = touch.clientY - centerY;
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  const baseRadius = rect.width / 2;
  const knobRadius = joystickKnob.offsetWidth / 2;
  const maxDistance = Math.max(1, baseRadius - knobRadius - 1);
  const clampedDistance = Math.min(distance, maxDistance);

  const knobX = Math.cos(angle) * clampedDistance;
  const knobY = Math.sin(angle) * clampedDistance;
  joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

  const normalizedDistance = clampedDistance / maxDistance;
  // Zona muerta radial y remapeo continuo: sin salto de velocidad al salir.
  const strength = normalizedDistance <= JOYSTICK_DEADZONE
    ? 0
    : (normalizedDistance - JOYSTICK_DEADZONE) / (1 - JOYSTICK_DEADZONE);
  joystickData.x = Math.cos(angle) * strength;
  joystickData.y = Math.sin(angle) * strength;
  joystickData.active = true;
}

if (joystickBase) {
  joystickBase.addEventListener('touchstart', (event) => {
    event.preventDefault();

    if (joystickTouchId !== null || event.changedTouches.length === 0) return;

    const touch = event.changedTouches[0];
    joystickTouchId = touch.identifier;
    updateJoystickFromTouch(touch);
  }, { passive: false });

  joystickBase.addEventListener('touchmove', (event) => {
    event.preventDefault();

    if (joystickTouchId === null) return;

    const touch = getTouchByIdentifier(event.touches, joystickTouchId);
    if (touch) updateJoystickFromTouch(touch);
  }, { passive: false });

  const finishJoystickTouch = (event) => {
    event.preventDefault();

    if (joystickTouchId === null) return;

    const endedTouch = getTouchByIdentifier(event.changedTouches, joystickTouchId);
    if (endedTouch) resetJoystick();
  };

  joystickBase.addEventListener('touchend', finishJoystickTouch, { passive: false });
  joystickBase.addEventListener('touchcancel', finishJoystickTouch, { passive: false });
}

function bindActionButton(button, action) {
  if (!button) return;

  button.addEventListener('touchstart', (event) => {
    event.preventDefault();

    if (action === 'z' && gameState === 'PLAYING') {
      checkInteraction();
      return;
    }

    if (
      action === 'x' &&
      (gameState === 'DIALOG' || gameState === 'BOOK')
    ) {
      closeInteraction();
    }
  }, { passive: false });

  button.addEventListener('touchmove', (event) => {
    event.preventDefault();
  }, { passive: false });

  button.addEventListener('touchend', (event) => {
    event.preventDefault();
  }, { passive: false });

  button.addEventListener('touchcancel', (event) => {
    event.preventDefault();
  }, { passive: false });
}

bindActionButton(btnZ, 'z');
bindActionButton(btnX, 'x');

introContainer.addEventListener('touchstart', (event) => {
  if (gameState !== 'INTRO') return;

  event.preventDefault();
  startGame();
}, { passive: false });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) resetJoystick();
});

window.addEventListener('blur', resetJoystick);

// ============================================================
// PANTALLA COMPLETA MÓVIL
// ============================================================
function isFullscreenActive() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

function syncFullscreenButtons() {
  const active = isFullscreenActive();

  if (btnFullscreen) btnFullscreen.classList.toggle('hidden', active);
  if (btnExitFullscreen) btnExitFullscreen.classList.toggle('hidden', !active);
}

async function enterFullscreen() {
  const root = document.documentElement;

  try {
    if (root.requestFullscreen) {
      await root.requestFullscreen();
    } else if (root.webkitRequestFullscreen) {
      root.webkitRequestFullscreen();
    }
  } catch (error) {
    console.warn('No se pudo activar pantalla completa:', error);
  }

  syncFullscreenButtons();
}

async function exitFullscreen() {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  } catch (error) {
    console.warn('No se pudo salir de pantalla completa:', error);
  }

  syncFullscreenButtons();
}

function bindFullscreenButton(button, handler) {
  if (!button) return;

  button.addEventListener('touchstart', (event) => {
    event.preventDefault();
    handler();
  }, { passive: false });

  button.addEventListener('click', (event) => {
    event.preventDefault();
    handler();
  });
}

bindFullscreenButton(btnFullscreen, enterFullscreen);
bindFullscreenButton(btnExitFullscreen, exitFullscreen);

document.addEventListener('fullscreenchange', syncFullscreenButtons);
document.addEventListener('webkitfullscreenchange', syncFullscreenButtons);
syncFullscreenButtons();

// ============================================================
// COLISIONES
// ============================================================
function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function pointInsideRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function getPlayerHitbox(x = player.x, y = player.y) {
  return {
    x: x + PLAYER_HITBOX.offsetX,
    y: y + PLAYER_HITBOX.offsetY,
    width: PLAYER_HITBOX.width,
    height: PLAYER_HITBOX.height
  };
}

function hitboxInsideWalkable(hitbox, room) {
  // Cobertura exacta de la unión de rectángulos. Cuatro esquinas no bastan:
  // en una esquina cóncava podrían dejar pasar parte de los pies sobre vacío.
  const epsilon = 1e-7;
  const right = hitbox.x + hitbox.width;
  const bottom = hitbox.y + hitbox.height;
  const candidates = room.walkable.filter(area => rectsOverlap(hitbox, area));
  if (!candidates.length) return false;
  const cuts = [...new Set([hitbox.x, right, ...candidates.flatMap(area => [
    Math.max(hitbox.x, area.x), Math.min(right, area.x + area.width)
  ])])].sort((a, b) => a - b);

  for (let i = 0; i < cuts.length - 1; i += 1) {
    if (cuts[i + 1] - cuts[i] <= epsilon) continue;
    const x = (cuts[i] + cuts[i + 1]) / 2;
    const spans = candidates.filter(area => x >= area.x && x <= area.x + area.width)
      .map(area => [Math.max(hitbox.y, area.y), Math.min(bottom, area.y + area.height)])
      .sort((a, b) => a[0] - b[0]);
    let coveredTo = hitbox.y;
    for (const [top, end] of spans) {
      if (top > coveredTo + epsilon) break;
      coveredTo = Math.max(coveredTo, end);
    }
    if (coveredTo < bottom - epsilon) return false;
  }
  return true;
}

function canOccupy(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const room = rooms[currentRoom];
  const hitbox = getPlayerHitbox(x, y);

  if (!hitboxInsideWalkable(hitbox, room)) return false;
  if (room.solids.some((solid) => rectsOverlap(hitbox, solid))) return false;

  return true;
}

function movePlayer(dx, dy) {
  const previousX = player.x;
  const previousY = player.y;
  // Subpasos de hasta 1 px evitan saltar obstáculos al usar deltaTime.
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
  const stepX = dx / steps;
  const stepY = dy / steps;

  for (let step = 0; step < steps; step += 1) {
    // Ejes separados: conservar el deslizamiento por paredes.
    if (stepX !== 0 && canOccupy(player.x + stepX, player.y)) {
      player.x += stepX;
    }
    if (stepY !== 0 && canOccupy(player.x, player.y + stepY)) {
      player.y += stepY;
    }
  }

  return Math.abs(player.x - previousX) > 0.000001 || Math.abs(player.y - previousY) > 0.000001;
}

// Coloca los PIES del personaje en una coordenada tomada del PNG base.
function placePlayerAtFeet(nativeX, nativeY) {
  const worldX = nativeX * ROOM_SCALE;
  const worldY = nativeY * ROOM_SCALE;
  const hitboxCenterX = PLAYER_HITBOX.offsetX + PLAYER_HITBOX.width / 2;
  const hitboxCenterY = PLAYER_HITBOX.offsetY + PLAYER_HITBOX.height / 2;

  player.x = worldX - hitboxCenterX;
  player.y = worldY - hitboxCenterY;
}

function expandRect(rect, amount) {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    width: rect.width + amount * 2,
    height: rect.height + amount * 2
  };
}

function inwardVectorForExit(dir) {
  if (dir === 'up') return { x: 0, y: 1 };
  if (dir === 'down') return { x: 0, y: -1 };
  if (dir === 'left') return { x: 1, y: 0 };
  if (dir === 'right') return { x: -1, y: 0 };
  return { x: 0, y: 0 };
}

// Garantiza que el spawn quede, como mínimo, unos 14 píxeles nativos
// dentro de la habitación y no encima del trigger por el que se puede salir.
function clearSpawnFromExitTriggers() {
  const room = rooms[currentRoom];
  const clearance = SPAWN_CLEARANCE_NATIVE * ROOM_SCALE;

  for (let pass = 0; pass < 6; pass += 1) {
    const hitbox = getPlayerHitbox();
    const nearbyExit = room.exits.find((exit) =>
      rectsOverlap(hitbox, expandRect(exit, clearance))
    );

    if (!nearbyExit) return;

    const inward = inwardVectorForExit(nearbyExit.dir);
    if (inward.x === 0 && inward.y === 0) return;

    let moved = false;

    // Primero intenta los 14 px completos; si la geometría es estrecha,
    // busca una distancia menor pero siempre hacia el interior del cuarto.
    for (let distance = clearance; distance >= ROOM_SCALE * 4; distance -= ROOM_SCALE) {
      const nextX = player.x + inward.x * distance;
      const nextY = player.y + inward.y * distance;

      if (canOccupy(nextX, nextY)) {
        player.x = nextX;
        player.y = nextY;
        moved = true;
        break;
      }
    }

    if (!moved) return;
  }
}

// ============================================================
// PUERTAS / HABITACIONES
// ============================================================
function showDialog(text) {
  gameState = 'DIALOG';
  dialogText.textContent = text;
  dialogBox.classList.remove('hidden');
}

function changeRoom(exit) {
  currentRoom = exit.target;

  // Ambas pistas siguen reproduciéndose; aquí sólo se intercambian volúmenes.
  if (currentRoom === 'basementHallway') {
    bgm.volume = 0;
    bgmDown.volume = 0.5;
  } else {
    bgm.volume = 1;
    bgmDown.volume = 0;
  }

  // 1) Coloca los pies en el punto de entrada definido para ese cuarto.
  placePlayerAtFeet(exit.spawn[0], exit.spawn[1]);

  // 2) Empuja el spawn hacia el interior si quedó demasiado cerca del
  // trigger de salida. Esto elimina el bucle de teletransporte (spawn trap).
  clearSpawnFromExitTriggers();

  // 3) Mantiene la orientación correcta al cruzar la puerta.
  if (exit.facing) {
    player.direction = exit.facing;

    if (exit.facing === 'down') player.frameY = 0;
    if (exit.facing === 'up') player.frameY = 1;
    if (exit.facing === 'left') player.frameY = 2;
    if (exit.facing === 'right') player.frameY = 3;
  }

  player.frameX = 0;
  player.isMoving = false;
  animationElapsed = 0;
  transitionGraceFrames = TRANSITION_GRACE_FRAMES;
  roomNameLabel.textContent = rooms[currentRoom].label;
  updateCamera();
}

function checkRoomExit() {
  if (transitionGraceFrames > 0) return;

  const hitbox = getPlayerHitbox();
  const room = rooms[currentRoom];

  const exit = room.exits.find((candidate) => {
    if (candidate.dir && candidate.dir !== player.direction) return false;
    if (candidate.activation === 'feetCenter') {
      return pointInsideRect(hitbox.x + hitbox.width / 2, hitbox.y + hitbox.height / 2, candidate);
    }
    return rectsOverlap(hitbox, candidate);
  });

  if (exit) changeRoom(exit);
}

// ============================================================
// INTERACCIONES
// ============================================================
function interactionProbe() {
  const hitbox = getPlayerHitbox();
  const margin = 6;
  const reach = 36;
  if (player.direction === 'up') return {
    x: hitbox.x - margin, y: hitbox.y - reach,
    width: hitbox.width + margin * 2, height: reach + margin
  };
  if (player.direction === 'down') return {
    x: hitbox.x - margin, y: hitbox.y + hitbox.height - margin,
    width: hitbox.width + margin * 2, height: reach + margin
  };
  if (player.direction === 'left') return {
    x: hitbox.x - reach, y: hitbox.y - margin,
    width: reach + margin, height: hitbox.height + margin * 2
  };
  return {
    x: hitbox.x + hitbox.width - margin, y: hitbox.y - margin,
    width: reach + margin, height: hitbox.height + margin * 2
  };
}

function checkInteraction() {
  if (gameState !== 'PLAYING') return;
  const probe = interactionProbe();
  const feet = getPlayerHitbox();
  const centerX = feet.x + feet.width / 2;
  const centerY = feet.y + feet.height / 2;
  const distanceToObject = item => Math.hypot(
    centerX - Math.max(item.x, Math.min(centerX, item.x + item.width)),
    centerY - Math.max(item.y, Math.min(centerY, item.y + item.height))
  );
  const object = rooms[currentRoom].interactives.filter(item => rectsOverlap(probe, item))
    .sort((a, b) => distanceToObject(a) - distanceToObject(b))[0];
  if (!object) return;

  if (object.action === 'book') {
    gameState = 'BOOK';
    interactiveBook.classList.remove('hidden');
    return;
  }

  showDialog(object.text);
}

function closeInteraction() {
  dialogBox.classList.add('hidden');
  interactiveBook.classList.add('hidden');
  gameState = 'PLAYING';
}

// ============================================================
// CÁMARA
// ============================================================
function updateCamera() {
  const room = rooms[currentRoom];
  const roomW = room.nativeWidth * ROOM_SCALE;
  const roomH = room.nativeHeight * ROOM_SCALE;
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  if (roomW <= VIEW_W) {
    camera.x = -(VIEW_W - roomW) / 2;
  } else {
    camera.x = Math.max(0, Math.min(roomW - VIEW_W, playerCenterX - VIEW_W / 2));
  }

  if (roomH <= VIEW_H) {
    camera.y = -(VIEW_H - roomH) / 2;
  } else {
    camera.y = Math.max(0, Math.min(roomH - VIEW_H, playerCenterY - VIEW_H / 2));
  }
}

// ============================================================
// GAME LOOP
// ============================================================
function startGame() {
  if (gameState !== 'INTRO') return;

  bgm.volume = 1;
  bgmDown.volume = 0;

  // Las dos llamadas ocurren en el mismo gesto de Espacio/touchstart,
  // sin esperar promesas ni reiniciar pistas al cambiar de habitación.
  for (const track of [bgm, bgmDown]) {
    try {
      const playback = track.play();
      if (playback && typeof playback.catch === 'function') {
        playback.catch(error => console.warn('No se pudo iniciar el BGM:', track.src, error));
      }
    } catch (error) {
      console.warn('No se pudo iniciar el BGM:', track.src, error);
    }
  }
  introContainer.style.display = 'none';
  gameContainer.style.display = 'grid';
  gameState = 'PLAYING';
  currentRoom = 'entrance';
  placePlayerAtFeet(160, 206);
  roomNameLabel.textContent = rooms[currentRoom].label;
  updateCamera();
  lastFrameTime = null;
  requestAnimationFrame(gameLoop);
}

function update(deltaSeconds = 1 / NOMINAL_FPS) {
  if (gameState !== 'PLAYING') {
    player.isMoving = false;
    player.frameX = 0;
    animationElapsed = 0;
    updateCamera();
    return;
  }

  const frameFactor = deltaSeconds * NOMINAL_FPS;
  transitionGraceFrames = Math.max(0, transitionGraceFrames - frameFactor);

  let dx = 0;
  let dy = 0;
  let usingJoystick = false;

  if (joystickData.active) {
    dx = joystickData.x * player.speed;
    dy = joystickData.y * player.speed;
    usingJoystick = true;
  } else {
    if (keys.ArrowUp) dy -= player.speed;
    if (keys.ArrowDown) dy += player.speed;
    if (keys.ArrowLeft) dx -= player.speed;
    if (keys.ArrowRight) dx += player.speed;

    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }
  }

  // speed conserva sus unidades a 60 FPS; la velocidad real es 171 px/s.
  dx *= frameFactor;
  dy *= frameFactor;
  player.isMoving = Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01;

  if (!player.isMoving) {
    player.frameX = 0;
    animationElapsed = 0;
    updateCamera();
    return;
  }

  if (usingJoystick) {
    if (Math.abs(joystickData.y) > Math.abs(joystickData.x)) {
      if (joystickData.y < 0) {
        player.direction = 'up';
        player.frameY = 1;
      } else {
        player.direction = 'down';
        player.frameY = 0;
      }
    } else if (joystickData.x < 0) {
      player.direction = 'left';
      player.frameY = 2;
    } else {
      player.direction = 'right';
      player.frameY = 3;
    }
  } else if (dy < 0) {
    player.direction = 'up';
    player.frameY = 1;
  } else if (dy > 0) {
    player.direction = 'down';
    player.frameY = 0;
  } else if (dx < 0) {
    player.direction = 'left';
    player.frameY = 2;
  } else if (dx > 0) {
    player.direction = 'right';
    player.frameY = 3;
  }

  // El joystick es analógico, pero seguimos usando movePlayer para conservar
  // todas las colisiones y el deslizamiento por paredes del motor existente.
  player.isMoving = movePlayer(dx, dy);
  checkRoomExit();

  if (player.isMoving) {
    animationElapsed += frameFactor;
    while (animationElapsed >= STAGGER_FRAMES) {
      player.frameX = (player.frameX + 1) % 4;
      animationElapsed -= STAGGER_FRAMES;
    }
  } else {
    player.frameX = 0;
    animationElapsed = 0;
  }

  updateCamera();
}

function worldToScreen(rect) {
  return {
    x: rect.x - camera.x,
    y: rect.y - camera.y,
    width: rect.width,
    height: rect.height
  };
}

function draw() {
  const room = rooms[currentRoom];

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  drawRoom();
  if (currentRoom === 'hallway') drawMirrorReflection();
  drawPlayer();
  if (rooms[currentRoom].drawForeground) rooms[currentRoom].drawForeground(ctx, camera);
  drawLighting();

  if (debugCollisions) drawDebug();
}

function drawRoom() {
  const room = rooms[currentRoom];
  const roomW = room.nativeWidth * ROOM_SCALE;
  const roomH = room.nativeHeight * ROOM_SCALE;

  if (room.render) {
    room.render(ctx, camera, VIEW_W, VIEW_H);
    return;
  }
  if (room.image.complete && room.image.naturalWidth > 0) {
    ctx.drawImage(
      room.image,
      Math.round(-camera.x),
      Math.round(-camera.y),
      roomW,
      roomH
    );
    if (currentRoom === 'hallway') {
      // El color morado estaba incorporado en el fondo original, no en clip().
      // Retirar sólo el cristal antiguo antes de pintar el nuevo gris/celeste.
      const glass = worldToScreen(MIRROR_GLASS);
      ctx.clearRect(Math.round(glass.x), Math.round(glass.y), glass.width, glass.height);
    }
  }
}

function mirrorReflectionPose() {
  if (currentRoom !== 'hallway') return null;
  const feet = getPlayerHitbox();
  const centerX = feet.x + feet.width / 2;
  const centerY = feet.y + feet.height / 2;
  // Frente al cristal, sobre el piso del corredor, con alcance visual limitado.
  const reflectionY = player.y - 30;
  if (centerX < MIRROR_GLASS.x - 12 || centerX > MIRROR_GLASS.x + MIRROR_GLASS.width + 12 ||
      centerY < 144 || !rectsOverlap({ x: player.x, y: reflectionY,
        width: player.width, height: player.height }, MIRROR_GLASS)) return null;
  // Intercambiar UP/DOWN mediante filas; el canvas y los lados quedan normales.
  const rows = { up: 0, down: 1, left: 2, right: 3 };
  return {
    x: player.x, y: reflectionY,
    frameX: player.frameX, frameY: rows[player.direction]
  };
}

function drawMirrorReflection() {
  if (currentRoom !== 'hallway') return;
  const glass = worldToScreen(MIRROR_GLASS);
  ctx.save();
  ctx.beginPath();
  ctx.rect(Math.round(glass.x), Math.round(glass.y), glass.width, glass.height);
  ctx.clip();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(180, 190, 200, 0.6)';
  ctx.fillRect(Math.round(glass.x), Math.round(glass.y), glass.width, glass.height);
  const reflection = mirrorReflectionPose();
  if (reflection && playerSprite.complete && playerSprite.naturalWidth > 0) {
    ctx.globalAlpha = 0.5;
    drawSpriteFrame(reflection.frameX, reflection.frameY,
      Math.round(reflection.x - camera.x), Math.round(reflection.y - camera.y));
  }
  ctx.restore();
}

function drawSpriteFrame(frameX, frameY, screenX, screenY) {
  const sourceWidth = playerSprite.naturalWidth / 4;
  const sourceHeight = playerSprite.naturalHeight / 4;
  ctx.drawImage(playerSprite, frameX * sourceWidth, frameY * sourceHeight,
    sourceWidth, sourceHeight, screenX, screenY, player.width, player.height);
}

function drawPlayer() {
  const { x: screenX, y: screenY } = playerScreenPosition();

  if (playerSprite.complete && playerSprite.naturalWidth > 0) {
    drawSpriteFrame(player.frameX, player.frameY, screenX, screenY);
    return;
  }

  ctx.fillStyle = '#ff4040';
  ctx.fillRect(screenX, screenY, player.width, player.height);
}

function playerScreenPosition() {
  return {
    x: Math.round(player.x - camera.x),
    y: Math.round(player.y - camera.y)
  };
}

function carveRadialLight(ctx, x, y, radius) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(0.25, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.5)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawLighting() {
  lightingCtx.save();
  lightingCtx.setTransform(1, 0, 0, 1, 0, 0);
  lightingCtx.globalAlpha = 1;
  lightingCtx.globalCompositeOperation = 'source-over';
  // Limpiar en cada fotograma evita rastros luminosos al mover la cámara.
  lightingCtx.clearRect(0, 0, VIEW_W, VIEW_H);
  lightingCtx.fillStyle = currentRoom === 'basementHallway'
    ? 'rgba(20, 15, 35, 0.6)'
    : 'rgba(15, 15, 30, 0.2)';
  lightingCtx.fillRect(0, 0, VIEW_W, VIEW_H);

  lightingCtx.globalCompositeOperation = 'destination-out';
  const screen = playerScreenPosition();
  carveRadialLight(lightingCtx, screen.x + player.width / 2,
    screen.y + player.height / 2, TORCH_RADIUS);

  if (currentRoom === 'basementHallway') {
    for (const light of BasementMaze.lights) {
      // El renderizador del laberinto redondea su transformación de cámara.
      const x = light.x - Math.round(camera.x);
      const y = light.y - Math.round(camera.y);
      if (x + light.radius < 0 || x - light.radius > VIEW_W ||
          y + light.radius < 0 || y - light.radius > VIEW_H) continue;
      carveRadialLight(lightingCtx, x, y, light.radius);
    }
  }
  lightingCtx.globalCompositeOperation = 'source-over';
  lightingCtx.restore();

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(lightingCanvas, 0, 0);
  ctx.restore();
}

function drawRects(list, fillStyle) {
  ctx.fillStyle = fillStyle;
  list.forEach((rect) => {
    const p = worldToScreen(rect);
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });
}

function drawDebug() {
  const room = rooms[currentRoom];
  ctx.save();

  drawRects(room.walkable, 'rgba(40, 220, 90, .16)');
  drawRects(room.solids, 'rgba(255, 55, 55, .34)');
  drawRects(room.exits, 'rgba(40, 240, 255, .42)');
  drawRects(room.interactives, 'rgba(90, 110, 255, .30)');

  const hitbox = worldToScreen(getPlayerHitbox());
  ctx.fillStyle = 'rgba(255, 255, 0, .75)';
  ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);

  const probe = worldToScreen(interactionProbe());
  ctx.strokeStyle = 'rgba(255,255,255,.8)';
  ctx.strokeRect(probe.x, probe.y, probe.width, probe.height);

  ctx.restore();
}

function gameLoop(timestamp) {
  // Limitar pausas largas (pestaña oculta) para evitar teletransportes.
  const deltaSeconds = lastFrameTime === null
    ? 1 / NOMINAL_FPS
    : Math.min(0.05, Math.max(0, (timestamp - lastFrameTime) / 1000));
  lastFrameTime = timestamp;
  gameFrame += 1;
  update(deltaSeconds);
  draw();
  requestAnimationFrame(gameLoop);
}
