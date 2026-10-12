(function (global) {
  'use strict';

  const EMOTION_ANIMATION = Object.freeze({ NORMAL: 'idle', HAPPY: 'float', PLAYFUL: 'mock',
    ANNOYED: 'angry', SLEEPY: 'sleep', CURIOUS: 'observe', SCARED: 'scared',
    CONFUSED: 'confused', SAD: 'sad', SUPPORTIVE: 'support', MOCKING: 'mock', ANGRY: 'angry', SHY: 'shy' });
  const ANIMATION_ALIASES = Object.freeze({ floating: 'float', following: 'follow',
    laughing: 'laugh', mocking: 'mock', sleeping: 'sleep', surprised: 'surprise',
    scared: 'scared', celebrating: 'celebrate', petting: 'pet', eating: 'eat',
    hiding: 'hide', thinking: 'think', supportive: 'support', happy: 'celebrate',
    call: 'surprise', turn: 'observe', hurry: 'follow', brake: 'float', tired: 'angry' });
  const EMOTION_ALIASES = Object.freeze({ neutral: 'NORMAL', normal: 'NORMAL', happy: 'HAPPY',
    playful: 'PLAYFUL', mocking: 'PLAYFUL', annoyed: 'ANNOYED', angry: 'ANNOYED',
    sleepy: 'SLEEPY', curious: 'CURIOUS', scared: 'SCARED', confused: 'CONFUSED',
    sad: 'SAD', supportive: 'SUPPORTIVE', shy: 'HAPPY', surprised: 'CURIOUS' });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const overlaps = (a, b) => a && b && a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;
  const BEHAVIOR_ANIMATION = Object.freeze({ photo: 'observe', pc: 'observe', window: 'observe',
    perch: 'idle', hum: 'celebrate', sleep: 'sleep', cower: 'hide', freeze: 'scared', observe: 'observe' });
  const clamp = (number, min, max) => Math.max(min, Math.min(max, number));

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
      this.placed = false; this.velocity = { x:0, y:0 };
      this.task = null; this.lastCall = -100; this.taskCounter = 0;
      // Phase 7 is opt-in. Phase 4 can ship recall without enabling the agenda.
      this.autonomyEnabled = false; this.interests = []; this.behaviorCursor = 0;
      this.behaviorElapsed = 0; this.behaviorWait = 18; this.behaviorCooldowns = new Map();
      this.diagnostics = { plans: 0, recoveries: 0, failedPlans: 0 };
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

    awayFromDoor(point) {
      return !(this.context?.room?.exits || []).some(exit => overlaps(
        { x:point.x-12, y:point.y-10, width:24, height:20 }, exit));
    }

    safeNear(point, radius = 96, anchor = null, options = {}) {
      const player = this.playerPoint(this.context);
      const valid = candidate => this.canStand(candidate.x, candidate.y) &&
        (!anchor || this.lineClear(anchor, candidate)) &&
        (!options.minDistance || distance(candidate, player) >= options.minDistance) &&
        (!options.avoidDoors || this.awayFromDoor(candidate));
      if (valid(point)) return { ...point };
      for (let r = 8; r <= radius; r += 8) {
        const count = Math.max(12, Math.ceil(r * Math.PI / 6));
        for (let i = 0; i < count; i++) {
          const candidate = { x: point.x + Math.cos(i * Math.PI * 2 / count) * r,
            y: point.y + Math.sin(i * Math.PI * 2 / count) * r };
          if (valid(candidate)) return candidate;
        }
      }
      return null;
    }

    companionSpot(context, minDistance = 32) {
      const player = this.playerPoint(context);
      const direction = context.player && context.player.direction || 'down';
      const behind = { down: [34, -36], up: [-34, 36], left: [42, -20], right: [-42, -20] }[direction] || [34, -36];
      const options = { minDistance, avoidDoors:true };
      const candidate = this.safeNear({ x: player.x + behind[0], y: player.y + behind[1] }, 80, player, options);
      return candidate || this.safeNear(player, 96, player, options);
    }

    onRoomChange(context = this.adapter.getContext()) {
      if (!context) return;
      this.context = context;
      this.roomId = context.roomId;
      const position = this.companionSpot(context);
      this.placed = !!position;
      if (position) { this.x = position.x; this.y = position.y; }
      this.path = []; this.trail = [this.playerPoint(context)];
      this.lastPlayer = this.playerPoint(context);
      this.lastGoal = null; this.planElapsed = 1; this.stuckElapsed = 0;
      this.hiding = false; this.hideTarget = null; this.pendingPlacement = null;
      this.task = null; this.velocity = {x:0,y:0}; this.behaviorElapsed = 0;
      this.fade = this.placed && context.reducedMotion ? 1 : 0;
      this.fadePhase = 'in'; this.moving = false;
    }

    setFollowing(enabled) { this.followingOverride = !!enabled; }

    isPaused() {
      return !!this.context?.paused || ['INTRO', 'VIDEO', 'PAUSED', 'DIALOG', 'BOOK', 'TRANSITION',
        'LUMO', 'LUMO_GAME', 'PC'].includes(this.context?.state);
    }

    emitEvent(event) {
      if (typeof this.adapter.onActorEvent === 'function') {
        this.adapter.onActorEvent({ ...event, roomId:this.roomId, x:this.x, y:this.y });
      }
    }

    faceToward(point) {
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
      const dx = point.x-this.x, dy = point.y-this.y;
      if (Math.hypot(dx,dy) < 1) return true;
      this.direction = Math.abs(dx)>Math.abs(dy)*1.15 ? (dx<0?'left':'right') : (dy<0?'up':'down');
      return true;
    }

    cancelTask(reason = 'cancelled') {
      if (this.task) this.emitEvent({type:'behavior-end',kind:this.task.kind,id:this.task.id,reason});
      this.task = null; this.path = []; this.lastGoal = null; this.planElapsed = 0.35;
      this.velocity = {x:0,y:0}; this.behaviorElapsed = 0;
    }

    call({hurry=true} = {}) {
      const context = this.adapter.getContext();
      if (!context) return {accepted:false,reason:'no-context'};
      if (context.roomId!==this.roomId) this.onRoomChange(context);
      this.context=context;
      if (this.isPaused() || this.hiding) return {accepted:false,reason:this.hiding?'hiding':'busy'};
      if (this.elapsed-this.lastCall<0.7) return {accepted:false,reason:'cooldown'};
      const point=this.companionSpot(context,36);
      if (!point) return {accepted:false,reason:'no-safe-spot'};
      this.lastCall=this.elapsed; this.cancelTask('called'); this.faceToward(this.playerPoint(context));
      const nearby=this.placed && distance(this,this.playerPoint(context))<=62;
      this.task={id:`call-${++this.taskCounter}`,kind:'recall',priority:80,phase:nearby?'settle':'react',
        remaining:nearby?0.5:0.24,target:point,hurry:!!hurry,animation:nearby?'mock':'surprise'};
      this.animationElapsed=0;
      return {accepted:true,nearby,id:this.task.id};
    }

    goTo(point, {kind='observe', duration=6, lookAt=null, priority=20, id=null} = {}) {
      if (!point || point.roomId && point.roomId!==this.roomId || !this.placed || this.hiding ||
          !Number.isFinite(point.x) || !Number.isFinite(point.y) || !this.canStand(point.x,point.y) ||
          !this.awayFromDoor(point) || !Object.hasOwn(BEHAVIOR_ANIMATION,kind)) return false;
      if (this.task && this.task.priority>priority) return false;
      this.cancelTask('replaced');
      this.task={id:String(id || `behavior-${++this.taskCounter}`).slice(0,64),kind,priority:clamp(priority,0,80),
        phase:'approach',target:{x:point.x,y:point.y},duration:clamp(Number(duration)||6,0.4,15),
        lookAt:lookAt && Number.isFinite(lookAt.x) && Number.isFinite(lookAt.y)?{...lookAt}:null,
        animation:BEHAVIOR_ANIMATION[kind],remaining:0,hurry:false};
      return true;
    }

    setInterests(points) {
      this.interests=(Array.isArray(points)?points:[]).filter(point => point && Object.hasOwn(BEHAVIOR_ANIMATION,point.kind)
        && Number.isFinite(point.x) && Number.isFinite(point.y)).slice(0,24).map(point=>({...point}));
    }

    setAutonomy(enabled) {
      this.autonomyEnabled=!!enabled; this.behaviorElapsed=0;
      if (!this.autonomyEnabled && this.task?.priority<70) this.cancelTask('autonomy-disabled');
    }

    scheduleBehavior(dt) {
      if (!this.autonomyEnabled || this.task || this.hiding || !this.shouldFollow() || this.context.serious ||
          this.idleElapsed<6 || distance(this,this.playerPoint(this.context))>120) return;
      this.behaviorElapsed+=dt;
      if (this.behaviorElapsed<this.behaviorWait) return;
      this.behaviorElapsed=0;
      const supplied=typeof this.adapter.getBehaviorPoints==='function'?this.adapter.getBehaviorPoints(this.context):this.interests;
      const candidates=(Array.isArray(supplied)?supplied:[]).slice(0,24).filter(point =>
        point && (!point.roomId || point.roomId===this.roomId) && Object.hasOwn(BEHAVIOR_ANIMATION,point.kind) &&
        Number.isFinite(point.x) && Number.isFinite(point.y) && this.canStand(point.x,point.y) && this.awayFromDoor(point) &&
        distance(point,this.playerPoint(this.context))<=150 &&
        this.elapsed-(this.behaviorCooldowns.get(point.id)||-1000)>=90);
      this.behaviorWait=18+(this.behaviorCursor%4)*7;
      if (!candidates.length) return;
      const point=candidates[this.behaviorCursor++%candidates.length];
      if (this.goTo(point,{kind:point.kind,id:point.id,duration:point.duration,lookAt:point.lookAt,priority:20})) {
        this.behaviorCooldowns.set(point.id,this.elapsed);
      }
    }

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
      this.cancelTask('hide');
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
      if (!candidate) { this.placed=false; this.fade=0; return; }
      if (!this.canStand(candidate.x, candidate.y)) return;
      this.placed=true;
      this.pendingPlacement = candidate; this.fadePhase = 'out';
      // A stale save or changed room geometry can invalidate the old point.
      // Hide it immediately; only valid floor points may ever be rendered.
      if (!this.canStand(this.x, this.y)) {
        this.x = candidate.x; this.y = candidate.y;
        this.fade = 0; this.pendingPlacement = null; this.fadePhase = 'in';
      }
      this.stuckElapsed = 0; this.path = []; this.lastGoal = null;
      this.velocity={x:0,y:0};
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
      } else this.fade = this.placed ? Math.min(1, this.fade + dt * speed) : 0;
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

    moveToGoal(goal, dt, hurry=false) {
      if (!goal) return false;
      const gap=distance(this,goal);
      this.planElapsed+=dt;
      // A failed route gets the same retry limit as a successful route.
      if (gap>5 && this.planElapsed>=0.35 && (!this.path.length || !this.lastGoal || distance(goal,this.lastGoal)>16)) {
        this.path=this.planRoute(goal); this.lastGoal={...goal}; this.planElapsed=0;
        if (!this.path.length) this.diagnostics.failedPlans++;
      }
      while (this.path.length && distance(this.path[0],this)<3) this.path.shift();
      const target=this.path[0];
      if (target && gap>4) {
        const dx=target.x-this.x,dy=target.y-this.y,length=Math.hypot(dx,dy);
        const moodSpeed=['SAD','SLEEPY'].includes(this.emotion)?0.72:1;
        const cruise=Math.min(hurry?280:245,130+Math.max(0,distance(this,this.playerPoint(this.context))-56)*1.2)*moodSpeed;
        const desired=Math.min(cruise,length*8,Math.sqrt(800*length));
        const blend=1-Math.exp(-dt/0.10);
        this.velocity.x+=(dx/Math.max(0.001,length)*desired-this.velocity.x)*blend;
        this.velocity.y+=(dy/Math.max(0.001,length)*desired-this.velocity.y)*blend;
        const speed=Math.hypot(this.velocity.x,this.velocity.y),amount=Math.min(length,speed*dt);
        let next={x:this.x+this.velocity.x/Math.max(0.001,speed)*amount,y:this.y+this.velocity.y/Math.max(0.001,speed)*amount};
        // At a sharp corner, discard lateral momentum before touching a wall.
        if (!this.lineClear(this,next)) {
          next={x:this.x+dx/Math.max(0.001,length)*amount,y:this.y+dy/Math.max(0.001,length)*amount};
          this.velocity={x:dx/Math.max(0.001,length)*speed,y:dy/Math.max(0.001,length)*speed};
        }
        if (this.lineClear(this,next)) {
          this.x=next.x;this.y=next.y;this.moving=amount>0.02;
          if (this.moving) this.faceToward(target);
        } else { this.path=[];this.velocity={x:0,y:0}; }
      } else this.velocity={x:0,y:0};
      if (!this.moving && gap>50) this.stuckElapsed+=dt;
      else this.stuckElapsed=0;
      if (this.stuckElapsed>2.5 || !this.canStand(this.x,this.y)) {
        if (this.task && this.task.priority<70) this.cancelTask('unreachable');
        this.recoverNearPlayer();
      }
      return gap<=5;
    }

    updateTask(dt) {
      const task=this.task;
      if (!task) return null;
      if (task.kind==='recall') {
        if (task.phase==='react') {
          this.faceToward(this.playerPoint(this.context));task.remaining-=dt;
          if (task.remaining<=0) task.phase='approach';
          return 'surprise';
        }
        if (task.phase==='approach') {
          const point=this.companionSpot(this.context,36);
          if (!point) { this.cancelTask('no-safe-spot');return null; }
          task.target=point;
          if (this.moveToGoal(task.target,dt,task.hurry)) {
            task.phase='settle';task.remaining=0.5;task.animation='angry';
            this.faceToward(this.playerPoint(this.context));
          }
          return this.moving?'follow':'float';
        }
        task.remaining-=dt;this.faceToward(this.playerPoint(this.context));
        if (task.remaining<=0) {
          this.emitEvent({type:'call-arrived',id:task.id,kind:'recall'});
          this.task=null;this.path=[];this.lastGoal=null;this.behaviorElapsed=0;
        }
        return task.animation;
      }
      if (task.phase==='approach') {
        if (this.moveToGoal(task.target,dt)) {
          task.phase='dwell';task.remaining=task.duration;
          if (task.lookAt) this.faceToward(task.lookAt);
          this.emitEvent({type:'behavior-start',kind:task.kind,id:task.id});
        }
        return this.moving?'follow':task.animation;
      }
      if (task.lookAt) this.faceToward(task.lookAt);
      task.remaining-=dt;
      if (task.remaining<=0) this.cancelTask('completed');
      return task.animation;
    }

    step(dt) {
      this.elapsed += dt; this.animationElapsed += dt;
      this.advanceFade(dt);
      const player = this.playerPoint(this.context);
      const playerTravel = this.lastPlayer ? distance(player, this.lastPlayer) : 0;
      const paused=this.isPaused();
      if (!paused) {
        if (playerTravel>1 || this.context.player?.isMoving) {this.idleElapsed=0;this.behaviorElapsed=0;}
        else this.idleElapsed+=dt;
      }
      this.lastPlayer = player;
      const last = this.trail[this.trail.length - 1];
      if (!last || distance(player, last) >= 6) {
        this.trail.push({ ...player });
        if (this.trail.length > 180) this.trail.shift();
      }
      if (this.forcedRemaining > 0) this.forcedRemaining = Math.max(0, this.forcedRemaining - dt);
      if (this.forcedRemaining === 0) this.forcedAnimation = null;
      this.moving = false;
      if (!this.placed) {
        if (!paused) {this.planElapsed+=dt;if(this.planElapsed>=0.35){this.planElapsed=0;this.recoverNearPlayer();}}
        return;
      }
      let taskAnimation=null;
      if (!paused && !this.hiding && this.fadePhase!=='out') {
        if (this.task && this.task.priority<70 && (playerTravel>1 || this.context.player?.isMoving || this.context.serious)) {
          this.cancelTask(this.context.serious?'serious':'player-moving');
        }
        this.scheduleBehavior(dt);
        if (this.task) taskAnimation=this.updateTask(dt);
        else if (this.shouldFollow()) this.moveToGoal(this.followGoal(player),dt);
      }
      let animation = taskAnimation || this.forcedAnimation || (this.hiding ? 'hide' : null);
      if (!animation) {
        if (this.moving) animation = this.emotion === 'SCARED' ? 'scared' : 'follow';
        else if (this.idleElapsed > 45 && ['NORMAL', 'HAPPY'].includes(this.emotion)) animation = 'sleep';
        else animation = EMOTION_ANIMATION[this.emotion] || 'idle';
      }
      if (animation !== this.animation) { this.animation = animation; this.animationElapsed = 0; }
    }

    frameForDrawing() {
      const assets = this.assets;
      const directional = ['follow','float','idle'].includes(this.animation);
      const descriptor = directional && assets.directions[this.direction] || assets.animations[this.animation] || assets.animations.idle;
      if (!descriptor || !descriptor.frames.length) return null;
      const fps=this.task?.kind==='recall' && this.moving?Math.min(12,descriptor.fps*1.25):descriptor.fps;
      const index = Math.floor(this.animationElapsed * fps) % descriptor.frames.length;
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
      if (!sample || !this.placed || this.fade <= 0) return;
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
        const wiggle=Math.round(Math.sin(this.animationElapsed*12))*2;
        ctx.drawImage(sample,x-18+wiggle,y-52+bob,36,48);
      } else ctx.drawImage(sample, x - 18, y - 52 + bob, 36, 48);
      ctx.restore();
    }

    getInteraction(probe, feet) {
      if (!this.placed || this.fade<0.5) return null;
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
        placed:this.placed,calling:this.task?.kind==='recall',mode:this.task?.kind || (this.hiding?'hide':'follow'),
        taskPhase:this.task?.phase || null, speed:Math.hypot(this.velocity.x,this.velocity.y),
        idleSeconds: this.idleElapsed, diagnostics: { ...this.diagnostics } };
    }
  }

  global.LumoActor = LumoActor;
})(window);
