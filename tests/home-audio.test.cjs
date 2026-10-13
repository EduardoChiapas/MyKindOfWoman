'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
function fixture(options={}){
 const nodes=[],events={},decoded=[];
 class Param{constructor(){this.value=1;this.events=[];}setValueAtTime(value,at){this.value=value;this.events.push(['set',value,at]);}linearRampToValueAtTime(value,at){this.events.push(['linear',value,at]);}exponentialRampToValueAtTime(value,at){this.events.push(['exponential',value,at]);}}
 class Node{constructor(type){this.type=type;this.connections=[];this.gain=new Param();this.frequency=new Param();nodes.push(this);}connect(next){this.connections.push(next);return next;}disconnect(){this.disconnected=true;}start(...args){this.started=args;}stop(...args){this.stopped=args;}}
 class Context{constructor(){this.state='running';this.sampleRate=44100;this.currentTime=0;this.destination=new Node('destination');this.nodes=[];}createGain(){return new Node('gain');}createBufferSource(){return new Node('sample');}createOscillator(){return new Node('oscillator');}createBuffer(channels,length,rate){return {duration:length/rate,getChannelData:()=>new Float32Array(length),fallback:true};}async decodeAudioData(bytes){const raw=Buffer.from(bytes);decoded.push(raw);if(options.decode)return options.decode(bytes,this);if(raw.toString('ascii',0,4)==='RIFF')return {duration:Math.max(.023,raw.length/176400),raw};return {duration:.24,raw};}}
 const document={hidden:false,addEventListener:(name,callback)=>{events[name]=callback;}};
 const window={atob:value=>Buffer.from(value,'base64').toString('binary')};
 const sandbox={window,document,Uint8Array,Map,Promise,setTimeout,clearTimeout};
 vm.runInNewContext(fs.readFileSync(path.join(root,'sfx-data.js'),'utf8'),sandbox);
 vm.runInNewContext(fs.readFileSync(path.join(root,'undertale-audio.js'),'utf8'),sandbox);
 const context=new Context();
 return {audio:window.UndertaleAudio,window,document,context,nodes,events,decoded,Context,latest(type){return nodes.filter(n=>n.type===type).at(-1);}};
}
test('selected library originals and embedded bytes match the recorded source hashes',async()=>{
 const f=fixture();await f.audio.prepare(f.context);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/sfx/home/SOURCES.json'),'utf8'));
 assert.equal(manifest.samples.length,9);
 for(const item of manifest.samples){
  const raw=fs.readFileSync(path.join(root,'assets/sfx/home',item.file));
  assert.equal(raw.length,item.bytes);
  assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),item.sha256);
  assert.deepEqual(Buffer.from(f.window.UndertaleSfxData[item.id],'base64'),raw);
  assert.equal(f.audio.sampleStatus[item.id],'original');
  assert.match(item.source,/sounds\.spriters-resource\.com\/media\/assets\/397\/399803\.zip/);
  assert.equal(path.basename(item.archivePath),item.file);
  assert.match(item.mirrorVerification.source,new RegExp(item.sourceCommit));
 }
 assert.ok(f.decoded.every(raw=>['RIFF','OggS'].includes(raw.toString('ascii',0,4))));
 assert.equal(Object.values(f.audio.sampleStatus).filter(v=>v==='fallback').length,0);
});
test('world texture cues use distinct decoded samples and bounded envelopes at original pitch',async()=>{
 const f=fixture();await f.audio.prepare(f.context);
 assert.equal(f.audio.effect('water'),true);
 const water=f.latest('sample'),waterGain=water.connections[0];
 assert.ok(water.started[2]<=.66);assert.equal(water.playbackRate,undefined);
 assert.deepEqual(waterGain.gain.events.at(-1),['linear',0,.66]);
 assert.equal(f.audio.effect('bell'),true);const bell=f.latest('sample');
 assert.notEqual(water.buffer,bell.buffer);
 assert.equal(f.audio.effect('paper'),true);assert.equal(f.latest('sample').started[2],.17);
 assert.equal(f.audio.effect('unknown'),false);
});
test('text and effects have independent adjustable buses including voices already playing',async()=>{
 const f=fixture();await f.audio.prepare(f.context);
 f.audio.play('text');const text=f.latest('sample'),textBus=text.connections[0].connections[0];
 f.audio.effect('water',{volume:.5});const water=f.latest('sample'),effectBus=water.connections[0].connections[0];
 assert.notEqual(textBus,effectBus);
 assert.equal(water.connections[0].gain.events[1][1],.065);
 f.audio.setVolumes({effects:.2,text:.8});
 assert.equal(effectBus.gain.value,.2);assert.equal(textBus.gain.value,.8);
 f.audio.setVolumes({effects:0});assert.equal(f.audio.effect('bell'),false);
 f.audio.setVolumes({effects:Infinity,text:NaN});assert.equal(effectBus.gain.value,0);assert.equal(textBus.gain.value,0);
});
test('rapid gestures cannot stack voices, loops are bounded and scope stopping preserves text',async()=>{
 const f=fixture();await f.audio.prepare(f.context);
 assert.equal(f.audio.effect('water',{loop:true}),true);const loop=f.latest('sample');
 assert.equal(loop.loop,true);assert.ok(loop.stopped[0]<=3.01);
 assert.equal(f.audio.effect('water'),false);assert.equal(f.audio.activeVoices,1);
 f.context.currentTime=.3;assert.equal(f.audio.effect('water'),true);
 assert.ok(loop.disconnected);assert.equal(f.audio.activeVoices,1);
 f.audio.play('text');f.audio.effect('bell');assert.equal(f.audio.activeVoices,3);
 f.audio.stop('world:water');assert.equal(f.audio.activeVoices,2);
 f.audio.stop('world');assert.equal(f.audio.activeVoices,1);
 for(let n=0;n<20;n++){f.context.currentTime+=.3;f.audio.effect(n%2?'bell':'switch');f.audio.hum();}
 assert.ok(f.audio.activeVoices<=8);f.audio.stop();assert.equal(f.audio.activeVoices,0);
});
test('mute, pause, hidden document and context suspension stop or reject sound naturally',async()=>{
 const f=fixture();await f.audio.prepare(f.context);f.audio.effect('bell');
 f.audio.setPaused(true);assert.equal(f.audio.activeVoices,0);assert.equal(f.audio.effect('bell'),false);
 assert.equal(f.audio.effect('bell',{ui:true}),true);
 f.audio.setMuted(true);assert.equal(f.audio.activeVoices,0);assert.equal(f.audio.effect('water',{ui:true}),false);
 f.audio.setMuted(false);f.audio.setPaused(false);f.audio.effect('water');
 f.document.hidden=true;f.events.visibilitychange();assert.equal(f.audio.activeVoices,0);
 assert.equal(f.audio.effect('bell',{ui:true}),false);
 f.document.hidden=false;f.context.state='suspended';assert.equal(f.audio.effect('bell'),false);
});
test('decode failure is honestly marked fallback and preparation from an old context cannot win',async()=>{
 let first=true,release;
 const f=fixture({decode:(bytes,ctx)=>first?new Promise(resolve=>{release=()=>resolve({duration:5,old:true});}):Promise.reject(new Error('unsupported'))});
 const pending=f.audio.prepare(f.context);first=false;
 const replacement=new f.Context();await f.audio.prepare(replacement);
 release();
 assert.equal(f.audio.sampleStatus.water,'fallback');assert.equal(f.audio.effect('water'),true);
 assert.equal(f.latest('sample').buffer.fallback,true);assert.equal(f.latest('sample').buffer.old,undefined);
 // The prior decoders are intentionally unresolved; their timeout remains bounded.
 await pending;
 await f.audio.prepare(null);assert.equal(f.audio.activeVoices,0);assert.equal(f.audio.effect('bell'),false);
});
