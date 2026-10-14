'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createProgress,KEY,SCHEMA_VERSION,LAYOUT_VERSION,LAYOUT_SAFE_POSITIONS}=require('../home-progress.js');
function fixture(raw){
  const values=new Map([[KEY,JSON.stringify(raw)],['fnf-save','original score'],['mkw:pc:v1','original desktop'],
    ['mkw:lumo:world:v1','saved gifts/drawing/inventory'],['mkw:lumo:v2','saved friendship/memory'],['mkw:ryon:v2','independent memories']]);
  const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  return {values,progress:createProgress(storage)};
}
const old=room=>({version:2,layoutVersion:1,position:{room,x:190,y:205,direction:'right'},
  events:['lumo_met','pc_found','photo_window','photo_music','photo_lumo','memory_collection','piano_played','home_melody_found','flower_watered'],
  visits:['hallway','gallery','gardenHall',room],interactions:{home_piano:8,garden_flower:3},recipe:'crispy'});
const position=(room,feet)=>({room,x:feet[0]*2-24,y:feet[1]*2-59,direction:'up'});

test('reorganizing the wing bumps only geometry metadata and relocates the three changed rooms to their clear arrival points',()=>{
  assert.equal(SCHEMA_VERSION,2);assert.equal(LAYOUT_VERSION,2);
  for(const [room,feet]of [['bathroom',[120,168]],['readingRoom',[40,130]],['garden',[192,230]]]){
    const raw=old(room),f=fixture(raw),before=new Map(f.values),state=f.progress.getState();
    assert.deepEqual(state.position,position(room,feet));assert.equal(state.layoutVersion,2);
    assert.deepEqual(state.events,raw.events);assert.deepEqual(state.interactions,raw.interactions);
    assert.ok(state.visits.includes('gardenHall'));assert.equal(state.recipe,'crispy');assert.equal(state.flower.watered,true);
    assert.deepEqual(state.photos,['photo_window','photo_music','photo_lumo']);
    f.progress.checkpoint(state.position);const persisted=JSON.parse(f.values.get(KEY));
    assert.equal(persisted.version,2);assert.equal(persisted.layoutVersion,2);assert.deepEqual(persisted.position,state.position);
    for(const [key,value]of before)if(key!==KEY)assert.equal(f.values.get(key),value,`${room}: unrelated ${key} survives byte-for-byte`);
    assert.equal(f.progress.canEnter('basementHallway'),false);
  }
});

test('layout-one positions in the unchanged continuous passage, hideout and original rooms remain exact',()=>{
  for(const room of ['gallery','lumoRoom','hallway','friskRoom','torielRoom','kitchen','entrance','livingRoom']){
    const raw=old(room),f=fixture(raw);assert.deepEqual(f.progress.getState().position,raw.position,room);
    assert.equal(f.progress.getState().layoutVersion,2);assert.equal(f.progress.has('piano_played'),true);
  }
});

test('pre-compact saves still migrate every wing room, and the removed garden corridor retains its historical visit',()=>{
  for(const version of [1,2])for(const room of [...Object.keys(LAYOUT_SAFE_POSITIONS),'gardenHall']){
    const raw=old(room);raw.version=version;delete raw.layoutVersion;const f=fixture(raw),target=room==='gardenHall'?'gallery':room;
    assert.deepEqual(f.progress.getState().position,position(target,LAYOUT_SAFE_POSITIONS[target].feet));
    assert.ok(f.progress.getState().visits.includes('gardenHall'));assert.deepEqual(f.progress.getState().events,raw.events);
  }
  const f=fixture(old('gardenHall'));assert.deepEqual(f.progress.getState().position,position('gallery',[44,152]));
});

test('a saved position from layout two survives reload and ordinary checkpoints never invoke an older migration',()=>{
  for(const room of ['bathroom','readingRoom','garden','gallery','lumoRoom']){
    const raw=old(room);raw.layoutVersion=2;const f=fixture(raw);assert.deepEqual(f.progress.getState().position,raw.position);
    const next={room,x:raw.position.x+11,y:raw.position.y+7,direction:'left'};
    assert.equal(f.progress.checkpoint(next),true);assert.deepEqual(f.progress.getState().position,next);
    const g=fixture(JSON.parse(f.values.get(KEY)));assert.deepEqual(g.progress.getState().position,next);
  }
});

test('unknown future layouts or schemas cannot be overwritten or reset by movement, exploration, or story activities',()=>{
  for(const [version,layoutVersion]of [[2,3],[2,99],[3,2],[99,99]]){
    const raw={...old('readingRoom'),version,layoutVersion,future:{keep:'unknown metadata'}},f=fixture(raw),bytes=f.values.get(KEY);
    assert.equal(f.progress.getState().readOnly,true);
    f.progress.checkpoint({room:'garden',x:360,y:420,direction:'down'});f.progress.visit('bathroom');f.progress.touch('home_piano');
    f.progress.record('home_complete');f.progress.setRecipe('balanced');f.progress.waterFlower();
    assert.equal(f.progress.reset(),false);assert.equal(f.values.get(KEY),bytes);
    assert.equal(f.progress.canEnter('basementHallway'),false);
  }
});
