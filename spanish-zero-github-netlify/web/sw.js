const CACHE = 'spanish-zero-web-v8-background-tts-queue';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

const LOOP_SCRIPT = String.raw`(() => {
  let running=false,runId=0,deck=[],queuedWords=0;
  const PREQUEUE_WORDS=1200;
  const FEMALE=/female|woman|mujer|helena|elvira|lucia|lucía|paulina|monica|mónica|sofia|sofía|maria|maría|irina|svetlana|victoria/i;
  const MALE=/male|man|hombre|alvaro|álvaro|pablo|diego|jorge|antonio|pavel|yuri|alexander|maxim|dmitry|nikolai|mikhail/i;
  const progress=()=>{try{return typeof getP==='function'?getP():{dictSelected:[]}}catch{return{dictSelected:[]}}};
  const entries=()=>{try{return typeof dictionaryEntries==='function'?dictionaryEntries():[]}catch{return[]}};
  const count=()=>{const p=progress();return Array.isArray(p.dictSelected)?p.dictSelected.length:0};
  function voice(lang,gender){const code=lang.slice(0,2).toLowerCase(),a=speechSynthesis.getVoices().filter(v=>(v.lang||'').toLowerCase().startsWith(code)),re=gender==='female'?FEMALE:MALE,named=a.find(v=>re.test(v.name||''));return named||(a.length>1?a[gender==='female'?0:1]:a[0]||null)}
  function makeUtterance(text,lang,gender,rate){const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=rate;const v=voice(lang,gender);if(v)u.voice=v;return u}
  function refresh(){const b=document.getElementById('selected-loop-btn'),s=document.getElementById('selected-loop-status'),n=count();if(b){b.disabled=!n&&!running;b.style.opacity=(n||running)?'1':'.45';const label=running?'■ Остановить прослушку':('🔁 Прослушка по кругу ('+n+')');if(b.textContent!==label)b.textContent=label}if(s){const label=running?('Идёт по кругу: '+deck.length+' слов. Очередь подготовлена для фоновой работы при погашенном экране.'):'Карточка меняется вместе с началом озвучки. Для блокировки экрана заранее создаётся длинная очередь TTS.';if(s.textContent!==label)s.textContent=label}const stopBtn=document.getElementById('loop-stop-card-btn');if(stopBtn)stopBtn.textContent='■ Остановить прослушку'}
  function ensure(){const a=document.querySelector('.dict-actions');if(a&&!document.getElementById('selected-loop-btn')){const b=document.createElement('button');b.id='selected-loop-btn';b.className='accent';b.onclick=toggle;a.appendChild(b);const s=document.createElement('div');s.id='selected-loop-status';s.className='muted tiny';s.style.margin='-4px 2px 12px';a.insertAdjacentElement('afterend',s)}if(running&&typeof page!=='undefined'&&page==='drill'){const main=document.querySelector('main');if(main&&!document.getElementById('loop-stop-card-btn')){const b=document.createElement('button');b.id='loop-stop-card-btn';b.className='primary';b.style.marginTop='12px';b.onclick=stop;b.textContent='■ Остановить прослушку';const change=[...main.querySelectorAll('button')].find(x=>x.textContent&&x.textContent.includes('Сменить набор'));if(change)main.insertBefore(b,change);else main.appendChild(b)}}refresh()}
  function stop(){running=false;runId++;deck=[];queuedWords=0;if('speechSynthesis'in window)speechSynthesis.cancel();refresh()}
  function syncCard(w,index){try{if(typeof drillDeck!=='undefined')drillDeck=deck.slice();if(typeof drillPos!=='undefined')drillPos=index;if(typeof page!=='undefined')page='drill';if(typeof lastAutoSpoken!=='undefined')lastAutoSpoken=w.id+':'+index;if(typeof render==='function')render();ensure()}catch{}}
  function queueBackground(id){if(!running||id!==runId||!deck.length)return;queuedWords=0;for(let turn=0;turn<PREQUEUE_WORDS;turn++){const index=turn%deck.length,w=deck[index],femaleFirst=turn%2===0;const es=makeUtterance(w.es,'es-ES',femaleFirst?'female':'male',.78);const ru=makeUtterance(w.ru,'ru-RU',femaleFirst?'male':'female',.88);es.onstart=()=>{if(running&&id===runId){queuedWords=turn+1;syncCard(w,index)}};es.onerror=()=>{};ru.onerror=()=>{};speechSynthesis.speak(es);speechSynthesis.speak(ru)}}
  function toggle(){if(running){stop();return}const p=progress(),selected=Array.isArray(p.dictSelected)?p.dictSelected:[];deck=entries().filter(x=>selected.includes(x.id));if(!deck.length){alert('Сначала выберите слова флажком «Учить».');return}if(!('speechSynthesis'in window)){alert('Этот браузер не поддерживает системную озвучку.');return}speechSynthesis.cancel();running=true;const id=++runId;syncCard(deck[0],0);setTimeout(()=>queueBackground(id),80);refresh()}
  function start(){const app=document.getElementById('app');if(!app)return;new MutationObserver(()=>setTimeout(ensure,0)).observe(app,{childList:true});ensure()}
  window.stopSelectedLoopListening=stop;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();`;

const MOBILE_DICTIONARY_STYLE = String.raw`<style id="mobile-dictionary-fix">
@media(max-width:520px){
  .dict-table-wrap{overflow-x:hidden!important}
  .dict-table{min-width:0!important;width:100%!important;table-layout:fixed!important;font-size:.82rem!important}
  .dict-table th,.dict-table td{padding:8px 5px!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
  .dict-table th:nth-child(1),.dict-table td:nth-child(1){width:42px!important}
  .dict-table th:nth-child(2),.dict-table td:nth-child(2){width:28%!important;display:table-cell!important}
  .dict-table th:nth-child(3),.dict-table td:nth-child(3){width:29%!important;display:table-cell!important}
  .dict-table th:nth-child(4),.dict-table td:nth-child(4){width:auto!important;display:table-cell!important}
  .dict-table th:nth-child(5),.dict-table td:nth-child(5),
  .dict-table th:nth-child(6),.dict-table td:nth-child(6),
  .dict-table th:nth-child(7),.dict-table td:nth-child(7){display:none!important}
  .dict-es{display:block!important;font-size:1.05rem!important;font-weight:900!important;line-height:1.2!important;color:#231f20!important}
  :root[data-theme="dark"] .dict-es{color:#fff!important}
  .dict-tr{display:block!important;font-size:.78rem!important;line-height:1.25!important}
  .dict-ru{display:block!important;font-size:.82rem!important;line-height:1.25!important}
  .dict-no{display:none!important}
}
</style>`;

function prepareHtml(html) {
  const generated = 'const BASE_WORDS=buildExtendedDictionary(CORE_WORDS);';
  const realOnly = 'const BASE_WORDS=CORE_WORDS.map(x=>({...x}));';
  if (html.includes(generated)) html = html.replace(generated, realOnly);
  if (!html.includes('mobile-dictionary-fix')) html = html.replace('</head>', `${MOBILE_DICTIONARY_STYLE}</head>`);
  if (!html.includes('selected-loop-btn')) html = html.replace('</body>', `<script>${LOOP_SCRIPT}<\/script></body>`);
  return html;
}

async function appResponse(request) {
  try {
    const res = await fetch(request, { cache: 'no-store' });
    const type = res.headers.get('content-type') || '';
    if (!type.includes('text/html')) return res;
    const html = prepareHtml(await res.text());
    const headers = new Headers(res.headers);
    headers.delete('content-length');
    const modified = new Response(html, { status: res.status, statusText: res.statusText, headers });
    const cacheCopy = modified.clone();
    caches.open(CACHE).then(cache => cache.put('/index.html', cacheCopy));
    return modified;
  } catch {
    const cached = await caches.match('/index.html');
    if (!cached) throw new Error('offline');
    const html = prepareHtml(await cached.text());
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
