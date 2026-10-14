'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const presentation=require('../home-presentation.js'),world=require('../home-world.js');
const interior=require('../home-interior-art.js');
const root=path.resolve(__dirname,'..');
const engine=fs.readFileSync(path.join(root,'script.js'),'utf8');
const fixtureSource=fs.readFileSync(path.join(__dirname,'home-engine.test.cjs'),'utf8');
const fixture=vm.runInNewContext(fixtureSource.slice(0,fixtureSource.indexOf("\ntest('"))+'\nfixture;',{
  require,__dirname,console,AbortController,Promise});

test('the six original HOME backgrounds and PC paint use their source images and colors without recoloring',()=>{
  const f=fixture(),c=f.c,images=[],colors=[];
  c.ctx={drawImage:(...args)=>images.push(args),clearRect(){},fillRect(){colors.push(this.fillStyle);},
    save(){},restore(){},translate(){},scale(){},beginPath(){},rect(){},clip(){},fillText(){}};
  c.HomePalette={image(){assert.fail('Original rooms must never be recolored');},color(){assert.fail('Original detail colors must stay intact');}};
  c.torielOriginalArt={complete:true,naturalWidth:227};c.gamingPCSprite={complete:false};
  c.worldToScreen=rect=>rect;c.MIRROR_GLASS={x:1,y:1,width:2,height:2};c.HouseExperience.elapsedSeconds=0;
  vm.runInContext(engine.slice(engine.indexOf('function drawRoom()'),engine.indexOf('function mirrorReflectionPose()')),f.context);
  for(const id of ['entrance','livingRoom','hallway','friskRoom','torielRoom','kitchen']){
    c.currentRoom=id;c.rooms[id].image={complete:true,naturalWidth:320,src:id+'.png'};
    images.length=0;c.drawRoom();assert.equal(images[0][0],c.rooms[id].image,id);
  }
  assert.ok(images.length>0);assert.ok(colors.includes('#b3b1a7'),'The PC desk returns to its original warm grey');
});

test('actual wing rendering uses licensed furniture and keeps visible footprints aligned to collision bounds',()=>{
  const f=fixture(),c=f.c,bySrc=Object.fromEntries(Object.entries(interior.sources).map(([id,src])=>[src,interior.sheetSizes[id]]));
  class Image{set src(src){this.complete=true;[this.naturalWidth,this.naturalHeight]=bySrc[src];}}
  const loaded=interior.create({Image}),painted=[];c.HomeInteriorArt={...loaded,draw(ctx,prop,state){if(loaded.draw(ctx,prop,state)){painted.push(prop.id);return true;}return false;}};
  const ctx={fillStyle:'',imageSmoothingEnabled:false,drawImage(){},fillRect(){},fillText(){},save(){},restore(){},translate(){},scale(){},beginPath(){},rect(){},clip(){}};
  for(const id of ['readingRoom','lumoRoom'])c.rooms[id].render(ctx,{x:0,y:0});
  for(const id of ['reading_books','reading_sofa','reading_window','reading_table','lumo_desk'])assert.ok(painted.includes(id),id);
  for(const prop of Object.values(world.definitions()).flatMap(room=>room.props))if(interior.kinds[prop.kind]){
    const box=loaded.placement(prop,interior.kinds[prop.kind]);assert.ok(box,prop.id);
    assert.equal(box.width,prop.width,prop.id);assert.equal(box.height,prop.height,prop.id);
    if(prop.solid){assert.ok(prop.solid.x>=box.x&&prop.solid.x+prop.solid.width<=box.x+box.width,prop.id);assert.ok(prop.solid.y>=box.y&&prop.solid.y+prop.solid.height<=box.y+box.height,prop.id);}
  }
});

test('desktop stage sizes fit the viewport with whole physical pixels; mobile uses the available area',()=>{
  for(const[width,height,dpr]of [[1280,720,1],[1366,768,1.25],[1920,1080,1.5],[640,480,2],[901,641,3]]){
    const size=presentation.layoutSize(width,height,dpr);assert.ok(size);
    assert.ok(size.width<=width+.00001&&size.height<=height+.00001);
    assert.ok(Math.abs(size.width/size.height-4/3)<.00001);assert.equal(size.integerPixels,true);
    assert.ok(Math.abs(size.scale*dpr-Math.round(size.scale*dpr))<.00001,
      'Each native room pixel fills a whole number of physical display pixels');
  }
  for(const[width,height]of [[390,844],[844,390],[320,568],[430,932]]){
    const size=presentation.layoutSize(width,height,2);assert.equal(size.integerPixels,false);
    assert.ok(size.width<=width+.00001&&size.height<=height+.00001);
    assert.ok(Math.abs(size.width-width)<.00001||Math.abs(size.height-height)<.00001,
      'A mobile view fills one available edge instead of retaining a small desktop frame');
  }
  assert.equal(presentation.layoutSize(0,720,1),null);assert.equal(presentation.layoutSize(640,NaN,1),null);
});

test('actual HOME objects have useful short labels, independent of raw IDs, dialogue and future-lore strings',()=>{
  const props=Object.values(world.definitions()).flatMap(room=>room.props);
  const expected={reading_books:'Libros',reading_sofa:'Sofá',reading_chair:'Sillón',reading_table:'Parejas',
    reading_plant:'Lámpara',garden_watering_can:'Letrero',garden_flower:'Flor',lumo_bed:'Camita',
    gallery_candle_right:'Vela',gallery_plant:'Cómoda',garden_workbench:'Calabazas',garden_frog:'Setas',
    garden_tree_gold:'Árbol dorado',garden_pond:'Estanque',reading_tv:'Televisión',lumo_hideout_entry:'Escondite'};
  for(const[id,name]of Object.entries(expected)){
    const object=props.find(p=>p.id===id);assert.ok(object,id);
    assert.equal(presentation.hintLabel(object),'Z · '+name,id);
    assert.equal(presentation.hintLabel(object,true),'Examinar · '+name,id+' touch');
  }
  for(const object of props){const label=presentation.hintLabel(object);assert.ok(!label.includes(object.id));assert.ok(!label.includes('*'));}
  assert.equal(presentation.hintLabel({id:'future_secret_raw_id',kind:'unknown',text:'secret spoiler text',label:'secret spoiler label'}),'Z · Examinar');
  assert.equal(presentation.hintLabel({id:'entrance_basement_door'}),'Z · Bajada al sótano');
  assert.equal(presentation.hintLabel({id:'hallway_locked_door'}),'Z · Puerta cerrada');
  assert.equal(presentation.hintLabel({id:'hallway_locked_door'},true),'Examinar · Puerta cerrada');
  assert.equal(presentation.hintLabel(null),'');
});
