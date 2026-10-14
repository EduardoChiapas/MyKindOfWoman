'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=require('../home-candle-art.js');
const helpers=fs.readFileSync(path.join(__dirname,'home-object-render.test.cjs'),'utf8');
const {png,pixel}=vm.runInNewContext(helpers.slice(0,helpers.indexOf("\ntest('"))+'\n({png,pixel});',
  {require,__dirname,console,Uint8ClampedArray,Buffer});
const source=png('entrance.png');
const cream=[246,231,189,255];
const same=(a,b)=>a.every((value,index)=>value===b[index]);

// Independently find the original wall connected to the crop's border; cream
// enclosed in a furniture contour would remain a physical part of the sprite.
function wallPixels(){
  const {x,y,width:w,height:h}=base.frame,seen=new Set(),queue=[];
  const visit=(xx,yy)=>{
    if(xx<0||yy<0||xx>=w||yy>=h)return;
    const key=yy*w+xx;if(seen.has(key)||!same(pixel(source,x+xx,y+yy),cream))return;
    seen.add(key);queue.push([xx,yy]);
  };
  for(let xx=0;xx<w;xx++){visit(xx,0);visit(xx,h-1);}
  for(let yy=0;yy<h;yy++){visit(0,yy);visit(w-1,yy);}
  for(let i=0;i<queue.length;i++){
    const [xx,yy]=queue[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])visit(xx+dx,yy+dy);
  }
  return seen;
}
function fixture(){
  let reads=0,canvases=0,network=0;
  class Image{
    set src(value){assert.equal(value,base.source);for(const [key,item]of Object.entries(source))if(key!=='src')this[key]=item;this.srcValue=value;}
  }
  const art=base.create({Image,document:{createElement(){canvases++;throw Error('No readable canvas exists for file://.');}},
    fetch(){network++;throw Error('No provider belongs in a visual renderer.');}});
  const calls=[],ctx={imageSmoothingEnabled:true,
    getImageData(){reads++;const error=Error('Canvas read denied');error.name='SecurityError';throw error;},
    drawImage(image,sx,sy,sw,sh,x,y,w,h){calls.push({image,sx,sy,sw,sh,x,y,w,h});}};
  return {art,ctx,calls,stats:()=>({reads,canvases,network})};
}
function rendered(calls,x,y){
  const p=calls.findLast(call=>x>=call.x&&y>=call.y&&x<call.x+call.w&&y<call.y+call.h);
  return p?pixel(p.image,p.sx+Math.floor((x-p.x)*p.sw/p.w),p.sy+Math.floor((y-p.y)*p.sh/p.h)):null;
}

test('the candle preserves every original physical pixel while removing only its connected wall at both integer scales',()=>{
  const wall=wallPixels();assert.equal(wall.size,148);
  for(const scale of [1,2]){
    const f=fixture(),prop={kind:'wallCandle',x:29,y:98,width:11*scale,height:23*scale};
    assert.equal(f.art.draw(f.ctx,prop,{scale}),true);assert.equal(f.ctx.imageSmoothingEnabled,false);
    let retained=0;
    for(let y=0;y<23*scale;y++)for(let x=0;x<11*scale;x++){
      const sx=Math.floor(x/scale),sy=Math.floor(y/scale),painted=rendered(f.calls,prop.x+x,prop.y+y);
      if(wall.has(sy*11+sx))assert.equal(painted,null,`The wall must be transparent at ${x},${y}.`);
      else{assert.deepEqual(painted,pixel(source,222+sx,27+sy),`Retain source pixel ${sx},${sy}.`);retained++;}
    }
    assert.equal(retained,105*scale*scale);
    assert.equal(rendered(f.calls,prop.x-1,prop.y),null);assert.equal(rendered(f.calls,prop.x+prop.width,prop.y),null);
  }
});

test('an unreadable file canvas renders the same complete candle without a rectangular fallback or provider calls',()=>{
  const f=fixture(),prop={kind:'smallCandle',x:6,y:8,width:11,height:23};
  for(let frame=0;frame<30;frame++)assert.equal(f.art.draw(f.ctx,prop),true);
  assert.deepEqual(f.stats(),{reads:0,canvases:0,network:0});
  assert.equal(f.calls.length,300);
  assert.ok(f.calls.every(call=>call.sw*call.sh<253),'No call copies the wall-filled crop.');
  assert.equal(rendered(f.calls,6,8),null);assert.deepEqual(Array.from(rendered(f.calls,9,8)),[0,0,0,255]);
});

test('asset readiness retries and unsupported dimensions leave the caller untouched',()=>{
  const f=fixture(),prop={kind:'wallCandle',x:6,y:8,width:11,height:23},image=f.art.assets[0];
  image.complete=false;assert.equal(f.art.draw(f.ctx,prop),false);assert.equal(f.calls.length,0);
  image.complete=true;const width=image.naturalWidth;image.naturalWidth=0;
  assert.equal(f.art.draw(f.ctx,prop),false);image.naturalWidth=width;
  assert.equal(f.art.draw(f.ctx,prop),true);f.calls.length=0;
  for(const p of [{...prop,kind:'piano'},{...prop,width:10},{...prop,height:22},{...prop,x:6.5},{...prop,y:NaN}])
    assert.equal(f.art.draw(f.ctx,p),false);
  for(const scale of [.5,1.5,3,-1])assert.equal(f.art.draw(f.ctx,prop,{scale}),false);
  assert.equal(f.calls.length,0);
});
