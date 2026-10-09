/*
 * BasementMaze is a classic-script, Canvas-only level. All public rectangles
 * use WORLD coordinates (2x native art); spawnNative uses native coordinates.
 * Floor and walls are derived from the same 25-native-pixel occupancy grid.
 * The small loop rejoins its own corridor; it never skips a main descent.
 */
const BasementMaze = (() => {
  'use strict';

  const SCALE = 2;
  const PALETTE = {
    floor: ['#5a456b', '#5c476d', '#574267', '#5e496f'],
    joints: '#493655', floorHighlight: '#725681', cracks: '#3d2c49',
    wall: '#2d2236', mortar: '#43314f', wallShadow: '#241a2e',
    wallSide: '#3a2b46', edge: '#21182a', lip: '#493455', lipHighlight: '#6d517c'
  };
  const NATIVE_CELL = 25;
  const CELL = NATIVE_CELL * SCALE;
  const COLS = 60;
  const ROWS = 50;
  const nativeWidth = COLS * NATIVE_CELL;
  const nativeHeight = ROWS * NATIVE_CELL;
  const floor = Array.from({ length: ROWS }, () => new Uint8Array(COLS));
  const rect = (x, y, width, height) => ({
    x: x * SCALE, y: y * SCALE,
    width: width * SCALE, height: height * SCALE
  });

  // Inclusive grid endpoints. Three-cell-wide passages leave ample clearance.
  // Horizontal lanes have two or more sealed rows between them.
  const routes = [
    [1, 4, 50, 6], [48, 4, 50, 18],
    [6, 16, 50, 18], [6, 16, 8, 30],
    [6, 28, 50, 30], [48, 28, 50, 42],
    [24, 40, 50, 42], [24, 40, 26, 47],
    [24, 45, 57, 47], [52, 43, 58, 48],

    // A true circuit attached only to the first lane.
    [10, 6, 12, 11], [18, 6, 20, 11], [10, 9, 20, 11],
    // T-shaped dead-end, then isolated L-shaped and straight alcoves.
    [30, 6, 32, 11], [26, 9, 36, 11],
    [39, 12, 41, 16],
    [25, 18, 27, 24], [25, 22, 32, 24],
    [36, 25, 38, 28],
    [16, 30, 18, 35], [12, 33, 18, 35],
    [31, 36, 33, 40]
  ];
  for (const [x0, y0, x1, y1] of routes) {
    for (let row = y0; row <= y1; row++) {
      for (let col = x0; col <= x1; col++) floor[row][col] = 1;
    }
  }

  // Closed door occupies the top two rows of the final chamber. It is removed
  // from the FLOOR itself, so walkable and solids remain an exact partition.
  for (let row = 43; row <= 44; row++) {
    for (let col = 54; col <= 56; col++) floor[row][col] = 0;
  }
  const door = { ...rect(1350, 1075, 75, 50), frontY: 2250 };

  // Fuse identical horizontal runs vertically. This yields disjoint, exact
  // rectangles without allowing corner-only containment to bridge a gap.
  function mergeCells(value) {
    const result = [];
    let active = new Map();
    for (let row = 0; row < ROWS; row++) {
      const next = new Map();
      let col = 0;
      while (col < COLS) {
        if (floor[row][col] !== value) { col++; continue; }
        const start = col;
        while (col < COLS && floor[row][col] === value) col++;
        const key = start + ':' + col;
        const previous = active.get(key);
        if (previous) {
          previous.height += CELL;
          next.set(key, previous);
        } else {
          const region = {
            x: start * CELL, y: row * CELL,
            width: (col - start) * CELL, height: CELL
          };
          result.push(region);
          next.set(key, region);
        }
      }
      active = next;
    }
    return result;
  }

  const walkable = mergeCells(1);
  const solids = mergeCells(0);
  const paths = routes.map(([x0, y0, x1, y1]) => ({
    x: x0 * CELL, y: y0 * CELL,
    width: (x1 - x0 + 1) * CELL, height: (y1 - y0 + 1) * CELL
  }));
  const spawnNative = [58, 137.5];
  const exits = [{
    ...rect(25, 100, 14, 75), dir: 'left', target: 'entrance',
    spawn: [100, 94], facing: 'left'
  }];
  const interactives = [
    { ...rect(1348, 1067, 79, 63), text: '* Una inmensa puerta bloquea el camino.' },
    { ...rect(260, 291, 50, 12), text: '* Una grieta atraviesa la pared.\n* Al otro lado, alguien cuenta los días.\n* Siempre vuelve a empezar.' },
    { ...rect(640, 243, 14, 40), text: '* La piedra está tibia.\n* Como si recordara una mano que ya no está.' },
    { ...rect(914, 249, 14, 35), text: '* Una inscripción casi borrada: «No todos los caminos quieren llevarte a casa».' },
    { ...rect(991, 291, 45, 14), text: '* Hay una pequeña grieta en el techo.\n* No entra luz.\n* Aun así, esperas un momento.' },
    { ...rect(814, 568, 14, 38), text: '* Una voz parece decir tu nombre.\n* Es el viento.\n* El viento conoce demasiadas cosas.' },
    { ...rect(915, 616, 45, 14), text: '* Una marca de tiza promete una salida.\n* Debajo hay otras siete promesas.' },
    { ...rect(291, 842, 14, 40), text: '* La pared termina aquí.\n* Tus pasos tardan un poco más en aceptarlo.' },
    { ...rect(790, 891, 45, 14), text: '* Una grieta huele a pastel.\n* Por un instante, el sótano parece menos profundo.' },
    { ...rect(1464, 1144, 14, 50), text: '* La piedra junto a la puerta tiene una cicatriz antigua.\n* Algunas heridas aprenden a parecer paredes.' },

    // Hitboxes invisibles próximas al remate de cada callejón. Son datos
    // editables, no sólidos ni decoración; no modifican el trazado del mapa.
    { id: 'forgotten-1', ...rect(650, 275, 12, 24), text: '* Una bufanda pequeña, doblada con cuidado.\n* Aún conserva un tenue olor a canela.' },
    { id: 'forgotten-2', ...rect(913, 275, 12, 24), text: '* Un dibujo de una casa con ventanas amarillas.\n* En una esquina dice: «Para cuando quieras volver».' },
    { id: 'forgotten-3', ...rect(1010, 300, 35, 8), text: '* Un botón amarillo descansa entre dos piedras.\n* Parece un sol que cabe en el bolsillo.' },
    { id: 'forgotten-4', ...rect(813, 580, 12, 36), text: '* Hay una carta sin sobre.\n* Solo dice: «Guardé una porción para ti».' },
    { id: 'forgotten-5', ...rect(945, 625, 25, 8), text: '* Una canica azul refleja la luz de la lámpara.\n* Por un instante, parece contener todo un cielo.' },
    { id: 'forgotten-6', ...rect(300, 853, 12, 36), text: '* Una cinta roja marca la página de un cuento.\n* El final espera pacientemente a su lectora.' },
    { id: 'forgotten-7', ...rect(805, 900, 35, 8), text: '* Una tarjeta lleva el nombre de Damaris.\n* Debajo, con letra cuidadosa: «Aquí siempre habrá un lugar para ti».' }
  ];

  const lamps = [
    [230, 100], [560, 100], [1035, 100],
    [1170, 400], [820, 400], [305, 400],
    [390, 700], [765, 700], [1160, 700],
    [1115, 1000], [895, 1000], [725, 1000],
    [805, 1125], [1115, 1125]
  ].map(([x, y]) => ({ x: x * SCALE, y: y * SCALE }));
  // Emisores de luz compartidos con script.js, en el centro visible de la llama.
  const lights = lamps.map(lamp => ({ x: lamp.x, y: lamp.y - 20, radius: 180 }));

  function isFloor(col, row) {
    return row >= 0 && row < ROWS && col >= 0 && col < COLS && floor[row][col] === 1;
  }

  // Integer hash keeps wear marks stable across frames and cameras.
  function hash(col, row) {
    return ((col * 73856093) ^ (row * 19349663)) >>> 0;
  }

  function drawFloorTile(ctx, col, row) {
    const x = col * CELL;
    const y = row * CELL;
    const seed = hash(col, row);
    ctx.fillStyle = PALETTE.floor[seed % PALETTE.floor.length];
    ctx.fillRect(x, y, CELL, CELL);
    ctx.fillStyle = PALETTE.joints;
    ctx.fillRect(x, y, CELL, 2);
    ctx.fillRect(x, y + 24, CELL, 2);
    const joint = (row % 2 ? 30 : 12);
    ctx.fillRect(x + joint, y + 2, 2, 22);
    ctx.fillRect(x + (joint + 24) % 48, y + 26, 2, 22);
    ctx.fillStyle = PALETTE.floorHighlight;
    ctx.fillRect(x + 4, y + 4, 12 + seed % 14, 2);
    if (seed % 7 === 0) {
      ctx.fillStyle = PALETTE.cracks;
      ctx.fillRect(x + 12, y + 31, 12, 2);
      ctx.fillRect(x + 22, y + 33, 2, 6);
    }
  }

  function drawWallEdge(ctx, col, row) {
    const x = col * CELL;
    const y = row * CELL;
    if (!isFloor(col, row - 1)) {
      // Recessed wall faces stand above the same boundary used by collisions.
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(x, y - 38, CELL, 38);
      ctx.fillStyle = PALETTE.mortar;
      ctx.fillRect(x, y - 36, CELL, 2);
      ctx.fillRect(x, y - 20, CELL, 2);
      ctx.fillRect(x + ((row + col) % 2 ? 12 : 34), y - 34, 2, 14);
      ctx.fillRect(x + ((row + col) % 2 ? 34 : 12), y - 18, 2, 12);
      ctx.fillStyle = PALETTE.wallShadow;
      ctx.fillRect(x, y - 6, CELL, 6);
      ctx.fillStyle = 'rgba(20, 15, 35, 0.2)';
      ctx.fillRect(x, y, CELL, 10);
    }
    if (!isFloor(col - 1, row)) {
      ctx.fillStyle = PALETTE.wallSide;
      ctx.fillRect(x - 8, y, 8, CELL);
      ctx.fillStyle = PALETTE.edge;
      ctx.fillRect(x, y, 4, CELL);
    }
    if (!isFloor(col + 1, row)) {
      ctx.fillStyle = PALETTE.wallSide;
      ctx.fillRect(x + CELL, y, 8, CELL);
      ctx.fillStyle = PALETTE.edge;
      ctx.fillRect(x + CELL - 4, y, 4, CELL);
    }
    if (!isFloor(col, row + 1)) {
      // The player's sprite extends three world pixels below its feet collider.
      // An eight-pixel stone lip preserves a visible surface under those pixels.
      ctx.fillStyle = PALETTE.lip;
      ctx.fillRect(x, y + CELL, CELL, 8);
      ctx.fillStyle = PALETTE.lipHighlight;
      ctx.fillRect(x, y + CELL, CELL, 2);
      ctx.fillStyle = PALETTE.wallShadow;
      ctx.fillRect(x, y + CELL + 8, CELL, 12);
    }
  }

  function visible(x, y, width, height, camera, viewW, viewH, margin = 0) {
    return x + width >= camera.x - margin && x <= camera.x + viewW + margin &&
      y + height >= camera.y - margin && y <= camera.y + viewH + margin;
  }

  function drawLamp(ctx, lamp) {
    const x = lamp.x;
    const y = lamp.y;
    const glow = ctx.createRadialGradient(x, y + 8, 2, x, y + 8, 150);
    glow.addColorStop(0, 'rgba(255, 188, 95, .15)');
    glow.addColorStop(1, 'rgba(255, 188, 95, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 150, y - 142, 300, 300);
    ctx.fillStyle = '#100f14';
    ctx.fillRect(x - 8, y - 30, 16, 24);
    ctx.fillStyle = '#957047';
    ctx.fillRect(x - 6, y - 29, 12, 2);
    ctx.fillRect(x - 6, y - 9, 12, 2);
    ctx.fillStyle = '#e7b768';
    ctx.fillRect(x - 4, y - 25, 8, 13);
    ctx.fillStyle = '#fff0b6';
    ctx.fillRect(x - 2, y - 23, 4, 7);
  }

  function drawEntrance(ctx) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(12, 188, 40, 166);
    ctx.fillStyle = '#0c0c12';
    ctx.fillRect(16, 202, 34, 144);
    ctx.fillStyle = PALETTE.wallSide;
    ctx.fillRect(44, 200, 6, 150);
    ctx.fillRect(12, 196, 38, 6);
    ctx.fillRect(12, 344, 38, 6);
    ctx.fillStyle = PALETTE.floorHighlight;
    for (let i = 0; i < 4; i++) ctx.fillRect(18 + i * 6, 208 + i * 9, 5, 122 - i * 18);
    // Exit marker belongs to the room art and remains inside its real trigger.
    ctx.fillStyle = '#b3a086';
    ctx.fillRect(66, 263, 14, 2);
    ctx.fillRect(64, 261, 4, 6);
    ctx.fillRect(62, 263, 2, 2);
  }

  function drawDoor(ctx) {
    const x = door.x;
    const y = door.y - 64;
    const w = door.width;
    const h = door.height + 64;
    ctx.fillStyle = '#17151b';
    ctx.fillRect(x - 18, y + 24, w + 36, h - 18);
    ctx.fillStyle = '#655340';
    ctx.fillRect(x - 12, y + 26, 10, h - 20);
    ctx.fillRect(x + w + 2, y + 26, 10, h - 20);
    ctx.fillRect(x - 2, y + 14, w + 4, 14);
    ctx.fillRect(x + 12, y + 6, w - 24, 10);
    ctx.fillRect(x + 26, y, w - 52, 8);
    ctx.fillStyle = '#9a7a4c';
    ctx.fillRect(x - 10, y + 28, 2, h - 24);
    ctx.fillRect(x + w + 4, y + 28, 2, h - 24);
    ctx.fillRect(x + 14, y + 8, w - 28, 2);
    ctx.fillStyle = '#29232c';
    ctx.fillRect(x, y + 28, w, h - 28);
    ctx.fillStyle = '#3c2f36';
    ctx.fillRect(x + 5, y + 31, w / 2 - 9, h - 35);
    ctx.fillRect(x + w / 2 + 4, y + 31, w / 2 - 9, h - 35);
    ctx.fillStyle = '#1d1923';
    ctx.fillRect(x + w / 2 - 2, y + 26, 4, h - 26);
    ctx.strokeStyle = '#775a3f';
    ctx.lineWidth = 2;
    for (let leaf = 0; leaf < 2; leaf++) {
      const lx = x + 12 + leaf * w / 2;
      ctx.strokeRect(lx, y + 46, w / 2 - 24, 43);
      ctx.strokeRect(lx, y + 103, w / 2 - 24, 43);
    }
    // Brass crest and two heavy rings; fixed art has no random frame flicker.
    ctx.fillStyle = '#aa8651';
    ctx.fillRect(x + w / 2 - 18, y + 37, 36, 4);
    ctx.fillRect(x + w / 2 - 12, y + 33, 24, 12);
    ctx.fillRect(x + w / 2 - 4, y + 27, 8, 22);
    for (const offset of [-13, 13]) {
      ctx.strokeStyle = '#ba975a';
      ctx.strokeRect(x + w / 2 + offset - 4, y + 91, 8, 10);
    }
    ctx.fillStyle = '#91744d';
    ctx.fillRect(x - 14, door.frontY, w + 28, 4);
    ctx.fillStyle = '#382a28';
    ctx.fillRect(x - 14, door.frontY + 4, w + 28, 5);
  }

  function draw(ctx, camera, viewW, viewH) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
    const left = Math.max(0, Math.floor(camera.x / CELL) - 1);
    const right = Math.min(COLS - 1, Math.ceil((camera.x + viewW) / CELL) + 1);
    const top = Math.max(0, Math.floor(camera.y / CELL) - 1);
    const bottom = Math.min(ROWS - 1, Math.ceil((camera.y + viewH) / CELL) + 1);
    // First all floor tiles, then boundary faces: no tile overwrites a neighbor's wall.
    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (isFloor(col, row)) drawFloorTile(ctx, col, row);
      }
    }
    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (isFloor(col, row)) drawWallEdge(ctx, col, row);
      }
    }
    for (const lamp of lamps) {
      if (visible(lamp.x, lamp.y, 1, 1, camera, viewW, viewH, 160)) drawLamp(ctx, lamp);
    }
    if (visible(0, 188, 85, 170, camera, viewW, viewH)) drawEntrance(ctx);
    if (visible(door.x - 18, door.y - 64, door.width + 36, door.height + 75,
      camera, viewW, viewH)) drawDoor(ctx);
    ctx.restore();
  }

  return {
    nativeWidth, nativeHeight, walkable, solids, exits, interactives,
    spawnNative, door, paths, draw, lights,
    geometry: { cellSize: CELL, columns: COLS, rows: ROWS, floor, isFloor }
  };
})();
