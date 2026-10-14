'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto'),zlib=require('node:zlib'),base=require('../home-garden-art.js');
const root=path.resolve(__dirname,'..');
const hashes={objects:'d4c350d69c2d3f518afd15000e633e654e6db06af03e08d0582322af2e26520a',terrain:'7623d0c2428213917dead7c4c03c622f5b648b0a81d5bd92af6536601fd27130'};
function pixels(buffer){
  const width=buffer.readUInt32BE(16),height=buffer.readUInt32BE(20),parts=[];
  assert.equal(buffer[24],8);assert.equal(buffer[25],6);
  for(let offset=8;offset<buffer.length;){const size=buffer.readUInt32BE(offset),kind=buffer.toString('ascii',offset+4,offset+8);
    if(kind==='IDAT')parts.push(buffer.subarray(offset+8,offset+8+size));offset+=size+12;}
  const raw=zlib.inflateSync(Buffer.concat(parts)),stride=width*4,data=Buffer.alloc(stride*height);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++)for(let x=0;x<stride;x++){
    const filter=raw[y*(stride+1)],i=y*stride+x,a=x>=4?data[i-4]:0,b=y?data[i-stride]:0,c=x>=4&&y?data[i-stride-4]:0;
    assert.ok(filter<=4);data[i]=(raw[y*(stride+1)+1+x]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;
  }
  return {width,height,alpha:(x,y)=>data[(y*width+x)*4+3]};
}
function fixture(){
  const bySrc=Object.fromEntries(Object.entries(base.sources).map(([key,src])=>[src,base.sheetSizes[key]]));
  class Image{set src(src){this._src=src;this.complete=true;[this.naturalWidth,this.naturalHeight]=bySrc[src];}get src(){return this._src;}}
  const art=base.create({Image}),images=[],clips=[];
  const ctx={imageSmoothingEnabled:true,drawImage(...args){images.push(args);},fillRect(){throw Error('Do not overlay invented pixel props or floor grids');},save(){},restore(){},beginPath(){},rect(...args){clips.push(args);},clip(){}};
  return {art,ctx,images,clips};
}
test('garden uses byte-identical original sheets and all native crops remain in their source',()=>{
  for(const [key,src] of Object.entries(base.sources)){
    const b=fs.readFileSync(path.join(root,src));assert.equal(crypto.createHash('sha256').update(b).digest('hex'),hashes[key]);
    assert.deepEqual([b.readUInt32BE(16),b.readUInt32BE(20)],base.sheetSizes[key]);
  }
  for(const f of Object.values(base.frames)){
    const [w,h]=base.sheetSizes[f.sheet];assert.ok([f.x,f.y,f.width,f.height].every(Number.isInteger));
    assert.ok(f.x>=0&&f.y>=0&&f.width>0&&f.height>0&&f.x+f.width<=w&&f.y+f.height<=h);
  }
});
test('authored props have tight complete silhouettes with no neighboring atlas pixels',()=>{
  const sheet=pixels(fs.readFileSync(path.join(root,base.sources.objects)));
  for(const [id,expected] of Object.entries({treeGreen:5604,bench:1467,mossRock:2017,stumpMoss:467,mushrooms:116,pumpkinPatch:2078,pumpkinGrowing:626,signpost:464})){
    const f=base.frames[id],sides=[false,false,false,false];let count=0;
    for(let y=0;y<f.height;y++)for(let x=0;x<f.width;x++)if(sheet.alpha(f.x+x,f.y+y)){
      count++;if(x===0)sides[0]=true;if(x===f.width-1)sides[1]=true;if(y===0)sides[2]=true;if(y===f.height-1)sides[3]=true;
    }
    assert.equal(count,expected,id);assert.deepEqual(sides,[true,true,true,true],id);
  }
});
test('garden objects use native integer scales and never repaint art in reaction states',()=>{
  for(const [kind,id] of Object.entries(base.kinds))for(const scale of [1,2])for(const phase of [0,.5,1]){
    const f=fixture(),frame=base.frames[id],prop={kind,x:9,y:13,width:frame.width*scale+3,height:frame.height*scale+5};
    assert.equal(f.art.draw(f.ctx,prop,{scale,phase,pulse:.7}),true);assert.equal(f.images.length,1);assert.equal(f.ctx.imageSmoothingEnabled,false);
    const a=f.images[0];assert.deepEqual(a.slice(1,5),[frame.x,frame.y,frame.width,frame.height]);
    assert.deepEqual(a.slice(7),[frame.width*scale,frame.height*scale]);assert.ok(a.slice(1).every(Number.isInteger));
    assert.ok(a[5]>=prop.x&&a[6]>=prop.y&&a[5]+a[7]<=prop.x+prop.width&&a[6]+a[8]<=prop.y+prop.height);
  }
});
test('incomplete sources and unrecognized or undersized props leave fallback available',()=>{
  const f=fixture(),prop={kind:'gardenBench',x:0,y:0,width:48,height:34};
  f.art.assets[0].complete=false;assert.equal(f.art.draw(f.ctx,prop),false);assert.equal(f.images.length,0);
  f.art.assets[0].complete=true;assert.equal(f.art.draw(f.ctx,prop),true);
  for(const p of [{...prop,width:47},{...prop,x:.5},{...prop,kind:'flowerbed'}])assert.equal(f.art.draw(f.ctx,p),false);
  assert.equal(f.art.drawFrame(f.ctx,'bench',0,0,1.5),false);
});
test('grass tiles clip at field edges without stretching and retain the shared native phase',()=>{
  const f=fixture(),origin={x:0,y:0},a={x:18,y:82,width:51,height:47},b={x:0,y:150,width:26,height:42};
  assert.equal(f.art.tile(f.ctx,'grass',a,origin),true);assert.equal(f.art.tile(f.ctx,'grass',b,origin),true);
  for(const args of f.images){
    const [sx,sy,sw,sh,x,y,w,h]=args.slice(1);assert.deepEqual([sw,sh],[w,h]);assert.ok(args.slice(1).every(Number.isInteger));
    assert.equal(sx-176,((x%16)+16)%16);assert.equal(sy,((y%16)+16)%16);
    assert.ok(sx>=176&&sy>=0&&sx+sw<=192&&sy+sh<=16);
  }
  assert.equal(f.art.tile(f.ctx,'grass',{...a,width:0}),false);
});
test('garden background joins its dirt route and paints only native terrain inside the field and passage',()=>{
  const f=fixture();assert.equal(f.art.background(f.ctx,{nativeWidth:320,nativeHeight:240}),true);
  assert.deepEqual(f.clips,[[18,16,284,202],[0,150,26,42]]);assert.ok(f.images.length>200);
  for(const args of f.images){assert.equal(args[0].src,base.sources.terrain);assert.deepEqual(args.slice(3,5),args.slice(7));assert.ok(args.slice(1).every(Number.isInteger));}
  const cells=base.pathCells(),seen=new Set(),queue=['0,10'];
  while(queue.length){const cell=queue.shift();if(seen.has(cell)||!cells.has(cell))continue;seen.add(cell);
    const [x,y]=cell.split(',').map(Number);for(const [a,b] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])queue.push(`${a},${b}`);
  }
  assert.equal(seen.size,cells.size);assert.ok(cells.has('10,6'));assert.equal(base.pathFrame(cells,10,9),'pathC');
  assert.equal(base.pathFrame(cells,12,9),'pathNE');assert.equal(base.pathFrame(cells,9,6),'pathNW');
  f.art.assets[1].complete=false;const before=f.images.length;assert.equal(f.art.background(f.ctx),false);assert.equal(f.images.length,before);
});
