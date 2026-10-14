'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),source=name=>fs.readFileSync(path.join(root,name),'utf8');
const engineTests=source('tests/home-engine.test.cjs'),renderTests=source('tests/home-object-render.test.cjs');
const engineFixture=vm.runInNewContext(engineTests.slice(0,engineTests.indexOf('\nconst mounted='))+'\nfixture;',{require,__dirname,console,AbortController,Promise});
const renderHelpers=vm.runInNewContext(renderTests.slice(0,renderTests.indexOf("\ntest('"))+'\n({png,fixture});',{require,__dirname,console,Uint8ClampedArray,Buffer});

function fixture(quiet=false,denyRead=false){
  const f=engineFixture({'fnf-save':'original score','mkw:pc:v1':'original desktop'}),c=f.c,engine=source('script.js'),image=renderHelpers.png('kitchen.png');
  let now=0,draws=[];
  c.HouseExperience.reducedMotion=quiet;
  c.HomeObjectsState=require('../home-objects.js').create({storage:f.storage,progress:c.HomeProgress,now:()=>now,reducedMotion:()=>c.HouseExperience.reducedMotion});
  c.HomeRoomDetails.install({objects:c.HomeObjectsState,progress:c.HomeProgress});
  c.HomeObjectRender=renderHelpers.fixture({deny:denyRead}).art;
  if(denyRead)c.location.href='file:///experimental/index.html';
  // Load the real probe, room descriptions, draw and animation loop. Unrelated
  // ambience/actor layers are inert; the moving original front is rendered.
  // The shared engine fixture already loads the real lore and object probes.
  // Loading the same top-level const twice would invalidate this browser realm.
  c.rooms.kitchen.image=image;c.rooms.kitchen.interactives=c.houseInteractives('kitchen');
  c.HouseAmbience={draw(){},drawForeground(){}};
  c.playerSprite={complete:false,naturalWidth:0};c.debugCollisions=false;c.gameFrame=0;
  c.ctx={save(){},restore(){},translate(){},scale(){},fillRect(){},drawImage(...args){draws.push(args);}};
  vm.runInContext(engine.slice(engine.indexOf('function drawRoomTransition('),engine.indexOf('function checkRoomExit(')),f.context);
  vm.runInContext(engine.slice(engine.indexOf('function worldToScreen('),engine.indexOf('HouseExperience.boot(')),f.context);
  c.applyRoomChange({target:'kitchen',spawn:[39,95],facing:'up'});c.gameState='PLAYING';
  assert.equal(c.findInteraction()?.id,'kitchen_fridge');
  return {...f,frame(time){now=time;draws=[];c.gameLoop(time);return draws.filter(args=>args[0]!==image&&args[0]?.width===29&&args[0]?.height===45);}};
}

test('the real fridge probe opens and closes the original full front across visible frames while native dialogue stays open',()=>{
  const f=fixture(),c=f.c;c.checkInteraction();
  assert.equal(c.gameState,'DIALOG');assert.match(f.calls.native.at(-1),/Abres el refrigerador/);
  const frames=[];
  for(const time of [80,160,240,320,400,480]){
    const drawn=f.frame(time);assert.equal(c.gameState,'DIALOG');assert.equal(drawn.length,1,'The open dialogue does not freeze the world');
    assert.deepEqual(drawn[0].slice(1),[25,39]);frames.push(drawn[0][0]);
  }
  assert.ok(new Set(frames.map(frame=>crypto.createHash('sha256').update(frame.data).digest('hex'))).size>=5,'Actual original-pixel poses change throughout the swing');
  assert.equal(c.HomeObjectsState.visual('kitchen_fridge').phase,1);
  c.closeInteraction();c.checkInteraction();assert.equal(c.gameState,'DIALOG');assert.match(f.calls.native.at(-1),/Cierras el refrigerador/);
  assert.equal(f.frame(720).length,1);assert.equal(c.HomeObjectsState.visual('kitchen_fridge').phase,.5);
  assert.equal(f.frame(960).length,0,'Closed furniture uses only the unchanged original room image');
  assert.equal(c.HomeObjectsState.visual('kitchen_fridge').phase,0);assert.equal(c.gameState,'DIALOG');
  assert.equal(f.values.get('fnf-save'),'original score');assert.equal(f.values.get('mkw:pc:v1'),'original desktop');
  assert.equal(c.HomeProgress.has('home_complete'),false);assert.equal(c.HomeProgress.canEnter('basementHallway'),false);
});

test('quiet effects still display the actual open fridge and restore its original closed front during dialogue',()=>{
  const f=fixture(true),c=f.c;c.checkInteraction();
  assert.equal(c.gameState,'DIALOG');assert.equal(c.HomeObjectsState.visual('kitchen_fridge').phase,1);
  assert.equal(f.frame(0).length,1);
  c.closeInteraction();c.checkInteraction();assert.equal(c.gameState,'DIALOG');
  assert.equal(c.HomeObjectsState.visual('kitchen_fridge').phase,0);assert.equal(f.frame(80).length,0);
});

test('file-origin SecurityError during pixel sampling cannot hide the fridge swing or its final open front',()=>{
  const f=fixture(false,true),c=f.c;c.checkInteraction();
  const frames=[];
  for(const time of [80,160,240,320,400,480]){
    const drawn=f.frame(time);assert.equal(drawn.length,1);assert.equal(c.gameState,'DIALOG');frames.push(drawn[0][0]);
  }
  assert.ok(new Set(frames.map(frame=>crypto.createHash('sha256').update(frame.data).digest('hex'))).size>=5);
  assert.equal(c.HomeObjectsState.visual('kitchen_fridge').phase,1);
  const expected=fixture();expected.c.checkInteraction();const final=expected.frame(480)[0][0];
  assert.deepEqual(frames.at(-1).data,final.data,'The filesystem fallback displays exactly the same full original front');
});
