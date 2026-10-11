(function (global) {
  'use strict';

  const EMOTION_ANIMATION = Object.freeze({ NORMAL: 'idle', HAPPY: 'float', PLAYFUL: 'mock',
    ANNOYED: 'angry', SLEEPY: 'sleep', CURIOUS: 'observe', SCARED: 'scared',
    CONFUSED: 'confused', SAD: 'sad', SUPPORTIVE: 'support' });
  const ANIMATION_ALIASES = Object.freeze({ floating: 'float', following: 'follow',
    laughing: 'laugh', mocking: 'mock', sleeping: 'sleep', surprised: 'surprise',
    scared: 'scared', celebrating: 'celebrate', petting: 'pet', eating: 'eat',
    hiding: 'hide', thinking: 'think', supportive: 'support', happy: 'celebrate' });
  const EMOTION_ALIASES = Object.freeze({ neutral: 'NORMAL', normal: 'NORMAL', happy: 'HAPPY',
    playful: 'PLAYFUL', mocking: 'PLAYFUL', annoyed: 'ANNOYED', angry: 'ANNOYED',
    sleepy: 'SLEEPY', curious: 'CURIOUS', scared: 'SCARED', confused: 'CONFUSED',
    sad: 'SAD', supportive: 'SUPPORTIVE', shy: 'HAPPY', surprised: 'CURIOUS' });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const overlaps = (a, b) => a && b && a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;

  // The heap keeps path planning bounded even in the long HOME corridor.
  class MinHeap {
    constructor() { this.items = []; }
    push(item) {
      const list = this.items;
      list.push(item);
      let index = list.length - 1;
      while (index > 0) {
        const parent = (index - 1) >> 1;
        if (list[parent].priority <= item.priority) break;
        list[index] = list[parent]; index = parent;
      }
      list[index] = item;
    }
    pop() {
      const list = this.items, first = list[0], last = list.pop();
      if (list.length) {
        let index = 0;
        while (index * 2 + 1 < list.length) {
          let child = index * 2 + 1;
          if (child + 1 < list.length && list[child + 1].priority < list[child].priority) child++;
          if (list[child].priority >= last.priority) break;
          list[index] = list[child]; index = child;
        }
        list[index] = last;
      }
      return first;
    }
    get length() { return this.items.length; }
  }

  class LumoActor {
    constructor({ mind, adapter } = {}) {
      if (!adapter || typeof adapter.getContext !== 'function' || typeof adapter.canStand !== 'function') {
        throw new TypeError('LumoActor necesita getContext y canStand del mundo.');
      }
      this.mind = mind;
      this.adapter = adapter;
      this.assets = global.LUMO_ASSETS || { animations: {}, directions: {} };
      this.images = new Map();
      this.samples = new Map();
      this.x = 0; this.y = 0; this.roomId = null;
      this.emotion = 'NORMAL'; this.direction = 'down';
      this.animation = 'idle'; this.forcedAnimation = null; this.forcedRemaining = 0;
      this.elapsed = 0; this.animationElapsed = 0; this.idleElapsed = 0;
      this.moving = false; this.followingOverride = null;
      this.path = []; this.trail = []; this.lastPlayer = null;
      this.planElapsed = 1; this.lastGoal = null; this.stuckElapsed = 0;
      this.fade = 1; this.fadePhase = 'in'; this.pendingPlacement = null;
      this.hiding = false; this.hideTarget = null;
      this.diagnostics = { plans: 0, recoveries: 0 };
      Object.values(this.assets.sources || {}).forEach(src => this.loadImage(src));
      this.onRoomChange(adapter.getContext());
    }

    loadImage(src) {
      if (this.images.has(src)) return this.images.get(src);
      if (typeof global.Image !== 'function') return null;
      const image = new global.Image();
      image.src = src;
      this.images.set(src, image);
      return image;
    }

    playerPoint(context) {
      const feet = context && context.feet;
      if (feet && Number.isFinite(feet.x) && Number.isFinite(feet.y)) {
        return { x: feet.x + (feet.width || 0) / 2, y: feet.y + (feet.height || 0) / 2 };
      }
      const player = context && context.player || {};
      return { x: (player.x || 0) + (player.width || 48) / 2,
        y: (player.y || 0) + (player.height || 68) - 9 };
    }

    canStand(x, y) {
      return Number.isFinite(x) && Number.isFinite(y) && !!this.adapter.canStand(x, y, this.roomId);
    }

    lineClear(from, to) {
      const count = Math.max(1, Math.ceil(distance(from, to) / 3));
      for (let index = 0; index <= count; index++) {
        const t = index / count;
        if (!this.canStand(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t)) return false;
      }
      return true;
    }

    safeNear(point, radius = 96, anchor = null) {
      if (this.canStand(point.x, point.y) && (!anchor || this.lineClear(anchor, point))) return { ...point };
      for (let r = 8; r <= radius; r += 8) {
        const count = Math.max(12, Math.ceil(r * Math.PI / 6));
        for (let i = 0; i < count; i++) {
          const candidate = { x: point.x + Math.cos(i * Math.PI * 2 / count) * r,
            y: point.y + Math.sin(i * Math.PI * 2 / count) * r };
          if (this.canStand(candidate.x, candidate.y) && (!anchor || this.lineClear(anchor, candidate))) return candidate;
        }
      }
      return null;
    }

    companionSpot(context) {
      const player = this.playerPoint(context);
      const direction = context.player && context.player.direction || 'down';
      const behind = { down: [34, -36], up: [-34, 36], left: [42, -20], right: [-42, -20] }[direction] || [34, -36];
      const candidate = this.safeNear({ x: player.x + behind[0], y: player.y + behind[1] }, 80, player);
      return candidate || this.safeNear(player, 96) || player;
    }

    onRoomChange(context = this.adapter.getContext()) {
      if (!context) return;
      this.context = context;
      this.roomId = context.roomId;
      const position = this.companionSpot(context);
      this.x = position.x; this.y = position.y;
      this.path = []; this.trail = [this.playerPoint(context)];
      this.lastPlayer = this.playerPoint(context);
      this.lastGoal = null; this.planElapsed = 1; this.stuckElapsed = 0;
      this.hiding = false; this.hideTarget = null; this.pendingPlacement = null;
      this.fade = context.reducedMotion ? 1 : 0;
      this.fadePhase = 'in'; this.moving = false;
    }

    setFollowing(enabled) { this.followingOverride = !!enabled; }

    shouldFollow() {
      if (this.followingOverride !== null) return this.followingOverride;
      const state = this.mind && (typeof this.mind.getState === 'function' ? this.mind.getState() : this.mind.state);
      return !state || state.met === undefined || !!state.met;
    }

    setEmotion(value) {
      const input = String(value || 'NORMAL');
      const emotion = EMOTION_ANIMATION[input.toUpperCase()] ? input.toUpperCase() : EMOTION_ALIASES[input.toLowerCase()];
      if (emotion) this.emotion = emotion;
      return this.emotion;
    }

    perform(value, duration = 2.4) {
      const input = String(value || '').toLowerCase();
      const animation = ANIMATION_ALIASES[input] || input;
      if (!this.assets.animations[animation]) return false;
      this.forcedAnimation = animation;
      this.forcedRemaining = Math.max(0.2, Math.min(15, Number(duration) || 2.4));
      this.animationElapsed = 0;
      return true;
    }

    react(response = {}) {
      if (response.emotion) this.setEmotion(response.emotion);
      if (response.animation) this.perform(response.animation, response.duration);
    }

    beginHide({ x, y, roomId = this.roomId } = {}) {
      if (roomId !== this.roomId || !Number.isFinite(x) || !Number.isFinite(y)) return false;
      const target = this.safeNear({ x, y }, 40);
      if (!target) return false;
      this.hiding = true; this.hideTarget = target;
      this.path = []; this.lastGoal = null;
      this.setEmotion('PLAYFUL');
      // The game instruction covers this short fade; Lumo does not cross a wall.
      this.pendingPlacement = target;
      this.fadePhase = 'out';
      return true;
    }

    endHide() {
      this.hiding = false; this.hideTarget = null;
      this.path = []; this.planElapsed = 1; this.lastGoal = null;
      this.perform('celebrate', 1.8);
    }

    followGoal(player) {
      const wantedDistance = this.emotion === 'SCARED' ? 34 : this.emotion === 'SAD' ? 66 : 52;
      if (this.trail.length < 2) return this.companionSpot(this.context);
      let remaining = wantedDistance;
      for (let index = this.trail.length - 1; index > 0; index--) {
        const next = this.trail[index], previous = this.trail[index - 1], segment = distance(next, previous);
        if (segment >= remaining) {
          const t = remaining / Math.max(0.001, segment);
          const point = { x: next.x + (previous.x - next.x) * t, y: next.y + (previous.y - next.y) * t };
          return this.canStand(point.x, point.y) ? point : previous;
        }
        remaining -= segment;
      }
      return this.trail[0] || player;
    }

    planRoute(goal) {
      this.diagnostics.plans++;
      const start = { x: this.x, y: this.y };
      if (this.lineClear(start, goal)) return [{ ...goal }];
      const size = 8;
      const gridNear = point => {
        const center = { x: Math.round(point.x / size), y: Math.round(point.y / size) };
        for (let radius = 0; radius <= 3; radius++) {
          for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
            const cell = { x: center.x + dx, y: center.y + dy };
            const actual = { x: cell.x * size, y: cell.y * size };
            if (this.canStand(actual.x, actual.y) && this.lineClear(point, actual)) return cell;
          }
        }
        return null;
      };
      const origin = gridNear(start), destination = gridNear(goal);
      if (!origin || !destination) return [];
      const key = (x, y) => `${x},${y}`;
      const passableCache = new Map();
      const passable = (x, y) => {
        const id = key(x, y);
        if (!passableCache.has(id)) passableCache.set(id, this.canStand(x * size, y * size));
        return passableCache.get(id);
      };
      const heap = new MinHeap(), costs = new Map(), previous = new Map(), closed = new Set();
      const originId = key(origin.x, origin.y), destinationId = key(destination.x, destination.y);
      costs.set(originId, 0);
      heap.push({ ...origin, id: originId, priority: distance(origin, destination) });
      let reached = null;
      for (let iterations = 0; heap.length && iterations < 9000; iterations++) {
        const cell = heap.pop();
        if (closed.has(cell.id)) continue;
        if (cell.id === destinationId) { reached = cell; break; }
        closed.add(cell.id);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          const x = cell.x + dx, y = cell.y + dy, id = key(x, y);
          if (closed.has(id) || !passable(x, y)) continue;
          if (dx && dy && (!passable(cell.x + dx, cell.y) || !passable(cell.x, cell.y + dy))) continue;
          if (!this.lineClear({ x: cell.x * size, y: cell.y * size }, { x: x * size, y: y * size })) continue;
          const cost = costs.get(cell.id) + (dx && dy ? Math.SQRT2 : 1);
          if (cost >= (costs.get(id) ?? Infinity)) continue;
          costs.set(id, cost); previous.set(id, cell.id);
          heap.push({ x, y, id, priority: cost + Math.hypot(destination.x - x, destination.y - y) });
        }
      }
      if (!reached) return [];
      const points = [{ ...goal }];
      let id = reached.id;
      while (id) {
        const [x, y] = id.split(',').map(Number);
        points.push({ x: x * size, y: y * size });
        id = previous.get(id);
      }
      points.reverse();
      // Visible movement uses only validated line segments; diagonal corners stay solid.
      const simplified = [];
      let anchor = start, index = 0;
      while (index < points.length) {
        let next = index;
        while (next + 1 < points.length && this.lineClear(anchor, points[next + 1])) next++;
        simplified.push(points[next]); anchor = points[next]; index = next + 1;
      }
      return simplified;
    }

    recoverNearPlayer() {
      const candidate = this.companionSpot(this.context);
      if (!this.canStand(candidate.x, candidate.y)) return;
      this.pendingPlacement = candidate; this.fadePhase = 'out';
      // A stale save or changed room geometry can invalidate the old point.
      // Hide it immediately; only valid floor points may ever be rendered.
      if (!this.canStand(this.x, this.y)) {
        this.x = candidate.x; this.y = candidate.y;
        this.fade = 0; this.pendingPlacement = null; this.fadePhase = 'in';
      }
      this.stuckElapsed = 0; this.path = []; this.lastGoal = null;
      this.diagnostics.recoveries++;
    }

    advanceFade(dt) {
      const speed = this.context.reducedMotion ? 100 : 1 / 0.16;
      if (this.fadePhase === 'out') {
        this.fade = Math.max(0, this.fade - dt * speed);
        if (this.fade === 0) {
          if (this.pendingPlacement && this.canStand(this.pendingPlacement.x, this.pendingPlacement.y)) {
            this.x = this.pendingPlacement.x; this.y = this.pendingPlacement.y;
          }
          this.pendingPlacement = null; this.fadePhase = 'in';
        }
      } else this.fade = Math.min(1, this.fade + dt * speed);
    }

    update(dt) {
      const context = this.adapter.getContext();
      if (!context) return;
      if (context.roomId !== this.roomId) this.onRoomChange(context);
      this.context = context;
      const elapsed = Math.max(0, Math.min(1, Number(dt) || 0));
      let remaining = elapsed;
      while (remaining > 0.000001) {
        const step = Math.min(1 / 60, remaining);
        this.step(step); remaining -= step;
      }
    }

    step(dt) {
      this.elapsed += dt; this.animationElapsed += dt;
      this.advanceFade(dt);
      const player = this.playerPoint(this.context);
      const playerTravel = this.lastPlayer ? distance(player, this.lastPlayer) : 0;
      if (playerTravel > 1) this.idleElapsed = 0;
      else this.idleElapsed += dt;
      this.lastPlayer = player;
      const last = this.trail[this.trail.length - 1];
      if (!last || distance(player, last) >= 6) {
        this.trail.push({ ...player });
        if (this.trail.length > 180) this.trail.shift();
      }
      if (this.forcedRemaining > 0) this.forcedRemaining = Math.max(0, this.forcedRemaining - dt);
      if (this.forcedRemaining === 0) this.forcedAnimation = null;
      this.moving = false;
      const paused = ['INTRO', 'VIDEO', 'PAUSED'].includes(this.context.state) || this.context.paused;
      if (!paused && this.shouldFollow() && !this.hiding && this.fadePhase !== 'out') {
        const goal = this.followGoal(player);
        const gap = distance({ x: this.x, y: this.y }, goal);
        this.planElapsed += dt;
        if (gap > 7 && (this.path.length === 0 || this.planElapsed >= 0.35 &&
            (!this.lastGoal || distance(goal, this.lastGoal) > 16))) {
          this.path = this.planRoute(goal); this.lastGoal = { ...goal }; this.planElapsed = 0;
        }
        while (this.path.length && distance(this.path[0], this) < 3) this.path.shift();
        const target = this.path[0];
        if (target && gap > 5) {
          const dx = target.x - this.x, dy = target.y - this.y, length = Math.hypot(dx, dy);
          const moodSpeed = this.emotion === 'SAD' || this.emotion === 'SLEEPY' ? 0.72 : 1;
          const speed = Math.min(250, 130 + Math.max(0, distance(this, player) - 56) * 1.2) * moodSpeed;
          const amount = Math.min(length, speed * dt);
          const next = { x: this.x + dx / Math.max(0.001, length) * amount,
            y: this.y + dy / Math.max(0.001, length) * amount };
          if (this.lineClear(this, next)) {
            this.x = next.x; this.y = next.y; this.moving = amount > 0.02;
            if (Math.abs(dx) > Math.abs(dy) * 1.2) this.direction = dx < 0 ? 'left' : 'right';
            else this.direction = dy < 0 ? 'up' : 'down';
          } else { this.path = []; this.planElapsed = 1; }
        }
        if (!this.moving && gap > 50) this.stuckElapsed += dt;
        else this.stuckElapsed = 0;
        if (this.stuckElapsed > 2.5 || !this.canStand(this.x, this.y)) this.recoverNearPlayer();
      }
      let animation = this.forcedAnimation || (this.hiding ? 'hide' : null);
      if (!animation) {
        if (this.moving) animation = this.emotion === 'SCARED' ? 'scared' : 'follow';
        else if (this.idleElapsed > 45 && ['NORMAL', 'HAPPY'].includes(this.emotion)) animation = 'sleep';
        else animation = EMOTION_ANIMATION[this.emotion] || 'idle';
      }
      if (animation !== this.animation) { this.animation = animation; this.animationElapsed = 0; }
    }

    frameForDrawing() {
      const assets = this.assets;
      const directional = this.animation === 'follow' || this.animation === 'float';
      const descriptor = directional && assets.directions[this.direction] || assets.animations[this.animation] || assets.animations.idle;
      if (!descriptor || !descriptor.frames.length) return null;
      const index = Math.floor(this.animationElapsed * descriptor.fps) % descriptor.frames.length;
      return descriptor.frames[index];
    }

    sampleFor(frame) {
      if (this.samples.has(frame.id)) return this.samples.get(frame.id);
      const image = this.loadImage(frame.sheet);
      if (!image || !image.complete || !image.naturalWidth || !global.document) return null;
      const canvas = global.document.createElement('canvas');
      canvas.width = 18; canvas.height = 24;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const rect = frame.rect;
      // Sample the intact source; pixel-grid rendering creates no replacement artwork.
      const scale = Math.min(16 / rect.width, 22 / rect.height);
      const width = Math.max(1, Math.round(rect.width * scale));
      const height = Math.max(1, Math.round(rect.height * scale));
      ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height,
        Math.floor((18 - width) / 2), 23 - height, width, height);
      this.samples.set(frame.id, canvas);
      return canvas;
    }

    draw(ctx, camera = { x: 0, y: 0 }) {
      const frame = this.frameForDrawing();
      const sample = frame && this.sampleFor(frame);
      if (!sample || this.fade <= 0) return;
      const reduced = this.context && this.context.reducedMotion;
      const sleep = this.animation === 'sleep';
      const bob = reduced ? 0 : Math.round(Math.sin(this.elapsed * (sleep ? 1.3 : 3.4)) * (sleep ? 1 : 2));
      const x = Math.round(this.x - camera.x), y = Math.round(this.y - camera.y);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha *= this.fade;
      ctx.fillStyle = 'rgba(31, 22, 46, 0.24)';
      ctx.beginPath(); ctx.ellipse(x, y, sleep ? 10 : 9, 3, 0, 0, Math.PI * 2); ctx.fill();
      if (!reduced && ['laugh', 'mock'].includes(this.animation)) {
        ctx.translate(x, y - 26 + bob);
        ctx.rotate(Math.sin(this.animationElapsed * 12) * 0.07);
        ctx.drawImage(sample, -18, -26, 36, 48);
      } else ctx.drawImage(sample, x - 18, y - 52 + bob, 36, 48);
      ctx.restore();
    }

    getInteraction(probe, feet) {
      const rectangle = { x: this.x - 12, y: this.y - 10, width: 24, height: 16,
        id: 'lumo', action: 'lumo', label: this.hiding ? 'Encontrar a Lumo' : 'Lumo' };
      // Examining follows Mira's direction. Lumo's floating body and proximity
      // must not steal the object she is looking at; taps use the visual bounds.
      return overlaps(probe, rectangle) ? rectangle : null;
    }

    getState() {
      return { x: this.x, y: this.y, roomId: this.roomId, emotion: this.emotion,
        animation: this.animation, direction: this.direction, moving: this.moving,
        hiding: this.hiding, fade: this.fade, following: this.shouldFollow(),
        idleSeconds: this.idleElapsed, diagnostics: { ...this.diagnostics } };
    }
  }

  global.LumoActor = LumoActor;
})(window);
