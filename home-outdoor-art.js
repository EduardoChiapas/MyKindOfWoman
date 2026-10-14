/* Sunny HOME courtyard. Marie Pepo's authored terrain/trees, native pixel scenery and bounded motion. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.HomeOutdoorArt=factory(root);
})(typeof window==='object'?window:this,function makeOutdoor(env){
  'use strict';
  const art=()=>env?.HomeGardenArt;
  const fill=(ctx,c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const time=s=>s?.motion===false?0:(Number(s?.time)||0)/1000;
  const frame=Object.freeze({green:{x:327,y:3,width:67,height:151},gold:{x:247,y:3,width:67,height:151}});
  let staticLayer=null,staticKey='';
  function ellipse(ctx,c,x,y,w,h){
    for(let yy=0;yy<h;yy++){
      const n=(yy+.5-h/2)/(h/2),span=Math.max(1,Math.round(w*Math.sqrt(Math.max(0,1-n*n))));
      fill(ctx,c,x+Math.floor((w-span)/2),y+yy,span,1);
    }
  }
  function hill(ctx,c,start,end,top,phase){
    for(let x=start;x<end;x+=4){const yy=Math.round(top+Math.sin(x/48+phase)*9+Math.sin(x/91)*4);
      fill(ctx,c,x,yy,Math.min(4,end-x),100-yy);}
  }
  function fence(ctx,w){
    fill(ctx,'#543d32',12,96,w-24,2);fill(ctx,'#b58d60',12,97,w-24,3);
    fill(ctx,'#543d32',12,106,w-24,2);fill(ctx,'#a4774d',12,107,w-24,2);
    for(let x=12;x<w-10;x+=24){fill(ctx,'#503c30',x,90,5,25);fill(ctx,'#c69b6b',x+1,92,3,22);fill(ctx,'#dfb67b',x+1,91,3,2);}
  }
  function path(ctx,x,y,w,h){
    if(art()?.tile(ctx,'pathC',x,y,w,h,{x:176,y:128}))return;
    fill(ctx,'#d4a879',x,y,w,h);
  }
  function paintStatic(ctx,def){
    const w=def.nativeWidth,h=def.nativeHeight;
    fill(ctx,'#91cde1',0,0,w,h);fill(ctx,'#b4dfdf',0,50,w,44);
    ellipse(ctx,'#f3dda1',286,12,36,36);ellipse(ctx,'#ffe7a6',289,15,30,30);ellipse(ctx,'#fff1c3',293,18,14,8);
    hill(ctx,'#91b4a0',0,w,63,.4);hill(ctx,'#719b80',0,w,76,1.7);
    fill(ctx,'#3d6b51',0,91,w,h-91);
    art()?.tile(ctx,'grass',0,92,w,h-92,{x:0,y:92});
    // Connected authored edge tiles give the terrace a grass border, including at its junctions.
    const cells=new Set();
    for(let yy=8;yy<=12;yy++)for(let xx=8;xx<=14;xx++)cells.add(`${xx},${yy}`);
    for(let yy=11;yy<=12;yy++)for(let xx=7;xx<=15;xx++)cells.add(`${xx},${yy}`);
    for(let yy=13;yy<Math.ceil(h/16);yy++)for(let xx=11;xx<=12;xx++)cells.add(`${xx},${yy}`);
    for(const cell of cells){const [xx,yy]=cell.split(',').map(Number),g=art();
      if(!g?.drawFrame(ctx,g.pathFrame(cells,xx,yy),xx*16,yy*16,1))path(ctx,xx*16,yy*16,16,16);}
    for(const [xx,yy]of [[96,156],[288,126],[64,220],[304,224]])art()?.tile(ctx,'grassPatch',xx,yy,16,16,{x:xx,y:yy});
    fence(ctx,w);
    // House-side edging and two short steps identify the only exit.
    fill(ctx,'#4d392c',0,h-10,178,10);fill(ctx,'#4d392c',206,h-10,w-206,10);
    fill(ctx,'#b38d62',178,h-12,28,12);fill(ctx,'#f0d1a0',178,h-12,28,2);fill(ctx,'#6f5339',178,h-6,28,1);
    // A few authored wildflowers decorate borders, rather than covering the route.
    for(const [xx,yy]of [[66,119],[273,119],[88,218],[313,219]]){
      fill(ctx,'#365143',xx+2,yy+4,1,6);fill(ctx,'#99b56b',xx,yy+5,2,1);
      fill(ctx,'#ebc896',xx,yy+1,5,3);fill(ctx,'#fcdfad',xx+1,yy,3,5);fill(ctx,'#b88369',xx+2,yy+2,1,1);
    }
  }
  function cloud(ctx,x,y){
    const f=(c,xx,yy,w,h)=>fill(ctx,c,x+xx,y+yy,w,h);
    f('#d9eeee',2,8,42,7);f('#e9f5e9',0,8,42,4);f('#e9f5e9',7,3,28,8);
    f('#f7f8df',12,0,12,11);f('#f7f8df',26,4,9,5);f('#f7f8df',6,7,31,3);
  }
  function background(ctx,def,state={}){
    if(!ctx?.fillRect)return false;
    const ready=art()?.assets?.every(image=>image.complete&&image.naturalWidth>0),key=def.nativeWidth+':'+def.nativeHeight;
    if(ready&&env?.document?.createElement&&(!staticLayer||key!==staticKey)){
      const canvas=env.document.createElement('canvas');canvas.width=def.nativeWidth;canvas.height=def.nativeHeight;
      const painter=canvas.getContext?.('2d');
      if(painter?.drawImage){painter.imageSmoothingEnabled=false;paintStatic(painter,def);staticLayer=canvas;staticKey=key;}
    }
    if(staticLayer&&staticKey===key)ctx.drawImage(staticLayer,0,0);else paintStatic(ctx,def);
    const t=time(state),w=def.nativeWidth;
    cloud(ctx,Math.round((30+t*1.3)%(w+60))-40,25);
    cloud(ctx,Math.round((177+t*.8)%(w+60))-15,10);
    cloud(ctx,Math.round((331+t*.6)%(w+60))-15,47);
    // Two distant birds travel across the sky on integer pixels.
    const bx=Math.round((90+t*5)%(w+30))-10,by=40+Math.round(Math.sin(t*.7)*2);
    const flap=Math.floor(t*4)%2;
    for(const d of [0,15]){fill(ctx,'#5c8086',bx+d,by+flap,2,1);fill(ctx,'#5c8086',bx+d+3,by+1-flap,2,1);}
    return true;
  }
  function tree(ctx,p,state){
    const g=art(),sheet=g?.assets?.find(image=>image.src?.endsWith('Autumn_Forest_Objects.png'));
    if(!sheet?.complete||!sheet.naturalWidth)return false;
    const f=p.kind==='goldTree'?frame.gold:frame.green;
    const sway=state.motion===false?0:Math.round(Math.sin(time(state)*1.4+(p.x/40)));
    const x=p.x+1;
    ctx.drawImage(sheet,f.x,f.y,67,112,x+sway,p.y,67,112);
    ctx.drawImage(sheet,f.x,f.y+112,67,39,x,p.y+112,67,39);
    return true;
  }
  function pond(ctx,p,state){
    const{x,y,width:w,height:h}=p,t=time(state);
    ellipse(ctx,'#253d37',x,y,w,h);ellipse(ctx,'#b4ad8b',x+2,y+2,w-4,h-4);
    ellipse(ctx,'#528b9b',x+5,y+5,w-10,h-10);ellipse(ctx,'#367482',x+8,y+8,w-16,h-16);
    for(let i=0;i<3;i++){
      const yy=y+14+i*10+Math.floor(t*2+i)%3,xx=x+15+(i%2)*17;
      fill(ctx,'#9cc8c0',xx,yy,15+i*3,1);fill(ctx,'#689fac',xx+4,yy+2,9,1);
    }
    fill(ctx,'#799659',x+11,y+6,12,3);fill(ctx,'#a3b470',x+13,y+5,7,2);
    return true;
  }
  function draw(ctx,p,state={}){
    if(p?.kind==='greenTree'||p?.kind==='goldTree')return tree(ctx,p,state);
    if(p?.kind==='pond')return pond(ctx,p,state);
    const ids={outdoorBench:'bench',outdoorRock:'mossRock',outdoorSign:'signpost',outdoorMushrooms:'mushrooms',vegetableBed:'pumpkinPatch'};
    if(ids[p?.kind])return art()?.drawFrame(ctx,ids[p.kind],p.x,p.y,1)===true;
    if(p?.kind==='gardenFlower')return env?.HomeInteriorArt?.drawFrame(ctx,'roseFlower',p.x,p.y,2)===true;
    return false;
  }
  return Object.freeze({background,draw,frames:frame,assets:art()?.assets||[],create:runtime=>makeOutdoor(runtime)});
});
