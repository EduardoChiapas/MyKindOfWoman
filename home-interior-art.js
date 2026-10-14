/* Bitglow's licensed interior sheets, drawn at native integer scales for the HOME wing. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.HomeInteriorArt=factory(root);
})(typeof window==='object'?window:this,function makeInteriorArt(env){
  'use strict';
  const SOURCES=Object.freeze({
    livingroom:'assets/home/bitglow/livingroom_LRK.png',
    cabinets:'assets/home/bitglow/cabinets_LRK.png',
    windows:'assets/home/bitglow/doorswindowsstairs_LRK.png',
    decorations:'assets/home/bitglow/decorations_LRK.png',
    surfaces:'assets/home/bitglow/floorswalls_LRK.png',
    bathFixtures:'assets/home/bitglow/fixtures_BA.png',
    bathCabinets:'assets/home/bitglow/cabinets_BA.png',
    bathTextiles:'assets/home/bitglow/textiles_BA.png',
    beds:'assets/home/bitglow/beds_BR.png',
    bedroomDecorations:'assets/home/bitglow/decorations_BR.png',
    bedroomFurniture:'assets/home/bitglow/wardrobes_BR.png'
  });
  const sheetSizes=Object.freeze({livingroom:[624,416],cabinets:[752,405],windows:[736,256],decorations:[192,160],surfaces:[224,256],
    bathFixtures:[208,112],bathCabinets:[160,112],bathTextiles:[317,186],beds:[231,256],bedroomDecorations:[192,192],bedroomFurniture:[336,368]});
  const entry=(sheet,x,y,width,height)=>Object.freeze({sheet,x,y,width,height});
  // These are tight alpha bounds, never padded atlas cells or resampled crops.
  const frames=Object.freeze({
    bookcase:entry('cabinets',16,16,48,48),
    sofa:entry('livingroom',16,32,48,32),
    armchair:entry('livingroom',240,32,32,32),
    table:entry('livingroom',16,160,48,32),
    desk:entry('cabinets',528,32,48,25),
    console:entry('cabinets',624,32,48,25),
    window:entry('windows',208,17,48,30),
    windowNight:entry('windows',208,49,48,30),
    gardenWindow:entry('windows',208,177,48,30),
    chair:entry('livingroom',128,144,16,32),
    lamp:entry('decorations',48,15,16,47),
    gardenLamp:entry('decorations',16,16,16,46),
    sideLamp:entry('decorations',120,22,16,25),
    plant:entry('decorations',16,81,15,30),
    roundPlant:entry('decorations',80,80,16,31),
    picture:entry('decorations',112,96,32,16),
    flowerPicture:entry('decorations',112,64,32,16),
    clock:entry('decorations',16,128,16,16),
    roseFlower:entry('decorations',48,124,16,16),
    tallMirror:entry('decorations',160,64,16,46),
    bath:entry('bathFixtures',15,16,65,32),
    bathWater:entry('bathFixtures',15,64,65,32),
    basin:entry('bathFixtures',105,13,32,21),
    basinWater:entry('bathFixtures',105,61,32,21),
    toilet:entry('bathFixtures',165,16,22,44),
    whiteCabinet:entry('bathCabinets',16,76,32,20),
    tallCabinet:entry('bathCabinets',96,16,16,48),
    towel:entry('bathTextiles',176,112,16,32),
    bathMat:entry('bathTextiles',16,66,64,28),
    smallBathMat:entry('bathTextiles',16,32,32,16),
    cot:entry('beds',16,184,32,56),
    nightstand:entry('bedroomFurniture',160,20,16,20),
    bench:entry('bedroomFurniture',24,280,32,16),
    sunset:entry('bedroomDecorations',132,19,40,26),
    smallMirror:entry('bedroomDecorations',160,80,16,32),
    fairyLights:entry('bedroomDecorations',97,80,47,23),
    wallLamp:entry('bedroomDecorations',131,57,10,15),
    ovalRug:entry('bedroomDecorations',17,128,62,48),
    rug:entry('livingroom',16,256,64,32),
    roundRug:entry('livingroom',416,256,48,32),
    wallCream:entry('surfaces',32,32,16,16),
    wallMint:entry('surfaces',96,32,16,16),
    wallPink:entry('surfaces',32,176,16,16),
    wallSage:entry('surfaces',96,176,16,16),
    wallWhite:entry('surfaces',160,32,16,16),
    panelWhite:entry('surfaces',32,48,16,32),
    panelHoney:entry('surfaces',96,48,16,32),
    woodFloor:entry('surfaces',32,96,32,16),
    whiteFloor:entry('surfaces',96,96,32,16),
    darkWoodFloor:entry('surfaces',160,96,32,16),
    creamTile:entry('surfaces',32,192,32,32),
    sageTile:entry('surfaces',96,192,32,32),
    warmWood:entry('surfaces',16,80,64,48),
    whiteWood:entry('surfaces',80,80,64,48),
    mint:entry('surfaces',80,192,64,48),
    blushWall:entry('surfaces',32,176,16,16)
  });
  const part=(frame,x,y)=>Object.freeze({frame,x,y});
  // All three pieces have their authored silhouettes. The basin covers the cabinet's
  // top edge and its faucet sits in front of the mirror, as a real washstand would.
  const composite=(basin)=>Object.freeze({width:32,height:64,parts:Object.freeze([
    part('smallMirror',8,0),part('whiteCabinet',0,44),part(basin,0,28)
  ])});
  const composites=Object.freeze({washstand:composite('basin'),washstandWater:composite('basinWater')});
  const images={};
  for(const [id,src] of Object.entries(SOURCES)){
    if(typeof env?.Image==='function'){const image=new env.Image();image.src=src;images[id]=image;}
  }
  const kinds=Object.freeze({bookcase:'bookcase',chaise:'sofa',gameTable:'table',blindWindow:'window',desk:'desk',
    map:'flowerPicture',clock:'clock',hooks:'tallMirror',mailbox:'console',umbrella:'plant',
    bath:'bath',sink:'washstand',toilet:'toilet',towel:'towel',soap:'tallCabinet',
    beanbag:'armchair',recordPlayer:'lamp',origami:'picture',
    glass:'gardenWindow',bootrack:'bench',windchime:'gardenLamp',
    hammock:'cot',box:'nightstand',mobile:'fairyLights',flowerbed:'roseFlower',
    trellis:'roundPlant',gardenBench:'bench'});
  const integer=n=>Number.isFinite(n)&&Number.isInteger(n);
  const ratio=n=>Math.max(0,Math.min(1,Number(n)||0));
  function ready(frame){
    if(frame?.parts)return frame.parts.every(p=>ready(frames[p.frame]));
    const image=images[frame?.sheet];
    return Boolean(image&&image.complete&&(image.naturalWidth||image.width)>=frame.x+frame.width&&
      (image.naturalHeight||image.height)>=frame.y+frame.height);
  }
  function placement(prop,frameId,requestedScale){
    const f=frames[frameId]||composites[frameId];
    if(!f||!prop||![prop.x,prop.y,prop.width,prop.height].every(integer)||prop.width<=0||prop.height<=0)return null;
    const scale=requestedScale===undefined?Math.min(2,Math.floor(prop.width/f.width),Math.floor(prop.height/f.height)):requestedScale;
    if(![1,2].includes(scale)||f.width*scale>prop.width||f.height*scale>prop.height)return null;
    return {x:prop.x+Math.floor((prop.width-f.width*scale)/2),y:prop.y+prop.height-f.height*scale,
      width:f.width*scale,height:f.height*scale,scale,frame:f};
  }
  function drawFrame(ctx,frameId,x,y,scale=1){
    const f=frames[frameId]||composites[frameId];
    if(!f||!ready(f)||!ctx?.drawImage||![x,y].every(integer)||![1,2].includes(scale))return false;
    ctx.imageSmoothingEnabled=false;
    if(f.parts){
      for(const p of f.parts)drawFrame(ctx,p.frame,x+p.x*scale,y+p.y*scale,scale);
      return true;
    }
    const source=env?.HomeWingStyle?.adapted(images[f.sheet],f,frameId.startsWith('window')||frameId==='gardenWindow'?'window':frameId);
    if(source)ctx.drawImage(source,0,0,f.width,f.height,x,y,f.width*scale,f.height*scale);
    else ctx.drawImage(images[f.sheet],f.x,f.y,f.width,f.height,x,y,f.width*scale,f.height*scale);
    return true;
  }
  function draw(ctx,prop,state={}){
    const phase=ratio(state.phase),pulse=ratio(state.pulse);
    let frameId=kinds[prop?.kind];
    if(prop?.kind==='bath'&&(phase>=.5||pulse>.2))frameId='bathWater';
    if(prop?.kind==='sink'&&phase>=.5)frameId='washstandWater';
    const p=placement(prop,frameId,state.scale);
    if(!p||!ready(p.frame))return false;
    if(prop.kind==='chaise'&&pulse>.2&&p.y>prop.y)p.y--;
    if(!drawFrame(ctx,frameId,p.x,p.y,p.scale))return false;
    const s=p.scale,ink='#60402d',paper='#f2e5af',dark='#9c7651';
    const rect=(color,x,y,w,h)=>{
      if(!ctx.fillRect)return;
      const left=Math.max(0,Math.round(x)),top=Math.max(0,Math.round(y));
      const right=Math.min(p.frame.width,Math.round(x+w)),bottom=Math.min(p.frame.height,Math.round(y+h));
      if(right<=left||bottom<=top)return;
      ctx.fillStyle=color;ctx.fillRect(p.x+left*s,p.y+top*s,(right-left)*s,(bottom-top)*s);
    };
    // State accents remain sparse; the underlying furniture is always the original sprite.
    if(prop.kind==='gameTable'){
      for(const [x,y,c] of [[13,6,'#956ba5'],[20,6,'#b98868'],[27,6,'#75a290'],[34,6,'#956ba5']]){
        rect(ink,x,y,5,7);rect(paper,x+1,y+1,3,5);rect(c,x+2,y+2,1,3);
      }
      if(pulse>.3)rect('#f2db8e',17,13,15,1);
    }else if(prop.kind==='desk'&&state.claimed!==true){
      rect(ink,18,4,11,8);rect('#fff0ca',19,5,9,6);rect('#ac87b1',21,7,2,2);rect('#dfaaa3',25,7,2,2);
    }
    return true;
  }
  function tile(ctx,frameId,x,y,width,height,origin){
    const area=typeof x==='object'?x:{x,y,width,height};
    const f=frames[frameId];
    if(!f||!ready(f)||!ctx?.drawImage||!area||![area.x,area.y,area.width,area.height].every(integer)||area.width<=0||area.height<=0)return false;
    const anchor=origin||(typeof x==='object'&&typeof y==='object'?y:null);
    const originX=anchor?.x??area.originX??area.x,originY=anchor?.y??area.originY??area.y;
    if(![originX,originY].every(integer))return false;
    const modulo=(value,size)=>((value%size)+size)%size;
    ctx.imageSmoothingEnabled=false;
    // Shared native origins keep the room and its passage on the same pattern phase.
    // Initial and final fragments crop the sheet; pixels are never stretched.
    for(let yy=area.y;yy<area.y+area.height;){
      const phaseY=modulo(yy-originY,f.height),h=Math.min(f.height-phaseY,area.y+area.height-yy);
      for(let xx=area.x;xx<area.x+area.width;){
        const phaseX=modulo(xx-originX,f.width),w=Math.min(f.width-phaseX,area.x+area.width-xx);
        ctx.drawImage(images[f.sheet],f.x+phaseX,f.y+phaseY,w,h,xx,yy,w,h);
        xx+=w;
      }
      yy+=h;
    }
    return true;
  }
  return Object.freeze({draw,drawFrame,tile,placement,frames,composites,sources:SOURCES,sheetSizes,kinds,
    assets:Object.values(images),create:runtime=>makeInteriorArt(runtime)});
});
