'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/lumo/manifest.json'), 'utf8'));
const realm = { window: { LUMO_ASSETS: manifest } };
vm.runInNewContext(fs.readFileSync(path.join(root, 'lumo-actor.js'), 'utf8'), realm);
const LumoActor = realm.window.LumoActor;

function makeWorld(stand = (x, y) => x >= 12 && y >= 12 && x <= 628 && y <= 468) {
  const context = { roomId: 'home-test', room: { nativeWidth: 320, nativeHeight: 240 },
    feet: { x: 90, y: 194, width: 20, height: 12 },
    player: { x: 76, y: 141, width: 48, height: 68, direction: 'right', isMoving: false },
    state: 'PLAYING', reducedMotion: false };
  const adapter = { getContext: () => context, canStand: (x, y, roomId) => roomId === context.roomId && stand(x, y) };
  const actor = new LumoActor({ mind: { getState: () => ({ met: true }) }, adapter });
  return { context, actor, stand, adapter };
}

function advance(world, seconds, fps = 60, move) {
  for (let frame = 0; frame < Math.round(seconds * fps); frame++) {
    if (move) move((frame + 1) / fps, world.context);
    world.actor.update(1 / fps);
    assert(world.stand(world.actor.x, world.actor.y), 'Every visible and faded actor placement remains on walkable floor.');
  }
}

// A continuous wall forces a route through a real gap. Validate every pixel
// segment instead of only asserting the final position.
const barrier = makeWorld((x, y) => x >= 12 && y >= 12 && x <= 628 && y <= 468 &&
  !(x >= 230 && x <= 270 && y < 330));
barrier.actor.x = 190; barrier.actor.y = 200;
const route = barrier.actor.planRoute({ x: 350, y: 200 });
assert(route.length >= 2, 'A wall requires more than a direct segment.');
let previous = { x: 190, y: 200 };
for (const point of route) {
  assert(barrier.actor.lineClear(previous, point), 'Path does not cut a wall or its corner.');
  previous = point;
}
assert(route.some(point => point.y >= 330), 'Path travels through the wall gap.');

// Move Mira around a furniture obstacle with a right-angle route; the follower
// must remain on floor and catch up without using recovery teleportation.
const furniture = makeWorld((x, y) => x >= 12 && y >= 12 && x <= 628 && y <= 468 &&
  !(x >= 220 && x <= 300 && y >= 140 && y <= 280));
advance(furniture, 6, 60, (time, context) => {
  let x = 100, y = 200;
  if (time < 1) y = 200 + time * 140;
  else if (time < 3) { x = 100 + (time - 1) * 150; y = 340; }
  else if (time < 4) { x = 400; y = 340 - (time - 3) * 140; }
  else { x = 400; y = 200; }
  context.feet.x = x - 10; context.feet.y = y - 6;
});
assert(Math.hypot(furniture.actor.x - 400, furniture.actor.y - 200) < 85, 'Follower catches up around furniture.');
assert.equal(furniture.actor.diagnostics.recoveries, 0, 'Ordinary following does not need recovery.');

// Same continuous walk sampled at 30/60/120Hz yields the same friendly distance.
const finals = [30, 60, 120].map(fps => {
  const world = makeWorld();
  advance(world, 3, fps, (time, context) => { context.feet.x = 90 + time * 120; });
  return world.actor.getState();
});
assert(Math.max(...finals.map(value => value.x)) - Math.min(...finals.map(value => value.x)) < 8,
  'Follow distance remains stable across frame rates.');
for (const value of finals) assert(Math.hypot(value.x - 460, value.y - 200) > 30, 'Lumo leaves personal space.');

const hide = makeWorld();
assert.equal(hide.actor.beginHide({ x: 420, y: 350, roomId: 'wrong-room' }), false);
assert(hide.actor.beginHide({ x: 420, y: 350, roomId: 'home-test' }));
advance(hide, 0.7);
assert(hide.actor.hiding && Math.hypot(hide.actor.x - 420, hide.actor.y - 350) < 1);
assert(hide.actor.getInteraction({ x: 403, y: 331, width: 35, height: 35 }, { x: 400, y: 340, width: 20, height: 12 }));
hide.actor.endHide();
assert.equal(hide.actor.hiding, false);
hide.context.roomId = 'another-home-room';
hide.context.feet.x = 290; hide.context.feet.y = 94;
hide.actor.update(1 / 60);
assert.equal(hide.actor.getState().roomId, 'another-home-room');
assert.equal(hide.actor.trail.length, 1, 'Changing rooms discards old world positions.');

// A companion immediately behind Mira must not take the examine action from
// a drawing ahead, even when the floating body overlaps her visual silhouette.
const examining = makeWorld();
advance(examining, 0.2); // Place the actor as the real game does before allowing interaction.
examining.actor.x = 100; examining.actor.y = 225;
const miraFeet = { x:90, y:194, width:20, height:12 };
const lookingUp = { x:84, y:158, width:32, height:42 };
const lookingDown = { x:84, y:200, width:32, height:42 };
assert.equal(examining.actor.getInteraction(lookingUp, miraFeet), null,
  'Facing away from nearby Lumo leaves examine available to the object ahead.');
assert.equal(examining.actor.getInteraction(lookingDown, miraFeet)?.id, 'lumo',
  'Facing into the same nearby companion selects Lumo normally.');
examining.actor.y = 180;
assert.equal(examining.actor.getInteraction(lookingUp, miraFeet)?.id, 'lumo',
  'Lumo in front remains directly examinable.');

const recovery = makeWorld();
recovery.actor.x = 800; recovery.actor.y = 800;
advance(recovery, 0.7);
assert.equal(recovery.actor.diagnostics.recoveries, 1, 'Invalid positions recover with a fade.');

const idle = makeWorld();
idle.actor.setFollowing(false);
advance(idle, 46);
assert.equal(idle.actor.animation, 'sleep');
idle.actor.react({ emotion: 'ANNOYED', animation: 'angry' });
advance(idle, 0.2);
assert.equal(idle.actor.emotion, 'ANNOYED');
assert.equal(idle.actor.animation, 'angry');
assert.equal(idle.actor.perform('run-arbitrary-command'), false);

for (const name of ['idle', 'float', 'follow', 'sleep', 'laugh', 'mock', 'angry', 'scared',
  'surprise', 'confused', 'shy', 'sad', 'celebrate', 'pet', 'eat', 'hide', 'observe', 'think', 'support']) {
  const animation = manifest.animations[name];
  assert(animation && animation.frames.length >= 2, `${name} has real sprite frames.`);
  for (const frame of animation.frames) {
    assert(fs.existsSync(path.join(root, frame.sheet)), `${frame.sheet} is packaged locally.`);
    assert(frame.rect.width > 0 && frame.rect.height > 0);
  }
}
for (const emotion of ['NORMAL', 'HAPPY', 'PLAYFUL', 'ANNOYED', 'SLEEPY', 'CURIOUS', 'SCARED', 'CONFUSED', 'SAD', 'SUPPORTIVE']) {
  assert(manifest.portraits.emotions[emotion]);
}
console.log('PASS: furniture following, wall-gap route, 30/60/120Hz stability, safe recovery, room reset, hide/find, idle sleep, validated actions, 19 animations and 15 portraits.');
