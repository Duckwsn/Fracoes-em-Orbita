const CACHE='fracoes-orbita-v2';
const ASSETS=['./','./index.html','./css/main.css','./css/board.css','./css/cards.css','./css/animations.css','./js/fractions.js','./js/questions.js','./js/events.js','./js/audio.js','./js/game.js','./js/board.js','./js/ui.js','./js/app.js','./assets/icons/icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res;}).catch(()=>caches.match('./index.html'))));});
