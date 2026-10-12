'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const script = fs.readFileSync(require.resolve('../lumo-connection.js'),'utf8');
const readyResponse = (value = {ready:true,providerReady:true},ok = true) => ({ok,json:async()=>value});
function deferred() {
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
  return {promise,resolve,reject};
}
function fixture(fetch,options={}) {
  let time=options.start||1000000,next=0;
  const timers=new Map(),calls=[];
  const sandbox={module:{exports:{}},AbortController,Date,setTimeout:(callback,delay)=>{
    const timer={id:++next,unref(){}};
    timers.set(timer,{callback,at:time+delay});
    return timer;
  },clearTimeout:timer=>timers.delete(timer)};
  vm.runInNewContext(script,sandbox);
  const environment=fetch===null?{}:{fetch:(url,request)=>{calls.push({url,request});return fetch(url,request);}};
  const shared=sandbox.module.exports.shared;
  const client=shared(environment,options.endpoint||'https://backend.example/api/chat',{now:()=>time,timeoutMs:options.timeoutMs||90000});
  const advance=duration=>{
    time+=duration;
    for(const [timer,value] of [...timers]) if(value.at<=time){timers.delete(timer);value.callback();}
  };
  return {environment,client,shared,calls,timers,advance,now:()=>time};
}
function abortable(request,pending=deferred()) {
  const reject=()=>pending.reject(Object.assign(new Error('Aborted'),{name:'AbortError'}));
  if(request.signal.aborted)reject();
  else request.signal.addEventListener('abort',reject,{once:true});
  return pending;
}

test('simultaneous Lumo and Ryon warm calls share one request per browser and backend',async()=>{
  const pending=deferred(),f=fixture(()=>pending.promise);
  const ryon=f.shared(f.environment,'https://backend.example/api/ryon/chat');
  assert.equal(ryon,f.client);
  const a=f.client.warm(),b=ryon.warm(),c=f.client.warm();
  await Promise.resolve();
  assert.equal(a,b);assert.equal(a,c);assert.equal(f.calls.length,1);
  assert.equal(f.client.status,'warming');assert.equal(f.client.isReady(),false);
  pending.resolve(readyResponse());
  assert.deepEqual(await Promise.all([a,b,c]),[true,true,true]);
  assert.equal(f.client.status,'ready');assert.equal(f.client.isReady(),true);
  assert.equal(f.timers.size,0);
  assert.equal(await ryon.warm(),true);assert.equal(f.calls.length,1);
  const otherBackend=f.shared(f.environment,'https://another.example/api/chat');
  assert.notEqual(otherBackend,f.client);assert.equal(await otherBackend.warm(),true);
  assert.equal(f.calls.length,2);
});

test('warm sends only anonymous GET /api/ready without chat text, body, cookies or model call',async()=>{
  const f=fixture(async()=>readyResponse());
  assert.equal(await f.client.warm(),true);
  const {url,request}=f.calls[0];
  assert.equal(url,'https://backend.example/api/ready');
  assert.equal(request.method,'GET');assert.equal(request.credentials,'omit');assert.equal(request.redirect,'error');
  assert.equal(request.body,undefined);assert.equal(request.headers,undefined);
  assert.ok(request.signal instanceof AbortSignal);assert.equal(request.signal.aborted,false);
  assert.ok(!f.calls.some(call=>/\/(?:chat|session)$/.test(call.url)));
  for(let i=0;i<100;i++) assert.equal(await f.client.warm(),true);
  f.advance(60000);assert.equal(f.calls.length,1);
  assert.equal(f.timers.size,0); // No background heartbeat or keep-alive.
});

test('readiness requires HTTP success and explicit true confirmations for server and provider',async()=>{
  for(const response of [readyResponse({ready:false,providerReady:true}),readyResponse({ready:true,providerReady:false}),readyResponse({ready:1,providerReady:true}),readyResponse({ready:true,providerReady:1}),readyResponse({ready:true}),readyResponse({},false),readyResponse(null),{ok:true,json:async()=>{throw Error('invalid json');}}]) {
    const f=fixture(async()=>response);
    assert.equal(await f.client.warm(),false);
    assert.equal(f.client.isReady(),false);assert.equal(f.client.status,'cold');
    assert.equal(f.timers.size,0);assert.equal(f.calls.length,1);
  }
  const f=fixture(async()=>readyResponse({ready:true,providerReady:true}));
  assert.equal(await f.client.warm(),true);assert.equal(f.client.isReady(),true);
});

test('readiness expires at fifteen minutes and the next action starts a fresh single GET',async()=>{
  const f=fixture(async()=>readyResponse());
  assert.equal(await f.client.warm(),true);
  f.advance(15*60000-1);assert.equal(f.client.isReady(),true);
  f.advance(1);assert.equal(f.client.isReady(),false);assert.equal(f.calls.length,1);
  const a=f.client.warm(),b=f.client.warm();
  await Promise.resolve();
  assert.equal(a,b);assert.equal(f.calls.length,2);
  assert.equal(await a,true);assert.equal(f.client.isReady(),true);
});

test('successful chat traffic refreshes readiness without sending any helper request',()=>{
  const f=fixture(async()=>readyResponse());
  f.client.success();assert.equal(f.client.isReady(),true);assert.equal(f.calls.length,0);
  f.advance(15*60000-1);f.client.success();
  f.advance(15*60000-1);assert.equal(f.client.isReady(),true);
  f.advance(1);assert.equal(f.client.isReady(),false);assert.equal(f.calls.length,0);
});

test('failed readiness retries only after twenty seconds without background polling',async()=>{
  let count=0;
  const f=fixture(async()=>{if(++count===1)throw Error('offline');return readyResponse();});
  assert.equal(await f.client.warm(),false);
  assert.equal(await f.client.warm(),false);assert.equal(f.calls.length,1);
  f.advance(19999);assert.equal(await f.client.warm(),false);assert.equal(f.calls.length,1);
  f.advance(1);assert.equal(f.calls.length,1);
  assert.equal(await f.client.warm(),true);assert.equal(f.calls.length,2);
  assert.equal(f.timers.size,0);
});

test('synchronous fetch failure also releases the cached promise for the twenty second retry',async()=>{
  let count=0;
  const f=fixture(()=>{if(++count===1)throw Error('synchronous failure');return Promise.resolve(readyResponse());});
  assert.equal(await f.client.warm(),false);
  assert.equal(f.client.status,'cold');
  f.advance(20000);
  assert.equal(await f.client.warm(),true);
  assert.equal(f.calls.length,2);assert.equal(f.client.isReady(),true);
});

test('an explicit transport failure makes the next action wait for the retry cooldown',async()=>{
  const f=fixture(async()=>readyResponse());
  f.client.success();f.client.failure();
  assert.equal(f.client.isReady(),false);assert.equal(f.client.status,'cold');
  assert.equal(await f.client.warm(),false);assert.equal(f.calls.length,0);
  f.advance(20000);assert.equal(await f.client.warm(),true);assert.equal(f.calls.length,1);
});

test('cancel aborts pending fetch, returns false and clears its timeout without chat messages',async()=>{
  let pending;
  const f=fixture((_url,request)=>{pending=abortable(request);return pending.promise;});
  const warming=f.client.warm();await Promise.resolve();f.client.cancel();
  assert.equal(f.calls[0].request.signal.aborted,true);
  assert.equal(await warming,false);assert.equal(f.client.isReady(),false);assert.equal(f.client.status,'cold');
  assert.equal(f.timers.size,0);
  pending.resolve(readyResponse());await Promise.resolve();
  assert.equal(f.client.isReady(),false);assert.equal(f.calls.length,1);
});

test('timeout aborts pending fetch and follows the same bounded retry policy',async()=>{
  const f=fixture((_url,request)=>abortable(request).promise,{timeoutMs:500});
  const warming=f.client.warm();
  await Promise.resolve();
  f.advance(499);assert.equal(f.calls[0].request.signal.aborted,false);
  f.advance(1);assert.equal(f.calls[0].request.signal.aborted,true);
  assert.equal(await warming,false);assert.equal(f.client.status,'cold');assert.equal(f.client.isReady(),false);
  assert.equal(f.timers.size,0);
  assert.equal(await f.client.warm(),false);assert.equal(f.calls.length,1);
});

test('cancel cannot accept a late response even when a transport ignores its abort signal',async()=>{
  const pending=deferred(),f=fixture(()=>pending.promise);
  const warming=f.client.warm();f.client.cancel();
  pending.resolve(readyResponse());
  assert.equal(await warming,false);
  assert.equal(f.client.isReady(),false);assert.equal(f.client.status,'cold');
  assert.equal(f.calls.length,1);assert.equal(f.timers.size,0);
});

test('cancel while response JSON is pending cannot restore late readiness',async()=>{
  const body=deferred(),started=deferred();
  const f=fixture(async()=>({ok:true,json:()=>{started.resolve();return body.promise;}}));
  const warming=f.client.warm();await started.promise;f.client.cancel();
  body.resolve({ready:true,providerReady:true});
  assert.equal(await warming,false);assert.equal(f.client.isReady(),false);assert.equal(f.client.status,'cold');
  assert.equal(f.timers.size,0);
});

test('timeout cannot accept readiness arriving after the request was aborted',async()=>{
  const pending=deferred(),f=fixture(()=>pending.promise,{timeoutMs:500});
  const warming=f.client.warm();f.advance(500);
  pending.resolve(readyResponse());
  assert.equal(await warming,false);assert.equal(f.client.isReady(),false);assert.equal(f.client.status,'cold');
  assert.equal(f.timers.size,0);
});

test('provider unavailable or missing fetch reports no readiness without initiating a chat',async()=>{
  for(const f of [fixture(async()=>readyResponse({ready:true,providerReady:false})),fixture(null)]) {
    assert.equal(await f.client.warm(),false);assert.equal(f.client.isReady(),false);
    f.advance(60000);assert.equal(f.client.isReady(),false);
    assert.ok(f.calls.every(call=>call.request.method==='GET'&&call.url.endsWith('/api/ready')));
    assert.equal(f.timers.size,0);
  }
});
