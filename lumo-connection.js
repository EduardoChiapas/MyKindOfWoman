/* One readiness request per active browser/backend. No paid model call, chat or keep-alive. */
(function(root){
  'use strict';const clients=new WeakMap();
  function shared(environment,endpoint,options={}){
    let endpoints=clients.get(environment);if(!endpoints){endpoints=new Map();clients.set(environment,endpoints);}
    const url=endpoint.replace(/\/api\/(?:ryon\/)?chat$/,'/api/ready');
    if(endpoints.has(url))return endpoints.get(url);
    const now=typeof options.now==='function'?options.now:Date.now;
    const delay=options.timeoutMs||90000;let status='cold',lastTraffic=0,retryAt=0,promise=null,controller=null;
    function isReady(){return status==='ready'&&now()-lastTraffic<15*60000;}
    function warm(){
      if(isReady())return Promise.resolve(true);if(promise)return promise;if(now()<retryAt)return Promise.resolve(false);
      status='warming';const active=new AbortController();controller=active;const timer=setTimeout(()=>active.abort(),delay);timer.unref?.();
      promise=Promise.resolve().then(async()=>{try{
        const response=await environment.fetch(url,{method:'GET',credentials:'omit',redirect:'error',signal:active.signal});
        if(!response.ok)throw Error('Not ready');const result=await response.json();
        if(active.signal.aborted)throw Error('Cancelled');
        if(result.ready!==true||result.providerReady!==true)throw Error('Not configured');
        status='ready';lastTraffic=now();retryAt=0;return true;
      }catch{status='cold';retryAt=now()+20000;return false;}finally{clearTimeout(timer);promise=null;controller=null;}});
      return promise;
    }
    function success(){status='ready';lastTraffic=now();retryAt=0;}
    function failure(){status='cold';retryAt=now()+20000;}
    function cancel(){controller?.abort();status='cold';}
    const api={isReady,warm,success,failure,cancel,get status(){return status;}};endpoints.set(url,api);return api;
  }
  const api={shared};if(typeof module==='object'&&module.exports)module.exports=api;else root.LumoConnection=api;
})(typeof window!=='undefined'?window:globalThis);
