'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createArt,assertSourceDraw}=require('./home-art-fixture.cjs');
const defs=require('../home-world.js').definitions();
function context(){const calls=[];return {calls,fillStyle:'',imageSmoothingEnabled:true,
  fillRect(x,y,w,h){calls.push(['fill',this.fillStyle,x,y,w,h]);},
  drawImage(image,...args){calls.push(['image',image,...args]);},
  getImageData(){throw Error('No pixel reads are allowed.');}};}
const drawing=ctx=>ctx.calls.map(c=>c[0]==='image'?['image',c[1].src||'cache',...c.slice(2)]:c);

test('the supplied piano is the credited source, tightly framed and proportional; TV shows a rear casing',()=>{
  const env=createArt(),piano=defs.readingRoom.props.find(p=>p.id==='home_piano'),ctx=context();
  const bytes=fs.readFileSync(path.join(__dirname,'..',env.HomeRoomFurnishing.source));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'80a3508f1aa3617a5a8d0aeb68a52745076849f511e2f4dfe55445fb7ee1a2b2');
  assert.equal(env.HomeRoomFurnishing.draw(ctx,piano),true);
  assert.equal(ctx.calls.length,1);assertSourceDraw(ctx.calls[0][1],ctx.calls[0].slice(2),piano);
  assert.equal(ctx.imageSmoothingEnabled,false);
  const tv=defs.readingRoom.props.find(p=>p.id==='reading_tv'),sofa=defs.readingRoom.props.find(p=>p.id==='reading_sofa'),chair=defs.readingRoom.props.find(p=>p.id==='reading_chair');
  assert.ok(tv.y>sofa.y+sofa.height&&tv.y>chair.y+chair.height);
  const off=context(),on=context();env.HomeRoomFurnishing.draw(off,tv,{value:false});env.HomeRoomFurnishing.draw(on,tv,{value:true});
  assert.notDeepEqual(drawing(off),drawing(on),'Power lamp follows the real saved toggle');
  for(const [,color,x,y,w,h]of off.calls){assert.ok(x>=tv.x&&y>=tv.y&&x+w<=tv.x+tv.width&&y+h<=tv.y+tv.height,color);}
});

test('outdoor source frames stay native and inside each physical object throughout motion',()=>{
  const env=createArt();
  for(const prop of defs.garden.props)for(const t of [0,1000,2500,15000]){
    const ctx=context();assert.equal(env.HomeOutdoorArt.draw(ctx,prop,{time:t,motion:true}),true,prop.id);
    for(const call of ctx.calls){
      if(call[0]==='image'){
        assertSourceDraw(call[1],call.slice(2),prop);
        const [x,y,w,h]=call.slice(6);assert.ok(x>=prop.x&&y>=prop.y&&x+w<=prop.x+prop.width&&y+h<=prop.y+prop.height,prop.id);
      }else{const [x,y,w,h]=call.slice(2);assert.ok(w>0&&h>0&&x>=prop.x&&y>=prop.y&&x+w<=prop.x+prop.width&&y+h<=prop.y+prop.height,prop.id);}
    }
  }
});

test('sunny scenery caches terrain once, animates without pixel reads, and freezes with quiet effects',()=>{
  const env=createArt();let canvases=0;
  env.document={createElement(type){assert.equal(type,'canvas');canvases++;return {getContext(){return context();}};}};
  const art=require('../home-outdoor-art.js').create(env),a=context(),b=context(),quietA=context(),quietB=context();
  assert.equal(art.background(a,defs.garden,{time:0,motion:true}),true);
  art.background(b,defs.garden,{time:20000,motion:true});
  assert.equal(canvases,1,'Do not allocate terrain canvases every frame');
  assert.notDeepEqual(drawing(a),drawing(b),'Clouds/birds change without rebuilding scenery');
  art.background(quietA,defs.garden,{time:0,motion:false});art.background(quietB,defs.garden,{time:20000,motion:false});
  assert.deepEqual(drawing(quietA),drawing(quietB));assert.equal(canvases,1);
  for(const prop of defs.garden.props.filter(p=>['greenTree','goldTree','pond'].includes(p.kind))){
    const q=context(),r=context();art.draw(q,prop,{time:0,motion:false});art.draw(r,prop,{time:42000,motion:false});assert.deepEqual(drawing(q),drawing(r));
  }
});
