const CACHE='escreveai-1.17';
const LOCAL_CORE=[
  './',
  './index.html',
  './EscreveAI1.9.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];
const OPTIONAL_RUNTIME=[
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(LOCAL_CORE);
    await Promise.allSettled(OPTIONAL_RUNTIME.map(async url=>{
      const response=await fetch(url,{cache:'no-cache'});
      if(response&&(response.ok||response.type==='opaque'))await cache.put(url,response.clone());
    }));
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys())if(key!==CACHE)await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const req=event.request;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(req);
        const cache=await caches.open(CACHE);
        if(fresh&&fresh.ok)cache.put(req,fresh.clone()).catch(()=>{});
        return fresh;
      }catch(err){
        const cache=await caches.open(CACHE);
        return (await cache.match(req))||(await cache.match('./index.html'))||(await cache.match('./EscreveAI1.9.html'))||Response.error();
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const hit=await cache.match(req);
    if(hit)return hit;
    try{
      const fresh=await fetch(req);
      if(fresh&&(fresh.ok||fresh.type==='opaque'))cache.put(req,fresh.clone()).catch(()=>{});
      return fresh;
    }catch(err){
      return Response.error();
    }
  })());
});
