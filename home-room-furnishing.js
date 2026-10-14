/* The supplied piano is a source image; the rear-facing TV is native canvas pixel art. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.HomeRoomFurnishing=factory(root);
})(typeof window==='object'?window:this,function makeFurnishing(env){
  'use strict';
  const source='assets/home/piano-waterfall.png';
  const frame=Object.freeze({x:24,y:67,width:1111,height:761});
  const image=typeof env?.Image==='function'?new env.Image():null;if(image)image.src=source;
  const fill=(ctx,c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  function draw(ctx,p,state={}){
    if(p?.kind==='piano'){
      if(!image?.complete||image.naturalWidth<frame.x+frame.width||!ctx?.drawImage)return false;
      ctx.imageSmoothingEnabled=false;
      ctx.drawImage(image,frame.x,frame.y,frame.width,frame.height,p.x,p.y,p.width,p.height);
      return true;
    }
    if(p?.kind!=='tvBack')return false;
    const{x,y,width:w,height:h}=p;
    const f=(c,a,b,cw,ch)=>fill(ctx,c,x+a,y+b,cw,ch);
    // Beveled rear casing, ventilation, sockets, stand and feet. Its screen faces the seats.
    f('#000000',3,1,w-6,2);f('#000000',1,3,w-2,25);f('#000000',0,6,w,18);
    f('#4e4747',4,3,w-8,2);f('#363033',2,6,w-4,18);f('#242025',4,24,w-8,3);
    f('#60544e',3,5,1,18);f('#17171d',w-5,6,2,18);
    for(let yy=9;yy<19;yy+=3)for(let xx=9;xx<w-14;xx+=4)f('#111119',xx,yy,3,1);
    f('#15141a',8,22,10,3);f('#bb9867',10,23,2,1);f('#8b9390',14,23,2,1);
    f(state.value?'#a9be78':'#7c6655',w-10,23,2,1);
    f('#000000',Math.floor(w/2)-4,28,8,6);f('#514238',Math.floor(w/2)-3,28,6,5);
    f('#000000',12,34,w-24,3);f('#a77b51',13,34,w-26,1);
    f('#000000',11,36,5,h-36);f('#000000',w-16,36,5,h-36);
    return true;
  }
  return Object.freeze({source,frame,draw,assets:image?[image]:[],create:runtime=>makeFurnishing(runtime)});
});
