'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const engine=source('script.js'),engineTests=source('tests/home-engine.test.cjs');
const engineFixture=vm.runInNewContext(engineTests.slice(0,engineTests.indexOf('\nconst mounted='))+'\nfixture;',{
  require,__dirname,console,AbortController,Promise});
function fixture(){
  const f=engineFixture(),c=f.c;c.LumoMind.act('meet');c.HomeProgress.record('lumo_met');
  assert.ok(c.HomeContinuousWing,'The explicit hallway/gallery join must be installed.');
  c.applyRoomChange({target:'hallway',spawn:[730,108],facing:'right'});c.transitionGraceFrames=0;
  c.LumoGame.actor.setAutonomy(false);
  return f;
}
const center=c=>{const feet=c.getPlayerHitbox();return {x:feet.x+feet.width/2,y:feet.y+feet.height/2};};
function common(c){const p=center(c),o=c.HomeContinuousWing.origin(c.currentRoom);return {x:p.x+o.x,y:p.y+o.y};}
function commonCamera(c){const o=c.HomeContinuousWing.origin(c.currentRoom);return {x:c.camera.x+o.x,y:c.camera.y+o.y};}

test('shared corridor collision permits the seam overlap while retaining original room geometry and every neighbor obstacle',()=>{
  const f=fixture(),c=f.c,original=c.rooms.hallway.walkable.map(r=>({...r}));
  c.placePlayerAtFeet(745,108);assert.ok(c.canOccupy(c.player.x,c.player.y),'Feet can span both floor regions at the boundary.');
  c.placePlayerAtFeet(740,70);assert.equal(c.canOccupy(c.player.x,c.player.y),false,'The umbrella/wall still blocks the upper edge.');
  c.placePlayerAtFeet(753,150);assert.equal(c.canOccupy(c.player.x,c.player.y),false,'The shared collision does not admit the black void.');
  c.applyRoomChange({target:'gallery',spawn:[44,152],facing:'left'});
  c.placePlayerAtFeet(-30,153);assert.ok(c.canOccupy(c.player.x,c.player.y),'The previous room remains physical just left of the seam.');
  c.placePlayerAtFeet(-25,105);assert.equal(c.canOccupy(c.player.x,c.player.y),false,'A neighbor obstacle still blocks feet in gallery-local coordinates.');
  assert.equal(JSON.stringify(c.rooms.hallway.walkable),JSON.stringify(original));
});

test('real movement crosses the corridor seam in both directions without a fade, a spawn jump, input reset or camera discontinuity',()=>{
  const f=fixture(),c=f.c;c.placePlayerAtFeet(744,108);c.updateCamera(true);
  const before=common(c),cameraBefore=commonCamera(c),actor=c.LumoGame.actor;
  actor.x=1438;actor.y=216;actor.fade=1;actor.placed=true;
  const buddyBefore={x:actor.x,y:actor.y};c.keys.ArrowRight=true;c.update(1/60);
  assert.equal(c.currentRoom,'gallery');assert.equal(c.gameState,'PLAYING');assert.equal(c.roomTransition.phase,'idle');assert.equal(c.roomTransition.opacity,0);
  assert.deepEqual(common(c),{x:before.x+3,y:before.y});
  assert.equal(c.keys.ArrowRight,true,'Held walking input continues through the seam.');
  assert.ok(Math.abs(commonCamera(c).x-cameraBefore.x)<=3);assert.equal(commonCamera(c).y,cameraBefore.y);
  const o=c.HomeContinuousWing.origin(c.currentRoom);
  assert.deepEqual({x:actor.x+o.x,y:actor.y+o.y},buddyBefore,'The companion stays in the same physical location.');
  assert.equal(actor.fade,1,'No companion fade is introduced at the join.');
  c.keys.ArrowRight=false;c.keys.ArrowLeft=true;const after=common(c);c.update(1/60);
  assert.equal(c.currentRoom,'hallway');assert.equal(c.gameState,'PLAYING');assert.equal(c.roomTransition.phase,'idle');
  assert.deepEqual(common(c),{x:after.x-3,y:after.y});assert.equal(commonCamera(c).y,cameraBefore.y);
  assert.ok(c.canOccupy(c.player.x,c.player.y));assert.equal(f.calls.network,0);
});

test('the connection activates at the actual physical seam and leaves ordinary room transitions unchanged',()=>{
  const f=fixture(),c=f.c;c.placePlayerAtFeet(735,108);c.facePlayer('right');
  assert.equal(c.checkRoomExit(),false,'An old doorway trigger cannot teleport the player early.');
  c.applyRoomChange({target:'gallery',spawn:[66,138],facing:'up'});c.transitionGraceFrames=0;
  const bath=c.rooms.gallery.exits.find(e=>e.target==='bathroom');c.changeRoom(bath);
  assert.equal(c.gameState,'TRANSITION');assert.equal(c.roomTransition.phase,'out');
  c.updateRoomTransition(.5);assert.equal(c.currentRoom,'bathroom');assert.equal(c.gameState,'PLAYING');
  assert.ok(c.canOccupy(c.player.x,c.player.y));
});

test('diagonal walking classifies the physical side correctly and movement along the exact boundary never loops between IDs',()=>{
  const f=fixture(),c=f.c;c.placePlayerAtFeet(744,108);c.facePlayer('up');
  c.keys.ArrowRight=true;c.keys.ArrowUp=true;c.update(1/60);
  assert.equal(c.currentRoom,'gallery');assert.equal(c.player.direction,'up');assert.equal(c.gameState,'PLAYING');
  c.keys.ArrowRight=false;c.placePlayerAtFeet(0,153);
  for(let i=0;i<3;i++)c.update(1/60);
  assert.equal(c.currentRoom,'gallery');assert.equal(c.roomTransition.phase,'idle');
});

test('the real companion follows through the shared corridor seam without a teleport, fade or collision during later frames',()=>{
  const f=fixture(),c=f.c,actor=c.LumoGame.actor;c.placePlayerAtFeet(735,108);c.updateCamera(true);
  actor.x=1426;actor.y=216;actor.fade=1;actor.placed=true;actor.setFollowing(true);c.keys.ArrowRight=true;
  let previous={x:actor.x,y:actor.y};
  for(let frame=0;frame<100;frame++){
    c.update(1/60);c.LumoGame.tick(1/60);
    const o=c.HomeContinuousWing.origin(c.currentRoom),point={x:actor.x+o.x,y:actor.y+o.y};
    assert.ok(Math.hypot(point.x-previous.x,point.y-previous.y)<8,'The companion moves smoothly in common coordinates.');
    assert.ok(actor.canStand(actor.x,actor.y));assert.equal(actor.fade,1);
    assert.equal(c.gameState,'PLAYING');assert.equal(c.roomTransition.phase,'idle');previous=point;
  }
  assert.equal(c.currentRoom,'gallery');assert.ok(actor.x>0,'Lumo physically reaches the new leg instead of staying behind the seam.');
});

test('both native backgrounds are painted together with one common camera and each remains clipped to its own room',()=>{
  const f=fixture(),c=f.c,layers=[],images=[],clips=[];
  c.ctx={save(){},restore(){},beginPath(){},rect(...args){clips.push(args);},clip(){},clearRect(){},translate(){},scale(){},
    fillRect(){},fillText(){},drawImage(...args){images.push(args);}};
  c.MIRROR_GLASS=c.R(649,38,45,18);
  c.rooms.hallway.image={complete:true,naturalWidth:745,naturalHeight:156};
  const render=c.rooms.gallery.render;c.rooms.gallery.render=(ctx,view)=>{layers.push({id:'gallery',view:{...view}});render(ctx,view);};
  vm.runInContext(engine.slice(engine.indexOf('function drawRoom()'),engine.indexOf('function drawGamingPC()')),f.context);
  c.placePlayerAtFeet(744,108);c.updateCamera(true);c.drawRoom();
  assert.equal(layers.length,1);const previousCamera=commonCamera(c);
  assert.deepEqual(layers[0].view,{x:previousCamera.x-1490,y:previousCamera.y+90});
  assert.ok(images.some(args=>args[0]===c.rooms.hallway.image&&args.length===5));
  assert.equal(clips.length,2,'Both room rectangles are clipped so wall strokes cannot cover the neighboring floor.');
  c.keys.ArrowRight=true;c.update(1/60);layers.length=0;images.length=0;clips.length=0;c.drawRoom();
  assert.equal(c.currentRoom,'gallery');assert.equal(layers.length,1);
  assert.ok(images.some(args=>args[0]===c.rooms.hallway.image&&args.length===5),'The corridor remains visible after changing the saved room ID.');
  assert.equal(clips.length,2);
});
