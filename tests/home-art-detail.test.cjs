'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const world=require('../home-world.js'),{createArt,assertSourceDraw}=require('./home-art-fixture.cjs');
const props=Object.values(world.definitions()).flatMap(room=>room.props);
const art=createArt();
function paint(prop,state){
  const strokes=[];
  const ctx={font:'',fillStyle:'',fillRect(x,y,width,height){strokes.push([this.fillStyle,x,y,width,height]);},
    drawImage(source,sx,sy,sw,sh,x,y,width,height){
      assertSourceDraw(source,[sx,sy,sw,sh,x,y,width,height],prop);
      strokes.push(['image:'+source.path,x,y,width,height,sx,sy,sw,sh]);
    },
    fillText(text,x,y){strokes.push(['text',text,x,y]);}};
  assert.equal(art.draw(ctx,prop,state),true,prop.id);return strokes;
}

test('every furniture pose remains on the native pixel grid and inside its unchanged collision-sized sprite',()=>{
  for(const prop of props)for(const phase of [0,.001,.2,.49,.6,.9,1])for(const pulse of [0,.1,1]){
    const strokes=paint(prop,{phase,pulse,motion:true,time:375,claimed:false});
    assert.ok(strokes.length>0,prop.id);
    for(const [color,x,y,width,height]of strokes){
      if(color==='text')continue;
      assert.ok([x,y,width,height].every(Number.isInteger),`${prop.id} ${phase}/${pulse}: native pixel coordinates`);
      assert.ok(width>0&&height>0,`${prop.id}: no inverted strokes`);
      assert.ok(x>=prop.x&&y>=prop.y&&x+width<=prop.x+prop.width&&y+height<=prop.y+prop.height,
        `${prop.id} ${phase}/${pulse}: the pose cannot paint into a neighboring object or passage`);
    }
  }
});

test('reduced-motion furniture has stable final poses, including the actual reading lamp without a fictional record overlay',()=>{
  for(const prop of props){
    assert.deepEqual(paint(prop,{phase:1,pulse:0,motion:false,time:0}),
      paint(prop,{phase:1,pulse:0,motion:false,time:3500}),`${prop.id}: reduced-motion pose is stable`);
  }
  const record=props.find(p=>p.kind==='recordPlayer');
  assert.deepEqual(paint(record,{phase:1,pulse:0,motion:true,time:0}),
    paint(record,{phase:1,pulse:0,motion:true,time:500}),'The existing reading-lamp ID does not paint a record player over its authored sprite.');
});

test('the bookshelf keeps its original spines and the collected desk paper stays absent in every gesture',()=>{
  const book=props.find(p=>p.kind==='bookcase');
  const poses=[0,.2,.6,1].map(phase=>JSON.stringify(paint(book,{phase,pulse:0,motion:false,time:0})));
  assert.equal(new Set(poses).size,1,'An examined book never paints fake pages over the authored bookshelf.');
  const desk=props.find(p=>p.kind==='desk');
  for(const pulse of [0,.5,1]){
    const claimed=paint(desk,{claimed:true,pulse}),available=paint(desk,{claimed:false,pulse});
    assert.notDeepEqual(claimed,available,'The actual collection flag removes the drawing from the paper');
    assert.deepEqual(claimed.filter(s=>s[0].startsWith('image:')),available.filter(s=>s[0].startsWith('image:')),'The real furniture remains after picking up its paper.');
    assert.equal(claimed.filter(s=>s[0]!=='text'&&!s[0].startsWith('image:')).length,0);
  }
});
