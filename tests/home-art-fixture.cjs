'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const piano=require('../home-room-furnishing.js');

// The same dependency order as index.html, with real source dimensions. Sources
// are readable without a canvas, exercising the browser's file:// fallback too.
function createArt(){
  class Image{
    set src(value){
      this.path=value;this._src=value;const bytes=fs.readFileSync(path.join(__dirname,'..',value));
      this.naturalWidth=bytes.readUInt32BE(16);this.naturalHeight=bytes.readUInt32BE(20);this.complete=true;
    }
    get src(){return this._src;}
  }
  const env={Image};
  for(const [name,file]of [
    ['HomeCandleArt','home-candle-art.js'],['HomeRoomFurnishing','home-room-furnishing.js'],
    ['HomeWingStyle','home-wing-style.js'],['HomeInteriorArt','home-interior-art.js'],
    ['HomeGardenArt','home-garden-art.js'],['HomeOutdoorArt','home-outdoor-art.js']
  ])env[name]=require('../'+file).create(env);
  function draw(ctx,prop,state={}){
    return env.HomeOutdoorArt.draw(ctx,prop,state)||env.HomeRoomFurnishing.draw(ctx,prop,state)||
      env.HomeWingStyle.draw(ctx,prop,state)||env.HomeInteriorArt.draw(ctx,prop,state)||
      env.HomeGardenArt.draw(ctx,prop,state)||require('../home-pixel-art.js').draw(ctx,prop,state);
  }
  return {...env,draw};
}
function assertSourceDraw(image,args,prop){
  const [sx,sy,sw,sh,x,y,w,h]=args;
  assert.ok(args.every(Number.isInteger),prop.id+': source and destination remain on whole pixels');
  assert.ok(sw>0&&sh>0&&w>0&&h>0,prop.id+': nonempty source and destination');
  assert.ok(sx>=0&&sy>=0&&sx+sw<=image.naturalWidth&&sy+sh<=image.naturalHeight,prop.id+': complete source frame');
  if(prop.kind==='piano'){
    assert.equal(image.src,piano.source,'Only the explicitly supplied piano is downsampled');
    assert.deepEqual([sx,sy,sw,sh],[piano.frame.x,piano.frame.y,piano.frame.width,piano.frame.height]);
    assert.deepEqual([x,y,w,h],[prop.x,prop.y,prop.width,prop.height]);
    assert.ok(Math.abs((w/h)/(sw/sh)-1)<.01,'The piano preserves its source proportions');
  }else{
    assert.equal(w/sw,h/sh,prop.id+': native aspect ratio');assert.ok([1,2].includes(w/sw),prop.id+': native integer scale');
  }
}
module.exports={createArt,assertSourceDraw};
