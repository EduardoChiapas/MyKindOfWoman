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

// Los fondos extraídos de la hoja se dibujan a 2x.
// Así conservamos el pixel-art y el corredor puede desplazarse con cámara.
const ROOM_SCALE = 2;

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
  kitchen: loadImage('assets/rooms/kitchen.png')
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
const rooms = {
  entrance: {
    label: 'Entrada',
    image: roomImages.entrance,
    nativeWidth: 320,
    nativeHeight: 240,
    walkable: [
      R(38, 58, 244, 160),
      R(0, 145, 45, 72),
      R(275, 145, 45, 72),
      R(139, 214, 42, 26),
      // Centro/hueco negro de las escaleras: se puede recorrer.
      R(116, 92, 99, 34)
    ],
    solids: [
      R(42, 20, 28, 47),
      R(242, 47, 39, 31),

      // Barandas/bordes de la escalera. El centro negro queda libre.
      R(77, 56, 138, 7),
      R(77, 56, 8, 80),
      R(207, 56, 8, 80),
      // Borde inferior dividido para dejar una entrada caminable al hueco.
      R(77, 129, 45, 7),
      R(200, 129, 15, 7)
    ],
    exits: [
      { ...R(0, 147, 12, 59), dir: 'left', target: 'livingRoom', spawn: [287, 178], facing: 'left' },
      { ...R(308, 147, 12, 59), dir: 'right', target: 'hallway', spawn: [20, 105], facing: 'right' }
    ],
    interactives: [
      { ...R(41, 18, 31, 55), text: '* Una planta muy bien cuidada.' },
      { ...R(241, 44, 42, 37), text: '* Un mueble pequeño. Todo está perfectamente ordenado.' },
      { ...R(103, 18, 116, 28), text: '* Un cuadro sencillo cuelga de la pared.' },

      // Solo responde al llegar al final del hueco negro y pulsar Z/Enter.
      { ...R(194, 98, 19, 24), text: '* Las escaleras continúan hacia el sótano.\n* Esa zona todavía no está disponible.' }
    ]
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
    interactives: [
      { ...R(132, 42, 73, 38), text: '* El fuego de la chimenea crepita suavemente.' },
      { ...R(209, 13, 66, 61), text: '* Una colección de libros viejos.\n* Varios tratan sobre monstruos y plantas.' },
      { ...R(278, 27, 23, 51), text: '* Un perchero junto a la estantería.' }
    ]
  },

  hallway: {
    label: 'Corredor',
    image: roomImages.hallway,
    nativeWidth: 745,
    nativeHeight: 156,
    walkable: [
      R(0, 72, 745, 66),
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
    interactives: [
      { ...R(207, 34, 43, 51), text: '* Una maceta con flores.' },

      // Pintura marrón situada junto a la primera puerta.
      { ...R(247, 14, 54, 31), text: '* Un pequeño paisaje cuelga en la pared.' },

      { ...R(321, 33, 33, 52), text: '* Las hojas de esta planta casi rozan el suelo.' },
      { ...R(521, 37, 42, 50), text: '* Otra planta. Toriel realmente las cuida.' },
      { ...R(571, 18, 38, 45), text: '* La puerta no se abre.' },

      // Espejo morado del extremo derecho. Interacción independiente de la pintura.
      { ...R(645, 33, 55, 28), text: '* Eres tú, a pesar de todo sigues siendo tú.' }
    ]
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
    interactives: [
      { ...R(18, 57, 64, 77), text: '* Una cama muy cómoda.' },
      { ...R(103, 28, 59, 60), text: '* Una estantería llena de libros.' },
      { ...R(165, 52, 54, 33), text: '* Un cajón. Parece tener espacio para guardar recuerdos.' },
      { ...R(25, 131, 35, 61), text: '* Sobre la mesa hay algo especial.', action: 'book' },
      { ...R(185, 166, 36, 48), text: '* Una planta crece tranquilamente en la esquina.' }
    ]
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
      // Mesita angosta a la izquierda de la cama.
      R(139, 96, 15, 32),
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
    interactives: [
      { ...R(20, 52, 54, 31), text: '* Los cajones están ordenados con mucho cuidado.' },
      { ...R(86, 28, 31, 55), text: '* Un armario alto con una flor encima.' },
      { ...R(151, 59, 64, 72), text: '* La cama de Toriel está perfectamente arreglada.' },
      { ...R(180, 141, 33, 58), text: '* Un escritorio con papeles y libros.' }
    ]
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
      // Cajonera inferior bajo el fregadero.
      R(59, 82, 31, 15),
      // Encimera y gabinetes centrales.
      R(91, 49, 54, 33),
      // Estufa/horno.
      R(147, 42, 30, 41)
    ],
    exits: [
      { ...R(46, 153, 40, 10), dir: 'down', target: 'livingRoom', spawn: [66, 57], facing: 'down' }
    ],
    interactives: [
      { ...R(20, 23, 39, 60), text: '* El refrigerador está lleno de comida.' },
      { ...R(59, 47, 31, 19), text: '* El fregadero está impecable.' },
      { ...R(91, 49, 54, 33), text: '* La encimera está perfectamente ordenada.' },
      { ...R(147, 42, 30, 41), text: '* El horno todavía conserva un poco de calor.' },
      { ...R(59, 82, 31, 15), text: '* Huele a algo recién horneado.' }
    ]
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

const JOYSTICK_THRESHOLD = 15;
let joystickTouchId = null;

function releaseMobileDirections() {
  keys.ArrowUp = false;
  keys.ArrowDown = false;
  keys.ArrowLeft = false;
  keys.ArrowRight = false;
}

function resetJoystick() {
  joystickTouchId = null;
  releaseMobileDirections();

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
  const maxDistance = Math.max(0, baseRadius - knobRadius - 1);
  const visualDistance = Math.min(distance, maxDistance);

  const knobX = Math.cos(angle) * visualDistance;
  const knobY = Math.sin(angle) * visualDistance;

  joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

  if (gameState !== 'PLAYING' || distance < JOYSTICK_THRESHOLD) {
    releaseMobileDirections();
    return;
  }

  keys.ArrowLeft = dx < -JOYSTICK_THRESHOLD;
  keys.ArrowRight = dx > JOYSTICK_THRESHOLD;
  keys.ArrowUp = dy < -JOYSTICK_THRESHOLD;
  keys.ArrowDown = dy > JOYSTICK_THRESHOLD;
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
  const inset = 1;
  const corners = [
    [hitbox.x + inset, hitbox.y + inset],
    [hitbox.x + hitbox.width - inset, hitbox.y + inset],
    [hitbox.x + inset, hitbox.y + hitbox.height - inset],
    [hitbox.x + hitbox.width - inset, hitbox.y + hitbox.height - inset]
  ];

  return corners.every(([x, y]) => room.walkable.some((area) => pointInsideRect(x, y, area)));
}

function canOccupy(x, y) {
  const room = rooms[currentRoom];
  const hitbox = getPlayerHitbox(x, y);

  if (!hitboxInsideWalkable(hitbox, room)) return false;
  if (room.solids.some((solid) => rectsOverlap(hitbox, solid))) return false;

  return true;
}

function movePlayer(dx, dy) {
  // Ejes separados: Frisk se desliza por paredes y esquinas en vez de quedarse pegado.
  if (dx !== 0) {
    const nextX = player.x + dx;
    if (canOccupy(nextX, player.y)) player.x = nextX;
  }

  if (dy !== 0) {
    const nextY = player.y + dy;
    if (canOccupy(player.x, nextY)) player.y = nextY;
  }
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
    return rectsOverlap(hitbox, candidate);
  });

  if (exit) changeRoom(exit);
}

// ============================================================
// INTERACCIONES
// ============================================================
function interactionProbe() {
  const hitbox = getPlayerHitbox();
  const probe = {
    x: hitbox.x - 8,
    y: hitbox.y - 8,
    width: hitbox.width + 16,
    height: hitbox.height + 16
  };

  const reach = 24;
  if (player.direction === 'up') probe.y -= reach;
  if (player.direction === 'down') probe.y += reach;
  if (player.direction === 'left') probe.x -= reach;
  if (player.direction === 'right') probe.x += reach;

  return probe;
}

function checkInteraction() {
  const probe = interactionProbe();
  const object = rooms[currentRoom].interactives.find((item) => rectsOverlap(probe, item));
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
  introContainer.style.display = 'none';
  gameContainer.style.display = 'block';
  gameState = 'PLAYING';
  currentRoom = 'entrance';
  placePlayerAtFeet(160, 206);
  roomNameLabel.textContent = rooms[currentRoom].label;
  updateCamera();
  requestAnimationFrame(gameLoop);
}

function update() {
  if (gameState !== 'PLAYING') {
    updateCamera();
    return;
  }

  if (transitionGraceFrames > 0) transitionGraceFrames -= 1;

  let dx = 0;
  let dy = 0;

  if (keys.ArrowUp) dy -= player.speed;
  if (keys.ArrowDown) dy += player.speed;
  if (keys.ArrowLeft) dx -= player.speed;
  if (keys.ArrowRight) dx += player.speed;

  player.isMoving = dx !== 0 || dy !== 0;

  if (!player.isMoving) {
    player.frameX = 0;
    updateCamera();
    return;
  }

  if (dx !== 0 && dy !== 0) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }

  // Dirección visual priorizando el eje vertical cuando ambos están pulsados.
  if (dy < 0) {
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

  movePlayer(dx, dy);
  checkRoomExit();

  if (gameFrame % STAGGER_FRAMES === 0) {
    player.frameX = (player.frameX + 1) % 4;
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
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  drawRoom();
  drawPlayer();

  if (debugCollisions) drawDebug();
}

function drawRoom() {
  const room = rooms[currentRoom];
  const roomW = room.nativeWidth * ROOM_SCALE;
  const roomH = room.nativeHeight * ROOM_SCALE;

  if (room.image.complete && room.image.naturalWidth > 0) {
    ctx.drawImage(
      room.image,
      Math.round(-camera.x),
      Math.round(-camera.y),
      roomW,
      roomH
    );
  }
}

function drawPlayer() {
  const screenX = Math.round(player.x - camera.x);
  const screenY = Math.round(player.y - camera.y);

  if (playerSprite.complete && playerSprite.naturalWidth > 0) {
    const sourceWidth = playerSprite.naturalWidth / 4;
    const sourceHeight = playerSprite.naturalHeight / 4;

    ctx.drawImage(
      playerSprite,
      player.frameX * sourceWidth,
      player.frameY * sourceHeight,
      sourceWidth,
      sourceHeight,
      screenX,
      screenY,
      player.width,
      player.height
    );
    return;
  }

  ctx.fillStyle = '#ff4040';
  ctx.fillRect(screenX, screenY, player.width, player.height);
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

function gameLoop() {
  gameFrame += 1;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
