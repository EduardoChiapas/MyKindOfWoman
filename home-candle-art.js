/* Original HOME candle silhouette, drawn without sampling or repainting its wall. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.HomeCandleArt=factory(root);
})(typeof window==='object'?window:this,function makeCandleArt(env){
  'use strict';
  const source='assets/rooms/entrance.png';
  const frame=Object.freeze({x:222,y:27,width:11,height:23});
  // Exact contiguous source runs exclude the connected cream wall. These strips
  // retain the original black outline, cream wax, gold holder and thin support.
  // drawImage needs no pixel read, so a file:// canvas cannot restore a backdrop.
  const strips=Object.freeze([
    [3,0,5,1],[2,1,7,1],[1,2,9,2],[2,4,7,4],[3,8,5,1],
    [4,9,3,2],[3,11,5,1],[2,12,7,3],[3,15,5,1],[6,16,1,5]
  ].map(strip=>Object.freeze(strip)));
  let image=null;
  if(typeof env?.Image==='function'){image=new env.Image();image.src=source;}
  const integer=value=>Number.isFinite(value)&&Number.isInteger(value);
  function draw(ctx,prop,state={}){
    if(!['wallCandle','smallCandle'].includes(prop?.kind)||!ctx?.drawImage||
      !image?.complete||image.naturalWidth<frame.x+frame.width||image.naturalHeight<frame.y+frame.height||
      !prop||![prop.x,prop.y,prop.width,prop.height].every(integer))return false;
    const scale=state.scale===undefined?Math.min(2,Math.floor(prop.width/frame.width),Math.floor(prop.height/frame.height)):state.scale;
    if(![1,2].includes(scale)||frame.width*scale>prop.width||frame.height*scale>prop.height)return false;
    const x=prop.x+Math.floor((prop.width-frame.width*scale)/2),y=prop.y+prop.height-frame.height*scale;
    ctx.imageSmoothingEnabled=false;
    for(const [sx,sy,w,h]of strips)ctx.drawImage(image,frame.x+sx,frame.y+sy,w,h,x+sx*scale,y+sy*scale,w*scale,h*scale);
    return true;
  }
  return Object.freeze({draw,source,frame,strips,assets:image?[image]:[],create:runtime=>makeCandleArt(runtime)});
});
