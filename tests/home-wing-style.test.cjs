'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const vm=require('node:vm');
const base=require('../home-wing-style.js'),world=require('../home-world.js');
const candleBase=require('../home-candle-art.js'),{createArt}=require('./home-art-fixture.cjs');
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));

function fixture({deny=false,contextMissing=false}={}){
  let reads=0,created=0,network=0;
  class Image{
    set src(src){this.srcValue=src;this.complete=true;const b=fs.readFileSync(path.join(__dirname,'..',src));
      this.naturalWidth=b.readUInt32BE(16);this.naturalHeight=b.readUInt32BE(20);}
  }
  class Canvas{
    constructor(){this.width=0;this.height=0;this.pixels=null;created++;}
    get data(){const size=this.width*this.height*4;if(!this.pixels||this.pixels.length!==size)this.pixels=new Uint8ClampedArray(size);return this.pixels;}
    getContext(){if(contextMissing)return null;const canvas=this;return {
      drawImage(source,sx,sy,sw,sh,dx,dy,dw,dh){
        for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){
          const offset=((dy+y)*canvas.width+dx+x)*4,sourceOffset=((sy+y)*source.naturalWidth+sx+x)*4;
          canvas.data.set(source.data?source.data.subarray(sourceOffset,sourceOffset+4):[246,231,189,255],offset);
        }
      },
      getImageData(){reads++;if(deny){const error=Error('Canvas read denied');error.name='SecurityError';throw error;}return {data:canvas.data.slice()};},
      putImageData(image){canvas.data.set(image.data);}
    };}
  }
  const env={Image,document:{createElement(type){assert.equal(type,'canvas');return new Canvas();}},
    fetch(){network++;throw Error('A visual renderer must never contact a provider.');}};
  env.HomeCandleArt=candleBase.create(env);const art=base.create(env);
  return {art,stats:()=>({reads,created,network})};
}
function trace(){
  const calls=[],ctx={imageSmoothingEnabled:false,fillStyle:'',
    fillRect(x,y,w,h){calls.push({kind:'fill',color:this.fillStyle,x,y,w,h});},
    drawImage(image,sx,sy,sw,sh,x,y,w,h){calls.push({kind:'image',image,sx,sy,sw,sh,x,y,w,h});}};
  return {ctx,calls,colorAt(x,y){const p=calls.findLast(p=>x>=p.x&&y>=p.y&&x<p.x+p.w&&y<p.y+p.h);return p?.kind==='image'?'floor':p?.color;}};
}
function sourceAt(calls,x,y){const p=calls.findLast(p=>p.kind==='image'&&x>=p.x&&y>=p.y&&x<p.x+p.w&&y<p.y+p.h);
  assert.ok(p,`Source exists at ${x},${y}`);return [p.sx+x-p.x,p.sy+y-p.y];}

test('the new wing keeps black contours and warm HOME roles, with cool accents restricted by object identity',()=>{
  assert.deepEqual(base.colorFor(0,0,0,'sofa'),[0,0,0]);
  assert.deepEqual(base.colorFor(255,255,255,'sofa'),rgb(base.palette.cream));
  assert.deepEqual(base.colorFor(246,211,140,'sofa'),rgb(base.palette.floor));
  const blue=[100,200,255];
  assert.notDeepEqual(base.colorFor(...blue,'window'),base.colorFor(...blue,'bathWater'));
  assert.notDeepEqual(base.colorFor(...blue,'cot'),base.colorFor(...blue,'sofa'));
  assert.deepEqual(base.colorFor(...blue,'window'),rgb('#9ccfd0'),'The later outdoor request permits daylight through windows.');
});

test('palette adaptation preserves transparency and source bytes, separates roles and caches each source crop',()=>{
  const f=fixture(),image={complete:true,naturalWidth:2,naturalHeight:2,
    data:new Uint8ClampedArray([255,255,255,255,100,200,255,96,246,231,189,255,12,33,71,0])};
  const before=image.data.slice(),frame={x:0,y:0,width:2,height:2};
  const furniture=f.art.adapted(image,frame,'sofa');assert.ok(furniture);
  assert.deepEqual(Array.from(furniture.data.subarray(0,3)),rgb(base.palette.cream));
  assert.equal(furniture.data[7],96);assert.equal(furniture.data[15],0);
  assert.deepEqual(image.data,before,'No palette pass edits an original image.');
  assert.equal(f.art.adapted(image,frame,'sofa'),furniture);assert.equal(f.stats().reads,1);
  const candle=f.art.adapted(image,frame,'candle');assert.equal(candle.data[11],0,'Wall background is removed around the sampled candle.');
  const water=f.art.adapted(image,frame,'bathWater');assert.notDeepEqual(water.data,furniture.data);
  assert.equal(f.stats().reads,3);assert.equal(f.stats().network,0);
});

test('incomplete sprites retry; candle source strips keep the original silhouette when canvas reads are unavailable',()=>{
  const f=fixture(),source={complete:false,naturalWidth:1,naturalHeight:1,data:new Uint8ClampedArray([255,255,255,255])},frame={x:0,y:0,width:1,height:1};
  assert.equal(f.art.adapted(source,frame,'sofa'),null);assert.equal(f.stats().reads,0);
  source.complete=true;assert.ok(f.art.adapted(source,frame,'sofa'));assert.equal(f.stats().reads,1);
  for(const options of [{deny:true},{contextMissing:true}]){
    const denied=fixture(options),t=trace(),p={kind:'wallCandle',x:29,y:98,width:11,height:23};
    for(let i=0;i<10;i++)assert.equal(denied.art.draw(t.ctx,p),true);
    assert.equal(denied.stats().reads,0);assert.equal(denied.stats().created,0);
    assert.equal(t.calls.length,10*candleBase.strips.length);
    for(let i=0;i<t.calls.length;i++){
      const call=t.calls[i],[x,y,w,h]=candleBase.strips[i%candleBase.strips.length];
      assert.deepEqual([call.sx,call.sy,call.sw,call.sh,call.x,call.y,call.w,call.h],[222+x,27+y,w,h,29+x,98+y,w,h]);
    }
    assert.equal(denied.stats().network,0);
  }
});

test('the sole overlay in the original corridor opens only its empty right border and keeps the native floor phase',()=>{
  const f=fixture(),t=trace(),image=f.art.assets.find(image=>image.srcValue===base.sources.hallway),view={x:600.25,y:14.5};
  assert.equal(f.art.hallwayPassage(t.ctx,image,view,2),true);assert.equal(t.calls.length,1);
  const p=t.calls[0];assert.deepEqual([p.sx,p.sy,p.sw,p.sh],[667,72,18,84]);
  assert.deepEqual([p.x,p.y,p.w,p.h],[Math.round(727*2-view.x),Math.round(72*2-view.y),36,168]);
  assert.equal(p.x+p.w,Math.round(745*2-view.x));assert.equal(p.y+p.h,Math.round(156*2-view.y));
  assert.ok(p.sx+p.sw<=image.naturalWidth&&p.sy+p.sh<=image.naturalHeight);
  assert.equal(t.ctx.imageSmoothingEnabled,false);
  image.complete=false;assert.equal(f.art.hallwayPassage(t.ctx,image,view),false);assert.equal(t.calls.length,1);
});

test('the visible new corridor starts with exactly the original corridor floor pixels through its full depth',()=>{
  const helpers=fs.readFileSync(path.join(__dirname,'home-object-render.test.cjs'),'utf8');
  const {png,pixel}=vm.runInNewContext(helpers.slice(0,helpers.indexOf("\ntest('"))+'\n({png,pixel});',
    {require,__dirname,console,Uint8ClampedArray,Buffer});
  const image=png('hallway.png'),f=fixture(),t=trace();f.art.background(t.ctx,world.definitions().gallery,'gallery');
  for(let y=85;y<132;y++)for(let x=0;x<36;x++){
    const [sx,sy]=sourceAt(t.calls,x,y+45);
    assert.deepEqual(pixel(image,sx,sy),pixel(image,685+x,y),`Original plank pixel at gallery ${x},${y+45}`);
  }
});

test('native floor segments keep their phase at every overlap, including negative tile offsets and clipped edges',()=>{
  const f=fixture(),main=trace(),side=trace();
  const a={x:18,y:74,w:180,h:100},b={x:0,y:130,w:196,h:44};
  f.art.floor(main.ctx,a.x,a.y,a.w,a.h);f.art.floor(side.ctx,b.x,b.y,b.w,b.h);
  for(let y=130;y<174;y++)for(let x=18;x<196;x++)assert.deepEqual(sourceAt(main.calls,x,y),sourceAt(side.calls,x,y));
  for(const [area,calls]of [[a,main.calls],[b,side.calls]])for(const p of calls){
    assert.ok([p.sx,p.sy,p.sw,p.sh,p.x,p.y,p.w,p.h].every(Number.isInteger));
    assert.equal(p.sw,p.w);assert.equal(p.sh,p.h);
    assert.ok(p.sx>=20&&p.sx+p.sw<=300&&p.sy>=100&&p.sy+p.sh<=130);
    assert.ok(p.x>=area.x&&p.y>=area.y&&p.x+p.w<=area.x+area.w&&p.y+p.h<=area.y+area.h);
  }
});

test('the compact L paints floor only inside its collision-defined legs and leaves the unused quadrants black',()=>{
  const f=fixture(),t=trace(),def=world.definitions().gallery;
  assert.equal(f.art.background(t.ctx,def,'gallery'),true);
  for(const point of [[30,150],[170,110],[220,112],[170,82]])assert.equal(t.colorAt(...point),'floor',`Clear L floor at ${point}`);
  for(const point of [[110,42],[212,150],[62,42],[225,180]])assert.equal(t.colorAt(...point),base.palette.ink,`Black void remains at ${point}`);
  for(const p of t.calls.filter(p=>p.kind==='image'))for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++)
    assert.ok(def.walkable.some(a=>x>=a.x&&y>=a.y&&x<a.x+a.width&&y<a.y+a.height),`Floor ${x},${y} matches the declared geometry.`);
  for(const p of t.calls.filter(p=>p.kind==='fill'&&p.color!==base.palette.ink))
    assert.ok(p.x>=0&&p.y>=0&&p.x+p.w<=def.nativeWidth&&p.y+p.h<=def.nativeHeight,'No nonblack paint extends outside the new room.');
  assert.equal(f.stats().network,0);
});

test('the requested outdoor courtyard has sky, a visible sun and native terrain connected to its bottom exit',()=>{
  const art=createArt(),t=trace(),def=world.definitions().garden;
  assert.equal(art.HomeOutdoorArt.background(t.ctx,def,{motion:false,time:0}),true);
  assert.equal(t.colorAt(120,19),'#91cde1');assert.equal(t.colorAt(306,28),'#ffe7a6');
  assert.equal(t.colorAt(192,230),'floor','The arrival is on authored terrain.');
  assert.equal(t.colorAt(192,255),'#b38d62','Visible steps connect the exit at the bottom edge.');
  const images=t.calls.filter(p=>p.kind==='image');assert.ok(images.length>100);
  for(const p of images){
    assert.equal(p.image.src,art.HomeGardenArt.sources.terrain);assert.equal(p.sw,p.w);assert.equal(p.sh,p.h);
    assert.ok([p.sx,p.sy,p.sw,p.sh,p.x,p.y,p.w,p.h].every(Number.isInteger));
    assert.ok(p.x>=0&&p.y>=0&&p.x+p.w<=def.nativeWidth&&p.y+p.h<=def.nativeHeight);
  }
});

test('bathroom tile joints end at the floor and never trail down across its black border',()=>{
  const f=fixture(),t=trace(),def=world.definitions().bathroom;
  assert.equal(f.art.background(t.ctx,def,'bathroom'),true);
  for(const p of t.calls.filter(p=>p.kind==='fill'&&p.color==='#bfa876')){
    assert.ok(p.x>=18&&p.x+p.w<=def.nativeWidth-18);
    assert.ok(p.y>=74&&p.y+p.h<=def.nativeHeight-26);
  }
  assert.equal(t.colorAt(50,def.nativeHeight-27),base.palette.ink);
});
