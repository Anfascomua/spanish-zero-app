const CACHE = 'spanish-zero-web-v4-loop-listening-fix';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

const LOOP_SCRIPT = String.raw`(() => {
  let running=false,runId=0,step=0,deck=[];
  const FEMALE=/female|woman|mujer|helena|elvira|lucia|lucía|paulina|monica|mónica|sofia|sofía|maria|maría|irina|svetlana|victoria/i;
  const MALE=/male|man|hombre|alvaro|álvaro|pablo|diego|jorge|antonio|pavel|yuri|alexander|maxim|dmitry|nikolai|mikhail/i;
  const progress=()=>{try{return typeof getP==='function'?getP():{dictSelected:[]}}catch{return{dictSelected:[]}}};
  const entries=()=>{try{return typeof dictionaryEntries==='function'?dictionaryEntries():[]}catch{return[]}};
  const count=()=>{const p=progress();return Array.isArray(p.dictSelected)?p.dictSelected.length:0};
  function voice(lang,gender){const code=lang.slice(0,2).toLowerCase(),a=speechSynthesis.getVoices().filter(v=>(v.lang||'').toLowerCase().startsWith(code)),re=gender==='female'?FEMALE:MALE,named=a.find(v=>re.test(v.name||''));return named||(a.length>1?a[gender==='female'?0:1]:a[0]||null)}
  function sayPart(text,lang,gender,rate){return new Promise(done=>{if(!('speechSynthesis'in window)){done();return}const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=rate;const v=voice(lang,gender);if(v)u.voice=v;u.onend=done;u.onerror=done;speechSynthesis.speak(u)})}
  const pause=(ms,id)=>new Promise(r=>setTimeout(()=>r(running&&id===runId),ms));
  function refresh(){const b=document.getElementById('selected-loop-btn'),s=document.getElementById('selected-loop-status'),n=count();if(b){b.disabled=!n&&!running;b.style.opacity=(n||running)?'1':'.45';const label=running?'■ Остановить прослушку':('🔁 Прослушка по кругу ('+n+')');if(b.textContent!==label)b.textContent=label}if(s){const label=running?('Идёт по кругу: '+deck.length+' слов. Голоса меняются на каждом следующем слове.'):'1-е слово: женщина по-испански → мужчина по-русски. 2-е: мужчина по-испански → женщина по-русски. Затем по кругу.';if(s.textContent!==label)s.textContent=label}}
  function ensure(){const a=document.querySelector('.dict-actions');if(!a)return;if(!document.getElementById('selected-loop-btn')){const b=document.createElement('button');b.id='selected-loop-btn';b.className='accent';b.onclick=toggle;a.appendChild(b);const s=document.createElement('div');s.id='selected-loop-status';s.className='muted tiny';s.style.margin='-4px 2px 12px';a.insertAdjacentElement('afterend',s)}refresh()}
  function stop(){running=false;runId++;deck=[];if('speechSynthesis'in window)speechSynthesis.cancel();refresh()}
  async function play(id){while(running&&id===runId&&deck.length){const w=deck[step%deck.length],femaleFirst=step%2===0;await sayPart(w.es,'es-ES',femaleFirst?'female':'male',.78);if(!running||id!==runId)break;if(!await pause(260,id))break;await sayPart(w.ru,'ru-RU',femaleFirst?'male':'female',.88);if(!running||id!==runId)break;step++;refresh();if(!await pause(600,id))break}}
  function toggle(){if(running){stop();return}const p=progress(),selected=Array.isArray(p.dictSelected)?p.dictSelected:[];deck=entries().filter(x=>selected.includes(x.id));if(!deck.length){alert('Сначала выберите слова флажком «Учить».');return}if(!('speechSynthesis'in window)){alert('Этот браузер не поддерживает системную озвучку.');return}speechSynthesis.cancel();running=true;step=0;const id=++runId;refresh();play(id)}
  function start(){const app=document.getElementById('app');if(!app)return;new MutationObserver(()=>setTimeout(ensure,0)).observe(app,{childList:true});ensure()}
  window.stopSelectedLoopListening=stop;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();`;

function injectLoopListening(html) {
  if (html.includes('selected-loop-btn')) return html;
  return html.replace('</body>', `<script>${LOOP_SCRIPT}<\/script></body>`);
}

async function appResponse(request) {
  try {
    const res = await fetch(request, { cache: 'no-store' });
    const type = res.headers.get('content-type') || '';
    if (!type.includes('text/html')) return res;
    const html = injectLoopListening(await res.text());
    const headers = new Headers(res.headers);
    headers.delete('content-length');
    const modified = new Response(html, { status: res.status, statusText: res.statusText, headers });
    const cacheCopy = modified.clone();
    caches.open(CACHE).then(cache => cache.put('/index.html', cacheCopy));
    return modified;
  } catch {
    const cached = await caches.match('/index.html');
    if (!cached) throw new Error('offline');
    const html = injectLoopListening(await cached.text());
    const headers = new Headers(cached.headers);
    headers.delete('content-length');
    return new Response(html, { status: cached.status, statusText: cached.statusText, headers });
  }
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(appResponse(req));
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(cache => cache.put(req, copy));
      return res;
    }))
  );
});
