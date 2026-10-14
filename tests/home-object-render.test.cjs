'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const base=require('../home-object-render.js'),roomFiles={kitchen:'kitchen.png',friskRoom:'frisk_room.png',torielRoom:'toriel_room.png'};
const hashes={kitchen:'5df32900a7e78979083eb53d898e6cc71515c2269faf66a32bd5c774a28cad4d',
  friskRoom:'5aa198905657dfc46a1c02554b98ac706fdba7e495dbda26bd1b26a64e9ac106',
  torielRoom:'84d174b4466c82bb46f2857980f99429edf4e7d8aec1acd49f23d8ff99b83739'};
function png(file){
  const bytes=fs.readFileSync(path.join(__dirname,'../assets/rooms',file));
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20),idat=[];
  assert.equal(bytes[24],8);assert.equal(bytes[25],6);
  for(let i=8;i<bytes.length;){const n=bytes.readUInt32BE(i);if(bytes.toString('ascii',i+4,i+8)==='IDAT')idat.push(bytes.subarray(i+8,i+8+n));i+=n+12;}
  const raw=zlib.inflateSync(Buffer.concat(idat)),stride=width*4,data=Buffer.alloc(stride*height);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++)for(let x=0;x<stride;x++){
    const i=y*stride+x,a=x>=4?data[i-4]:0,b=y?data[i-stride]:0,c=x>=4&&y?data[i-stride-4]:0;
    data[i]=(raw[y*(stride+1)+1+x]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][raw[y*(stride+1)]])&255;
  }
  return {width,height,naturalWidth:width,naturalHeight:height,complete:true,src:file,data,bytes};
}
function pixel(image,x,y){return Array.from(image.data.subarray((y*image.width+x)*4,(y*image.width+x)*4+4));}
function fixture({deny=false,context=false}={}){
  let reads=0,created=0;const draws=[];
  class Canvas{
    constructor(){this.width=0;this.height=0;this._data=null;created++;}
    get data(){const n=this.width*this.height*4;if(!this._data||this._data.length!==n)this._data=new Uint8ClampedArray(n);return this._data;}
    getContext(){
      if(context)return null;const canvas=this;
      return {imageSmoothingEnabled:true,createImageData(w,h){return {width:w,height:h,data:new Uint8ClampedArray(w*h*4)};},
        getImageData(){reads++;if(deny){const error=Error('The canvas has been tainted by cross-origin data');error.name='SecurityError';throw error;}return {data:canvas.data.slice()};},
        putImageData(image){canvas.data.set(image.data);},drawImage(source,...args){
          let sx=0,sy=0,sw=source.width,sh=source.height,dx,dy,dw=sw,dh=sh;
          if(args.length===2)[dx,dy]=args;
          else if(args.length===4)[dx,dy,dw,dh]=args;
          else [sx,sy,sw,sh,dx,dy,dw,dh]=args;
          for(let yy=0;yy<dh;yy++)for(let xx=0;xx<dw;xx++){
            const a=((yy+dy)*canvas.width+xx+dx)*4,b=((sy+Math.floor(yy*sh/dh))*source.width+sx+Math.floor(xx*sw/dw))*4;
            if(xx+dx>=0&&yy+dy>=0&&xx+dx<canvas.width&&yy+dy<canvas.height)canvas.data.set(source.data.subarray(b,b+4),a);
          }
        }};
    }
  }
  const art=base.create({document:{createElement(kind){assert.equal(kind,'canvas');return new Canvas();}}});
  const ctx={imageSmoothingEnabled:true,drawImage(...args){draws.push(args);}};
  function composite(source){const canvas=new Canvas();canvas.width=source.width;canvas.height=source.height;
    canvas.data.set(source.data);const c=canvas.getContext();return {canvas,ctx:c};}
  return {art,ctx,draws,composite,stats:()=>({reads,created})};
}

test('source furniture files remain byte exact and only existing moving faces are supported',()=>{
  for(const [room,file] of Object.entries(roomFiles))assert.equal(crypto.createHash('sha256').update(png(file).bytes).digest('hex'),hashes[room]);
  assert.deepEqual(Object.keys(base.specs).sort(),['frisk_dresser','kitchen_fridge','kitchen_sink','toriel_dresser','toriel_wardrobe']);
  assert.deepEqual(base.bounds('kitchen','kitchen_fridge'),[25,39,29,45]);
  assert.equal(base.bounds('entrance','entrance_console'),null);
});

test('closed and pulse-only objects draw nothing; unsupported IDs and wrong rooms also leave original art alone',()=>{
  const f=fixture();
  for(const [id,spec] of Object.entries(base.specs))for(const visual of [{phase:0,pulse:1,value:true},{phase:-1},{pulse:1},{phase:NaN}])
    assert.equal(f.art.draw(f.ctx,spec.room,id,visual,png(roomFiles[spec.room])),false);
  assert.equal(f.art.draw(f.ctx,'livingRoom','living_table',{phase:1},png('kitchen.png')),false);
  assert.equal(f.art.draw(f.ctx,'torielRoom','kitchen_fridge',{phase:1},png('toriel_room.png')),false);
  assert.equal(f.art.draw(f.ctx,'friskRoom','frisk_desk_book',{phase:1},png('frisk_room.png')),false);
  assert.deepEqual(f.draws,[]);assert.equal(f.stats().reads,0);
});

test('open drawers move their entire existing border and handle without recoloring or stretching a pixel',()=>{
  for(const [room,id,x] of [['friskRoom','frisk_dresser',169],['torielRoom','toriel_dresser',26]]){
    const source=png(roomFiles[room]),f=fixture(),{canvas,ctx}=f.composite(source);
    assert.equal(f.art.draw(ctx,room,id,{phase:1},source),true);
    for(let y=0;y<8;y++)for(let xx=0;xx<44;xx++)assert.deepEqual(pixel(canvas,x+xx,67+y),pixel(source,x+xx,64+y));
    // The second drawer's knob, the lamp and the dresser frame remain the real ones.
    for(const [xx,yy] of [[x+19,77],[x-2,64],[x+45,70],[x+30,58]])assert.deepEqual(pixel(canvas,xx,yy),pixel(source,xx,yy));
    assert.notDeepEqual(pixel(canvas,x+10,65),pixel(source,x+10,65));
  }
});

test('both fridge doors, handles and separator rotate as the same complete original assembly',()=>{
  const source=png('kitchen.png'),f=fixture(),{canvas,ctx}=f.composite(source);
  assert.equal(f.art.draw(ctx,'kitchen','kitchen_fridge',{phase:1},source),true);
  // Both handles land in one common projected column with one common depth.
  for(const y of [43,46,60,63,73])assert.deepEqual(pixel(canvas,33,y+3),pixel(source,50,y));
  // The original full-width divider remains exposed in the body, behind the moving door.
  for(let x=35;x<54;x++)assert.deepEqual(pixel(canvas,x,52),pixel(source,x,52));
  for(const [x,y] of [[21,40],[23,70],[55,73],[30,25],[39,82]])assert.deepEqual(pixel(canvas,x,y),pixel(source,x,y));
  assert.notDeepEqual(pixel(canvas,45,44),pixel(source,45,44));
  assert.notDeepEqual(pixel(canvas,45,65),pixel(source,45,65));
});

test('every pose stays in its exact object bounds and uses only colors sampled from the original furniture',()=>{
  for(const [id,spec] of Object.entries(base.specs)){
    const source=png(roomFiles[spec.room]),f=fixture(),[bx,by,bw,bh]=spec.bounds;
    const palette=new Set();for(let i=0;i<source.data.length;i+=4)palette.add(Array.from(source.data.subarray(i,i+4)).join(','));
    for(const phase of [.1,.3,.7,1]){
      const {canvas,ctx}=f.composite(source);assert.equal(f.art.draw(ctx,spec.room,id,{phase},source),true);
      for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){
        const result=pixel(canvas,x,y);
        if(x<bx||x>=bx+bw||y<by||y>=by+bh)assert.deepEqual(result,pixel(source,x,y),`${id}: fixed scenery ${x},${y}`);
        else assert.ok(palette.has(result.join(',')),`${id}: original palette ${x},${y}`);
      }
    }
  }
});

test('opening wardrobe leaves its lower drawer and the adjacent room objects untouched',()=>{
  const source=png('toriel_room.png'),f=fixture(),{canvas,ctx}=f.composite(source);
  assert.equal(f.art.draw(ctx,'torielRoom','toriel_wardrobe',{phase:1},source),true);
  for(let y=74;y<=82;y++)for(let x=86;x<=115;x++)assert.deepEqual(pixel(canvas,x,y),pixel(source,x,y));
  assert.notDeepEqual(pixel(canvas,98,50),pixel(source,98,50));
  assert.notDeepEqual(pixel(canvas,105,50),pixel(source,105,50));
  // Both narrow original handle columns survive the integer projection.
  assert.deepEqual(pixel(canvas,93,61),pixel(source,98,59));
  assert.deepEqual(pixel(canvas,109,61),pixel(source,103,59));
});

test('source pixels are read once and at most fifteen positive poses are cached for repeated frames',()=>{
  const f=fixture(),source=png('kitchen.png');
  for(let repeat=0;repeat<3;repeat++)for(let i=1;i<=300;i++)f.art.draw(f.ctx,'kitchen','kitchen_fridge',{phase:i/300},source);
  assert.equal(f.stats().reads,1);assert.equal(f.stats().created,16);
  const previous=f.draws.at(-1)[0];f.art.draw(f.ctx,'kitchen','kitchen_fridge',{phase:1,pulse:1},source);
  assert.equal(f.draws.at(-1)[0],previous);assert.equal(f.ctx.imageSmoothingEnabled,false);
});

test('incomplete sources retry once ready and denied reads or missing frame canvas still draw the real front',()=>{
  const source=png('kitchen.png'),f=fixture();source.complete=false;
  assert.equal(f.art.draw(f.ctx,'kitchen','kitchen_fridge',{phase:1},source),false);assert.equal(f.stats().reads,0);
  source.complete=true;assert.equal(f.art.draw(f.ctx,'kitchen','kitchen_fridge',{phase:1},source),true);
  source.naturalWidth=0;assert.equal(f.art.draw(f.ctx,'kitchen','kitchen_fridge',{phase:1},source),false);
  for(const options of [{deny:true},{context:true}]){
    const denied=fixture(options),image=png('kitchen.png');
    for(let i=0;i<20;i++)assert.equal(denied.art.draw(denied.ctx,'kitchen','kitchen_fridge',{phase:1},image),true);
    assert.ok(denied.stats().reads<=1);assert.ok(denied.draws.length>=20);
  }
  assert.equal(base.draw(f.ctx,'kitchen','kitchen_fridge',{phase:1},png('kitchen.png')),true);
});

test('denied pixel reads and absent offscreen canvas preserve every original pose pixel without synthetic colors',()=>{
  for(const [id,spec] of Object.entries(base.specs))for(const phase of [.2,.5,.8,1]){
    const source=png(roomFiles[spec.room]),normal=fixture(),expected=normal.composite(source);
    normal.art.draw(expected.ctx,spec.room,id,{phase},source);
    for(const configuration of [{deny:true},{context:true}]){
      const fallback=fixture(configuration),output=normal.composite(source);
      assert.equal(fallback.art.draw(output.ctx,spec.room,id,{phase},source),true);
      assert.deepEqual(output.canvas.data,expected.canvas.data,id+' '+phase+' uses the identical cropped original front');
    }
  }
});
