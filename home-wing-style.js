/* The new wing uses HOME's native palette. Original room images are never modified. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.HomeWingStyle=factory(root);
})(typeof window==='object'?window:this,function makeWingStyle(env){
  'use strict';
  const palette=Object.freeze({ink:'#000000',cream:'#f6e7bd',floor:'#f5d79e',wood:'#c2854e',
    brown:'#b77f5b',deep:'#513001',shadow:'#97611a',gold:'#eaa335',
    leaf:'#64703b',moss:'#89914c',night:'#242f22',water:'#849ba6',lavender:'#b299c7'});
  const passage=Object.freeze({x:727,y:72,width:18,height:84,sourceX:667,sourceY:72});
  const sources=Object.freeze({wood:'assets/rooms/living_room.png',entrance:'assets/rooms/entrance.png',hallway:'assets/rooms/hallway.png'});
  const images={},cache=new WeakMap();
  for(const [key,src]of Object.entries(sources))if(typeof env?.Image==='function'){
    images[key]=new env.Image();images[key].src=src;
  }
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  const colors=Object.fromEntries(Object.entries(palette).map(([key,value])=>[key,rgb(value)]));
  function colorFor(r,g,b,role){
    const l=(r*3+g*6+b)/10,spread=Math.max(r,g,b)-Math.min(r,g,b);
    if(l<58)return colors.ink;
    if(role==='fairyLights'&&l>130)return l>200?colors.lavender:colors.gold;
    if(role==='window'&&(g>r+8||b>r+8))return l>155?rgb('#9ccfd0'):colors.leaf;
    if(['cot','fairyLights','ovalRug'].includes(role)&&(b>r+12||g>r+16))
      return l>165?colors.lavender:l>100?rgb('#806891'):colors.deep;
    if(['bathWater','basinWater','bathMat','towel','toilet','smallMirror'].includes(role)&&(b>r+15||g>r+22))
      return l>175?rgb('#c0cbd0'):l>110?colors.water:rgb('#4f6670');
    if(g>r+9&&g>b+3)return l>170?colors.moss:l>100?colors.leaf:colors.night;
    if(role==='roseFlower'&&r>g+8&&b>g+3)return l>180?rgb('#dfa7b2'):l>120?rgb('#c76f87'):rgb('#9b4863');
    if(l>215)return colors.cream;
    if(l>175)return colors.floor;
    if(l>135)return spread<20?colors.brown:colors.wood;
    if(l>95)return colors.shadow;
    return colors.deep;
  }
  function adapted(image,frame,role){
    if(!image?.complete||!image.naturalWidth||!env?.document?.createElement)return null;
    let entries=cache.get(image);if(!entries){entries=new Map();cache.set(image,entries);}
    const key=[role,frame.x,frame.y,frame.width,frame.height].join(':');
    if(entries.has(key))return entries.get(key);
    try{
      const canvas=env.document.createElement('canvas');canvas.width=frame.width;canvas.height=frame.height;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx){entries.set(key,null);return null;}
      ctx.imageSmoothingEnabled=false;
      ctx.drawImage(image,frame.x,frame.y,frame.width,frame.height,0,0,frame.width,frame.height);
      const pixels=ctx.getImageData(0,0,frame.width,frame.height),data=pixels.data;
      for(let i=0;i<data.length;i+=4){
        if(!data[i+3])continue;
        if(role==='candle'&&data[i]===246&&data[i+1]===231&&data[i+2]===189){data[i+3]=0;continue;}
        let value=colorFor(data[i],data[i+1],data[i+2],role);
        if(role==='window'&&(data[i+1]>data[i]+8||data[i+2]>data[i]+8)){
          const xx=(i/4)%frame.width,yy=Math.floor(i/4/frame.width);
          value=yy>=(xx<24?18-xx%6:12+xx%5)?colors.leaf:rgb('#9ccfd0');
        }
        data[i]=value[0];data[i+1]=value[1];data[i+2]=value[2];
      }
      ctx.putImageData(pixels,0,0);entries.set(key,canvas);return canvas;
    }catch(_error){
      // Some file:// browsers deny canvas reads. Keep the artist's complete sprite.
      entries.set(key,null);return null;
    }
  }
  const fill=(ctx,color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  function floor(ctx,x,y,w,h){
    const image=images.wood;
    if(!image?.complete||!image.naturalWidth){fill(ctx,palette.floor,x,y,w,h);return;}
    const mod=(n,s)=>((n%s)+s)%s;
    for(let yy=y;yy<y+h;){const py=mod(yy-74,30),sh=Math.min(30-py,y+h-yy);
      for(let xx=x;xx<x+w;){const px=mod(xx-18,280),sw=Math.min(280-px,x+w-xx);
        ctx.drawImage(image,20+px,100+py,sw,sh,xx,yy,sw,sh);xx+=sw;}
      yy+=sh;
    }
  }
  function wall(ctx,x,y,w,h){
    fill(ctx,palette.ink,x-1,y-1,w+2,h+1);fill(ctx,palette.cream,x,y,w,h);
    fill(ctx,palette.shadow,x,y+h-2,w,2);fill(ctx,palette.ink,x,y+h,w,1);
  }
  function corridorFloor(ctx,x,y,w,h){
    const image=images.hallway;
    if(!image?.complete||!image.naturalWidth){fill(ctx,'#e6f578',x,y,w,h);return;}
    const mod=(n,s)=>((n%s)+s)%s;
    for(let yy=y;yy<y+h;){const py=mod(yy-130,40),sh=Math.min(40-py,y+h-yy);
      for(let xx=x;xx<x+w;){const px=mod(745+xx-667,60),sw=Math.min(60-px,x+w-xx);
        ctx.drawImage(image,667+px,85+py,sw,sh,xx,yy,sw,sh);xx+=sw;}
      yy+=sh;
    }
  }
  function corridorWall(ctx,x,y,w,h){
    fill(ctx,palette.ink,x-1,y,w+2,h+1);fill(ctx,'#ebba43',x,y,w,h);
    fill(ctx,palette.deep,x,y+h-4,w,1);fill(ctx,'#e6f578',x,y+h-3,w,2);
    fill(ctx,palette.ink,x,y+h-1,w,1);
  }
  function doorway(ctx,e,top,paintFloor=floor){
    fill(ctx,palette.ink,e.x-3,top,e.width+6,e.y+e.height-top);
    fill(ctx,palette.shadow,e.x-2,top+1,e.width+4,e.y+e.height-top-1);
    fill(ctx,paintFloor===corridorFloor?'#e6f578':palette.floor,e.x,top+2,e.width,e.y+e.height-top-2);
    fill(ctx,paintFloor===corridorFloor?'#f1f6a0':palette.cream,e.x+1,top+3,e.width-2,e.y+e.height-top-4);
    fill(ctx,palette.gold,e.x+e.width-6,e.y+4,2,2);
    paintFloor(ctx,e.x,e.y+e.height-3,e.width,8);
  }
  function background(ctx,def,id){
    const w=def.nativeWidth,h=def.nativeHeight;fill(ctx,palette.ink,0,0,w,h);
    if(def.layout==='compactL'){
      // Paint the union of the actual L legs, not a rectangular room underneath it.
      corridorFloor(ctx,0,120,196,59);corridorFloor(ctx,144,66,52,113);corridorFloor(ctx,192,96,48,36);
      corridorWall(ctx,0,45,144,75);corridorWall(ctx,144,12,52,54);corridorWall(ctx,196,42,44,54);
      fill(ctx,palette.ink,0,179,196,1);fill(ctx,palette.deep,0,180,196,1);fill(ctx,'#ebba43',0,181,196,h-181);
      fill(ctx,palette.ink,196,132,44,1);fill(ctx,palette.deep,196,133,44,1);fill(ctx,'#ebba43',196,134,44,3);
      fill(ctx,palette.ink,196,66,1,30);fill(ctx,palette.deep,197,67,2,28);
      fill(ctx,palette.ink,196,133,1,46);
      doorway(ctx,def.exits.find(e=>e.target==='bathroom'),68,corridorFloor);
      doorway(ctx,def.exits.find(e=>e.target==='garden'),16,corridorFloor);
      return true;
    }
    if(id==='garden')return env?.HomeOutdoorArt?.background(ctx,def)===true;
    const bottom=h-26;wall(ctx,18,16,w-36,58);floor(ctx,18,74,w-36,bottom-74);
    fill(ctx,palette.ink,17,16,1,bottom-15);fill(ctx,palette.ink,w-18,16,1,bottom-15);
    fill(ctx,palette.shadow,18,bottom,w-36,3);fill(ctx,palette.ink,18,bottom-1,w-36,1);
    if(id==='bathroom'){
      // Small, quiet tiles; blue-gray is confined to water and textiles.
      fill(ctx,palette.floor,18,74,w-36,bottom-75);
      for(let y=77;y<bottom-1;y+=16){fill(ctx,'#bfa876',18,y,w-36,1);
        for(let x=18;x<w-18;x+=16)fill(ctx,'#bfa876',x,y+1,1,Math.min(15,bottom-y-2));}
    }
    for(const e of def.exits){
      if(e.dir==='down')floor(ctx,e.x-4,bottom,e.width+8,h-bottom);
      if(e.dir==='left'||e.dir==='right'){
        const x=e.dir==='left'?0:w-26;floor(ctx,x,e.y-4,26,e.height+8);
        wall(ctx,e.dir==='left'?0:w-14,e.y-30,14,26);
      }
    }
    for(const a of def.props.filter(p=>p.kind==='alcove')){
      floor(ctx,w-26,a.y-4,26,a.height+4);wall(ctx,w-14,a.y-30,14,26);
    }
    return true;
  }
  function draw(ctx,prop,state={}){
    const {x,y,width:w,height:h}=prop;
    if(prop.kind==='alcove'){
      // A real side threshold continues the room's planks. The gathered curtain
      // hangs on its far jamb; no black panel or inexplicable vertical handle.
      floor(ctx,x,y,w,h);
      fill(ctx,palette.ink,x+6,y,w-6,3);fill(ctx,palette.wood,x+7,y+1,w-8,2);
      fill(ctx,palette.ink,x+w-3,y+3,3,h-3);fill(ctx,palette.shadow,x+w-2,y+3,2,h-4);
      fill(ctx,palette.ink,x+6,y+3,2,9);fill(ctx,palette.wood,x+7,y+3,1,8);
      fill(ctx,palette.ink,x+9,y+2,12,7);fill(ctx,palette.cream,x+10,y+3,10,5);
      for(const [xx,yy,ww]of [[14,3,1],[13,4,3],[11,5,7],[12,6,5],[12,7,2],[15,7,2]])
        fill(ctx,palette.gold,x+xx,y+yy,ww,1);
      fill(ctx,palette.ink,x+w-10,y+9,7,20);fill(ctx,palette.lavender,x+w-9,y+10,5,17);
      fill(ctx,'#806891',x+w-8,y+11,1,15);fill(ctx,palette.cream,x+w-5,y+11,1,15);
      fill(ctx,palette.gold,x+w-9,y+22,5,2);fill(ctx,'#806891',x+w-9,y+27,2,2);
      fill(ctx,palette.ink,x+6,y+h-2,w-6,1);fill(ctx,palette.floor,x+7,y+h-1,w-8,1);
      return true;
    }
    if(['wallCandle','smallCandle'].includes(prop.kind)){
      return env?.HomeCandleArt?.draw(ctx,prop,state)===true;
    }
    if(prop.kind==='piano'){
      return env?.HomeRoomFurnishing?.draw(ctx,prop,state)===true;
    }
    if(prop.kind==='pottingBench'){
      fill(ctx,palette.ink,x,y+5,w,h-5);fill(ctx,palette.wood,x+1,y+6,w-2,h-7);
      fill(ctx,palette.shadow,x+2,y+8,w-4,h-13);fill(ctx,palette.deep,x+3,y+7,w-6,7);
      for(const xx of [7,18,29]){fill(ctx,palette.leaf,x+xx,y+2,1,9);
        fill(ctx,palette.moss,x+xx-2,y+3,2,2);fill(ctx,palette.leaf,x+xx+1,y,2,2);}
      fill(ctx,palette.floor,x+1,y+6,w-2,1);return true;
    }
    if(prop.kind==='box'){
      // Complete small chest, rather than an added rectangle across another piece of furniture.
      fill(ctx,palette.ink,x+2,y+5,w-4,h-5);fill(ctx,palette.ink,x,y+8,w,h-9);
      fill(ctx,palette.shadow,x+1,y+9,w-2,h-11);fill(ctx,palette.wood,x+3,y+6,w-6,3);
      fill(ctx,palette.floor,x+3,y+6,w-6,1);fill(ctx,palette.ink,x+1,y+11,w-2,1);
      fill(ctx,palette.gold,x+7,y+11,2,3);fill(ctx,palette.deep,x+2,y+h-2,w-4,1);return true;
    }
    if(prop.kind==='birdbath'){
      fill(ctx,palette.ink,x+5,y+2,w-10,h-2);fill(ctx,palette.ink,x+1,y+8,w-2,h-10);
      fill(ctx,'#8d8768',x+6,y+3,w-12,h-4);fill(ctx,'#8d8768',x+2,y+9,w-4,h-12);
      fill(ctx,'#b0a68b',x+8,y+4,w-18,2);fill(ctx,'#645f47',x+5,y+h-5,w-10,3);
      fill(ctx,palette.leaf,x+7,y+2,12,3);fill(ctx,palette.moss,x+9,y+1,7,2);return true;
    }
    if(prop.kind==='frog'){
      for(const [xx,yy]of [[0,8],[5,12]]){
        fill(ctx,palette.ink,x+xx+2,y+yy+3,2,7);fill(ctx,palette.cream,x+xx+2,y+yy+4,1,5);
        fill(ctx,palette.ink,x+xx,y+yy,6,4);fill(ctx,palette.wood,x+xx+1,y+yy+1,4,2);
        fill(ctx,palette.floor,x+xx+2,y+yy+1,1,1);
      }return true;
    }
    return false;
  }
  function hallwayPassage(ctx,image,view,scale=2){
    if(!image?.complete||!image.naturalWidth)return false;
    const p=passage;ctx.imageSmoothingEnabled=false;
    ctx.drawImage(image,p.sourceX,p.sourceY,p.width,p.height,
      Math.round(p.x*scale-view.x),Math.round(p.y*scale-view.y),p.width*scale,p.height*scale);
    return true;
  }
  return Object.freeze({palette,passage,sources,colorFor,adapted,floor,corridorFloor,background,draw,hallwayPassage,
    assets:Object.values(images),create:runtime=>makeWingStyle(runtime)});
});
