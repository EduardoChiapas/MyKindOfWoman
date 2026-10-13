'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),render=require('../home-character-render.js');
function canvasRealm(){
  const canvases=[];
  const document={createElement(tag){
    assert.equal(tag,'canvas');const canvas={width:0,height:0,draws:[],ownerDocument:document};
    canvas.getContext=()=>({imageSmoothingEnabled:true,drawImage(...args){canvas.draws.push(args);}});
    canvases.push(canvas);return canvas;
  }};
  const ctx={canvas:{ownerDocument:document},imageSmoothingEnabled:true,fillStyle:'old',draws:[],rects:[],
    drawImage(...args){this.draws.push(args);},fillRect(...args){this.rects.push(args);}};
  return {canvases,document,ctx};
}

test('the odd-sized original Mira sheet partitions all sixteen frames without seams, overlap or fractional crops',()=>{
  const width=197,height=281;
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const rect=render.frameRect(width,height,col,row);assert.ok(Object.values(rect).every(Number.isInteger));
    assert.equal(rect.x,col?render.frameRect(width,height,col-1,row).x+render.frameRect(width,height,col-1,row).width:0);
    assert.equal(rect.y,row?render.frameRect(width,height,col,row-1).y+render.frameRect(width,height,col,row-1).height:0);
    if(col===3)assert.equal(rect.x+rect.width,width);if(row===3)assert.equal(rect.y+rect.height,height);
  }
  assert.equal(render.frameRect(width,height,-1,0),null);assert.equal(render.frameRect(width,height,4,0),null);
});

test('Mira samples each original pose once, preserves image bytes, restores drawing options and renders at the room pixel scale',()=>{
  const f=canvasRealm(),image={complete:true,naturalWidth:197,naturalHeight:281,src:'original-player.png'};
  const original={...image};
  for(let pass=0;pass<3;pass++)for(let frameY=0;frameY<4;frameY++)for(let frameX=0;frameX<4;frameX++){
    assert.equal(render.drawPlayer(f.ctx,image,{frameX,frameY,x:21.6,y:41.4,width:48,height:68,shadow:true}),true);
  }
  assert.equal(f.canvases.length,16,'Only the sixteen poses are cached for one source image');
  for(const canvas of f.canvases){assert.equal(canvas.width,24);assert.equal(canvas.height,34);assert.equal(canvas.draws.length,1);}
  for(const[,x,y,w,h]of f.ctx.draws){assert.ok([x,y,w,h].every(n=>Number.isInteger(n)&&n%2===0));assert.equal(w,48);assert.equal(h,68);}
  assert.deepEqual(image,original);assert.equal(f.ctx.imageSmoothingEnabled,true);assert.equal(f.ctx.fillStyle,'old');
  assert.ok(f.ctx.rects.every(rect=>rect.every(n=>Number.isInteger(n)&&n%2===0)));
});

test('an unloaded sprite does not allocate a cache or paint a placeholder and source-size changes invalidate old samples',()=>{
  const f=canvasRealm(),image={complete:false,naturalWidth:0,naturalHeight:0};
  assert.equal(render.drawPlayer(f.ctx,image,{frameX:0,frameY:0,x:0,y:0}),false);assert.equal(f.canvases.length,0);
  Object.assign(image,{complete:true,naturalWidth:197,naturalHeight:281});
  assert.equal(render.drawPlayer(f.ctx,image,{frameX:0,frameY:0,x:0,y:0}),true);
  image.naturalWidth=200;
  assert.equal(render.drawPlayer(f.ctx,image,{frameX:0,frameY:0,x:0,y:0}),true);assert.equal(f.canvases.length,2);
  assert.equal(f.canvases[1].draws[0][3],50,'The new image uses its own integer source grid');
});

function actorRealm(){
  const f=canvasRealm(),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/lumo/manifest.json'),'utf8'));
  class Image{constructor(){this.complete=true;}set src(value){this._src=value;const data=fs.readFileSync(path.join(root,value));this.naturalWidth=data.readUInt32BE(16);this.naturalHeight=data.readUInt32BE(20);}get src(){return this._src;}}
  const realm={window:{LUMO_ASSETS:manifest,Image,document:f.document}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'lumo-actor.js'),'utf8'),realm);
  const context={roomId:'hallway',room:{exits:[]},feet:{x:100,y:160,width:20,height:12},
    player:{x:86,y:110,width:48,height:68,direction:'down'},state:'PLAYING',reducedMotion:false};
  const actor=new realm.window.LumoActor({mind:{getState:()=>({met:true})},adapter:{getContext:()=>context,canStand:()=>true}});
  return {...f,actor,context,manifest};
}

test('Lumo uses one aspect-preserving fit per original sheet, one fixed tail baseline and a bounded cache',()=>{
  const f=actorRealm(),before=JSON.stringify(f.manifest),frames=new Map();
  for(const descriptor of [...Object.values(f.manifest.animations),...Object.values(f.manifest.directions)])
    for(const frame of descriptor.frames)frames.set(frame.id,frame);
  for(const frame of frames.values()){
    const canvas=f.actor.sampleFor(frame),again=f.actor.sampleFor(frame);assert.equal(canvas,again);
    assert.equal(canvas.width,18);assert.equal(canvas.height,24);assert.equal(canvas.draws.length,1);
    const[,sx,sy,sw,sh,dx,dy,dw,dh]=canvas.draws[0],fit=f.actor.sheetFits.get(frame.sheet);
    const scale=Math.min(16/fit.width,22/fit.height);
    assert.deepEqual([sx,sy,sw,sh],[frame.rect.x,frame.rect.y,frame.rect.width,frame.rect.height]);
    assert.equal(dw,Math.max(1,Math.round(sw*scale)));assert.equal(dh,Math.max(1,Math.round(sh*scale)));
    assert.equal(dy+dh,23);assert.ok(dx>=0&&dy>=0&&dx+dw<=18&&dy+dh<=24);
  }
  assert.equal(f.canvases.length,frames.size);assert.equal(JSON.stringify(f.manifest),before);
});

test('Lumo snaps only presentation to the room grid, draws a stepped shadow, and reduced motion freezes his sampled pose',()=>{
  const f=actorRealm();f.actor.x=203.5;f.actor.y=208.7;f.actor.placed=true;f.actor.fade=1;
  f.context.reducedMotion=true;
  const makeContext=()=>({imageSmoothingEnabled:false,globalAlpha:1,draws:[],rects:[],save(){},restore(){},
    drawImage(...args){this.draws.push(args);},fillRect(...args){this.rects.push(args);}});
  const first=makeContext(),second=makeContext();f.actor.elapsed=0;f.actor.animationElapsed=0;f.actor.draw(first,{x:3.3,y:7.9});
  f.actor.elapsed=17;f.actor.animationElapsed=17;f.actor.draw(second,{x:3.3,y:7.9});
  assert.deepEqual(first.draws,second.draws);assert.deepEqual(first.rects,second.rects);
  assert.equal(first.rects.length,3);assert.ok(first.draws[0].slice(1).every(n=>Number.isInteger(n)&&n%2===0));
  assert.equal(f.actor.x,203.5);assert.equal(f.actor.y,208.7,'Snapping rendering never changes movement or collision position');
});
