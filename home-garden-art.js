/* Original Autumn Forest sprites by Marie Pepo, integrated only in HOME's new garden. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.HomeGardenArt=factory(root);
})(typeof window==='object'?window:this,function makeGardenArt(env){
  'use strict';
  const sources=Object.freeze({objects:'assets/home/marie-pepo/Autumn_Forest_Objects.png',terrain:'assets/home/marie-pepo/Autumn_Forest_Tiles.png'});
  const sheetSizes=Object.freeze({objects:[640,640],terrain:[640,320]});
  const entry=(sheet,x,y,width,height)=>Object.freeze({sheet,x,y,width,height});
  const frames=Object.freeze({
    treeGreen:entry('objects',327,3,67,151),bench:entry('objects',400,377,48,34),
    mossRock:entry('objects',403,65,60,46),stumpMoss:entry('objects',34,374,28,26),
    mushrooms:entry('objects',17,440,11,22),pumpkinPatch:entry('objects',0,480,64,46),
    pumpkinGrowing:entry('objects',2,530,29,28),signpost:entry('objects',373,372,24,44),
    grass:entry('terrain',176,0,16,16),grassPatch:entry('terrain',224,64,16,16),
    pathNW:entry('terrain',176,16,16,16),pathN:entry('terrain',192,16,16,16),pathNE:entry('terrain',208,16,16,16),
    pathW:entry('terrain',176,32,16,16),pathC:entry('terrain',192,32,16,16),pathE:entry('terrain',208,32,16,16),
    pathSW:entry('terrain',176,48,16,16),pathS:entry('terrain',192,48,16,16),pathSE:entry('terrain',208,48,16,16)
  });
  const kinds=Object.freeze({trellis:'treeGreen',gardenBench:'bench',birdbath:'mossRock',frog:'mushrooms',
    pottingBench:'pumpkinPatch',wateringCan:'signpost',treeGreen:'treeGreen',mossRock:'mossRock',stumpMoss:'stumpMoss',
    mushrooms:'mushrooms',pumpkinPatch:'pumpkinPatch',pumpkinGrowing:'pumpkinGrowing',signpost:'signpost'});
  const images={};
  for(const [id,src] of Object.entries(sources))if(typeof env?.Image==='function'){
    const image=new env.Image();image.src=src;images[id]=image;
  }
  const integer=n=>Number.isFinite(n)&&Number.isInteger(n);
  function ready(frame){
    const image=images[frame?.sheet];
    return Boolean(image&&image.complete&&image.naturalWidth>=frame.x+frame.width&&image.naturalHeight>=frame.y+frame.height);
  }
  function placement(prop,frameId,requestedScale){
    const frame=frames[frameId];
    if(!frame||!prop||![prop.x,prop.y,prop.width,prop.height].every(integer)||prop.width<=0||prop.height<=0)return null;
    const scale=requestedScale===undefined?Math.min(2,Math.floor(prop.width/frame.width),Math.floor(prop.height/frame.height)):requestedScale;
    if(![1,2].includes(scale)||frame.width*scale>prop.width||frame.height*scale>prop.height)return null;
    return {x:prop.x+Math.floor((prop.width-frame.width*scale)/2),y:prop.y+prop.height-frame.height*scale,
      width:frame.width*scale,height:frame.height*scale,scale,frame};
  }
  function drawFrame(ctx,frameId,x,y,scale=1){
    const frame=frames[frameId];
    if(!frame||!ready(frame)||!ctx?.drawImage||![x,y].every(integer)||![1,2].includes(scale))return false;
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(images[frame.sheet],frame.x,frame.y,frame.width,frame.height,x,y,frame.width*scale,frame.height*scale);
    return true;
  }
  function draw(ctx,prop,state={}){
    const id=kinds[prop?.kind],p=placement(prop,id,state.scale);
    return Boolean(p&&drawFrame(ctx,id,p.x,p.y,p.scale));
  }
  function tile(ctx,frameId,x,y,width,height,origin){
    const area=typeof x==='object'?x:{x,y,width,height},frame=frames[frameId];
    if(!frame||!ready(frame)||!ctx?.drawImage||!area||![area.x,area.y,area.width,area.height].every(integer)||area.width<=0||area.height<=0)return false;
    const anchor=origin||(typeof x==='object'&&typeof y==='object'?y:null);
    const ox=anchor?.x??area.originX??area.x,oy=anchor?.y??area.originY??area.y;
    if(![ox,oy].every(integer))return false;
    const modulo=(n,size)=>((n%size)+size)%size;
    ctx.imageSmoothingEnabled=false;
    for(let yy=area.y;yy<area.y+area.height;){
      const sy=modulo(yy-oy,frame.height),h=Math.min(frame.height-sy,area.y+area.height-yy);
      for(let xx=area.x;xx<area.x+area.width;){
        const sx=modulo(xx-ox,frame.width),w=Math.min(frame.width-sx,area.x+area.width-xx);
        ctx.drawImage(images[frame.sheet],frame.x+sx,frame.y+sy,w,h,xx,yy,w,h);xx+=w;
      }
      yy+=h;
    }
    return true;
  }
  function pathCells(){
    const cells=new Set();
    // One joined three-tile-wide route; shared edges do not overwrite intersections with grass.
    for(let y=9;y<=11;y++)for(let x=-1;x<=12;x++)cells.add(`${x},${y}`);
    for(let y=6;y<=8;y++)for(let x=9;x<=11;x++)cells.add(`${x},${y}`);
    return cells;
  }
  function pathFrame(cells,x,y){
    const n=!cells.has(`${x},${y-1}`),s=!cells.has(`${x},${y+1}`),w=!cells.has(`${x-1},${y}`),e=!cells.has(`${x+1},${y}`);
    return n?(w?'pathNW':e?'pathNE':'pathN'):s?(w?'pathSW':e?'pathSE':'pathS'):w?'pathW':e?'pathE':'pathC';
  }
  function background(ctx,def={}){
    const width=def.nativeWidth||320,height=def.nativeHeight||240;
    if(![width,height].every(integer)||width<64||height<64||!ready(frames.grass)||!ctx?.drawImage||
      !['save','restore','beginPath','rect','clip'].every(key=>typeof ctx[key]==='function'))return false;
    ctx.save();ctx.beginPath();ctx.rect(18,16,width-36,height-38);ctx.rect(0,150,26,42);ctx.clip();
    tile(ctx,'grass',0,0,width,height,{x:0,y:0});
    // Sparse patches use complete authored terrain, with the same native palette and no colored grid overlays.
    for(const [x,y] of [[96,32],[208,48],[224,112],[48,208]])tile(ctx,'grassPatch',x,y,16,16,{x,y});
    const cells=pathCells();
    for(const cell of cells){const [x,y]=cell.split(',').map(Number);drawFrame(ctx,pathFrame(cells,x,y),x*16,y*16);}
    ctx.restore();return true;
  }
  return Object.freeze({sources,sheetSizes,frames,kinds,assets:Object.values(images),draw,drawFrame,tile,placement,
    pathCells,pathFrame,background,create:runtime=>makeGardenArt(runtime)});
});
