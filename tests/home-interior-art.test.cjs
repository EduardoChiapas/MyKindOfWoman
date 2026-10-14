'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto'),zlib=require('node:zlib'),base=require('../home-interior-art.js');
const root=path.resolve(__dirname,'..');
const hashes={livingroom:'837d60c522af8073636c1737f2e9683011e19725da84430bd0229271aa688b53',
  cabinets:'8f37a86199c0e634c55697294def878a00dc2ef55c8fa616086218a2d11d6f45',
  windows:'424c195ee117a144fa4519372fea8b5bbe61b6f0d0e9984fc92191c1947777b4',
  decorations:'cdf81b59aba819cdd28b304755bc914048f02d7df1b7583bdf2a0c5f10a3bb12',
  surfaces:'65089201a5b2ee8736667cca58982919834e1c38caa84cd2cdc83df3158f906f',
  bathFixtures:'77a79cf8250ed62f29f15d3dd20a92255ddb40a0dfb7c1df157bade554123fa5',
  bathCabinets:'09babd7df812df23e3d55f91834c279d25998b9179158d621083f865d49c53da',
  bathTextiles:'168f3896a84d26e77c3c646a20c72772ca7062cb8ee3d22b392e8644a4c0ebd1',
  beds:'83a6ba4be678985cd1ab5ad498884c1af408525a2052c1ab304fb83bded867df',
  bedroomDecorations:'e28b04578eb15dd25dbe25323e09043a42942cd3cec1e7ff7d1b185f9a382d46',
  bedroomFurniture:'09b41dd161e996ba8b03d3adaf81e31f188f721f167d4642b83e95b902cb28c0'};
function pixels(buffer){
  const width=buffer.readUInt32BE(16),height=buffer.readUInt32BE(20),parts=[];
  assert.equal(buffer[24],8);assert.equal(buffer[25],6,'Source stays RGBA rather than an opaque regenerated atlas');
  for(let offset=8;offset<buffer.length;){const size=buffer.readUInt32BE(offset),kind=buffer.toString('ascii',offset+4,offset+8);
    if(kind==='IDAT')parts.push(buffer.subarray(offset+8,offset+8+size));offset+=size+12;}
  const raw=zlib.inflateSync(Buffer.concat(parts)),stride=width*4,data=Buffer.alloc(stride*height);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];
    for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=4?data[i-4]:0,b=y?data[i-stride]:0,c=x>=4&&y?data[i-stride-4]:0;
      const predictors=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)];
      assert.ok(filter<=4);data[i]=(raw[y*(stride+1)+1+x]+predictors[filter])&255;}}
  return {width,height,alpha:(x,y)=>data[(y*width+x)*4+3]};
}
function fixture(){
  const bySrc=Object.fromEntries(Object.entries(base.sources).map(([key,src])=>[src,base.sheetSizes[key]]));
  class Image{set src(value){this._src=value;this.complete=true;[this.naturalWidth,this.naturalHeight]=bySrc[value];}get src(){return this._src;}}
  const art=base.create({Image}),images=[],strokes=[];
  const ctx={imageSmoothingEnabled:true,fillStyle:'',drawImage(...args){images.push(args);},fillRect(...args){strokes.push([this.fillStyle,...args]);}};
  return {art,ctx,images,strokes};
}

test('the licensed sheets keep their exact original bytes and every declared crop stays inside its sheet',()=>{
  for(const [key,src] of Object.entries(base.sources)){
    const buffer=fs.readFileSync(path.join(root,src));
    assert.equal(crypto.createHash('sha256').update(buffer).digest('hex'),hashes[key]);
    assert.deepEqual([buffer.readUInt32BE(16),buffer.readUInt32BE(20)],base.sheetSizes[key]);
  }
  for(const [id,f] of Object.entries(base.frames)){
    const [width,height]=base.sheetSizes[f.sheet];
    assert.ok([f.x,f.y,f.width,f.height].every(Number.isInteger),id);
    assert.ok(f.x>=0&&f.y>=0&&f.width>0&&f.height>0&&f.x+f.width<=width&&f.y+f.height<=height,id);
  }
});

test('main furniture crops contain the complete original silhouettes without a neighboring sprite',()=>{
  const expected={bookcase:2284,sofa:1380,armchair:870,table:1502,desk:1172,window:1438,
    bath:1894,basin:513,toilet:792,cot:1736,nightstand:284,fairyLights:237,smallMirror:392,console:1172,towel:331};
  const sheets={};
  for(const [id,opaqueCount] of Object.entries(expected)){
    const f=base.frames[id],sheet=sheets[f.sheet]||(sheets[f.sheet]=pixels(fs.readFileSync(path.join(root,base.sources[f.sheet]))));
    let count=0;const sides=[false,false,false,false];
    for(let y=0;y<f.height;y++)for(let x=0;x<f.width;x++)if(sheet.alpha(f.x+x,f.y+y)){
      count++;if(x===0)sides[0]=true;if(x===f.width-1)sides[1]=true;if(y===0)sides[2]=true;if(y===f.height-1)sides[3]=true;
    }
    assert.equal(count,opaqueCount,id);assert.deepEqual(sides,[true,true,true,true],`${id}: tight native bounds`);
  }
});

test('furniture preserves its source aspect ratio at native 1x or 2x scales in every state',()=>{
  for(const [kind,frameId] of Object.entries(base.kinds))for(const scale of [1,2])for(const phase of [0,.13,.7,1]){
    const f=fixture(),frame=base.frames[frameId]||base.composites[frameId],prop={kind,x:11,y:17,width:frame.width*scale+7,height:frame.height*scale+9};
    assert.equal(f.art.draw(f.ctx,prop,{phase,pulse:.65,scale,claimed:false}),true);
    assert.equal(f.ctx.imageSmoothingEnabled,false);
    for(const args of f.images){
      assert.deepEqual(args.slice(7),[args[3]*scale,args[4]*scale]);
      assert.ok(Object.values(base.frames).some(crop=>[crop.x,crop.y,crop.width,crop.height].every((v,i)=>v===args[i+1])),kind);
    }
    for(const [x,y,w,h] of [...f.images.map(args=>args.slice(5)),...f.strokes.map(s=>s.slice(1))]){
      assert.ok([x,y,w,h].every(Number.isInteger),kind);
      assert.ok(x>=prop.x&&y>=prop.y&&x+w<=prop.x+prop.width&&y+h<=prop.y+prop.height,kind);
    }
  }
});

test('a missing or incomplete sheet does not draw an empty object and is retried after it loads',()=>{
  const f=fixture(),prop={kind:'bookcase',x:0,y:0,width:63,height:61},image=f.art.assets.find(a=>a.src===base.sources.cabinets);
  image.complete=false;assert.equal(f.art.draw(f.ctx,prop,{phase:1}),false);assert.equal(f.images.length,0);assert.equal(f.strokes.length,0);
  image.complete=true;image.naturalWidth=0;assert.equal(f.art.draw(f.ctx,prop),false);
  image.naturalWidth=752;assert.equal(f.art.draw(f.ctx,prop),true);assert.equal(f.images.length,1);
});

test('unrecognized objects and undersized or fractional rectangles keep the caller fallback',()=>{
  const f=fixture();
  for(const prop of [{kind:'unsupportedObject',x:0,y:0,width:48,height:48},{kind:'desk',x:0,y:0,width:47,height:39},
    {kind:'bookcase',x:.5,y:0,width:63,height:61},{kind:'bookcase',x:0,y:0,width:47,height:61}])assert.equal(f.art.draw(f.ctx,prop),false);
  assert.equal(f.art.drawFrame(f.ctx,'sofa',0,0,1.5),false);
  assert.equal(f.art.drawFrame(f.ctx,'sofa',.5,0,1),false);assert.equal(f.images.length,0);
});

test('partial floor tiles crop source pixels without stretching them or bleeding across the room border',()=>{
  const f=fixture(),area={x:18,y:74,width:83,height:77};
  assert.equal(f.art.tile(f.ctx,'warmWood',area.x,area.y,area.width,area.height),true);
  assert.ok(f.images.length>1);assert.equal(f.ctx.imageSmoothingEnabled,false);
  for(const args of f.images){const [sx,sy,sw,sh,x,y,w,h]=args.slice(1);
    assert.deepEqual([sw,sh],[w,h]);assert.ok([sx,sy,sw,sh,x,y,w,h].every(Number.isInteger));
    assert.ok(sx>=16&&sy>=80&&sx+sw<=80&&sy+sh<=128);
    assert.ok(x>=area.x&&y>=area.y&&x+w<=area.x+area.width&&y+h<=area.y+area.height);
  }
  assert.equal(f.art.tile(f.ctx,'missing',area),false);assert.equal(f.art.tile(f.ctx,'warmWood',{...area,width:0}),false);
});

test('the authored furniture never receives fake book or blind overlays and a collected desk drawing stays absent',()=>{
  const draw=(kind,state)=>{const f=fixture();assert.equal(f.art.draw(f.ctx,{kind,x:0,y:0,width:96,height:96},state),true);return f.strokes;};
  assert.deepEqual(draw('bookcase',{phase:0}),draw('bookcase',{phase:1}),'The bookshelf no longer gets a fake book painted across its original spines');
  assert.deepEqual(draw('blindWindow',{phase:0}),draw('blindWindow',{phase:1}),'The window keeps its original authored pixels');
  assert.equal(draw('desk',{claimed:true}).length,0);assert.ok(draw('desk',{claimed:false}).length>0);
});

test('bath and washstand water states use the artist variants without painting extra pixels',()=>{
  for(const kind of ['bath','sink']){
    const closed=fixture(),open=fixture(),prop={kind,x:11,y:17,width:96,height:80};
    assert.equal(closed.art.draw(closed.ctx,prop,{phase:0}),true);
    assert.equal(open.art.draw(open.ctx,prop,{phase:1}),true);
    assert.equal(closed.strokes.length,0);assert.equal(open.strokes.length,0);
    const a=closed.images.at(-1),b=open.images.at(-1);
    assert.notDeepEqual(a.slice(1,5),b.slice(1,5));assert.deepEqual(a.slice(5),b.slice(5));
    if(kind==='sink')assert.equal(open.images.length,3,'The washstand uses complete mirror, cabinet and basin sprites');
  }
});

test('washstand is drawn only when every constituent sprite is ready',()=>{
  const f=fixture(),prop={kind:'sink',x:11,y:17,width:32,height:64};
  const mirrorSheet=f.art.assets.find(a=>a.src===base.sources.bedroomDecorations);
  mirrorSheet.complete=false;assert.equal(f.art.draw(f.ctx,prop,{phase:1}),false);
  assert.equal(f.images.length,0,'No partial cabinet without the actual mirror');
  mirrorSheet.complete=true;assert.equal(f.art.draw(f.ctx,prop,{phase:1}),true);
  assert.equal(f.images.length,3);
  assert.deepEqual(f.images.map(args=>args.slice(5)),[[19,17,16,32],[11,61,32,20],[11,45,32,21]]);
});

test('a room and its side passage share the exact source pixel phase at every overlap',()=>{
  function sourceAt(draws,x,y){
    const args=draws.find(a=>x>=a[5]&&y>=a[6]&&x<a[5]+a[7]&&y<a[6]+a[8]);
    assert.ok(args,`Painted pixel ${x},${y}`);return [args[1]+x-args[5],args[2]+y-args[6]];
  }
  for(const [key,origin,room,passage] of [
    ['warmWood',{x:18,y:74},{x:18,y:74,width:284,height:140},{x:0,y:124,width:26,height:42}],
    ['panelWhite',{x:18,y:48},{x:18,y:48,width:284,height:26},{x:0,y:48,width:26,height:26}]
  ]){
    const main=fixture(),side=fixture();
    assert.equal(main.art.tile(main.ctx,key,room.x,room.y,room.width,room.height,origin),true);
    assert.equal(side.art.tile(side.ctx,key,{...passage,originX:origin.x,originY:origin.y}),true);
    for(let y=Math.max(room.y,passage.y);y<Math.min(room.y+room.height,passage.y+passage.height);y++)
      for(let x=Math.max(room.x,passage.x);x<Math.min(room.x+room.width,passage.x+passage.width);x++)
        assert.deepEqual(sourceAt(main.images,x,y),sourceAt(side.images,x,y),`${key}: continuous native pattern`);
    const frame=base.frames[key];
    for(const args of [...main.images,...side.images]){
      assert.ok(args.slice(1).every(Number.isInteger));assert.deepEqual(args.slice(3,5),args.slice(7));
      assert.ok(args[1]>=frame.x&&args[2]>=frame.y&&args[1]+args[3]<=frame.x+frame.width&&args[2]+args[4]<=frame.y+frame.height);
    }
  }
  const f=fixture();assert.equal(f.art.tile(f.ctx,'warmWood',0,0,10,10,{x:.5,y:0}),false);
});
