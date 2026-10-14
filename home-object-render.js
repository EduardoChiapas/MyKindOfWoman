/* Moving faces of the existing HOME furniture, sampled from their unchanged room PNGs.
 * Coordinates are native room pixels; the caller supplies its usual world transform. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.HomeObjectRender=factory(root);
})(typeof window==='object'?window:this,function(environment){
  'use strict';
  const specs={
    kitchen_fridge:{room:'kitchen',size:[196,163],kind:'fridge',bounds:[25,39,29,45],front:[25,39,29,42]},
    frisk_dresser:{room:'friskRoom',size:[239,234],kind:'drawer',bounds:[169,64,44,11],front:[169,64,44,8],shade:[167,64],rim:[168,64]},
    toriel_dresser:{room:'torielRoom',size:[227,234],kind:'drawer',bounds:[26,64,44,11],front:[26,64,44,8],shade:[24,64],rim:[25,64]},
    toriel_wardrobe:{room:'torielRoom',size:[227,234],kind:'wardrobe',bounds:[90,41,23,32],fronts:[[90,41,12,30],[102,41,11,30]]},
    kitchen_sink:{room:'kitchen',size:[196,163],kind:'tap',bounds:[73,49,3,8]}
  };
  for(const spec of Object.values(specs)){
    for(const value of Object.values(spec))if(Array.isArray(value))Object.freeze(value);
    Object.freeze(spec);
  }
  Object.freeze(specs);
  function create(options={}){
    const doc=options.document||environment?.document;
    const sources=new WeakMap();
    function ready(source,spec){
      if(!source||typeof source!=='object'||source.complete===false)return false;
      const width=source.naturalWidth===undefined?source.width:source.naturalWidth;
      const height=source.naturalHeight===undefined?source.height:source.naturalHeight;
      return width===spec.size[0]&&height===spec.size[1];
    }
    function sourcePixels(source,spec){
      let record=sources.get(source),signature=String(source.currentSrc||source.src||'')+'|'+spec.size.join('x');
      if(record?.signature===signature)return record;
      record={signature,source,frames:new Map(),pixels:null};sources.set(source,record);
      try{
        const canvas=doc?.createElement?.('canvas');if(!canvas)return record;
        [canvas.width,canvas.height]=spec.size;
        const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return record;
        ctx.imageSmoothingEnabled=false;ctx.drawImage(source,0,0);
        record.pixels=ctx.getImageData(0,0,...spec.size).data;
      }catch(_){/* Cropped source columns below do not require pixel read access. */}
      return record;
    }
    function paintPose(spec,step,blit){
      const [bx,by,bw,bh]=spec.bounds,phase=step/15;
      const rect=(x,y,w,h,sample)=>blit(sample[0],sample[1],1,1,x,y,w,h);
      blit(bx,by,bw,bh,bx,by,bw,bh);
      const swing=(front,hingeRight=false,maxDepth=3,handleColumn=null)=>{
        const [x,y,w,h]=front;
        const width=Math.max(handleColumn===null?3:5,Math.round(w*(1-.66*phase))),depth=Math.round(phase*maxDepth);
        const handlePixel=handleColumn===null?-1:Math.max(1,Math.min(width-2,Math.round(handleColumn*(width-1)/(w-1))));
        for(let xx=0;xx<width;xx++){
          const sampled=xx===handlePixel?handleColumn:Math.round(xx*(w-1)/(width-1));
          const distance=hingeRight?width-1-xx:xx;
          const drop=Math.round(distance*depth/(width-1));
          const dx=hingeRight?x+w-width+xx:x+xx;
          // The upper and lower refrigerator doors share this one projection.
          blit(x+sampled,y,1,h,dx,y+drop,1,h);
        }
      };
      if(spec.kind==='drawer'){
        const [x,y,w,h]=spec.front,depth=Math.max(1,Math.round(phase*3));
        rect(x,y,w,depth,spec.shade);rect(x+1,y+depth-1,w-2,1,spec.rim);
        blit(x,y,w,h,x,y+depth,w,h);
      }else if(spec.kind==='fridge'){
        for(const [x,y,w,h,shelf] of [[26,40,27,11,47],[26,54,27,26,68]]){
          rect(x,y,w,h,[49,43]);rect(x,y,1,h,[25,45]);rect(x+w-1,y,1,h,[25,45]);
          rect(x+1,shelf,w-2,1,[30,40]);rect(x+1,shelf+1,w-2,1,[25,45]);
        }
        swing(spec.front);
      }else if(spec.kind==='wardrobe'){
        for(const [x,y,w,h] of spec.fronts){
          rect(x,y,w,h,[101,50]);rect(x+1,y+1,w-2,h-2,[88,50]);
          rect(x+1,y+23,w-2,1,[91,50]);
        }
        swing(spec.fronts[0],false,2,8);swing(spec.fronts[1],true,2,1);
      }else if(spec.kind==='tap'){
        const length=Math.max(1,Math.round(phase*7));
        rect(74,49,1,length,[73,47]);
        if(length>=6){rect(73,55,1,1,[68,51]);rect(75,55,1,1,[68,51]);}
      }
    }
    function pose(record,spec,step){
      const key=spec.room+':'+spec.kind+':'+spec.bounds.join(',')+':'+step;
      if(record.frames.has(key))return record.frames.get(key);
      let canvas=null;
      try{
        canvas=doc?.createElement?.('canvas');if(!canvas)throw Error('No frame canvas');const [bx,by,bw,bh]=spec.bounds;
        canvas.width=bw;canvas.height=bh;const ctx=canvas.getContext('2d');
        if(!ctx)throw Error('No canvas context');
        ctx.imageSmoothingEnabled=false;
        if(record.pixels){
          const target=ctx.createImageData(bw,bh),source=record.pixels,stride=spec.size[0];
          paintPose(spec,step,(sx,sy,sw,sh,dx,dy,dw,dh)=>{
            for(let yy=0;yy<dh;yy++)for(let xx=0;xx<dw;xx++){
              const x=dx+xx,y=dy+yy;if(x<bx||y<by||x>=bx+bw||y>=by+bh)continue;
              const index=((sy+Math.floor(yy*sh/dh))*stride+sx+Math.floor(xx*sw/dw))*4;
              target.data.set(source.subarray(index,index+4),((y-by)*bw+x-bx)*4);
            }
          });
          ctx.putImageData(target,0,0);
        }else{
          // Canvas privacy restrictions can deny getImageData while ordinary
          // drawing still works. Copy the same original columns instead of
          // silently leaving an open refrigerator painted closed.
          paintPose(spec,step,(sx,sy,sw,sh,dx,dy,dw,dh)=>ctx.drawImage(record.source,sx,sy,sw,sh,dx-bx,dy-by,dw,dh));
        }
      }catch(_){canvas=null;}
      record.frames.set(key,canvas);return canvas;
    }
    function draw(ctx,room,objectId,visual,source){
      const spec=specs[objectId],phase=visual?.phase;
      if(!spec||spec.room!==room||!Number.isFinite(phase)||phase<=0||!ready(source,spec)||!ctx?.drawImage)return false;
      const step=Math.round(Math.min(1,phase)*15);if(step===0)return false;
      const record=sourcePixels(source,spec),canvas=pose(record,spec,step);
      ctx.imageSmoothingEnabled=false;
      if(canvas)ctx.drawImage(canvas,spec.bounds[0],spec.bounds[1]);
      else paintPose(spec,step,(sx,sy,sw,sh,dx,dy,dw,dh)=>ctx.drawImage(source,sx,sy,sw,sh,dx,dy,dw,dh));
      return true;
    }
    function bounds(room,objectId){const spec=specs[objectId];return spec?.room===room?spec.bounds.slice():null;}
    return {draw,bounds,specs,create};
  }
  return create();
});
