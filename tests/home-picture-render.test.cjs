'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const base=require('../home-picture-render.js'),root=path.resolve(__dirname,'..');
function png(relative){
  const buffer=fs.readFileSync(path.join(root,relative)),width=buffer.readUInt32BE(16),height=buffer.readUInt32BE(20),parts=[];
  assert.equal(buffer[24],8);assert.equal(buffer[25],6);
  for(let at=8;at<buffer.length;){const size=buffer.readUInt32BE(at),kind=buffer.toString('ascii',at+4,at+8);
    if(kind==='IDAT')parts.push(buffer.subarray(at+8,at+8+size));at+=size+12;}
  const raw=zlib.inflateSync(Buffer.concat(parts)),stride=width*4,data=new Uint8ClampedArray(stride*height);
  const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c;};
  for(let y=0;y<height;y++)for(let x=0;x<stride;x++){
    const offset=y*stride+x,a=x>=4?data[offset-4]:0,b=y?data[offset-stride]:0,c=x>=4&&y?data[offset-stride-4]:0,filter=raw[y*(stride+1)];
    assert.ok(filter<=4);data[offset]=(raw[y*(stride+1)+x+1]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;
  }
  return {complete:true,naturalWidth:width,naturalHeight:height,width,height,_pixels:data,src:relative};
}
const original=png('assets/rooms/hallway.png'),portrait=png('assets/lumo/portraits-original.png');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/lumo/manifest.json'),'utf8'));
function realm(){
  const canvases=[],draws=[],stats={reads:0,denied:false};
  const document={createElement(tag){
    assert.equal(tag,'canvas');let width=0,height=0;
    const canvas={ownerDocument:document,_pixels:new Uint8ClampedArray(0),calls:[]};
    for(const name of ['width','height'])Object.defineProperty(canvas,name,{get:()=>name==='width'?width:height,set:value=>{
      if(name==='width')width=value;else height=value;canvas._pixels=new Uint8ClampedArray(width*height*4);
    }});
    const context={imageSmoothingEnabled:true,drawImage(...args){
      canvas.calls.push(args);const [source,...values]=args;
      const [sx,sy,sw,sh,dx,dy,dw,dh]=values.length===8?values:[0,0,source.width||source.naturalWidth,source.height||source.naturalHeight,
        values[0],values[1],source.width||source.naturalWidth,source.height||source.naturalHeight];
      const sourceWidth=source.width||source.naturalWidth;
      for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){
        const from=(Math.floor(sy+(y+.5)*sh/dh)*sourceWidth+Math.floor(sx+(x+.5)*sw/dw))*4,to=((dy+y)*width+dx+x)*4;
        const alpha=source._pixels[from+3]/255;if(!alpha)continue;
        const oldAlpha=canvas._pixels[to+3]/255,outAlpha=alpha+oldAlpha*(1-alpha);
        for(let c=0;c<3;c++)canvas._pixels[to+c]=(source._pixels[from+c]*alpha+canvas._pixels[to+c]*oldAlpha*(1-alpha))/outAlpha;
        canvas._pixels[to+3]=outAlpha*255;
      }
    },getImageData(){stats.reads++;if(stats.denied)throw new Error('read denied');return {data:canvas._pixels.slice()};},
    putImageData(value){canvas._pixels=value.data.slice();}};
    canvas.getContext=()=>context;canvases.push(canvas);return canvas;
  }};
  class Image{set src(value){assert.equal(value,portrait.src);this.complete=true;
    this.naturalWidth=portrait.naturalWidth;this.naturalHeight=portrait.naturalHeight;this.width=portrait.width;this.height=portrait.height;
    this._pixels=portrait._pixels.slice();this._src=value;}get src(){return this._src;}}
  const art=base.create({Image,document,LUMO_ASSETS:manifest});
  const ctx={canvas:{ownerDocument:document},imageSmoothingEnabled:true,drawImage(...args){draws.push(args);}};
  const source={...original,_pixels:original._pixels.slice()};
  return {art,ctx,source,canvases,draws,document,stats};
}
function composite(f){
  const canvas=f.document.createElement('canvas');canvas.width=original.width;canvas.height=original.height;
  const ctx=canvas.getContext('2d');ctx.drawImage(f.source,0,0);for(const args of f.draws)ctx.drawImage(...args);return canvas._pixels;
}

test('the existing frame and Lumo portrait retain their original bytes and the declared portrait crop',()=>{
  const hashes={'assets/rooms/hallway.png':'804d6eb17e358d36149e1189ab15ebf26a1250c26fb98c91c752cf1dbec559bf',
    'assets/lumo/portraits-original.png':'b061a20b4eca2594c42056a08c56d699643ef615348952e281d847219e7efae4'};
  for(const [name,hash]of Object.entries(hashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex'),hash);
  const f=realm();assert.deepEqual(f.art.portrait,manifest.portraits.emotions.NORMAL);
  assert.deepEqual(f.art.frame,{x:249,y:26,width:51,height:27});assert.deepEqual(f.art.fit(f.art.portrait.rect),{x:15,y:4,width:21,height:18});
  assert.equal(f.art.assets.length,1);assert.equal(f.art.assets[0].src,portrait.src);
});

test('only blank pixels inside the original frame change: no flowers, stems, edges, room pixels or background rectangle are covered',()=>{
  const f=realm(),before=f.source._pixels.slice();assert.equal(f.art.draw(f.ctx,'hallway',f.source),true);
  const after=composite(f),frame=f.art.frame;let changed=0,blank=0;
  for(let y=0;y<original.height;y++)for(let x=0;x<original.width;x++){
    const offset=(y*original.width+x)*4,inside=x>=frame.x&&x<frame.x+frame.width&&y>=frame.y&&y<frame.y+frame.height;
    const isBlank=inside&&f.art.blank.every((channel,c)=>before[offset+c]===channel);
    if(isBlank)blank++;
    if(before.slice(offset,offset+4).some((channel,c)=>after[offset+c]!==channel)){
      changed++;assert.ok(isBlank,`No new paint over original foreground at ${x},${y}`);
    }
  }
  assert.equal(blank,851);assert.ok(changed>150&&changed<378,'A recognizable portrait changes a small part of the intact frame');
  assert.deepEqual(f.source._pixels,before,'Source pixels are read, never rewritten');
  const patch=f.draws[0][0];assert.equal(patch.width,51);assert.equal(patch.height,27);
  assert.deepEqual(f.draws[0].slice(1),[249,26]);assert.equal(f.ctx.imageSmoothingEnabled,true);
});

test('portrait pixels come from one proportional nearest-neighbor sample of the original art without invented faces or accents',()=>{
  const f=realm();f.art.draw(f.ctx,'hallway',f.source);
  const mask=f.canvases[0],sample=f.canvases[1];
  assert.deepEqual(mask.calls[0].slice(1),[249,26,51,27,0,0,51,27]);
  assert.deepEqual(sample.calls[0].slice(1),[38,72,300,252,15,4,21,18]);
  assert.equal(sample.calls.length,1);assert.equal(sample.getContext('2d').imageSmoothingEnabled,false);
  for(let y=0;y<18;y++)for(let x=0;x<21;x++){
    const offset=((y+4)*51+x+15)*4;if(!sample._pixels[offset+3])continue;
    const sourceOffset=((72+Math.floor((y+.5)*252/18))*portrait.width+38+Math.floor((x+.5)*300/21))*4;
    assert.deepEqual(sample._pixels.slice(offset,offset+4),portrait._pixels.slice(sourceOffset,sourceOffset+4),
      'The actual authored portrait pixels, including their source alpha, are kept');
  }
});

test('the original source mask also protects a foreground detail placed inside the portrait silhouette',()=>{
  const f=realm(),offset=(39*original.width+275)*4;
  f.source._pixels.set([233,77,42,255],offset);f.art.draw(f.ctx,'hallway',f.source);
  assert.deepEqual(Array.from(composite(f).slice(offset,offset+4)),[233,77,42,255]);
});

test('samples are cached after loading; pending sources retry and a changed source identity invalidates the sample',()=>{
  const f=realm();f.source.complete=false;
  assert.equal(f.art.draw(f.ctx,'hallway',f.source),false);assert.equal(f.canvases.length,0);
  f.source.complete=true;f.art.assets[0].complete=false;assert.equal(f.art.draw(f.ctx,'hallway',f.source),false);
  f.art.assets[0].complete=true;assert.equal(f.art.draw(f.ctx,'hallway',f.source),true);
  for(let n=0;n<30;n++)assert.equal(f.art.draw(f.ctx,'hallway',f.source),true);
  assert.equal(f.canvases.length,2);assert.equal(f.stats.reads,2);
  f.source.src+='?updated';assert.equal(f.art.draw(f.ctx,'hallway',f.source),true);assert.equal(f.canvases.length,4);
});

test('other rooms and unreadable or undersized sources preserve the intact original instead of drawing placeholders',()=>{
  const f=realm();for(const room of ['friskRoom','livingRoom','torielRoom','basement','readingRoom','fnf'])assert.equal(f.art.draw(f.ctx,room,f.source),false);
  assert.equal(f.art.draw(f.ctx,'hallway',{...f.source,naturalWidth:200}),false);assert.equal(f.draws.length,0);
  f.stats.denied=true;assert.equal(f.art.draw(f.ctx,'hallway',f.source),false);assert.equal(f.art.draw(f.ctx,'hallway',f.source),false);
  assert.equal(f.stats.reads,1,'A denied canvas read is not retried every rendered frame');assert.equal(f.draws.length,0);
  const empty=base.create({document:f.document});assert.equal(empty.draw(f.ctx,'hallway',f.source),false);assert.equal(empty.assets.length,0);
});
