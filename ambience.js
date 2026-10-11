'use strict';

// All placement data uses native room pixels. The renderer rounds the camera
// once, just like the room art, so furniture and flame pixels never swim.
// draw() goes after the room and before Frisk. drawForeground() goes after
// Frisk and takes the player's feet rectangle in WORLD pixels for depth.
// Both accept { scale: 2, reducedMotion: false, enabled: true }.
(function createHouseAmbience(global) {
  const asset = name => {
    const image = new Image();
    image.src = 'assets/props/' + name;
    return image;
  };

  const images = {
    table: asset('living_table.png'),
    chair: asset('reading_chair.png'),
    diningLeft: asset('dining_chair_left.png'),
    diningBack: asset('dining_chair_back.png'),
    diningRight: asset('dining_chair_right.png'),
    fire: asset('fire.png')
  };

  // Back-to-front order. Native sizes and placement match the room reference;
  // the three dining chairs use their own original orientations and sizes.
  // Physics reads each solid directly through propsForRoom(), keeping the
  // painted furniture and the feet collision rectangles in one source.
  const livingProps = Object.freeze([
    Object.freeze({
      id: 'living_chair', image: 'chair', x: 108, y: 51, width: 47, height: 50,
      depthY: 100,
      solid: Object.freeze({ x: 112, y: 79, width: 39, height: 21 })
    }),
    Object.freeze({
      id: 'living_dining_back', image: 'diningBack', x: 99, y: 121, width: 25, height: 23,
      depthY: 144,
      solid: Object.freeze({ x: 100, y: 137, width: 23, height: 7 })
    }),
    Object.freeze({
      id: 'living_dining_left', image: 'diningLeft', x: 51, y: 151, width: 15, height: 25,
      depthY: 176,
      solid: Object.freeze({ x: 51, y: 165, width: 15, height: 11 })
    }),
    Object.freeze({
      id: 'living_dining_right', image: 'diningRight', x: 156, y: 144, width: 17, height: 34,
      depthY: 178,
      solid: Object.freeze({ x: 156, y: 164, width: 17, height: 14 })
    }),
    Object.freeze({
      id: 'living_table', image: 'table', x: 65, y: 145, width: 92, height: 50,
      depthY: 193,
      solid: Object.freeze({ x: 65, y: 163, width: 92, height: 30 })
    })
  ]);

  const propsForRoom = roomId => roomId === 'livingRoom' ? livingProps : empty;

  const candle = (x, y, phase) => Object.freeze({
    x, y, phase, radius: 23, strength: 0.10, candle: true
  });
  const lamp = (x, y, radius) => Object.freeze({
    x, y, radius, strength: 0.075, phase: 0
  });
  const lights = Object.freeze({
    entrance: Object.freeze([candle(227, 30, 0.3)]),
    livingRoom: Object.freeze([
      Object.freeze({ x: 168, y: 65, radius: 47, strength: 0.18, phase: 0.8 })
    ]),
    hallway: Object.freeze([
      candle(115, 34, 0.0), candle(440, 35, 1.2),
      candle(530, 35, 2.8), candle(630, 34, 4.0)
    ]),
    friskRoom: Object.freeze([lamp(172, 45, 24), lamp(33, 137, 23)]),
    torielRoom: Object.freeze([lamp(64, 44, 24), lamp(205, 146, 23)]),
    kitchen: Object.freeze([])
  });

  const bounds = Object.freeze({
    entrance: [320, 240], livingRoom: [320, 240], hallway: [745, 156],
    friskRoom: [239, 234], torielRoom: [227, 234], kitchen: [196, 163]
  });
  const empty = Object.freeze([]);
  const glowCache = new Map();

  function scaleFor(options) {
    return options && Number.isFinite(options.scale) && options.scale > 0
      ? options.scale : 2;
  }

  function glowFor(radius) {
    if (glowCache.has(radius)) return glowCache.get(radius);
    // One native-resolution light texture per radius, never a per-frame
    // gradient. Drawing at an integer scale preserves the source pixel grid.
    const layer = document.createElement('canvas');
    layer.width = radius * 2;
    layer.height = radius * 2;
    const brush = layer.getContext('2d');
    const glow = brush.createRadialGradient(radius, radius, 1, radius, radius, radius);
    glow.addColorStop(0, 'rgba(255, 176, 72, 1)');
    glow.addColorStop(0.28, 'rgba(255, 169, 65, 0.65)');
    glow.addColorStop(0.65, 'rgba(250, 152, 56, 0.20)');
    glow.addColorStop(1, 'rgba(250, 152, 56, 0)');
    brush.fillStyle = glow;
    brush.fillRect(0, 0, layer.width, layer.height);
    glowCache.set(radius, layer);
    return layer;
  }

  function visible(ctx, x, y, width, height) {
    return x + width >= 0 && y + height >= 0 &&
      x < ctx.canvas.width && y < ctx.canvas.height;
  }

  function drawProp(ctx, prop, camera, scale) {
    const source = images[prop.image];
    if (!source.complete || !source.naturalWidth) return;
    const image = source;
    const x = prop.x * scale - Math.round(camera.x);
    const y = prop.y * scale - Math.round(camera.y);
    if (!visible(ctx, x, y, prop.width * scale, prop.height * scale)) return;
    ctx.drawImage(image, x, y, prop.width * scale, prop.height * scale);
  }

  function drawLights(ctx, roomId, camera, seconds, scale, reducedMotion) {
    const roomLights = lights[roomId] || empty;
    const size = bounds[roomId];
    if (!size || !roomLights.length) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-Math.round(camera.x), -Math.round(camera.y), size[0] * scale, size[1] * scale);
    ctx.clip();
    ctx.globalCompositeOperation = 'source-over';
    for (const light of roomLights) {
      const x = (light.x - light.radius) * scale - Math.round(camera.x);
      const y = (light.y - light.radius) * scale - Math.round(camera.y);
      const diameter = light.radius * scale * 2;
      if (!visible(ctx, x, y, diameter, diameter)) continue;
      const breathe = reducedMotion ? 1 :
        0.97 + Math.sin(seconds * 2.3 + light.phase) * 0.02 +
        Math.sin(seconds * 4.7 + light.phase) * 0.01;
      ctx.globalAlpha = light.strength * breathe;
      ctx.drawImage(glowFor(light.radius), x, y, diameter, diameter);
      if (light.candle) {
        // Only the tiny center of the existing candle changes; its outline
        // and holder are always the original room pixels.
        const tall = !reducedMotion && Math.sin(seconds * 5 + light.phase) > 0.45;
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#fff2a5';
        ctx.fillRect(light.x * scale - Math.round(camera.x),
          (light.y - (tall ? 1 : 0)) * scale - Math.round(camera.y), scale, scale);
      }
    }
    ctx.restore();
  }

  function drawFire(ctx, camera, seconds, scale, reducedMotion) {
    if (!images.fire.complete || !images.fire.naturalWidth) return;
    const frame = reducedMotion ? 0 : Math.floor(seconds * 7) % 5;
    ctx.save();
    // The animation stays entirely inside the original black firebox.
    ctx.beginPath();
    ctx.rect(155 * scale - Math.round(camera.x), 54 * scale - Math.round(camera.y),
      27 * scale, 20 * scale);
    ctx.clip();
    ctx.drawImage(images.fire, frame * 20, 0, 20, 16,
      158 * scale - Math.round(camera.x), 57 * scale - Math.round(camera.y),
      20 * scale, 16 * scale);
    ctx.restore();
  }

  function draw(ctx, roomId, camera, elapsedSeconds, options = {}) {
    if (options.enabled === false) return;
    const scale = scaleFor(options);
    const seconds = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1;
    drawLights(ctx, roomId, camera, seconds, scale, !!options.reducedMotion);
    if (roomId === 'livingRoom') {
      drawFire(ctx, camera, seconds, scale, !!options.reducedMotion);
    }
    for (const prop of propsForRoom(roomId)) drawProp(ctx, prop, camera, scale);
    ctx.restore();
  }

  function drawForeground(ctx, roomId, camera, playerFeet, options = {}) {
    if (options.enabled === false || !playerFeet) return;
    const scale = scaleFor(options);
    const feetBottom = playerFeet.y + playerFeet.height;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1;
    for (const prop of propsForRoom(roomId)) {
      if (feetBottom <= prop.depthY * scale) drawProp(ctx, prop, camera, scale);
    }
    ctx.restore();
  }

  global.HouseAmbience = Object.freeze({
    draw, drawForeground,
    propsForRoom,
    lightsForRoom: roomId => lights[roomId] || empty
  });
})(window);
