/* Original Mira art sampled once per pose onto the room's native pixel grid. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.HomeCharacterRender=factory(root);
})(typeof window==='object'?window:this,function(global){
  'use strict';
  const caches=new WeakMap(),WIDTH=24,HEIGHT=34;
  function frameRect(width,height,frameX,frameY){
    if(!Number.isInteger(width)||!Number.isInteger(height)||width<4||height<4||
      !Number.isInteger(frameX)||!Number.isInteger(frameY)||frameX<0||frameX>3||frameY<0||frameY>3)return null;
    const x=Math.round(frameX*width/4),y=Math.round(frameY*height/4);
    return {x,y,width:Math.round((frameX+1)*width/4)-x,height:Math.round((frameY+1)*height/4)-y};
  }
  function sample(ctx,image,frameX,frameY){
    if(!image||image.complete!==true||!image.naturalWidth||!image.naturalHeight)return null;
    const rect=frameRect(image.naturalWidth,image.naturalHeight,frameX,frameY);
    if(!rect)return null;
    let cache=caches.get(image);
    if(!cache||cache.width!==image.naturalWidth||cache.height!==image.naturalHeight){
      cache={width:image.naturalWidth,height:image.naturalHeight,frames:new Map()};caches.set(image,cache);
    }
    const key=frameY*4+frameX;if(cache.frames.has(key))return cache.frames.get(key);
    const document=global?.document||ctx.canvas?.ownerDocument;
    if(!document?.createElement)return null;
    try{
      const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;
      const target=canvas.getContext('2d');if(!target)return null;
      target.imageSmoothingEnabled=false;
      target.drawImage(image,rect.x,rect.y,rect.width,rect.height,0,0,WIDTH,HEIGHT);
      cache.frames.set(key,canvas);return canvas;
    }catch{return null;}
  }
  function drawPlayer(ctx,image,options={}){
    if(!ctx||typeof ctx.drawImage!=='function')return false;
    const frame=sample(ctx,image,options.frameX??0,options.frameY??0);if(!frame)return false;
    const x=Number(options.x),y=Number(options.y),width=Number(options.width??48),height=Number(options.height??68);
    if(![x,y,width,height].every(Number.isFinite)||width<2||height<2)return false;
    const left=Math.round(x/2)*2,top=Math.round(y/2)*2,w=Math.round(width/2)*2,h=Math.round(height/2)*2;
    const smooth=ctx.imageSmoothingEnabled,color=ctx.fillStyle;
    const saved=typeof ctx.save==='function'&&typeof ctx.restore==='function';if(saved)ctx.save();
    ctx.imageSmoothingEnabled=false;
    if(options.shadow===true&&typeof ctx.fillRect==='function'){
      const center=left+Math.round(w/4)*2;
      ctx.fillStyle='rgba(48, 36, 29, 0.20)';
      ctx.fillRect(center-6,top+h-8,12,2);ctx.fillRect(center-10,top+h-6,20,4);ctx.fillRect(center-6,top+h-2,12,2);
    }
    ctx.drawImage(frame,left,top,w,h);
    if(saved)ctx.restore();else{ctx.imageSmoothingEnabled=smooth;ctx.fillStyle=color;}
    return true;
  }
  return Object.freeze({drawPlayer,frameRect,nativeWidth:WIDTH,nativeHeight:HEIGHT});
});
