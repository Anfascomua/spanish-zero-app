(()=>{
'use strict';
let running=false,runId=0,deck=[],step=0;
let wakeLock=null,keepAliveAudio=null,keepAliveUrl='',speechWatchdog=null;

const FEMALE=/female|woman|mujer|helena|elvira|lucia|lucía|paulina|monica|mónica|sofia|sofía|maria|maría|irina|svetlana|victoria/i;
const MALE=/male|man|hombre|alvaro|álvaro|pablo|diego|jorge|antonio|pavel|yuri|alexander|maxim|dmitry|nikolai|mikhail/i;

function voice(lang,gender){
  const code=lang.slice(0,2).toLowerCase();
  const voices=speechSynthesis.getVoices().filter(v=>(v.lang||'').toLowerCase().startsWith(code));
  const re=gender==='female'?FEMALE:MALE;
  return voices.find(v=>re.test(v.name||''))||(voices.length>1?voices[gender==='female'?0:1]:voices[0]||null);
}

function speakPart(text,lang,gender,rate){
  return new Promise(done=>{
    if(!('speechSynthesis' in window)){done();return;}
    try{speechSynthesis.resume();}catch{}
    const u=new SpeechSynthesisUtterance(text);
    u.lang=lang;
    u.rate=rate;
    const v=voice(lang,gender);
    if(v)u.voice=v;
    let finished=false;
    const end=()=>{if(finished)return;finished=true;done();};
    u.onend=end;
    u.onerror=end;
    speechSynthesis.speak(u);
  });
}

function delay(ms,id){
  return new Promise(resolve=>setTimeout(()=>resolve(running&&id===runId),ms));
}

function makeKeepAliveUrl(){
  if(keepAliveUrl)return keepAliveUrl;
  const sampleRate=8000;
  const sampleCount=4000;
  const buffer=new ArrayBuffer(44+sampleCount*2);
  const view=new DataView(buffer);
  const write=(offset,text)=>{for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i));};
  write(0,'RIFF');
  view.setUint32(4,36+sampleCount*2,true);
  write(8,'WAVE');
  write(12,'fmt ');
  view.setUint32(16,16,true);
  view.setUint16(20,1,true);
  view.setUint16(22,1,true);
  view.setUint32(24,sampleRate,true);
  view.setUint32(28,sampleRate*2,true);
  view.setUint16(32,2,true);
  view.setUint16(34,16,true);
  write(36,'data');
  view.setUint32(40,sampleCount*2,true);
  for(let i=0;i<sampleCount;i++){
    view.setInt16(44+i*2,Math.round(18*Math.sin(2*Math.PI*30*i/sampleRate)),true);
  }
  keepAliveUrl=URL.createObjectURL(new Blob([buffer],{type:'audio/wav'}));
  return keepAliveUrl;
}

async function requestWakeLock(){
  if(!running||document.visibilityState!=='visible'||!('wakeLock' in navigator))return;
  try{
    if(wakeLock&&!wakeLock.released)return;
    wakeLock=await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release',()=>{wakeLock=null;});
  }catch{wakeLock=null;}
}

async function releaseWakeLock(){
  try{if(wakeLock&&!wakeLock.released)await wakeLock.release();}catch{}
  wakeLock=null;
}

function startBackgroundMedia(){
  if(!keepAliveAudio){
    keepAliveAudio=document.createElement('audio');
    keepAliveAudio.id='loop-background-media';
    keepAliveAudio.src=makeKeepAliveUrl();
    keepAliveAudio.loop=true;
    keepAliveAudio.preload='auto';
    keepAliveAudio.volume=1;
    keepAliveAudio.setAttribute('playsinline','');
    keepAliveAudio.style.display='none';
    document.body.appendChild(keepAliveAudio);
  }

  try{
    keepAliveAudio.currentTime=0;
    const p=keepAliveAudio.play();
    if(p&&typeof p.catch==='function')p.catch(()=>{});
  }catch{}

  requestWakeLock();

  if(speechWatchdog)clearInterval(speechWatchdog);
  speechWatchdog=setInterval(()=>{
    if(!running)return;
    try{if(speechSynthesis.paused)speechSynthesis.resume();}catch{}
  },1500);

  if('mediaSession' in navigator){
    try{
      navigator.mediaSession.metadata=new MediaMetadata({
        title:'Испанский с нуля',
        artist:'Прослушка по кругу',
        album:'Выбранные слова',
        artwork:[
          {src:'/icon-192.png',sizes:'192x192',type:'image/png'},
          {src:'/icon-512.png',sizes:'512x512',type:'image/png'}
        ]
      });
      navigator.mediaSession.playbackState='playing';
      navigator.mediaSession.setActionHandler('pause',()=>stop());
      navigator.mediaSession.setActionHandler('stop',()=>stop());
      navigator.mediaSession.setActionHandler('play',()=>{});
    }catch{}
  }
}

function stopBackgroundMedia(){
  if(speechWatchdog){clearInterval(speechWatchdog);speechWatchdog=null;}
  if(keepAliveAudio){
    try{keepAliveAudio.pause();keepAliveAudio.currentTime=0;}catch{}
  }
  releaseWakeLock();
  if('mediaSession' in navigator){
    try{navigator.mediaSession.playbackState='none';}catch{}
  }
}

function selectedIds(){
  try{
    const p=getP();
    return Array.isArray(p.dictSelected)?p.dictSelected:[];
  }catch{return [];}
}

function allWords(){
  try{return dictionaryEntries();}catch{return [];}
}

function refreshButtons(){
  const ids=selectedIds();
  const currentCategory=typeof dictCategory!=='undefined'?(dictCategory||'all'):'all';
  const words=allWords();
  const categoryWords=currentCategory==='all'?words:words.filter(x=>x.category===currentCategory);
  const selectedButton=document.getElementById('listen-selected-btn');
  const categoryButton=document.getElementById('listen-category-btn');
  const cardButton=document.getElementById('loop-card-btn');

  if(selectedButton){
    selectedButton.disabled=!ids.length&&!running;
    selectedButton.style.opacity=(ids.length||running)?'1':'.45';
    selectedButton.textContent=running?'■ Остановить':`▶ Прослушать выбранное (${ids.length})`;
  }
  if(categoryButton){
    categoryButton.disabled=false;
    categoryButton.textContent=running?'■ Остановить':currentCategory==='all'?`🔁 Прослушать весь словарь (${categoryWords.length})`:`🔁 Прослушать категорию (${categoryWords.length})`;
  }
  if(cardButton){
    cardButton.disabled=false;
    cardButton.textContent=running?'■ Остановить':'▶ Прослушать выбранное';
  }
}

function stop(){
  running=false;
  runId++;
  step=0;
  try{speechSynthesis.cancel();}catch{}
  stopBackgroundMedia();
  refreshButtons();
}

function syncCard(word,index){
  try{
    page='drill';
    drillDeck=deck.slice();
    drillPos=index;
    lastAutoSpoken=word.id+':'+index;
    render();
    refreshButtons();
  }catch{}
}

async function play(id){
  while(running&&id===runId&&deck.length){
    const index=step%deck.length;
    const word=deck[index];
    const femaleFirst=step%2===0;

    syncCard(word,index);
    if(!await delay(120,id))break;

    await speakPart(word.es,'es-ES',femaleFirst?'female':'male',.70);
    if(!running||id!==runId)break;

    if(!await delay(250,id))break;
    await speakPart(word.ru,'ru-RU',femaleFirst?'male':'female',.79);
    if(!running||id!==runId)break;

    step++;
    if(!await delay(3000,id))break;
  }
}

function start(mode){
  if(running){stop();return;}

  const words=allWords();
  if(mode==='selected'){
    const ids=selectedIds();
    deck=words.filter(x=>ids.includes(x.id));
  }else if(mode==='category'){
    const currentCategory=typeof dictCategory!=='undefined'?(dictCategory||'all'):'all';
    deck=currentCategory==='all'?words:words.filter(x=>x.category===currentCategory);
  }else{
    try{deck=Array.isArray(drillDeck)?drillDeck.slice():[];}catch{deck=[];}
  }

  if(!deck.length){
    alert(mode==='selected'?'Сначала отметьте слова галками в словаре.':'В выбранном наборе нет слов.');
    return;
  }
  if(!('speechSynthesis' in window)){
    alert('Озвучка не поддерживается.');
    return;
  }

  try{speechSynthesis.cancel();}catch{}
  running=true;
  step=0;

  // Запускается прямо из нажатия кнопки: Android создаёт активную медиасессию.
  startBackgroundMedia();

  const id=++runId;
  refreshButtons();
  play(id);
}

window.startSelectedListening=()=>start('selected');
window.startCategoryListening=()=>start('category');
window.startLoopListening=()=>start('card');
window.stopSelectedLoopListening=stop;

document.addEventListener('visibilitychange',()=>{
  if(!running)return;
  if(document.visibilityState==='visible')requestWakeLock();
  else try{speechSynthesis.resume();}catch{}
});

const app=document.getElementById('app');
if(app)new MutationObserver(()=>setTimeout(refreshButtons,0)).observe(app,{childList:true,subtree:true});
setTimeout(refreshButtons,0);
})();
