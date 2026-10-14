/* Lumo's original portrait inside the existing hallway frame, with the original foreground mask. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.HomePictureRender=factory(root);
})(typeof window==='object'?window:this,function makePictureRender(env){
  'use strict';
  const FRAME=Object.freeze({x:249,y:26,width:51,height:27});
  const BLANK=Object.freeze([186,133,4,255]);
  const DEFAULT=Object.freeze({id:'portrait-0-0',sheet:'assets/lumo/portraits-original.png',
    rect:Object.freeze({x:38,y:72,width:300,height:252})});
  const declared=env?.LUMO_ASSETS?.portraits?.emotions?.NORMAL;
  const descriptor=declared?.sheet&&declared.rect?declared:DEFAULT;
  const portrait=typeof env?.Image==='function'?new env.Image():null;
  if(portrait)portrait.src=descriptor.sheet;
  const caches=new WeakMap();
  function ready(image){return image?.complete===true&&image.naturalWidth>0&&image.naturalHeight>0;}
  function fit(rect){
    if(!rect||![rect.x,rect.y,rect.width,rect.height].every(Number.isInteger)||rect.x<0||rect.y<0||rect.width<=0||rect.height<=0)return null;
    // One proportional nearest-neighbor sample on the room's native grid, never a stretched world overlay.
    const ratio=Math.min(24/rect.width,18/rect.height),width=Math.max(1,Math.round(rect.width*ratio)),height=Math.max(1,Math.round(rect.height*ratio));
    return {x:Math.floor((FRAME.width-width)/2),y:Math.floor((FRAME.height-height)/2),width,height};
  }
  function sample(ctx,source){
    if(!ready(source)||!ready(portrait)||source.naturalWidth<FRAME.x+FRAME.width||source.naturalHeight<FRAME.y+FRAME.height)return null;
    const rect=descriptor.rect,placement=fit(rect);
    if(!placement||rect.x+rect.width>portrait.naturalWidth||rect.y+rect.height>portrait.naturalHeight)return null;
    const document=env?.document||ctx?.canvas?.ownerDocument;
    if(!document?.createElement)return null;
    const key=[source.src,source.naturalWidth,source.naturalHeight,portrait.src,portrait.naturalWidth,portrait.naturalHeight,
      rect.x,rect.y,rect.width,rect.height].join('|');
    const previous=caches.get(source);if(previous?.key===key)return previous.canvas;
    try{
      const mask=document.createElement('canvas');mask.width=FRAME.width;mask.height=FRAME.height;
      const original=mask.getContext('2d',{willReadFrequently:true});if(!original)return null;
      original.imageSmoothingEnabled=false;
      original.drawImage(source,FRAME.x,FRAME.y,FRAME.width,FRAME.height,0,0,FRAME.width,FRAME.height);
      const sourcePixels=original.getImageData(0,0,FRAME.width,FRAME.height).data;
      const canvas=document.createElement('canvas');canvas.width=FRAME.width;canvas.height=FRAME.height;
      const target=canvas.getContext('2d',{willReadFrequently:true});if(!target)return null;
      target.imageSmoothingEnabled=false;
      target.drawImage(portrait,rect.x,rect.y,rect.width,rect.height,placement.x,placement.y,placement.width,placement.height);
      const sampled=target.getImageData(0,0,FRAME.width,FRAME.height);
      // Only the exact blank paint admits a portrait pixel. Frame edges, stems and foreground flowers stay untouched.
      for(let offset=0;offset<sampled.data.length;offset+=4){
        if(BLANK.some((channel,index)=>sourcePixels[offset+index]!==channel))sampled.data.fill(0,offset,offset+4);
      }
      target.putImageData(sampled,0,0);caches.set(source,{key,canvas});return canvas;
    }catch{
      // A denied read keeps the intact original painting; an unloaded image was never cached above.
      caches.set(source,{key,canvas:null});return null;
    }
  }
  function draw(ctx,roomId,sourceImage){
    if(roomId!=='hallway'||!ctx||typeof ctx.drawImage!=='function')return false;
    const canvas=sample(ctx,sourceImage);if(!canvas)return false;
    const smooth=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
    ctx.drawImage(canvas,FRAME.x,FRAME.y);ctx.imageSmoothingEnabled=smooth;return true;
  }
  return Object.freeze({draw,fit,frame:FRAME,blank:BLANK,portrait:descriptor,assets:portrait?[portrait]:[],
    create:runtime=>makePictureRender(runtime)});
});
