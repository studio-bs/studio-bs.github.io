
const $=s=>document.querySelector(s),TS=32,W=15,H=10,cv=$('#c'),g=cv.getContext('2d');cv.width=W*TS;cv.height=H*TS;

const FR='w'+'f'.repeat(W-2)+'w';
const I=(a,b='wfKKffXffXffKfw')=>['w'.repeat(W),a,FR,FR,b,...Array(4).fill(FR),'wwwwwwwxwwwwwww'];
/* 사라봉 트랙 (러너들이 도는 순환 경로) */
const TRACK=[...[3,4,5,6,7,8,9,10].map(x=>[x,6]),[10,7],[10,8],[10,9],...[10,9,8,7,6,5,4,3].map(x=>[x,10]),[3,9],[3,8],[3,7]];

/* ===== 제주 시간 · 날씨 ===== */
const WX={kind:'clear',temp:null,ok:false},QS=new URLSearchParams(location.search);
const RAIN=Array.from({length:90},()=>({x:Math.random()*520,y:Math.random()*320,v:9+Math.random()*6})),
      SNOW=Array.from({length:60},()=>({x:Math.random()*480,y:Math.random()*320,v:1+Math.random()*1.5,p:Math.random()*6}));
function jejuNow(){
  const f=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
  const g=k=>+f.find(p=>p.type==k).value,hq=QS.get('hour');
  return{h:hq!=null&&hq!==''?(+hq)%24:g('hour')%24,m:g('minute')};
}
const seasonNow=()=>{const m=+QS.get('month')||new Date(Date.now()+9*36e5).getUTCMonth()+1;return m==12||m<=2?'winter':m<=5?'spring':m<=8?'summer':'autumn'};
const isNight=()=>{const{h}=jejuNow();return h>=19||h<6};
/* 가족 일정: 11~1월, 날씨 좋을 때 아버지는 낮에, 어머니는 퇴근 후 가끔 과수원에 나감
   미리 보기: 주소 뒤에 ?hour=14&month=12 또는 ?hour=18&month=12&mom=1 */
const jejuDate=()=>new Date(Date.now()+9*36e5);
const farmDay=()=>{const m=+QS.get('month')||jejuDate().getUTCMonth()+1;return (m==11||m==12||m==1)&&(WX.kind=='clear'||WX.kind=='cloud')};
const dadFarm=()=>{const{h}=jejuNow();return farmDay()&&h>=7&&h<17};
const momFarm=()=>{const{h}=jejuNow();return farmDay()&&h>=17&&h<19&&(QS.get('mom')=='1'||Math.floor(Date.now()/864e5+.375)%3==0)};
const WET=()=>WX.kind=='rain'||WX.kind=='snow';
function nightA(){const{h,m}=jejuNow(),t=h+m/60;if(t>=20||t<5)return .5;if(t>=19)return .5*(t-19);if(t<6)return .5*(6-t);return 0}
function wxKind(c){if(c==null)return'clear';if(c>=95||(c>=51&&c<=67)||(c>=80&&c<=82))return'rain';if((c>=71&&c<=77)||c==85||c==86)return'snow';if(c==45||c==48)return'fog';if(c>=2)return'cloud';return'clear'}
const WXL={clear:['☀','맑음'],cloud:['☁','구름 많음'],fog:['🌫','안개'],rain:['🌧','비'],snow:['❄','눈']};
function wxText(){const l=WXL[WX.kind];return l[1]+(WX.temp!=null?' '+Math.round(WX.temp)+'°C':'')}
function updateWxChip(){
  const el=$('#wx');if(!el)return;const{h,m}=jejuNow(),l=WXL[WX.kind],ic=(isNight()&&WX.kind=='clear')?'🌙':l[0];
  el.textContent=WX_AT[wxPlace].n+' '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+' · '+ic+' '+l[1]+' · 🌡 '+(WX.temp!=null?Math.round(WX.temp)+'°C':'--°C');
}
function setWx(kind,temp,ok){const old=WX.kind;WX.kind=kind;WX.temp=temp;WX.ok=!!ok;updateWxChip();if(old!==kind)onWxChange()}
const fetchT=(u,ms=8000)=>Promise.race([fetch(u),new Promise((_,j)=>setTimeout(()=>j(new Error('timeout')),ms))]);
const WX_AT={jeju:{n:'제주',lat:33.2541,lon:126.5601,w:'Jeju'},seoul:{n:'서울',lat:37.5133,lon:126.9408,w:'Seoul'},busan:{n:'부산',lat:35.1151,lon:129.0415,w:'Busan'},incheon:{n:'인천',lat:37.4602,lon:126.4407,w:'Incheon'}},wxCache={};let wxPlace='jeju';
function wxSwitch(){const p=mmRegion();if(p==wxPlace)return;wxPlace=p;const c=wxCache[p];if(c&&Date.now()-c.at<6e5&&!QS.get('weather'))setWx(c.k,c.t,true);else{WX.temp=null;updateWxChip();loadWeather()}}
function wxPut(pl,k,t){wxCache[pl]={k,t,at:Date.now()};if(pl==wxPlace)setWx(k,t,true)}
async function loadWeather(){
  const q=QS.get('weather');if(q&&WXL[q]){setWx(q,null,true);return}
  const pl=wxPlace,P=WX_AT[pl];
  try{
    const r=await fetchT('https://api.open-meteo.com/v1/forecast?latitude='+P.lat+'&longitude='+P.lon+'&current=temperature_2m,weather_code,precipitation&timezone=Asia%2FSeoul');
    if(!r.ok)throw new Error('open-meteo '+r.status);
    const c=(await r.json()).current;let k=wxKind(c.weather_code);
    if(c.precipitation>0.1&&k!='snow')k='rain';
    wxPut(pl,k,c.temperature_2m);
  }catch(e){
    console.warn('날씨 1차 실패',e);
    try{   // 예비 날씨 서버
      const r=await fetchT('https://wttr.in/'+P.w+'?format=j1');
      if(!r.ok)throw new Error('wttr '+r.status);
      const c=(await r.json()).current_condition[0],w=+c.weatherCode;
      const k=w==113?'clear':[116,119,122].includes(w)?'cloud':[143,248,260].includes(w)?'fog':[179,227,230,323,326,329,332,335,338,368,371,392,395].includes(w)?'snow':'rain';
      wxPut(pl,k,+c.temp_C);
    }catch(e2){console.warn('날씨 2차 실패',e2);setWx(WX.kind,WX.temp,false);setTimeout(loadWeather,60000)}   // 둘 다 실패하면 1분 뒤 다시 시도
  }
}
function onWxChange(){if(map&&(map.o||cur=='house')&&!busy&&!dlg&&!modal)buildNpcs()}
function weatherFX(t){
  if(!map||!map.o)return;
  const w=W*TS,h=H*TS,na=nightA();
  if(na>0){g.fillStyle='rgba(8,16,52,'+na+')';g.fillRect(0,0,w,h)}
  const k=WX.kind;
  if(k=='rain'){
    g.fillStyle='rgba(20,30,55,.38)';g.fillRect(0,0,w,h);
    g.strokeStyle='rgba(200,220,255,.65)';g.lineWidth=1;g.beginPath();
    RAIN.forEach(d=>{d.y+=d.v;d.x-=d.v*.25;if(d.y>h){d.y=-10;d.x=Math.random()*(w+40)}if(d.x<0)d.x+=w;g.moveTo(d.x,d.y);g.lineTo(d.x+3,d.y-9)});g.stroke();
  }else if(k=='snow'){
    g.fillStyle='rgba(30,41,59,.12)';g.fillRect(0,0,w,h);g.fillStyle='rgba(255,255,255,.9)';
    SNOW.forEach(d=>{d.y+=d.v;d.x+=Math.sin(t/600+d.p)*.6;if(d.y>h){d.y=-4;d.x=Math.random()*w}g.fillRect(d.x,d.y,2,2)});
  }else if(k=='fog'){g.fillStyle='rgba(235,240,245,.28)';g.fillRect(0,0,w,h)}
  else if(k=='cloud'){g.fillStyle='rgba(30,41,59,.10)';g.fillRect(0,0,w,h)}
}

const AGL=['C','w','w','L','w','w','A'],AGR=['A','w','w','C','w','w','L'];
const AGM=['w'.repeat(W),'wwCwwAwwwAwwCww',...[2,3,4,5,6,7,8].map(y=>{const i=y-2,mid=y==3?'k'.repeat(W-2):y==4?'fXfffffffffXf':y==6?'ffZfffffffZff':y==7?'ff㉶f㉶f㉶f㉶f㉶ff'.slice(0,W-2):'f'.repeat(W-2);return AGL[i]+mid+AGR[i]}),'wwwwwwwxwwwwwww'];

const MNL=['w','w','C','w','B','w','E'],MNR=['w','w','E','w','I','w','C'];
const MNM=['w'.repeat(W),'wwBwwEwwwEwwBww',...[2,3,4,5,6,7,8].map(y=>{const i=y-2,mid=y==3?'k'.repeat(W-2):y==4?'fXfffffffffXf':y==6?'ffKKfffffKKff':y==7?'f㈈ff㉵ff㈈ff㉵ff'.slice(0,W-2):'f'.repeat(W-2);return MNL[i]+mid+MNR[i]}),'wwwwwwwxwwwwwww'];

/* 송: 지도마다 무작위로 나타나는 친구 */
/* 친구 관련 대사는 코드에 두지 않고 서버(talk_public, talk_private)에서 받아 옴 */
const TX={guest:[['안녕하세요. 😄']],placeG:{},chG:null,ck:[['ㅋ']],base:[],place:{},ch:null,ckWd:[],lOwner:null,lName:null,ckSelf:false};
async function talkLoad(){try{const r=await DB.rpc('talk_public');if(r)Object.assign(TX,r)}catch(e){}Object.assign(TX,{base:[],place:{},ch:null,ckWd:[],lOwner:null,lName:null,ckSelf:false});try{const r=await DB.rpc('talk_private',{p_name:typeof GUEST!='undefined'?GUEST.name||'':''});if(r&&r.ok)Object.assign(TX,r)}catch(e){}}
const SONG_XY={gym:[16,12],arcade:[15,11],gameRoom:[9,4],cinema:[5,6],bowl:[9,9],airport:[9,8],coast:[9,3],route2:[7,3],town:[11,7],sports:[12,4],route1:[2,8],rest:[5,6],studio:[11,8],samgeori:[5,6],beach:[12,6],orchard:[4,2],gotF:[4,7],oreumF:[9,6],shoreF:[8,4]};
const SONG={at:null,miss:0,last:-1};
function songRoll(id){if(!SONG_XY[id]){return}const on=SONG.miss>=2||Math.random()<.4;SONG.at=on?id:null;SONG.miss=on?0:SONG.miss+1}
const songPal=()=>typeof FRIEND!='undefined'&&FRIEND&&FRIEND.greet&&FRIEND.greet.length>0;   // 송과 아는 사이인지
/* L 군: 비가 와도 새벽에도 트랙을 뜀. 본인이 오면 트랙 세 바퀴를 돌아야 나타남 */
const LG={pos:0,q:null,done:false};try{LG.done=localStorage.getItem('bsw_lgun')=='1'}catch(e){}
const lgunMe=()=>!isOwner()&&typeof FRIEND!='undefined'&&FRIEND&&FRIEND.kind=='lgun';
const lgunKnown=()=>!!TX.lName;
const lgunShow=()=>!lgunMe()||LG.done;
function lgunTalk(){if(isOwner()&&TX.lOwner&&TX.lOwner.length){const L=TX.lOwner;return L[Math.random()*L.length|0]}if(!isOwner()&&typeof FRIEND!='undefined'&&FRIEND&&FRIEND.lTalk){const T=FRIEND.lTalk;return[T[Math.random()*T.length|0]]}if(lgunMe()&&FRIEND.self){return[FRIEND.self[Math.random()*FRIEND.self.length|0]]}return['운동은 나의 힘.','꾸준함이 모든 것을 이긴다.']}
function lgunStep(){if(cur!='sports'||!lgunMe()||LG.done)return;const q=py==6?(px<7?0:1):py==10?(px>=7?2:3):(py>=7&&py<=9&&px==10)?1.5:(py>=7&&py<=9&&px==3)?3.5:null;if(q==null||![3,4,5,6,7,8,9,10].includes(px))return;const Q=Math.floor(q);if(LG.q==null){LG.q=Q;return}if(Q==LG.q)return;const d=(Q-LG.q+4)%4;if(d==1)LG.pos++;else if(d==3)LG.pos--;LG.q=Q;if(Math.abs(LG.pos)>=12){LG.done=true;try{localStorage.setItem('bsw_lgun','1')}catch(e){}buildNpcs();sfx('w');toast('트랙 세 바퀴 완주! 저기 누가 뛰고 있다… 🏃')}}
const friendCall=()=>{if(typeof FRIEND=='undefined'||!FRIEND)return'';const s=FRIEND.short,c=s.charCodeAt(s.length-1)-0xAC00;return s+(c>=0&&c%28?'이':'')};
function songFriend(){if(isOwner()||!songPal())return null;if(!FRIEND.met){FRIEND.met=1;return FRIEND.greet}const L=FRIEND.lines||[];return L.length&&Math.random()<.6?[L[Math.random()*L.length|0]]:null}
function songTalk(){const fr=songFriend();if(fr)return fr;const P=TX.place[cur]||[],G=TX.placeG[cur],priv=isOwner()||songPal(),L0=!priv?(G&&Math.random()<.5?G:TX.guest):Math.random()<.65&&P.length?P:TX.base,L=L0&&L0.length?L0:TX.guest;let i=Math.random()*L.length|0;if(L[i][0]==SONG.last)i=(i+1)%L.length;SONG.last=L[i][0];return L[i]}
const SONG_CH=()=>(isOwner()||songPal())?(TX.ch||undefined):(TX.chG||undefined);
function songNpc(id){const[x,y]=SONG_XY[id];return{x,y,c:'#1e3a8a',h:'#201a1a',p:'#201a1a',gl:'#6b4a2e',cup:1,stay:1,n:'송',when:()=>SONG.at==id,s:songTalk,ch:SONG_CH}}

/* 해녀 할망 (제주 사투리) */
/* 수영장 시간: 보내 주신 제주국민체육센터 이용안내 기준. 설·추석과 1월 1일 휴관은 안내문으로만 표시 */
const poolState=()=>{const{h}=jejuNow(),d=jejuDate().getUTCDay();if(d==2)return'tue';if(h>=12&&h<14)return'noon';const end=d==0||d==6?18:21;return(h>=6&&h<12)||(h>=14&&h<end)?'open':'closed'};
const poolOpen=()=>poolState()=='open';
const poolBusy=()=>{if(!poolOpen())return false;const{h}=jejuNow();return(h>=6&&h<9)||(h>=17&&h<21)};
const poolMsg=()=>({open:'지금 수영할 수 있는 시간이에요. 🏊',noon:'12시부터 14시까지는 물 교환과 청소 시간이라 쉬어요.',tue:'매주 화요일은 휴관이에요.',closed:'지금은 문 닫은 시간이에요. 운영 시간을 확인해 주세요.'})[poolState()];
const hnMeal=()=>{const{h}=jejuNow();return !WET()&&((h>=11&&h<14)||(h>=17&&h<20))};   // 점심·저녁엔 해녀의 집에서 함께 쉼
const elderHome=()=>{const{h}=jejuNow();return h>=17||h<7||WET()};   // 저녁·밤·궂은 날에는 집에서 쉼
const hnS=()=>{
  if(WET())return['비가 오난 바당이 거칠어부난 오늘은 구경만 허주게.','보성이 할망이우다. 집에 강 감귤차나 마십서. ☕'];
  if(isNight())return['밤이우다게~ 어두우난 바당 가까이 가지 맙서.','보성이 할망이우다. 혼저 들어강 쉬어사주.'];
  return['혼저옵서예~ 보성이 할망이우다. 🌊','옛날엔 나도 이 바당에서 물질 허멍 살았주게.'];
};
const hnS2=()=>{
  if(WET())return['날이 궂으난 바당엔 들지 말아사 헌다게.','보성이 외할망이우다. 조심히 다녀갑서예.'];
  if(isNight())return['이 밤에 어디 감수광? 보성이 외할망이우다.','바당은 낮에 와사 곱닥허주게.'];
  return['보성이 외할망이우다. 잘 왔수다게~ 🐚','나도 옛날엔 테왁 하나 들엉 바당에 들었주.'];
};
const ELDER_M=['w'.repeat(W),'w†w†www†w†www†w','w㈀㈀ffffff㈂ffffw','wf§§f≈≈≈≈≈f§§fw','wffff≈¶¶¶≈ffffw','wffff≈≈≈≈≈ffffw',FR,'wfXff㈃ffff㈃ffXw'.slice(0,15),'w㈄fffffffffff㉵w','wwwwwwwxwwwwwww'];
const hnCh=()=>({
  '해녀 이야기':['제주바당은 우리 해녀들 삶터였주게.','숨 참앙 들어가민 바당 속이 또 다른 세상이었주.','올라왕 내쉬는 숨비소리, 그게 해녀 소리라.'],
  '지금 제주 날씨':['제주는 지금 '+wxText()+'이우다게.',WET()?'이런 날엔 바당에 들어가민 안 된다게.':'바당도 잔잔허고 좋은 날이우다.'],
  '감귤 이야기':['물질허고 나왕 먹던 감귤 한 쪽이 최고였주게. 🍊','표선 오른쪽 위 길로 가민 과수원이라, 귤 맛 볼 수 이서마씸.']
});
const UMB=[['비가 와부난 우산 써사 헌다게~ ☔','이런 날엔 따끈한 감귤차가 딱이우다.'],['비 오는 날 바당은 구경만 허는 거라게.','미끄러우난 조심히 다녀갑서예!'],['아이고, 우산 뒤집어질 뻔 했쥬.','바람이 막 불어부난…']];

const M={
town:{n:'제주시',o:1,bgm:'town',m:[
  'TTTTTTT=TTTTTTT',
  'T..F...=...F..T',
  'T.RRR..=.m.F..T',
  'T.HDH℧.=...T..T',
  'T.===..=#....TT',
  '===============',
  'T.F...m=....F.T',
  'T...m..=m.F...T',
  'TT.F...=....TTT',
  'TTTTTTT=TTTTTTT'
],sign:{'3,3':'보성의 집'},d:{'3,3':['house',7,8]},e:{u:['cityhall',7,9],l:['route2',14,5],r:['orchard',0,5],d:['route1',7,0]},umb:[[3,5,'#ef4444']],p:[
  {x:2,y:7,c:'#a16207',h:'#d1d5db',n:'마을 어르신',s:['보성이가 그렇게 가족들을 사랑하고 존경한다고 하더라~','요즘 그런 젊은이 드물어. 부모님이 복 받으셨지. 🍊']},
  {x:9,y:8,c:'#111827',h:'#1b1b26',stay:1,w:1,n:'창끼 (a.k.a 노진구)',s:()=>TX.ck[Math.random()*TX.ck.length|0]},
  {x:10,y:6,c:'#4aa3ff',h:'#6b3e26',n:'마을 소년',s:['어서 와! 여기가 BS World의 제주시이야.','위로 가면 공원, 아래는 감귤 과수원, 왼쪽은 한라산 가는 길, 오른쪽은 함덕 바다야.','위쪽 🧠 뇌구조 메뉴를 열면 어디든 순간이동할 수 있대!']},
  {x:12,y:7,c:'#312e81',h:'#fde047',n:'별지기',when:()=>{const{h}=jejuNow();return h>=23||h<1},s:['이 시간에 깨어 있네요. ✨','자정 무렵에만 여기 나와요. 비밀이에요.'],eg:'star'},
  {x:5,y:7,c:'#ff8fb1',h:'#222',w:1,n:'꽃밭 이웃',s:['꽃향기 맡고 가렴. 🌸','달리기 전엔 스트레칭 필수야!']}
]},

route1:{n:'표선',o:1,wide:1,land:[8,7],bgm:'route',m:['TTTTTTT=TTTTTTTTTTTTTTT=','TT.F...=..F...F..F..F.==','T.ЮЮЮ..=......ЖЖЖ.....=T','T.HDHb.=.....ŋHDH..F..=T','T..====================T','T.dodo.=..........dodo=T','T.dddd.=㌴.........dddd=T','========================','T.F...F=...F.......F..FT','T.....F=.F.....GGG...F.T','T..ac..=..b...㉾HDH.F...T','T..gh..================T','T.F...F=..F...F....F.F.T','ssssssssssssssssssssssss','~~~~~~~~~~~~~~~~~~~~~~~~'],
        board:{'14,10':'maeul'},sign:{'15,3':'할아버지댁','3,3':'외할아버지댁','7,13':'표선 백사장','16,10':'마을 경로당','8,6':'시외버스','13,5':'표선 오일장'},d:{'15,3':['gpHome',7,8],'3,3':['gmHome',7,8],'16,10':['maeul',7,8]},noe:{'23,1':1},ex:{'23,0':['orchard',0,13]},e:{u:['town',7,9], l:['gotF',14,5], r:['minsok',0,5]},umb:[[4,13,'#f59e0b'],[18,13,'#0ea5e9']],
        p:[
{x:18,y:1,ani:'cat',c:'#f59e0b',h:'#f59e0b',w:1,n:'고양이',s:['야옹~ 🐱','(할아버지댁 뒷마당에 사는 고양이다.)']},
{x:12,y:1,ani:'dog',c:'#fef3c7',h:'#92400e',w:1,n:'강아지',when:()=>S.eggs.cat,s:['멍멍! 🐶','(고양이가 부른 친구인 것 같다.)']},
{x:12,y:4,pet:1,w:1,c:'#000',h:'#000',n:'할아버지댁 개',when:()=>!isNight()&&!WET(),s:['멍! 멍멍! 🐕','(꼬리를 프로펠러처럼 흔들며 주위를 뛰어다닌다.)']},
{x:5,y:7,c:'#8a6d4b',h:'#999',n:'등산객',s:['자격증 공부는 마라톤이래. 페이스 조절이 전부지!','북쪽 시티엔 시험을 줄줄이 통과한 사람이 있다던데… 🤔']},
{x:12,y:7,c:'#ef4444',h:'#222',w:1,n:'꼬마 트레이너',s:['나는 표선의 달리기 선수!','위쪽 제주시 지나 사라봉까지 경주할래?']},
{x:9,y:13,c:'#f59e0b',h:'#5a3a1a',n:'여행자',s:['감귤 향 나는 섬에서 왔어. 🍊','감귤마라톤은 코스도 공기도 최고야.']},
{x:20,y:6,c:'#65a30d',h:'#d1d5db',w:1,when:()=>!isNight()&&!WET(),n:'밭일하는 삼춘',s:['올해 무가 잘 들었수다.','오일장은 끝자리 2일, 7일에 열리주게. 저 앞 공터가 장터라.']},
{x:20,y:13,c:'#0ea5e9',h:'#3f2a1c',w:1,when:()=>!isNight(),n:'백사장 산책객',s:['표선 백사장은 물 빠지면 정말 넓어요. 🏖']},
{x:11,y:9,c:'#a855f7',h:'#e5e7eb',w:1,when:()=>!isNight()&&!WET(),n:'동네 어르신',s:['경로당 가는 길이우다. 🍵']}]},



sports:{n:'사라봉',o:1,wide:1,bgm:'sports',land:[7,5], m:['TTTTTTT=TTTTTTTTTTTTTTT','TT.....=.GGG.㋘㋘㋘㋘㋘㋘㋘㋘TT','T[.].|.=.HDH.㋘㋘㋘㋘㋘㋘㋘㋘.T','T......=#===㉾㋘㋘㋘㋘㋘㋘㋘㋘.T','T.[.]|.=..=...=㋘㋘㋘㋘㋘..T','==================....T','T..tttttttt=㌕..㌕..T.%FT','T..t......t=㌀㌀㌀㌀.㌁㌁㌁%..','T.bt......t=㌀㌀㌀㌀.㌁㌁㌁%..','Tb.t......t=㌀㌀㌀㌀.㌁㌁㌁%..','T..tttttttt=㌀㌀㌀㌀.㌁㌁㌁%..','T...T.....F=㌀㌀㌀㌀b㌖.㌗%..','TT.F...F...=㌕..㌕.Tb.%..','TTTTTTTTTTT=TTTTTTTTTTT'],
        board:{'12,3':'gym'},sign:{'10,2':'체육관','16,3':'사라봉','14,5':'사라봉 오르는 길','3,1':'놀이터','13,7':'풋살장','18,7':'배드민턴','17,11':'식수대','19,11':'세면대'},d:{'14,4':['sara',11,14],'10,2':['gym',16,15]}, e:{u:['oreumF',7,13],l:['samgeori',14,5],d:['hamdeok',1,0]},umb:[[9,12,'#ef4444']],
        p:[
{x:4,y:6,ti:1,run:1,c:'#22c55e',h:'#222',n:'트랙 러너',s:['하나, 둘! 하나, 둘!','체육관 앞 게시판에 새 기록이 올라온대.']},
{x:10,y:6,ti:7,run:1,c:'#ef4444',h:'#6b3e26',n:'마라토너',s:['헉헉… 하프코스는 21km래!','페이스 조절이 제일 중요해.']},
{x:7,y:6,ti:4,run:1,allw:1,stay:1,c:'#111827',h:'#17151c',when:()=>lgunShow(),n:'L 군',s:()=>lgunTalk()},
{x:8,y:10,ti:13,run:1,c:'#f59e0b',h:'#222',n:'조깅 크루',s:['트랙 한 바퀴 더!','감귤마라톤 10km도 같이 뛸래? 🍊']},
{x:2,y:3,c:'#f59e0b',h:'#222',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=9&&h<20},n:'놀이터 꼬마',s:['그네 먼저 탈 거야! 😆']},{x:4,y:3,c:'#ec4899',h:'#3f2a1c',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=9&&h<20},n:'놀이터 꼬마',s:['철봉 나도 할 수 있어!']},
{x:13,y:8,c:'#ef4444',h:'#222',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=6&&h<23},n:'풋살 하는 사람',s:['패스! 패스! ⚽']},{x:14,y:9,c:'#3b82f6',h:'#3f2a1c',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=6&&h<23},n:'풋살 하는 사람',s:['한 골만 더 넣고 쉬자!']},{x:17,y:8,c:'#10b981',h:'#222',stay:1,fd:3,when:()=>{const h=jejuNow().h;return h>=6&&h<23},n:'배드민턴 치는 사람',s:['스매시! 🏸']},{x:19,y:8,c:'#f59e0b',h:'#6b3e26',stay:1,fd:2,when:()=>{const h=jejuNow().h;return h>=6&&h<23},n:'배드민턴 치는 친구',s:['방금 그거 아웃이었어요. 분명히요.']}]},

coast:{n:'제주 바닷가',o:1,bgm:'beach',m:[
  '~~3~2ss=TTTTTTT',
  '~1~~~ss=.㋧㋢㋢㋢.T',
  '4~~~~ss=.㋦㋣㋤㋣㋥T',
  '~~2~sss=..===.T',
  '~~~3ss.=.====.T',
  '~1~sss.========',
  '~~~~ss.F.....FT',
  '~~~1~ss.......T',
  '~2~~3~ss..F.TTT',
  '~~4~~~~sTTTTTTT'],sign:{'11,2':'해녀의 집'},d:{'11,2':['haenyeo',7,12]},e:{r:['route2',0,5],u:['airport',7,9,1],d:['beach',7,0,1]},p:[
{x:10,y:7,c:'#475569',h:'#d1d5db',n:'셋동네 삼춘',s:['쾅 소리 나난 "아이고, 베락 털어졈신가?" 했주게.','이 셋동네 사름들, 밝도록 줌 혼줌 못 잤수다!']},
{x:5,y:4,c:'#e879f9',h:'#222',w:1,n:'해변 산책러',s:['파도 소리를 들으면 마음이 차분해져. 🌊','헌혈의 집에 가면 헌혈왕 이야기를 들을 수 있어!']},
{x:4,y:6,c:'#1f2937',h:'#d1d5db',when:()=>!elderHome()&&!hnMeal(),n:'보성 할머니',s:hnS,ch:hnCh},
{x:6,y:8,c:'#334155',h:'#e5e7eb',when:()=>!elderHome()&&!hnMeal(),n:'보성 외할머니',s:hnS2,ch:hnCh}],umb:[[9,6,'#3b82f6']]},

airport:{n:'제주 공항',o:1,wide:1,land:[7,8],bgm:'route',plane:[7,3],plane2:[24,3],m:['~~~~TTTTTTTTTTTTTTTTTTTTTTTTTT','~~~~ssrrrrrrrrrrrrrrrrrrrrrTTT','~3~~ssyyyyyyyyyyyyyyyyyyyyyTTT','~~~~ssueeeuuuuuuuuuuuuuueeeuTT','~1~ss.ueeeuuuuuuuuuuuuuueeeuTT','~~~ss..nnnnnnn....+++..+++..TT','~2~ss..jjjDjjj....,,,..,,,..TT','~~~~ss.====.................TT','~~~3ss.=F..iS.TT.F...i....FTTT','~~3~2ss=TTTTTTTTTTTTTTTTTTTTTT'],sign:{'10,6':'터미널'},d:{'10,6':['terminal',7,8]},e:{d:['coast',7,0,1]},umb:[[6,7,'#0ea5e9'],[27,7,'#0ea5e9']],p:[{x:22,y:4,c:'#ea580c',h:'#222',w:1,n:'유도 요원',s:['오라이~ 오라이~ ✈']},
{x:20,y:7,c:'#4b5320',h:'#222',stay:1,n:'강하 교관',s:['이 하늘을 보면 보성이 생각이 나.','특전사 낙하산정비병 출신이지. 🪂'],ch:{'🪂 열기구 강하':['열기구에서 낙하산으로 5번 뛰었어. 🎈','그중 한 번은 자기가 직접 포장한 낙하산으로 뛰었지.','자기 손으로 접은 낙하산을 메고 뛰는 기분, 상상이 돼?'],'🔧 정비병이 하는 일':['우리 군의 안전을 위해 낙하산 정비에 힘쓰는 병력이야.','그래서 한 번 접을 때마다 몇 번이고 확인하지.']}},
{x:24,y:7,c:'#64748b',h:'#d1d5db',n:'격납고 정비 삼춘',s:['격납고 안은 출입 금지우다게.']},
{x:11,y:4,c:'#ea580c',h:'#222',n:'항공 정비사',s:['기체 점검 이상 없음! ✈','비행기를 타고 싶으면 터미널 안 탑승 수속 카운터로 가 봐.']},
{x:10,y:8,c:'#a78bfa',h:'#6b3e26',w:1,n:'여행객',s:['제주에 내리자마자 귤 냄새가 나는 것 같아요. 🍊','공항 바로 옆이 바다라니, 너무 좋아요!']}]},

studio:{n:'용담',o:1,wide:1,bgm:'knowledge',land:[11,5],m:['TTTTTTTTTTTTTTTTTTTTTTT','T.F...F...F...F..F...FT','T..F...T...F...T..F...T','T.QQQ.....YYY.......F.T','T.HDH.T...HDH㉾........T','=======================','T..F.....F...........TT','T...b...m...㋊㋊.㋊㋊.㋊㋊.FT','T.F..b..m.............T','TTTTTTTTTTTTTTTTTTTTTTT'],board:{'13,4':'atelier'},sign:{'3,4':'자격·프로젝트 센터','11,4':'창작 공방','15,6':'전시 가판대'},d:{'3,4':['agency',7,8],'11,4':['atelier',7,8]},e:{l:['shoreF',22,5],r:['rest',0,7]},umb:[[7,6,'#a855f7'],[20,6,'#a855f7']],p:[{x:13,y:8,c:'#b45309',h:'#3f2a1c',stay:1,n:'벼룩시장 삼춘',s:['여긴 자랑 가판대우다. 뽑은 인형이나 장비를 진열해 봅서. 🛍','사고파는 건 안 되고 구경만 해마씸.'],ch:{'🧸 전시 가판대':()=>showStall(),'🥕 주인장 가판대 보기':()=>showDanggn()}},
{x:17,y:8,c:'#be185d',h:'#222',lh:1,stay:1,n:'중고책 파는 학생',s:['전공책 거의 새것이에요. 🙌']},
{x:18,y:6,c:'#0f766e',h:'#222',w:1,n:'구경하는 사람',s:['가끔 보물 같은 물건이 나와요.']},
{x:13,y:6,c:'#3b82f6',h:'#222',n:'시티 안내원',s:['여기는 용담이에요.','보라색 지붕은 창작 공방이고, 김이 나는 건물은 찜질방이에요.']},

{x:12,y:8,c:'#fbbf24',h:'#3f2a1c',w:1,dog:'#d6a35c',n:'강아지와 스케치 나온 사람',s:['제 강아지가 모델이에요. 가만히는 안 있지만요. 🐕']},
{x:7,y:6,c:'#6366f1',h:'#222',n:'동네 사진가',s:['멘사 연구소는 서귀포에 있어요. 사진관은 공원으로 옮겼고요.']},
{x:4,y:8,c:'#f59e0b',h:'#6b3e26',w:1,n:'스케치하는 학생',s:['돌담을 그리고 있어요.']}]},

projects:{n:'자격·프로젝트 센터 2층',par:'agency',bgm:'knowledge',m:['w'.repeat(W),'w(w(wwwwww(w(ww',FR,FR,'wfKKffXffXffKKw'.slice(0,15),FR,'wf㉻fff㉻f㉻fff㉻fw',FR,'w㉵ffffffffff㉵fw'.slice(0,15),'wwwwwwwㅸwwwwwww'],sign:{'7,9':'1층'},d:{'7,9':['agency',11,8]},p:[
{x:7,y:3,c:'#2563eb',h:'#1b1b26',n:'전시관 큐레이터',s:['보성이 직접 만든 것들을 모아 둔 곳입니다.'],ch:{'🗂 프로젝트 보기':()=>showProjects(),'✉ 연락처':()=>showProjects()}}]},

photo:{n:'보성 사진관',par:'samgeori',wide:1,bgm:'indoor',m:['wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww','w)w)w)w)w)w)w)w)w)w)w)wwwwwwwwwwwwwww','wfffffffffffffffffffffwf㋽㋽fffffff㋾㋾fw','wfffⓜⓜⓜffff㈉fffff㈉ffffwf㋽㋽fffffff㋾㋾fw','wfffffffffffffffffffffffffffffffffffw','wfKKfffffⓔfffⓔfffⓔfKKfffffffffffffffw','wfffffffffffffffffffffffffffffffffffw','wfffⓔfffⓔffffkkkffⓔffff㉵fffffffffff㉵w','wfffffffffffffffffffffwfffffffffffffw','wwwwwwwwwwwxwwwwwwwwwwwwwwwwwwwwwwwww'],sign:{'25,2':'즉석사진','35,2':'증명사진'},d:{'11,9':['samgeori',11,4]},p:[
{x:30,y:4,c:'#a855f7',h:'#3f2a1c',stay:1,n:'체험실 직원',s:['왼쪽은 즉석사진, 오른쪽은 증명사진 기계예요. 📸','즉석사진은 귤밭, 돌하르방, 비행기 같은 배경을 고를 수 있어요.']},
{x:14,y:6,c:'#a855f7',h:'#3f2a1c',stay:1,n:'사진관 주인',s:['주인장이 찍은 사진들을 걸어 두었어요. 📷','벽 액자나 세워 둔 그림 앞에서 누르면 크게 볼 수 있어요.'],ch:{'🖼 사진 전체 보기':()=>showPhotos(),'🗺 여행 지도':()=>showTravel()}}]},

cave:{n:'??? 동굴',par:'gotF',bgm:'knowledge',m:[
  '_______________',
  '__::::::__:::__',
  '_:::__:::::::__',
  '_::::::::__:::_',
  '___:::::::::::_',
  '::::::::::::*__',
  '___:::::::::::_',
  '_::__::::::::__',
  '_::::::__:::::_',
  '_______________'],d:{'0,5':['gotF',12,4]},p:[
{x:7,y:3,c:'#334155',h:'#94a3b8',n:'동굴 지기',s:['어찌 여길 찾아왔수과? 제주 땅 밑엔 용암동굴이 많주게.','저 안쪽 상자는 열어봐도 됩니다.']}]},

beach:{n:'하얀 백사장',o:1,bgm:'beach',land:[7,8],m:[
  '~~4~~~~sTTTTTTT',
  '~~~~~ssss.F.TTT',
  '~3~~sss?ssYYYTT',
  '~~~sss;ss?HDHFT',
  '~~~ssssss..F..T',
  '~1~ss?;sss=====',
  '~~~~sssss?;...T',
  '~~3~~ssssss.F.T',
  '~~~~~~~ssss.TTT',
  '~~2~~~~~~TTTTTT'],sign:{'11,3':'바다 펜션'},d:{'11,3':['pension',7,8]},e:{u:['coast',7,9,1],r:['gotF',0,5]},umb:[[11,6,'#ef4444']],p:[
{x:6,y:4,c:'#f472b6',h:'#6b3e26',n:'모래성 쌓는 아이',s:['이 모래성은 파도가 와도 안 무너질 거예요!']},
{x:8,y:7,c:'#38bdf8',h:'#222',w:1,n:'비치볼 하는 사람',s:['받아라~!']},
{x:10,y:6,c:'#fde047',h:'#3f2a1c',sit:1,n:'일광욕하는 사람',s:['맨도롱 또똣허니 잠 오쿠다… 😎']},
{x:4,y:3,c:'#0ea5e9',h:'#111',n:'서퍼',s:['파도 좋은 날은 일이고 뭐고 없어요. 🏄']},
{x:8,y:2,c:'#a3e635',h:'#6b3e26',w:1,dog:'#d6a35c',n:'강아지 산책하는 주민',s:['우리 강아지는 모래만 보면 뛰어요. 🐕']}]},

gimpo:{n:'김포공항',o:1,bgm:'route',plane:[3,3],land:[7,7],m:[
  'TTTTTTTTTTTTTTT',
  'rrrrrrrrrrrrrrr',
  'yyyyyyyyyyyyyyy',
  'uuueeeuuuueeeuu',
  'uuueeeuuuueeeuu',
  '..nnnnnnnnnnn..',
  '..jjjjjDjjjDj..',
  'ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ',
  'ㅊㅊ...iS..㌴.ㅠ.ㅊㅊ',
  'ㅊㅊTTTTTTTTTTTㅊㅊ'],sign:{'9,8':'공항버스','7,5':'김포공항 국내선','11,5':'국제선','11,8':'5·9호선','1,8':'국립항공박물관','13,8':'롯데마트'},d:{'7,6':['gimpoT',7,8],'11,6':['gimpoI',7,8]},umb:[[5,8,'#0ea5e9']],p:[
{x:13,y:4,c:'#ea580c',h:'#222',n:'김포공항 정비사',s:['제주 노선은 하루 종일 쉴 틈이 없어요. ✈','서울 시내로 가려면 오른쪽 아래 지하철 입구로 들어가세요. 5호선과 9호선이 있어요.']},
{x:3,y:8,c:'#fb7185',h:'#3f2a1c',w:1,n:'캐리어 든 여행객',s:['제주에서 막 왔어요. 벌써 귤이 그립네요. 🍊']}]},

gimpoT:{n:'김포공항 터미널',par:'gimpo',bgm:'indoor',m:['w'.repeat(W),'wwlwwlwwwlⓡwlww','wfffffffffⓡfffw','wkkkkkkkkkⓡkkkw',FR,FR,'wfKKffffffffKKw',FR,FR,'wwwwwwwxwwwwwww'],d:{'7,9':['gimpo',7,7]},p:[
{x:7,y:2,c:'#0369a1',h:'#222',n:'김포공항 수속 직원',s:['BS 에어입니다. 제주로 돌아가시나요? ✈'],ch:{'✈ 제주로 돌아가기':()=>flyTo('terminal'),'📡 실제 김포공항 현황':()=>{FB.air='GMP';showAirBoard('D')}}},
{x:3,y:5,c:'#f472b6',h:'#222',w:1,n:'출장 다녀온 직장인',s:['제주 출장 끝! 이제 9호선 타고 바로 회사로 갑니다.']},
{x:11,y:7,c:'#bdb092',h:'#222',n:'지하철 안내원',s:['밖으로 나가 오른쪽 입구로 내려가면 5호선과 9호선이에요.','5호선은 신길과 여의도, 9호선은 여의도와 노량진, 노들까지 갑니다. 🚇']}]},

gimpoI:{n:'김포공항 국제선 터미널',par:'gimpo',bgm:'indoor',m:['w'.repeat(W),'wwlwwlwwwlwwlww',FR,'w'+'k'.repeat(W-2)+'w',FR,FR,'wfKKffffffffKKw',FR,FR,'wwwwwwwxwwwwwww'],d:{'7,9':['gimpo',11,7]},p:[
{x:7,y:2,c:'#1d4ed8',h:'#222',n:'국제선 수속 직원',s:['국제선 터미널입니다. BS 에어 국제선은 아직 취항 준비 중이에요. ✈'],ch:{'🗺 여행 지도 보기':()=>showTravel(),'📡 실제 김포공항 국제선 현황':()=>{FB.air='GMP';showAirBoard('I')}}},
{x:3,y:5,c:'#a78bfa',h:'#3f2a1c',w:1,n:'출국하는 여행객',s:['여권, 지갑, 충전기. 이 셋만 있으면 일단 출발이에요. 🧳']},
{x:11,y:7,c:'#0f766e',h:'#222',n:'환전소 직원',s:['남은 동전은 가져오셔도 소용없다고들 하죠. 그래도 추억은 남아요. 💱']}]},

yongsan:{n:'용산',o:1,bgm:'route',land:[7,3],m:[
  'ㅊㅊ.ㅊㅊ.TT.ㅔㅔㅔ.ㅑㅑ',
  '.F.....F.ㅔㅔㅔ.ㅑㅑ',
  'ㅈㅈ.F....ㄴㅀㄴ..TT',
  'ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹT',
  'ㅈㅈ.F...ㄹ.ㅅ.ㅈ..F',
  'sssssssㅂsㅅsssss',
  '~~~~~~~ㅂ~ㅅ~~~~~',
  '~~~~~~~ㅂ~ㅅ~~~~~',
  '~~~~~~~ㅂ~ㅅ~~~~~',
  '~~~~~~~ㅂ~ㅅ~~~~~'],ex:{'7,9':['nodeul',7,0]},sign:{'8,7':'한강대교','9,2':'용산역','11,0':'기념관','13,0':'남산'},p:[
{x:6,y:4,c:'#334155',h:'#222',n:'용산역 직원',s:['역 입구로 들어가 승강장까지 내려가면 1호선을 탈 수 있어요. 🚆','아래 한강대교로 쭉 가면 노들섬 지나 노들이에요.']},
{x:12,y:1,c:'#fb7185',h:'#3f2a1c',w:1,n:'남산 가는 여행자',s:['저 탑까지 걸어가 볼까 해요. 올라가면 한강이 다 보인대요.']}]},

yeouido:{n:'여의도',o:1,wide:1,bgm:'route',land:[18,8],m:['~~~~~~~~~~ssssㄹssssssssTTTTTTT~~~~~~','~~~~~~~~~sssssㄹssssssss~TTTTT~~~~~~~','~~~~~~~~ssssssㄹsssssss~~~~~~~~~~~~~~','~~~~~~~~~sssssㄹㄹㄹㄹㄹㄹㄹssssss~~~~~~~~~','~~~~~~ssssㄹㄹㄹㄹㄹ...ㄹ.ㄹㄹㄹㄹㄹㄹssss~~~~~~','~~~~sssㄹㄹㄹㄹFTT~TF.ㄹ.ㅊㅊㅐㅊㅊㄹㄹㄹㄹsss~~~~','~~~ssㄹㄹㄹ.F...F~~T.ㄹ.ㅊㅊ.ㅊㅊ..ㅎㄹㄹㄹss~~~','~~ss.ㄹ...T..T.....ㄹ........ㅎ..ㄹ.ss~~','ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㅂㅂㅂ','~ss.ㄹ...........F.ㄹㅠ...........ㄹ.ss~','~~ssㄹㄹ..ㅐF..T..T..ㄹ.ㅊㅊ.ㅊㅊ.ㅉ.ㅉㅐㄹㄹss~~','~~~ssㄹㄹㄹ.Fㅐ..F..T.ㄹ.ㅊㅊ.ㅊㅊㅐ..ㄹㄹㄹss~~~','~~~~sssㄹㄹㄹㄹ.T.Fㅐ..ㄹ..ㅐ..ㅐㄹㄹㄹㄹsss~~~~','~~~~~~ssssㄹㄹㄹㄹㄹ...ㄹ.ㄹㄹㄹㄹㄹㄹssss~~~~~~','~~~~~~~~~sssㅂssㄹㄹㄹㄹㄹㄹssssss~~~~~~~~~','~~~~~~~~~~~~ㅂ~sssssssss~~~~~~~~~~~~~','~~~~~~~~~~~~ㅂ~~~~~~~~~~~~~~~~~~~~~~~','~~~~~~~~~~~~ㅂ~~~~~~~~~~~~~~~~~~~~~~~'],sign:{'19,9':'5·9호선','14,5':'여의도공원','27,0':'밤섬','22,5':'더현대서울','25,6':'금융가','22,10':'IFC몰','25,11':'한국거래소','27,6':'63빌딩','16,1':'여의나루 방면','33,7':'샛강 방면','12,15':'서울교','12,4':'윤중로'},ex:{'12,17':['singil',7,0],'14,0':['yeouinaru',7,9],'35,8':['saetgang',0,5],'0,8':['assembly',14,5]},p:[
{x:19,y:7,c:'#1f2937',h:'#222',cup:1,when:()=>{const{h}=jejuNow();return h>=11&&h<14},n:'점심시간 직장인',s:['점심시간엔 커피 들고 한 바퀴 걸어야 오후를 버팁니다. ☕']},
{x:21,y:9,c:'#1f2937',h:'#222',stay:1,when:()=>{const{h}=jejuNow();return h>=21||h<6},n:'야근한 직장인',s:['방금 일 끝났어요… 막차는 이미 갔고요. 🌙']},
{x:9,y:5,c:'#f9a8d4',h:'#3f2a1c',w:1,n:'윤중로 산책하는 사람',s:['봄엔 섬 둘레가 온통 벚꽃이에요. 🌸']},
{x:15,y:9,c:'#22c55e',h:'#3f2a1c',w:1,n:'공원 자전거 쉬는 사람',s:['남쪽 다리를 건너면 신길, 동쪽은 샛강, 서쪽은 국회의사당, 북쪽은 여의나루예요.']}]},

saetgang:{n:'샛강',o:1,bgm:'route',land:[7,5],m:['TTTTTTTTTTTTTTT','T.F..T...F..T.T','T...F..~~~~...T','TF..T..~~~~.F.T','T.ㅠ....~~~~...T','ㄹㄹㄹㄹㄹㄹㄹㄹ.....TT','T.F..T.ㄹ.F..T.T','T...F..ㄹ...F..T','TF.T...ㄹ.T..F.T','TTTTTTTㄹTTTTTTT'],sign:{'2,4':'샛강역','9,3':'샛강생태공원'},e:{l:['yeouido',35,8],d:['daebang',7,0]},p:[{x:11,y:6,c:'#22c55e',h:'#3f2a1c',w:1,n:'샛강 산책객',s:['샛강 따라 걸으면 도심인 걸 잊게 돼요. 🌿','왼쪽은 여의도, 아래로 가면 대방이에요.']}]},
yeouinaru:{n:'여의나루',o:1,bgm:'route',land:[7,5],m:['~~~~~~~~~~~~~~~','sssssssssssssss','T.F...F...F...T','T..F.....T.ㅊㅊ.T','T.F.ㅠ.......F.T','ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ','T.F...Tㄹ..F...T','T..T...ㄹ.T..F.T','TF.....ㄹ...F..T','TTTTTTTㄹTTTTTTT'],sign:{'4,4':'여의나루역','9,1':'여의도한강공원','12,3':'한강버스','2,3':'서울색공원'},bd:{'12,3':['hangang',11,9]},e:{d:['yeouido',14,0]},p:[{x:10,y:3,c:'#fb7185',h:'#222',w:1,n:'한강 소풍객',s:['돗자리 펴고 치킨 시켰어요. 🍗','해 질 때 한강이 제일 예뻐요. 🌇']}]},
assembly:{n:'국회의사당',o:1,bgm:'route',land:[7,5],m:['TTTTTTTTTTTTTTT','T.F.....F...F.T','T...F..ㅍㅍㅍ....T','T.F....ㅌㅌㅌ.F..T','T..ㅠ..........T','ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ','T.F..T...F..T.T','T..ㅊㅊ...Fㅊㅊ...T','T..ㅊㅊ.F..ㅊㅊ.T.T','TTTTTTTTTTTTTTT'],sign:{'3,4':'국회의사당역','8,3':'국회','4,7':'국회박물관','10,7':'KBS'},e:{l:['dangsan',14,5],r:['yeouido',0,8]},p:[{x:11,y:4,c:'#475569',h:'#222',n:'국회 앞 직장인',s:['돔 지붕은 멀리서도 잘 보여요.','오른쪽으로 가면 여의도, 왼쪽은 당산이에요.']}]},
dangsan:{n:'당산',o:1,bgm:'route',land:[7,5],m:['TTTTTTTTTTTTTTT','ㅈㅈ.ㅈㅈ.F.ㅊㅊ.ㅈㅈ.T','ㅈㅈ.ㅈㅈ...ㅊㅊ.ㅈㅈ.T','T.F...T.F....FT','T..F.....F.ㅠ..T','ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ','ㅈㅈ.ㅈㅈ.F.ㅈㅈ.F..T','ㅈㅈ.ㅈㅈ...ㅈㅈ....T','T.F...T...F.T.T','TTTTTTTTTTTTTTT'],sign:{'11,4':'당산역'},e:{r:['assembly',0,5]},p:[{x:6,y:4,c:'#f59e0b',h:'#3f2a1c',w:1,n:'당산역 앞 주민',s:['9호선 타면 여의도까지 금방이에요.','출근 시간엔 각오하셔야 해요. 🚇']}]},
sindorim:{n:'신도림',o:1,bgm:'route',land:[7,5],m:['TTTTTTTTTTTTTTT','T.ㅊㅊ..F...ㅊㅊ.T','T.ㅊㅊ.....F..TT','T.F....F.....TT','ㅅㅅㅅㅀㄴㅅㅅㅅㅅㅅㅅㅅㅅㅅㅅ','ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ','T..F...T..F...T','TF...T...F..T.T','T..T...F...T..T','TTTTTTTTTTTTTTT'],sign:{'3,4':'신도림역'},p:[{x:9,y:6,c:'#475569',h:'#222',w:1,stay:1,n:'역 앞 주민',s:['여기서 2호선으로 많이들 갈아타요.']}]},
mapo:{n:'마포',o:1,bgm:'route',land:[7,5],m:['TTTTTTTTTTTTTTT','T.ㅊㅊ..F...ㅊㅊ.T','T.ㅊㅊ.....F..TT','T.F....F.....TT','ㅅㅅㅅㅀㄴㅅㅅㅅㅅㅅㅅㅅㅅㅅㅅ','ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ','T..F...T..F...T','TF...T...F..T.T','T..T...F...T..T','TTTTTTTTTTTTTTT'],sign:{'3,4':'마포역'},p:[{x:9,y:6,c:'#475569',h:'#222',w:1,stay:1,n:'역 앞 주민',s:['한강 건너면 바로 여의도예요.']}]},
gaehwa:{n:'개화',o:1,bgm:'route',land:[7,5],m:['TTTTTTTTTTTTTTT','T.F...T..F...FT','T...F....T.F..T','T.F....F.....TT','ㅅㅅㅅㅀㄴㅅㅅㅅㅅㅅㅅㅅㅅㅅㅅ','ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ','T..F...T..F...T','TF...T...F..T.T','T..T...F...T..T','TTTTTTTTTTTTTTT'],sign:{'3,4':'개화역'},p:[{x:9,y:6,c:'#475569',h:'#222',w:1,n:'동네 어르신',s:['여기가 9호선 끝이여. 김포공항은 바로 옆 역이고.']}]},
yeongdeungpo:{n:'영등포',o:1,bgm:'route',land:[7,5],m:['TTTTTTTㄹTTTTTTT','ㅊㅊ.ㅊㅊ.Fㄹ.ㅊㅊㅊ.ㅊT','ㅊ㌷.ㅊㅊ..ㄹ.ㅊㅊㅊ.ㅊT','T.F....ㄹ...F..T','ㅅㅅㅅㅀㄴㅅㅅㄹㅅㅅㅅㅅㅅㅅㅅ','ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ','ㅈㅈ.ㅈㅈ.F.TF~~FT.T','T.F...T.F.~~..T','ㅈㅈ.ㅈㅈ...T.F.TFT','TTTTTTTTTTTTTTT'],sign:{'3,4':'영등포역','1,1':'타임스퀘어','10,2':'영등포시장','10,6':'영등포공원'},bd:{'1,2':['timeSq',15,12]},e:{u:['singil',7,9]},p:[{x:10,y:6,c:'#ef4444',h:'#222',w:1,n:'영등포 쇼핑객',s:['역이랑 백화점이 붙어 있어서 편해요. 🛍','위로 가면 신길이에요.']}]},
singil:{n:'신길',o:1,bgm:'route',land:[7,5],m:[
  '~~~~~~~ㅂ~~~~~~~',
  'sssssssㅂsssssss',
  'ㅈㅈㅈ.ㅈ..ㄹ..ㅊㅊ.ㅊㅊ',
  'ㅈㅈㅈ.ㅈ..ㄹ..ㅊㅊ.ㅊㅊ',
  'ㅅㅅㅅㅀㄴㅅㅅㄹㅅㅅㅅㅅㅅㅅㅅ',
  'ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ',
  'ㅈㅈ.ㅈㅈ.Fㄹㅈㅈ.ㅈㅈ.F',
  '.F.....ㄹ....F..',
  'ㅈㅈ.ㅈㅈ.Tㄹㅈㅈ.ㅈㅈ.T',
  'TTTTTTTㄹTTTTTTT'],sign:{'3,4':'신길역','10,1':'샛강생태공원'},ex:{'14,1':['daebang',0,1]},e:{u:['yeouido',12,17],r:['daebang',0,5],d:['yeongdeungpo',7,0]},p:[
{x:3,y:7,c:'#0d9488',h:'#d1d5db',n:'신길 어르신',s:['여기는 집 많고 골목 많은 동네예요. 살기는 편하죠.','1호선도 5호선도 다 서니까 어디 가기 좋아요. 위는 여의도, 아래는 영등포, 오른쪽은 대방이에요.']}]},

daebang:{n:'대방',o:1,bgm:'route',land:[7,5],m:[
  '~~~~~~~ㅂ~~~~~~~',
  'sssssssㅂsssssss',
  'ㅈㅈㅈ.ㅈ..ㄹ..ㅊㅊ.ㅊㅊ',
  'ㅈㅈㅈ.ㅈ..ㄹ..ㅊㅊ.ㅊㅊ',
  'ㅅㅅㅅㅅㅅㅅㅅㄹㅅㅀㄴㅅㅅㅅㅅ',
  'ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ',
  'ㅈㅈ.ㅈㅈ.F.TF.T.TF',
  'ㅊㅊ.ㅊㅊ..T.F~~F..',
  'ㅊㅊ.ㅊㅊ.T.T.F.T.T',
  'TTTTTTTTTTTTTTT'],sign:{'9,4':'대방역','9,7':'대방공원','1,7':'서울여성플라자','4,7':'서울가족플라자'},ex:{'0,1':['singil',14,1],'14,1':['noryangjin',0,3]},e:{u:['saetgang',7,9],l:['singil',14,5],r:['noryangjin',0,8]},p:[
{x:11,y:7,c:'#a3e635',h:'#222',w:1,n:'대방역 앞 학생',s:['위로 가면 샛강, 왼쪽은 신길, 오른쪽으로 쭉 가면 노량진이에요.']}]},

nodeul:{n:'노들',o:1,wide:1,bgm:'route',land:[7,25],m:[
  'sssssssㅂsssssss',
  '~~~~~~~ㅂ~~~~~~~',
  '~~~~~~~ㅂ~~~~~~~',
  '~~~~~~~ㅂ~~~~~~~',
  '~~~~~~~ㅂ~~~~~~~',
  '~~~~~~~ㅂ~~~~~~~',
  '~~~~~~~ㅂ~~~~~~~',
  '~~~~~~~ㅂ~~~~~~~',
  '~~~~ㅗㅗㅗㅛㅗㅗㅗ~~~~',
  '~~ㅗㅗ.ㅊㅊㅛ.TTTㅗ~~',
  '~ㅗ.F.ㅊㅊㅛ.TFTTㅗ~',
  '~ㅗ.ㅉ...ㅛ.TTTTㅗ~',
  '~ㅗ.F.ㅊㅊㅛ..㉢㉢.ㅗ~',
  '~~ㅗㅗ.ㅊㅊㅛ..㉢㉢ㅗ~~',
  '~~~ㅗㅗㅗㅗㅛㅗㅗㅗㅗ~~~',
  '~~~~~~~ㅂ~~~~~~~',
  '~~~~~~~ㅂ~~~~~~~',
  '~~~~~~~ㅂ~~~~~~~',
  '~~~~~~~ㅂ~~~~~~~',
  '~~~~~~~ㅂ~~~~~~~',
  '~~~~~~~ㅂ~~~~~~~',
  '~~~~~~~ㅂ~~~~~~~',
  '~~~~~~~ㅂ~~~~~~~',
  '~~~~~~~ㅂ~~~~~~~',
  'sssssssㅂsssssss',
  'ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ',
  'ㄱㄱ.TF..ㄹ.ㄴㅀㄴㅠㄱㄱ',
  'T.F...Tㄹ..F.T.T',
  'TF..T..ㄹ.T..FTT',
  'TTTTTTTㄹTTTTTTT'],sign:{'12,26':'9호선','9,24':'한강대교','5,8':'노들섬 라이브하우스','3,10':'잔디마당','5,12':'노들섬 마켓','10,9':'맹꽁이숲','10,12':'헬기장','10,26':'노들역','3,27':'용양봉저정공원'},e:{u:['yongsan',7,9],l:['noryangjin',31,8],r:['heukseok',0,5],d:['sangdo',7,0]},p:[
{x:8,y:11,c:'#7c3aed',h:'#3f2a1c',n:'버스킹하는 사람',s:['해 질 때 여기서 치면 관객이 알아서 모여요. 🎸','섬 한가운데서 듣는 노을이 또 다르거든요.']},
{x:4,y:12,c:'#fb923c',h:'#222',w:1,n:'돗자리 든 사람',s:['다리 한가운데 섬이라니, 서울 사람들도 은근 잘 몰라요.','잔디에 누워 있으면 위로 차 소리, 옆으로 강 소리예요.']},
{x:4,y:14,c:'#22d3ee',h:'#3f2a1c',w:1,n:'트랙 도는 사람',s:['섬 둘레 트랙 한 바퀴 돌면 기분이 싹 풀려요. 🏃']},
{x:3,y:25,c:'#475569',h:'#222',w:1,n:'노들역 앞 주민',s:['서쪽으로 쭉 가면 노량진, 위쪽 한강대교로 건너면 노들섬 지나 용산이에요.']}]},

noryangjin:{n:'노량진',o:1,wide:1,bgm:'route',land:[13,10],m:['~~~~~~~~~~~~~~~ㅅ~~~~~~~~~~~~~~~~','~~~~~~~~~~~~~~~ㅅ~~~~~~~~~~~~~~~~','~~~~~~~~~~~~~~~ㅅ~~~~~~~~~~~~~~~~','sssssssssssssssㅅssㅟㅢㅢㅟㅕㅕㅕㅢㅢㅟㅢㅢㅟㅢ','.ㄷㄷㄷㄷㄷ.㉠㉠㉠㉠..ㄹ.ㅅ㉡㉡㉤㉤㉤ㅢㅚㅒㅒㅘㅘㅘㅒㅒㅢㅟ','.ㄷㄷㄷㄷㄷ.㉠㉠㉠㉠..ㄹ.ㅅ㉡㉡㉤㉤㉤ㅢㅚㅒㅒㅙㅙㅙㅒㅒㅢㅢ','.ㄷㄷㄷㄷㄷ.㉠㉠㉠㉠.Fㄹ.ㅅ㉡㉡㉤㉤㉤ㅢㅚㅚㅚㅚㅖㅚㅚㅢㅟㅢ','.ㄷㄷ㉦ㄷㄷ.......ㄹㄴㅀㄴㅠㅟㅢㅢㅢㅓㅢㅢㅟㅢㅢㅢㅟㅢㅢ','ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ','......ㄹㄱㄱ....ㄹ..........ㄹㅋㅋㅋ㉥ㅋㅋㅋ','.ㄱㄱ.ㄱㄱㄹㄱㄱ.ㅃㅃㅃㄹ.ㅊㅊ.ㅊㅊ.ㅊㅊ.ㄹ.......','.ㄱㄱ.ㄱㄱㄹㄱㄱ.ㅃㅃㅃㄹ.ㅊㅊ.ㅊㅊ.ㅊㅊ.ㄹ.ㅡ..ㅡ..','.ㄱㄱ.ㄱㄱㄹㄱㄱ.ㅃㅆㅃㄹ.㌵ㅊ.ㅊㅊ.ㅊㅊ.ㄹ.......','.ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ.','.ㄱㄱ.ㄱㄱㄹㄱㄱ.ㄱㄱㄱㄹ.ㄱㄱ.ㄱㄱ.ㄱㄱ.ㄹ.T...T.','.ㄱㄱ.ㄱㄱㄹㄱㄱ.ㄱㄱㄱㄹ.ㄱㄱ.ㄱㄱ.ㄱㄱ.ㄹF..T...','.ㄱㄱ.ㄱㄱㄹㄱㄱ.ㄱㄱㄱㄹ.ㄱㄱ.ㄱㄱ.ㄱㄱ.ㄹ..F.TT.','TTTTTTTTTTTTTㄹTTTTTTTTTTTTTTTTTT'],sign:{'17,7':'9호선','3,4':'수산시장','8,4':'노량진축구장','16,4':'야구장','19,4':'운동장','15,7':'노량진역','26,4':'사육신역사관','23,3':'조망지점','29,7':'음수대','27,9':'컵밥거리','11,10':'보성의 아지트','22,10':'학원가','15,12':'공무원학원','3,14':'고시촌','28,14':'동네 공원','11,2':'한강대교'},d:{'11,12':['home',7,8],'3,7':['suisan',7,8],'28,9':['cupbap',15,12]},bd:{'26,5':['sayuk',7,8],'15,12':['academy',11,12]},ex:{'0,3':['daebang',14,1]},e:{l:['daebang',14,5],r:['nodeul',0,25],d:['jangseung',7,0]},p:[
{x:18,y:9,stay:1,c:'#bdb092',h:'#222',n:'노량진역 안내원',s:['파란 지붕 역 입구나 금색 9호선 입구로 들어가 보세요. 🚇','안에서 개찰구를 지나면 1호선, 9호선 승강장으로 내려갈 수 있어요.']},
{x:9,y:6,c:'#f8fafc',h:'#222',stay:1,n:'수산시장 상인',s:['오늘 들어온 게 물이 좋아요! 새벽 경매 때 오면 더 볼 만하죠. 🐟']},
{x:27,y:10,c:'#ea580c',h:'#222',stay:1,when:()=>{const{h}=jejuNow();return h>=7&&h<23},n:'컵밥집 사장',s:['시험 앞둔 학생들 든든하게 먹이는 게 보람이에요. 🍚','고기 듬뿍, 밥은 더 달라면 더 줘요!']},
{x:14,y:11,c:'#475569',h:'#17151c',w:1,n:'동네 주민',s:['주인장도 요즘 이 동네에 살아요.','제주 사람이 서울 한복판에서 지내는 셈이지요.']},
{x:20,y:13,c:'#94a3b8',h:'#222',gl:'#27272a',stay:1,n:'고시생',s:['합격하면 제일 먼저 제주도 가서 귤부터 먹을 거예요. 🍊']},
{x:17,y:9,c:'#1e3a8a',h:'#3f2a1c',w:1,n:'학원 가는 수험생',s:['학원 수업 끝나면 바로 독서실이에요. 그래도 컵밥은 못 참죠.']},
{x:21,y:6,c:'#16a34a',h:'#d1d5db',w:1,n:'사육신공원 산책객',s:['전망대에 올라오면 한강이랑 철교가 다 보여요.','동쪽으로 조금만 더 가면 노들이고요.']},
{x:23,y:7,c:'#7c2d12',h:'#222',n:'공원 해설사',s:['조선 세조 때 단종 복위를 꾀하다 목숨을 잃은 여섯 신하, 사육신을 기리는 곳이에요.','돌계단 올라 붉은 홍살문을 지나면 사당이 나옵니다.']}]},

heukseok:{n:'흑석·중앙대',o:1,bgm:'route',land:[7,5],m:[
  'ㅊㅊ.ㅊㅊ..ㅁㅁㅁㅁㅁㅁㅁT',
  'ㅊㅊ.ㅊㅊ..ㅁㅁㅁㅁㅁㅁㅁT',
  '.F....T.ㅁㅁㅁㅁㅁ.T',
  'ㅈㅈ.F.....F....T',
  'ㅈ.Fㅠ......F..ㅢT',
  'ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ',
  'ㅈㅈ.ㅈㅈ.F.ㅈㅈ.ㅈㅈ.F',
  '.F.....T....F..',
  'ㅈㅈ.ㅈㅈ.T.ㅈㅈ.ㅈㅈ.T',
  'TTTTTTTTTTTTTTT'],sign:{'3,4':'흑석역','11,0':'중앙대'},e:{l:['nodeul',14,25]},p:[
{x:9,y:3,c:'#2563eb',h:'#3f2a1c',w:1,n:'중앙대 학생',s:['언덕이 많아서 등교가 곧 운동이에요. 🏃','9호선 흑석역에서 내리면 금방이에요.']},
{x:5,y:7,c:'#94a3b8',h:'#d1d5db',n:'흑석동 주민',s:['서쪽으로 가면 노들이고, 다리 건너면 한강이에요.']}]},

jangseung:{n:'장승배기',o:1,bgm:'route',land:[7,5],m:[
  'ㅈㅈ.ㅈㅈ.Tㄹ.ㅊㅊ.ㅊㅊ.',
  'ㅈㅈ.ㅈㅈ.Tㄹ.ㅊㅊ.ㅊㅊ.',
  '.F.....ㄹ...F...',
  'ㅈㅈ.F...ㄹ.ㅊㅊ.ㅊㅊ.',
  'ㅈ.Fㅠ...ㄹ.ㅊㅊ.ㅊㅊ.',
  'ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ',
  'ㅈㅈ.ㅈㅈ..ㄹ.ㅈㅈ.ㅈㅈ.',
  '.F.....ㄹ...F...',
  'ㅈㅈ.ㅈㅈ..ㄹ.ㅈㅈ.ㅈㅈ.',
  'TTTTTTTㄹTTTTTTT'],sign:{'3,4':'장승배기역'},e:{u:['noryangjin',13,17],r:['sangdo',0,5]},p:[
{x:5,y:7,c:'#0d9488',h:'#222',w:1,n:'장승배기 주민',s:['위로 가면 노량진, 동쪽으로 가면 상도예요.']}]},

soongsil:{n:'숭실대입구',o:1,bgm:'route',land:[7,5],m:[
  'ㅁㅁㅁㅁㅁ.Tㄹ.ㅊㅊ.ㅈㅈ.',
  'ㅁㅁㅁㅁㅁ.Tㄹ.ㅊㅊ.ㅈㅈ.',
  'ㅁㅁㅁㅁㅁ..ㄹ..F..F.',
  '.F.....ㄹ..F....',
  'ㅈㅈ.F...ㄹ..ㅠ.ㅈㅈ.',
  'ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ',
  'ㅈㅈ.ㅈㅈ..ㄹ.ㅈㅈ.ㅈㅈ.',
  '.F.....ㄹ...F...',
  'ㅈㅈ.ㅈㅈ..ㄹ.ㅈㅈ.ㅈㅈ.',
  'TTTTTTTㄹTTTTTTT'],sign:{'10,4':'숭실대입구역','2,0':'숭실대'},e:{u:['sangdo',7,9]},p:[
{x:3,y:3,c:'#1e3a8a',h:'#3f2a1c',w:1,n:'숭실대 학생',s:['살피재 고개만 넘으면 학교예요. 위로 쭉 가면 상도고요.']}]},

sangdo:{n:'상도',o:1,bgm:'route',land:[7,5],m:[
  'ㅈㅈ.Tㅊㅊ.ㄹ.ㅊㅊ.ㅈㅈ.',
  'ㅈㅈ.Tㅊㅊ.ㄹ.ㅊㅊ.ㅈㅈ.',
  '.F.....ㄹ.....F.',
  'ㅈㅈ...F.ㄹ..F.ㅈㅈ.',
  'ㅈ.F....ㄹ.ㅠ..ㅈㅈ.',
  'ㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ',
  'ㅈㅈ.ㅈㅈ..ㄹ.ㅈㅈ.ㅈㅈ.',
  '.F.....ㄹ...F...',
  'ㅈㅈ.ㅈㅈ..ㄹ.ㅈㅈ.ㅈㅈ.',
  'TTTTTTTㄹTTTTTTT'],sign:{'9,4':'상도역'},e:{u:['nodeul',7,29],l:['jangseung',14,5],d:['soongsil',7,0]},p:[
{x:6,y:7,c:'#f472b6',h:'#222',w:1,n:'상도동 주민',s:['위로 가면 노들, 아래로 가면 숭실대입구, 왼쪽으로 가면 장승배기예요.']}]},

anbang:{n:'부모님 안방',par:'town',bgm:'indoor',cozy:'#b45309',bedCol:'#d97706',m:['w'.repeat(W),'wqwwwqwwwwwqwww','wfffffffffffffw','w㈀㈀fßßfffffKKfw','w㈀㈀fßßffffffffw','xfffffffffffffw','wfffffffffff㈂fw','wffKKffffffff㈁w','wfffffffffffffw','w'.repeat(W)],memo:{'1,1':{s:'📷',c:'#fde68a',l:['📷 가족사진','오래된 가족사진이 걸려 있다.']},'5,1':{s:'🍊',c:'#fdba74',l:['🍊 달력','귤 철엔 달력이 빽빽하다.']},'11,1':{s:'🪞',c:'#bae6fd',l:['🪞 거울','옷 입고 나서는 곳.']}},d:{'0,5':['house',13,7]},p:[]},

shabu:{n:'제주미소 샤브샤브',par:'route2',bgm:'indoor',wide:1,land:[7,12],m:['wwwwwwwwwwwwwww','wⓈⓈⓈⓈⓈⓈwⒽⒽwwwww','wfffffffffffffw','wⒷⒷⒷⒷⒷⒷfkkkkkkw','wfffffffffffffw','wfㆎㆎffㆎㆎfffㆎㆎfw','wfㆍㆍffㆍㆍfffㆍㆍfw','wfㆎㆎffㆎㆎfffㆎㆎfw','wfffffffffffffw','wfㆎㆎffㆎㆎfffㆎㆎfw','wfㆍㆍffㆍㆍfffㆍㆍfw','wfㆎㆎffㆎㆎfffㆎㆎfw','wfffffffffffffw','wwwwwwwxwwwwwww'],d:{'7,13':['route2',3,4]},p:[
{x:10,y:2,stay:1,c:'#f8fafc',h:'#27272a',n:'작은아버지',s:['어서 오세요! 보성이 작은아버지입니다. 🍲','고기랑 채소는 넉넉하게 드릴 테니 편히 드세요.'],ch:{'🍽 주문하기':()=>showCafe(),'🍲 가게 정보·위치':()=>showShabu()}},
{x:9,y:4,stay:1,c:'#be123c',h:'#1c1917',n:'작은엄마',s:['어서 오세요~ 보성이 작은엄마예요. 편한 자리에 앉으세요. 😊','육수 더 필요하면 말씀하세요.'],ch:{'🍽 주문하기':()=>showCafe(),'🍲 가게 정보·위치':()=>showShabu()}},
{x:4,y:4,w:1,c:'#0f766e',h:'#222',n:'가게 돕는 사촌동생',s:['어서 오세요! 여기가 보성이 형 작은아버지네 가게예요.','주문 도와드릴게요.','여기 채소 리필은 무료예요. 🥬']},
{x:10,y:8,w:1,lh:1,c:'#db2777',h:'#3f2a1c',n:'서빙하는 사촌동생',s:['뜨거우니까 조심하세요! 🍲','오늘 손님 많아서 저희도 일 돕는 중이에요.']},
{x:2,y:5,c:'#14b8a6',h:'#222',sit:1,fd:0,eat:'🍲',n:'샤브 먹는 손님',s:['고기 넣고 딱 세 번 흔들면 돼요. 🥢']},{x:3,y:7,c:'#f97316',h:'#3f2a1c',lh:1,sit:1,fd:1,eat:'🥬',n:'샐러드바 단골',s:['채소를 세 접시째 가져왔어요.']},
{x:6,y:5,c:'#6366f1',h:'#222',sit:1,fd:0,eat:'🍲',n:'가족 손님',s:['아이들도 잘 먹어서 자주 와요.']},{x:7,y:5,c:'#ec4899',h:'#3f2a1c',lh:1,sit:1,fd:0,eat:'🥩',n:'가족 손님',s:['한우 샤브로 시켰어요. 오늘은 특별한 날이라서요.']},{x:11,y:11,c:'#84cc16',h:'#222',sit:1,fd:1,eat:'🦐',n:'해물 샤브 손님',s:['국물이 시원해요. 🦐']}]},

home:{n:'보성의 아지트',par:'noryangjin',bgm:'indoor',cozy:'#2563eb',m:['w'.repeat(W),'wwwwwwㅯwwwwwwww','wßßfππfþðfwㅮㅭfw','wfffffffffwfffw','w㈀ffffffffwwfww',FR,'wffffffffffㅲㅲfw',FR,'w㈄ffffffffffffw','wwwwwwwxwwwwwww'],sign:{'11,6':'내 가판대','12,2':'화장실','6,2':'보성의 하루'},d:{'7,9':['noryangjin',11,13]},p:[]},

route2:{n:'원도심 거리',o:1,bgm:'route',land:[7,5],m:['TTTTTTTTTTTTTTT','TT.F....F...FTT','TTㅹㅹㅹ....FGGGTT','TTㅺㅻㅺ㉾..b㉾HDHTT','...=.......=...','===============','......=.ⓐⓐⓐ....','T.F...=.ⓑⓒⓑ㉾F.T','T..m..====.m..T','TTTTTT=TTTTTTTT'],board:{'5,3':'shabu','9,3':'cafe','11,7':'jaldo'},sign:{'11,3':'바당 카페 · 24 OPEN','3,2':'제주미소'},d:{'11,3':['cafe',11,11],'3,3':['shabu',7,12],'9,7':['jaldo',7,12]},e:{l:['coast',14,5],r:['town',0,5],d:['gotF',6,0]},umb:[[6,2,'#0ea5e9']],p:[
{x:6,y:3,c:'#0d9488',h:'#6b3e26',n:'원도심 산책객',s:['돌담 옆으로 바다 보멍 걷는 원도심 거리라마씸. 🌊','서쪽으로 가민 해변, 동쪽으로 가민 제주시이우다.']},
{x:2,y:8,c:'#a3e635',h:'#3f2a1c',w:1,dog:'#92400e',n:'강아지 데리고 걷는 사람',s:['우리 강아지가 돌담 냄새를 다 맡아야 움직여요. 🐕']},
{x:12,y:7,c:'#fb7185',h:'#222',w:1,n:'사진 찍는 여행자',s:['돌담이랑 귤나무가 같이 나오게 찍고 있어요. 📷']}]},

rest:{n:'놀멍쉬멍',wide:1,land:[7,7],o:1,bgm:'indoor',m:[
  'TTTTTTTTTTTTTTT',
  'T.............T',
  'T.F.....F...F.T',
  'T.T.F...F.~~~.T',
  'T.RRR.GGG.~~~.T',
  'T㉾HDH.HDH㉾~~~FT',
  'T..=..b=......T',
  '===============',
  'T.Fㆄㆄㆄ.=.b....T',
  'T..ㆅㆅㆅ.=..>>>.T',
  'T.mㆇDㆇ.=..<D<㉾T',
  'T.ㆈ.========..T',
  'T.F...b=...F..T',
  'TTTTTTT=TTTTTTT'],board:{'1,5':'bowl','9,5':'jjim','13,10':'arcade'},sign:{'11,10':'게임 센터','6,11':'영화관','3,5':'볼링장','7,5':'찜질방','11,3':'용천수'},d:{'3,5':['bowl',7,8],'7,5':['jjim',7,8],'11,10':['arcade',13,12],'4,10':['cinema',7,8]},e:{l:['studio',22,5],r:['oreumF',0,5],d:['samgeori',7,0]},umb:[[5,6,'#14b8a6']],p:[
{x:9,y:6,c:'#14b8a6',h:'#d1d5db',n:'숲지기',s:['잘 왔수다. 여긴 잠시 쉬어 가는 곳이우다. 🌿','노래 들으려면 공원 음악 서재로 강 봅서. 영화관도 들러보곡예.'],ch:{'이 숲의 소문':['서귀포 숲 어딘가에 바람도 없는데 흔들리는 나무가 있댄 허여.','나도 가 보진 않았주게.']}},
{x:12,y:8,c:'#fdba74',h:'#222',w:1,dog:'#f8fafc',n:'강아지 산책 삼춘',s:['이 녀석 산책 안 시켜 주민 집을 뒤집어 놔마씸. 🐕']},
{x:1,y:6,c:'#c4b5fd',h:'#3f2a1c',w:1,n:'산책하는 사람',s:['아무것도 안 해도 되는 시간이 제일 좋네요.','연못 앞 벤치도 좋아요.']}]},

library:{n:'보성의 음악 서재',par:'samgeori',bgm:'indoor',m:['wwwwwwwwwwwwwww','wwzwzwzwzwzwzww','wfffffffffffffw','wfffffffffffffw','wppfkkkkkkkfppw','wfffkfffffkfffw','wfffkkkkkkkfffw','wɦffffffffffɡʊw'.slice(0,15),'wfffffffffffffw','wwwwwwwxwwwwwww'],d:{'7,9':['samgeori',3,4]},p:[
{x:5,y:5,c:'#0f766e',h:'#1b1b26',n:'서재 지기',s:['어서 오세요. 주인장이 고른 노래가 벽에 걸려 있어요. 🎵','액자를 누르면 곡 목록을 볼 수 있어요.'],ch:{'🎵 플레이리스트 보기':()=>plHome(),'듣는 방법':['🎬 표시 곡은 여기서 영상으로 재생되고, 전체 듣기와 반복도 돼요.','나머지 곡은 YouTube Music 작은 창으로 열려요.']}},
{x:9,y:5,c:'#8b5cf6',h:'#f472b6',n:'Suno 음악가',s:['보성이가 Suno AI로 만든 노래를 제가 틀어 드려요. 🎧'],ch:{'🎧 보성의 노래 듣기':()=>showSuno(),'어떤 노래예요?':['주인장이 Suno AI로 직접 만든 노래들이에요.','한 곡씩 골라서 들어 보세요.']}},
{x:3,y:8,c:'#fb923c',h:'#3f2a1c',n:'노래 추천 손님',s:['저 요즘 들을 노래가 없어요.','노래 추천해 주세요! 🎶'],ch:{'🎶 노래 추천하기':()=>showRec()}},
{x:11,y:8,c:'#fda4af',h:'#222',w:1,n:'음악 듣는 손님',s:['이 서재에 오면 시간이 천천히 가는 것 같아요.']}]},

orchard:{n:'감귤 과수원',o:1,wide:1,bgm:'route',land:[7,5],m:['TTTTTTTTTTTTTTTTTTTTTTT','T㋫㋫㋫.㋪㋪㋪㋪㌣㌣㌣㌦㌧㌦㌧㌦㌧㌦㌧%%T','T㋬㋭㋬.㋮㋯㋮㋮㌣㌣㌣㌦㌦㌦㌦㌦㌦㌦㌦%%T','T..㋰...㌟㌠㌤㌣㌣㌦㌧㌦㌧㌦㌧㌦㌧%%T','T&.㋱...㌥㌤㌥㌣㌣㌦㌦㌦㌦㌦㌦㌦㌦%%T','====================%%T','%%==&..F...&..F..&..%%T','%==F...m...F.m...F..%%T','%=.dodododododododod%%T','%=.ddddddddddddddddd%%T','%=.dodododododododod%%T','%=...&...F...&...F..%%T','%=%%%%%%%%%%%%%%%%%%%%T','==TTTTTTTTTTTTTTTTTTTTT'],sign:{'2,1':'농막','7,1':'검은 하우스'},d:{'2,2':['nongmak',7,8],'6,2':['blackHouse',7,8]},ex:{'0,13':['route1',23,0]},e:{l:['town',14,5]},p:[
{x:5,y:3,c:'#16a34a',h:'#6b7280',w:1,n:'감귤 농부 삼춘',s:['제주 감귤이 맛좋수다게~ 🍊','혼저 옵서예. 한 입 먹어봅서게!'],ch:{'감귤 이야기':['귤은 껍질 얇고 단내 확 나는 게 잘 익은 거우다.','겨울엔 비닐하우스에서 하우스감귤도 키우주.'],'농사 이야기':['허리가 아파도 열매 보민 힘이 나는 거라게.','비 오는 날은 하우스 안에서 가지 정리허곡 허여.']}},
{x:12,y:2,c:'#f59e0b',h:'#d1d5db',w:1,n:'귤 따는 할망',s:['오늘 귤은 당도가 막 좋쿠다게~','저 안쪽 나무 밑에서 쉬엉 갑서예.']},
{x:3,y:6,c:'#0ea5e9',h:'#222',w:1,n:'농부 청년',s:['귤 따는 철이 되민 눈코 뜰 새 없쥬.','보성이네 감귤농원 귤이 제일 맛좋수다게! 🍊']},
{x:4,y:3,c:'#854d0e',h:'#d1d5db',when:()=>kinHelp('gp1'),n:'보성 할아버지',s:['어서 옵서. 보성이 할아버지우다.','우리 감귤밭 구경허영 갑서게. 🍊'],ch:{'감귤 농사':['감귤은 사람 발소리 듣고 큰다고 허주.','부지런히 밭에 나와사 귤도 달아지는 거라.'],'보성이 이야기':['보성이 왔걸랑 귤 많이 먹으라고 곧아줍서.']}},
{x:5,y:4,c:'#475569',h:'#374151',w:1,n:'보성 아버지',when:dadFarm,s:['귤 철이라 요즘은 밭에서 살아요. 🍊','KT에서 은퇴하고 농사를 시작했는데, 이것도 재미있네요.']},
{x:12,y:6,c:'#be185d',h:'#d1d5db',stay:1,when:()=>kinHelp('hal1'),n:'보성 할머니',s:['귤 따는 거 도와주러 왔수다. 🍊']},
{x:9,y:6,c:'#7c3aed',h:'#d1d5db',stay:1,when:()=>kinHelp('hal2'),n:'보성 외할머니',s:['오늘은 일손 보태러 왔수다게. 🍊']},
{x:12,y:3,c:'#db2777',h:'#3f2a1c',lh:1,w:1,n:'보성 어머니',when:momFarm,s:['퇴근하고 일손 좀 도우러 왔어요. 🍊','병원 일 끝나고 맡는 귤 냄새가 참 좋아요.']},
{x:6,y:4,c:'#166534',h:'#e5e7eb',when:()=>kinHelp('gp2'),n:'보성 외할아버지',s:['보성이 외할아버지우다. 잘 왔수다게.','여기 귤 한번 맛봅서. 달주게? 🍊'],ch:{'감귤 농사':['바람 막아주는 돌담이 제주 귤밭의 보물이주.','겨울 되민 노랗게 익은 밭이 그렇게 곱닥허여.'],'보성이 이야기':['보성이 잘 지내는지, 만나걸랑 안부 전해줍서.']}}]},

house:{n:'보성의 집',par:'town',bgm:'indoor',m:[
  'wwwwwwwwwwwwwww',
  'wqwPwqwwKKwqwqw',
  'wffffffwffffffw',
  'wßßψKKfwþðððffw',
  'wffffffwffffffw',
  'wwwøwfwwwwfwwww',
  'wfffffffffffffw',
  'wfæææffOOfffffD',
  'wfffffffffffffw',
  'wwwwwwwxwwwwwww'],
memo:{'1,1':{s:'INFJ',c:'#fde047',l:['🧩 MBTI','INFJ']},'5,1':{s:'💙',c:'#93c5fd',l:['💙 좋아하는 색깔','파란색!']},'11,1':{s:'🐶',c:'#f9a8d4',l:['🐶 좋아하는 동물','강아지!']},'13,1':{s:'🎵',c:'#86efac',l:['🎵 즐겨듣는 노래','쉼의 숲 음악 서재 벽에 달마다 걸어 두고 있어요!']}},
sign:{'1,3':'내 방','14,7':'안방'},d:{'7,9':['town',3,4],'14,7':['anbang',1,5]},p:[
{x:1,y:4,c:'#7dd3fc',h:'#1b1b26',n:'거울 속의 나',s:['안녕, 나는 강보성.','BS World에 오신 것을 환영해!'],ch:{'다음 모험':['이 세상을 계속 넓혀 가는 중이야. 제주에서 시작해서 이제 서울까지 왔지.','요즘은 노량진에서 지내. 근처 지나가면 아지트도 구경하고 가. 🏠','다음엔 어디까지 넓힐지 나도 아직 몰라. 그게 재밌는 거지. 😄']}},
{x:2,y:7,c:'#475569',h:'#374151',sit:1,fd:1,n:'보성 아버지',when:()=>!dadFarm(),s:['어서 와요. 보성이 아버지입니다.','KT에서 은퇴하고 지금은 농사를 짓고 있어요. 편히 둘러봐요.']},
{x:4,y:7,c:'#db2777',h:'#3f2a1c',lh:1,sit:1,fd:1,n:'보성 어머니',when:()=>!momFarm(),s:['어머, 손님이 왔네! 보성이 엄마예요.','간호사로 일하고 있어요. 밥은 먹었어요? 귤이라도 하나 먹고 가요. 🍊']},
{x:11,y:8,c:'#f9a8d4',h:'#1b1b26',lh:1,n:'보성 여동생',s:['안녕하세요. 보성 오빠 동생입니다.','가운데 테이블에 방명록을 남겨 주세요. 😄']}]},

gym:{n:'체육관',par:'sports',wide:1,land:[16,15],bgm:'sports',m:['wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww','wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww','wfffffffffw㌈㌈ㆎㆎ㌈㌈㌈ㆎㆎ㌈㌈wfffffffffw','wf{{ff}}ffw㌈㌈㌈㌈㌈㌈㌈㌈㌈㌈㌈wf㉸㉸㉸f㉹㉹ffw','wfffffffffw㌈㌈㌈㌈㌈㌈㌈㌈㌈㌈㌈wfffffffffw','wf㌅㌅ff㌆f㌆fw㌃㌈㌈㌈㌈㌈㌈㌈㌈㌈㌃wf㉹㉹ff㉸㉸ffw','wfffffffffw㌈㌈㌈㌈㌈㌈㌈㌈㌈㌈㌈wfffffffffw','wfffffffffw㌈㌈㌈㌈㌈㌈㌈㌈㌈㌈㌈wfffffffffw','wf}}ff㌅㌅ffw㌈㌈㌈㌈㌈㌈㌈㌈㌈㌈㌈wf㉺㉺㉺f㉺㉺ffw','wfffffffffw㌈㌈㌈㌈㌈㌈㌈㌈㌈㌈㌈wfffffffffw','wwwwwfwwNwMwJww㋸㋸㋸wwJwMwNwwfwwwww','wfffffffffffff㌘fffffffffffffffffw','wfkkkkkfff㌇f㌇fffffffffffffffffffw','wfffffffffffffffffffffffffffffffw','wf㉵fffffffffffffffff㉴㉴㉴㉴ffffff㉵fw','wfffffff㉴㉴ffffffffffffffffffffffw','wfffffffffffffffffffffffffffffffw','wwwwwwwwwwwwwwwwxwwwwwwwwwwwwwwww'],sign:{'3,10':'맨몸 존','16,10':'농구 코트 08~22','14,11':'코트 예약','27,10':'머신 존','10,10':'명예의 벽','22,10':'명예의 벽','11,12':'운동 기록기','4,12':'안내'},d:{'16,17':['sports',10,3]},p:[
{x:24,y:13,stay:1,c:'#16a34a',h:'#222',n:'메인 러닝 코치',s:['어서 와! 여기는 체육관.','마라톤 하프코스를 3번 완주한 러너의 기록실이지.'],ch:{'하프코스 3회':['2013 제2회 6.25 상기 및 정전 60주년 기념 국민대통합 마라톤 대회 하프 01:58:21.05','2016 제9회 아름다운제주국제마라톤대회 하프 2:27:11.23','2016 제21회 제주국제관광마라톤축제 하프 02:54:26.14'],'감귤마라톤 & 볼링':['2019 제주감귤국제마라톤 10km 01:22:38.32 🍊','2011 제30회 제주특별자치도볼링협회장기 전도볼링대회 대학부 남자 2인조전 3위 🎳']}},
{x:4,y:11,c:'#ea580c',h:'#111',stay:1,n:'체육관 트레이너',s:['24시간 열려 있어요. 기구를 눌러 체험해 보세요.','기록은 저쪽 운동 기록기에 남습니다.'],ch:{'📈 기록 보기':()=>showFit()}},
{x:6,y:6,c:'#60a5fa',h:'#222',w:1,n:'서브 러너',s:['후… 후… 아 안녕!','기록은 숫자지만 완주는 이야기야. 파이팅!']},
{x:28,y:7,c:'#10b981',h:'#222',w:1,n:'철봉 찾는 회원',s:['철봉은 왼쪽 맨몸 존에 있어요.']},
{x:13,y:3,c:'#ef4444',h:'#222',w:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},stay:1,n:'농구 하는 회원',s:['패스! 패스! 🏀','퇴근하고 뛰면 스트레스가 풀려요.']},
{x:17,y:7,c:'#3b82f6',h:'#3f2a1c',w:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},stay:1,n:'농구 하는 회원',s:['한 게임 더 합시다!']},
{x:19,y:4,c:'#f59e0b',h:'#222',w:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},stay:1,n:'농구 하는 회원',s:['오늘 슛 감이 좋아요.']},
{x:15,y:8,c:'#10b981',h:'#6b3e26',w:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},stay:1,n:'농구 하는 회원',s:['수비! 수비!']},
{x:4,y:4,c:'#a855f7',h:'#222',w:1,when:()=>{const h=jejuNow().h;return h>=18&&h<23},n:'퇴근한 직장인',s:['퇴근하자마자 왔어요. 💪']},
{x:7,y:7,c:'#0ea5e9',h:'#3f2a1c',w:1,when:()=>{const h=jejuNow().h;return h>=18&&h<23},n:'퇴근한 직장인',s:['팔굽혀펴기 30개만 더…']},
{x:2,y:7,c:'#ef4444',h:'#222',w:1,when:()=>{const h=jejuNow().h;return h>=18&&h<23},n:'줄넘기 회원',s:['이단 뛰기 연습 중이에요!']},
{x:25,y:4,c:'#22c55e',h:'#222',w:1,when:()=>{const h=jejuNow().h;return h>=18&&h<23},n:'헬스 회원',s:['한 세트만 더…']},
{x:29,y:7,c:'#f97316',h:'#3f2a1c',w:1,when:()=>{const h=jejuNow().h;return h>=18&&h<23},n:'헬스 회원',s:['어깨 운동 날이에요.']},
{x:27,y:6,c:'#6366f1',h:'#222',w:1,when:()=>{const h=jejuNow().h;return h>=18&&h<23},n:'헬스 회원',s:['이 시간엔 기구 줄 서야 해요.']},
{x:8,y:13,c:'#14b8a6',h:'#222',w:1,when:()=>{const h=jejuNow().h;return h>=18&&h<23},n:'운동 마친 회원',s:['오늘 기록 남기고 가야죠.']},
{x:20,y:13,c:'#ec4899',h:'#3f2a1c',w:1,when:()=>{const h=jejuNow().h;return h>=18&&h<23},n:'쉬는 회원',s:['잠깐 물 좀 마시고요. 💧']}]},

terminal:{n:'제주 공항 터미널',par:'airport',bgm:'indoor',m:['w'.repeat(W),'wwlwwlwⓡwlwwlww','wffffffⓡffffffw','wkkkkkkⓡkkkkkkw',FR,FR,'wfKKffffffffKKw',FR,FR,'wwwwwwwxwwwwwww'],sign:{'4,2':'국내선','10,2':'국제선'},d:{'7,9':['airport',10,7]},p:[
{x:4,y:2,c:'#0369a1',h:'#222',n:'국내선 수속 직원',s:['BS 에어 국내선입니다. 어디로 가시겠어요? ✈'],ch:{'✈ 비행기 타기':()=>showFlight(),'📡 실제 운항 현황':()=>showAirBoard('D'),'공항 안내':['왼쪽이 국내선, 오른쪽이 국제선 카운터예요.','벽의 출발 안내판을 눌러도 탑승할 수 있어요.']}},
{x:10,y:2,c:'#7c3aed',h:'#222',n:'국제선 수속 직원',s:['국제선 카운터입니다. 여권 챙기셨어요? 🛂','아직 BS World 밖으로 나가는 노선은 취항 준비 중이에요.'],ch:{'📡 실제 국제선 현황':()=>showAirBoard('I'),'✈ 국내선 안내받기':()=>showFlight(),'언제 취항해요?':['주인장이 다음 나라를 고르면 바로 엽니다.','그전까지는 제주 하늘부터 즐겨 봅서.']}},
{x:3,y:5,c:'#f472b6',h:'#222',w:1,n:'출장 가는 직장인',s:['비행기 타기 전 감귤 주스 한 잔이 국룰이죠.']},
{x:11,y:7,c:'#94a3b8',h:'#d1d5db',n:'마중 나온 삼춘',s:['보성이 오는 날인가 해서 기다렴수다게.']}]},

samgeori:{n:'공원',o:1,bgm:'route',land:[7,5],opera:[1,1,5,2],m:[
  'TTTTTTT=TTTTTTT',
  'T$$$$$.=..F...T',
  'T$$$$$.=..YYY.T',
  'T¢¢D¢¢.=.bHDH.T',
  'T..=========..T',
  'TF.....========',
  'T.~~~..=.F.b..T',
  'T.~~~.b=...F.TT',
  'TF~~~..=.m...TT',
  'TTTTTTT=TTTTTTT'],sign:{'3,3':'음악 서재','11,3':'사진관'},d:{'3,3':['library',7,8],'11,3':['photo',11,8]},e:{u:['rest',7,13],d:['cityhall',7,0],r:['sports',0,5]},p:[
{x:9,y:6,c:'#65a30d',h:'#3f2a1c',w:1,n:'공원 산책객',s:['벤치에 앉아 있으면 음악 서재에서 노래가 들리는 것 같아요. 🎧','위로 가면 놀멍쉬멍, 아래로 가면 시청, 오른쪽은 사라봉이에요.']}]},
oreumF:{n:'건입동',o:1,wide:1,bgm:'route',land:[6,5],m:['TTTTTTTTTTTTTTTTTTTTTTT','TT.F..T..F.....F...T.TT','T..T.F...T..F.㋘㋘㋘㋘.F..T','T.QQQ....YYY..㋘㋘㋘㋘....T','T㊄HDH㉾..㉾HDH...F...F.TT','============..㌕.....㌕.T','T.F....=㌕㌀㌀㌀㌀㌀㌀㌀㌀㌀㌀㌀%.T','T.[]|..=b㌀㌀㌀㌀㌀㌀㌀㌀㌀㌀㌀%.T','T..F..T=.㌀㌀㌀㌀㌀㌀㌀㌀㌀㌀㌀%.T','T.F...T=㌕㌀㌀㌀㌀㌀㌀㌀㌀㌀㌀㌀%.T','T.....F=.㌀㌀㌀㌀㌀㌀㌀㌀㌀㌀㌀%.T','TT..F..=b㌀㌀㌀㌀㌀㌀㌀㌀㌀㌀㌀%.T','T.F....=㌕㌀㌀㌀㌀㌀㌀㌀㌀㌀㌀㌀%.T','TTTTTTT=TTTTTTTTTTTTTTT'],board:{'5,4':'woodang','8,4':'swim'},sign:{'3,4':'우당 도서관','10,4':'수영장','3,6':'놀이터','16,2':'별도봉','15,6':'축구장'},d:{'3,4':['woodang',11,10],'10,4':['swim',7,8]},e:{l:['rest',14,7],d:['sports',7,0]},p:[
{x:9,y:9,c:'#f59e0b',h:'#222',stay:1,fd:2,when:()=>{const h=jejuNow().h;return h>=6&&h<23},n:'골키퍼',s:['오늘은 한 골도 안 줍니다. 🧤']},{x:19,y:9,c:'#22c55e',h:'#3f2a1c',stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=6&&h<23},n:'골키퍼',s:['골대 뒤로 공 넘어가면 네가 주워 와!']},{x:12,y:8,c:'#ef4444',h:'#222',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=6&&h<23},n:'축구 하는 사람',s:['여기! 여기 비었어! ⚽']},{x:17,y:10,c:'#2563eb',h:'#222',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=6&&h<23},n:'축구 하는 사람',s:['한 골 차이! 끝까지 가자!']},{x:14,y:11,c:'#ef4444',h:'#6b3e26',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=6&&h<23},n:'축구 하는 사람',s:['가운데 공 차 볼래요? 눌러 봐요!']},{x:18,y:7,c:'#2563eb',h:'#3f2a1c',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=6&&h<23},n:'축구 하는 사람',s:['수비 내려와!']},
{x:2,y:6,c:'#f59e0b',h:'#222',w:1,n:'놀이터 꼬마',s:['그네 타 봤어요? 시소도 있어요!']}]},
gotF:{n:'서귀포',o:1,bgm:'route',land:[6,5],m:[
  'TTTTTT=TTTTTTTT',
  'TTT.F.=T.T..TTT',
  'TTT...=.F..T.FT',
  'TTRRRT=.QQQT!.T',
  'T.HDH.=FHDH.F.T',
  '===============',
  'TF.T.T...T.T.TT',
  'T..F...T..F...T',
  'TT.T.F..T..F.TT',
  'TTTTTTTTTTTTTTT'],sign:{'3,4':'나눔·헌혈','9,4':'멘사 연구소'},d:{'12,3':['cave',1,5],'3,4':['vol',7,8],'9,4':['mensa',7,8]},e:{u:['route2',6,9],l:['beach',14,5],r:['route1',0,7]},p:[]},
shoreF:{n:'해안 숲길',o:1,wide:1,bgm:'route',land:[12,5],m:['~~~~ssTTTTTTTTTTTTTTTTT','~~~~ssT.F..T.TT.F..T.TT','~~~~ss..T.F...T..T...FT','~~~sss.F...T.FTT...F..T','~~~~ss.T.F....T.F..T..T','~~~~s==================','~~~~s.㌊㋐㌊..㌊㋐㌊.㉾㌋㌋㌋㌋㌋㌋T','~~~~s.㌊㌊㌊..㌊㌊㌊..㌋㌌㌋㌋㌌㌋T','~~~~ss....㋑.....㌋㌋㌋㌋㌋㌋T','~~~~s.㌊㋐㌊..㌊㋐㌊..㌋㌋㌌㌋㌋㌌T','~~~~s.㌊㌊㌊..㌊㌊㌊..㌋㌋㌋㌋㌋㌋T','~~~~sF.T.F..T.F.㌌㌋㌋㌌㌋㌋T','~~~~sT.F...T..F.㌋㌋㌋㌋㌋㌋T','~~~~sTTTTTTTTTTTTTTTTTT'],board:{'15,6':'camp'},sign:{'9,6':'캠핑장','19,6':'주차장'},e:{r:['studio',0,5]},p:[{x:15,y:8,c:'#b45309',h:'#3f2a1c',stay:1,n:'캠핑장 관리인',s:['캠핑장은 24시간 열려 있수다. 빈 텐트에서 자고 가도 돼요. ⛺','차 끌고 와서 차박하는 사람도 많수다게. 🚗','모닥불 앞에서 A를 눌러 불멍 해 봅서. 🔥']},{x:9,y:8,c:'#0f766e',h:'#222',sit:1,fd:3,cup:1,n:'불멍하는 사람',s:['아무 생각 없이 불만 보는 게 좋아요. 🔥']},{x:9,y:7,c:'#be185d',h:'#3f2a1c',lh:1,w:1,n:'텐트 치는 사람',s:['팩 하나만 더 박으면 돼요. ⛺']},{x:18,y:8,c:'#2563eb',h:'#222',w:1,when:()=>{const h=jejuNow().h;return h>=7&&h<21},n:'차박 여행객',s:['오늘은 차에서 자려고요. 트렁크를 평평하게 만들었죠. 🚗']}]},
haenyeo:{n:'해녀의 집',par:'coast',wide:1,land:[7,12],bgm:'beach',m:['㋨'.repeat(W),'㋨㊉㊉㋨ⓦ㋨ⓦ㋨㋨㉧㉧㋨㉧㉧㋨',FR,'wf㌙㌙㌙fffffkkkfw',FR,'wffffㆍㆍㆍㆍㆍffffw',FR,'w㋩㋩fffㆎㆍㆎfff㋥fw',FR,'wfㆎㆍㆎfㆎㆍㆎfㆎㆍㆎfw',FR,'wfㆎㆍㆎfㆎㆍㆎfㆎㆍㆎfw',FR,'㋨㋨㋨㋨㋨㋨㋨x㋨㋨㋨㋨㋨㋨㋨'],sign:{'1,1':'오늘 잡은 것','3,3':'오늘의 메뉴','2,7':'불턱','11,1':'수조','7,8':'손님 자리'},d:{'7,13':['coast',11,3]},p:[
{x:11,y:2,c:'#f8fafc',h:'#d1d5db',lh:1,stay:1,n:'해녀의 집 주방 삼춘',s:['혼저옵서! 오늘 바당에서 직접 잡은 거우다. 🐚','주문허영 빈자리에 앉읍서.'],ch:{'🍽 주문하기':()=>showCafe()}},
{x:5,y:4,c:'#1f2937',h:'#d1d5db',sit:1,when:hnMeal,n:'보성 할머니',s:()=>[jejuNow().h<15?'옛날 물질허던 동무들 보레 왔수다. 혼저 앉아 먹읍서. 🍚':'저녁 먹으멍 옛날 이야기나 허주.'],ch:hnCh},
{x:7,y:4,c:'#334155',h:'#e5e7eb',sit:1,when:hnMeal,n:'보성 외할머니',s:()=>[jejuNow().h<15?'물질 그만둔 지 오래여도 여기 오민 바당 이야기만 허게 뒈주. 허허.':'따뜻헌 국 호끔 들엉 갑서.'],ch:hnCh},
{x:9,y:4,c:'#0f766e',h:'#9ca3af',sit:1,tw:1,when:hnMeal,n:'상군 해녀 삼춘',s:['오늘은 소라가 제법 잡혔수다. 🐚','숨비소리 들어 봐시냐? 그게 우리 숨이주게.']},
{x:5,y:6,c:'#7c3aed',h:'#374151',sit:1,tw:1,when:hnMeal,n:'막내 해녀 삼춘',s:['나가 막내라도 환갑은 넘었수다. 허허.','테왁 하나믄 바당이 집이나 마찬가지우다.']},
{x:9,y:6,c:'#b45309',h:'#e5e7eb',sit:1,tw:1,when:hnMeal,n:'옆집 해녀 할망',s:['물에서 나오민 불턱에 몸 녹이는 게 제일이주. 🔥','배 고프댄 말 말앙 혼저 먹읍서.']},
{x:4,y:8,c:'#475569',h:'#d1d5db',stay:1,when:()=>!hnMeal(),n:'해녀의 집 지키는 삼춘',s:()=>[WET()?'날 궂언 오늘은 물질 쉼수다. 다들 집이 이서마씸.':'지금은 다들 물질허레 갔수다. 점심이나 저녁때 오민 다 모여 쉬어마씸. 🌊']}]},

woodang:{n:'우당 도서관',par:'oreumF',wide:1,land:[11,10],bgm:'knowledge',m:['wwwwwwwwwwwwwwwwwwwwwww','w㊁㊂㉵ff㉵w㉲w㉲ㅸ㉲w㉲wppppppw','wfffffffffffffffffffffw','w㉴㉴ff㉴㉴wfffffffwfppfppw','wffffffwff㊅㊅㊅ffwffffffw','w㉴㉴ff㉴㉴w㉴f㊅㊅㊅f㉴wfppfppw','wffffffw㉴f㊅㊅㊅f㉴wffffffw','w㉵ffff㉵wff㊅㊅㊅ffwfppfppw','wwwwwwwwfffffffwffffffw','wwwwwww㉼fffffffwfkkkk㉻w','wwwwwwwwffffffffffffffw','wwwwwwwwwwwxwwwwwwwwwww'],sign:{'3,2':'쉼터','18,2':'종합자료실','11,1':'2층 열람실','7,9':'구내식당','18,8':'안내·대출','11,3':'중앙 정원'},d:{'11,11':['oreumF',3,5],'11,1':['woodang2',10,10],'7,9':['woodangF',13,4]},p:[
{x:9,y:4,c:'#1b2a33',h:'#17121a',p:'#17121a',stay:1,fd:2,when:()=>isOwner(),n:'창끼 (a.k.a 노진구)',s:()=>ckWoodang()},
{x:9,y:4,c:'#2b3140',h:'#17151c',p:'#17151c',stay:1,fd:2,when:()=>ckMe(),n:'강보성',s:()=>ckWoodang()},
{x:18,y:8,c:'#475569',h:'#222',stay:1,when:libRoomOpen,n:'도서관 사서',s:['우당 도서관입니다. 2층에 열람실이 있어요. 📚','구내식당은 왼쪽 문, 쉼터 자판기는 왼쪽 위예요.']},
{x:20,y:4,c:'#a78bfa',h:'#222',w:1,when:libRoomOpen,n:'책 고르는 손님',s:['제주 이야기 책이 많아서 좋아요.']},
{x:9,y:9,c:'#22d3ee',h:'#3f2a1c',w:1,n:'전시 보는 학생',s:['복도에 그림 전시를 자주 해요. 🖼']},
{x:1,y:3,c:'#0f766e',h:'#222',sit:1,fd:0,cup:1,n:'쉬는 손님',s:['공부하다 머리 식히러 왔어요. ☕']},
{x:8,y:5,c:'#be185d',h:'#3f2a1c',lh:1,sit:1,fd:3,n:'정원 앞 손님',s:['가운데 정원을 보고 있으면 눈이 편해요. 🌿']}]},
woodang2:{n:'우당 도서관 2층',par:'woodang',wide:1,land:[10,10],bgm:'knowledge',m:['wwwwwwwwwwwwwwwwwwwwwww','wⓦwⓦwⓦwⓦwⓦwⓦwⓦwⓦwⓦwⓦwⓦw','wfffffffffffffffffffffw','wf㊆㊆f㊆㊆f㊆㊆fwfppfppfppfw','wfffffffffffffffffffffw','wf㊆㊆f㊆㊆f㊆㊆fwffffffffffw','wffffffffffwfff㊈㊇㊇㊈fffw','wf㊆㊆f㊆㊆f㊆㊆fwfff㊈㊇㊇㊈fffw','wfffffffffffffffffffffw','wfppfppfppfw㉴㉴ff㈆㈆ff㉴㉴w','wffffffffffㅸffffffffffw','wwwwwwwwwwwwwwwwwwwwwww'],sign:{'5,2':'일반열람실','16,2':'자료 열람 공간','16,5':'제주 모형','11,10':'1층'},d:{'11,10':['woodang',11,2]},p:[
{x:3,y:3,c:'#1e3a8a',h:'#222',sit:1,fd:1,eat:'✏',n:'공부하는 학생',s:['시험 기간엔 자리가 금방 차요.','여기 오면 집중이 잘돼요. 📖']},
{x:9,y:5,c:'#0f766e',h:'#3f2a1c',gl:'#27272a',sit:1,fd:1,eat:'💻',n:'노트북 하는 사람',s:['과제 끝낼 때까지 집에 안 가려고요.']},
{x:6,y:7,c:'#b45309',h:'#222',sit:1,fd:1,eat:'📖',n:'자격증 준비생',s:['한 문제만 더 풀고 쉬려고요.']},
{x:15,y:6,c:'#475569',h:'#9ca3af',sit:1,fd:3,eat:'📖',n:'독서하는 어르신',s:['제주 옛이야기 책을 읽고 있어요.']},
{x:13,y:4,c:'#94a3b8',h:'#222',stay:1,n:'열람실 안내원',s:['빈자리에서 A를 눌러 보세요. 독서나 공부를 고르면 시간이 재져요. ⏱','조용히 부탁드려요.'],ch:{'🏆 열람실 랭킹':()=>showStudyRank()}}]},
woodangF:{n:'우당 도서관 구내식당',par:'woodang',bgm:'indoor',m:['w'.repeat(W),'w㊉㊉wwwⓦwⓦwⓦwⓦww',FR,'w㊋㊋㊋ffffffffffw','wfffffffffffff㉼','wf㊌㊌fㆎㆍㆎfffㆎㆍㆎw',FR,'wf㊌㊌fㆎㆍㆎfffㆎㆍㆎw',FR,'w'.repeat(W)],sign:{'1,1':'오늘의 메뉴','3,5':'간식 코너','13,4':'로비'},d:{'14,4':['woodang',8,9]},p:[
{x:2,y:2,c:'#1e3a8a',h:'#222',stay:1,n:'식당 직원',s:['어서 오세요. 국밥 맛있어요! 🍚','주문하고 빈자리에 앉으세요.'],ch:{'🍚 주문하기':()=>showCafe()}},
{x:5,y:5,c:'#475569',h:'#222',sit:1,fd:3,eat:'🍜',n:'점심 먹는 학생',s:['도서관 밥이 든든하고 저렴해요.']},
{x:13,y:7,c:'#be185d',h:'#3f2a1c',lh:1,sit:1,fd:2,eat:'🍚',n:'점심 먹는 손님',s:['여기 비빔밥 자주 먹어요.']},
{x:4,y:4,c:'#65a30d',h:'#3f2a1c',w:1,n:'간식 고르는 학생',s:['공부할 땐 초콜릿이 필요해요. 🍫']}]},

minsok:{n:'제주민속촌',o:1,wide:1,bgm:'route',land:[5,5],m:['TTTTTTTTTTTTTTTTTTTTTTT','TT.F..T.F..TF..T..F..FT','T%%%%%%%%%%%%%%%%%%%%.T','T%.F㋆㋆㋆F.........F..%.T','T%㋈.㋇D㋇㉾㋈...㋈.....㋈.%.T','=======================','T.F...㋉.F....㋊㋊.㋊㋊..F.T','T...F.....㋈...........T','T.F....F...F..F...F...T','T.㋈..F...㋊㋊.㋊㋊.㋈...F..T','T...F...T....F.....㋉..T','T.F....㋉...F...T......T','TT...F......T...F...F.T','TTTTTTTTTTTTTTTTTTTTTTT'],board:{'7,4':'minsokIn'},sign:{'5,4':'제주민속촌','15,6':'기념품 천막'},d:{'5,4':['minsokIn',15,16]},e:{l:['route1',23,7]},p:[
{x:11,y:6,c:'#be123c',h:'#222',lh:1,stay:1,n:'민속촌 안내원',s:['제주민속촌에 어서 오세요. 초가집 마을을 걸어 보세요. 🏯','표는 입구 안내판에 적혀 있어요.'],ch:{'🎟 입장료 보기':['성인 15,000원','경로(65세 이상) 13,000원','청소년·군경 12,000원','어린이(만 4세~초등) 11,000원'],'🕘 운영시간':['매일 09:00~18:00','매표는 17:00에 마감해요.'],'🗺 실제 위치 보기':()=>window.open('https://map.naver.com/p/search/%ED%91%9C%EC%84%A0%EB%AF%BC%EC%86%8D%EC%B4%8C/place/11590712','_blank','noopener')}},
{x:3,y:6,c:'#65a30d',h:'#222',w:1,n:'관광객',s:['돌담길 따라 걷는 게 참 좋아요. 🌿']}]},
minsokIn:{n:'제주민속촌 마을',o:1,par:'minsok',wide:1,land:[15,16],bgm:'route',m:['%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%','%T.............=.............T%','%..㋆㋆㋆...㋆㋆㋆...=..............%','%..㋇㋎㋇.㋉.㋇㋎㋇.T.=..㋊㋊.㋊㋊.㋊㋊.㋊㋊.%','%.T........T...=..............%','%....F.........=...........F..%','%..㋆㋆㋆...㋆㋆㋆...=....ㆎㆍㆎ.ㆎㆍㆎ...%','%..㋇㋎㋇...㋇㋎㋇...=..............%','%.㋈...T......㋈.=.㋈..T.....T.㋈.%','%=============================%','%..........F.㋈.=.㋈............%','%..㋆㋆㋆...㋆㋆㋆...=..㋆㋆㋆㋋㋋㋋..㋆㋆㋆.%','%..㋇㋎㋇.㋉.㋇㋎㋇...=..㋇㋎㋇㋋㋋㋋..㋇㋎㋇.%','%..............=..............%','%..㋆㋆㋆...㋆㋆㋆.T.=..F...........%','%..㋇㋎㋇.㋉.㋇㋎㋇...=...T....㋉㋉..T.%','%T.............=.............T%','%%%%%%%%%%%%%%%㉥%%%%%%%%%%%%%%%'],sign:{'4,2':'산촌','4,11':'중산간촌','20,3':'민속장터','22,11':'드라마 세트장','19,11':'초가상점','27,11':'추사전시관','6,9':'돌담길'},d:{'15,17':['minsok',5,5]},p:[
{x:19,y:4,c:'#b45309',h:'#3f2a1c',lh:1,stay:1,n:'장터 삼춘',s:['장터 음식 맛보고 갑서. 빙떡이 맛좋수다. 🍽'],ch:{'🍽 주문하기':()=>showCafe()}},
{x:25,y:4,c:'#0f766e',h:'#222',stay:1,n:'한복 빌려주는 삼춘',s:['한복 입고 사진 찍으면 곱닥허우다. 👘']},
{x:19,y:13,c:'#78350f',h:'#222',stay:1,n:'초가상점 주인',s:['제주 기념품 구경하고 갑서. 🎁','옷이랑 작은 소품들이 많수다.']},
{x:27,y:13,c:'#334155',h:'#9ca3af',stay:1,n:'전시관 해설사',s:['제주 유배 시절의 추사 김정희 이야기를 볼 수 있어요. 🖌']},
{x:22,y:13,c:'#be123c',h:'#222',lh:1,w:1,n:'한복 입은 관광객',s:['드라마 세트장 붉은 문 앞이 사진 명당이에요. 📸']},
{x:7,y:4,c:'#65a30d',h:'#3f2a1c',w:1,n:'초가 구경하는 사람',s:['지붕을 줄로 꽁꽁 묶어 놨어요. 바람 때문이래요.']},
{x:6,y:10,c:'#1d4ed8',h:'#222',stay:1,n:'민속촌 해설사',s:['초가집과 돌담은 제주 바람을 이기려는 지혜예요.','산촌, 중산간촌을 차례로 둘러보세요.']},
{x:17,y:13,c:'#ea580c',h:'#222',w:1,n:'가족 관광객',s:['돌하르방 코를 만지면 복이 온다던데요? 🗿']}]},
pension:{n:'바다 펜션',par:'beach',bgm:'beach',cozy:'#0ea5e9',m:['w'.repeat(W),'ww㋷wwⓦw㋷wⓦww㋷ww',FR,FR,'w㈀fff㉴㉴fffffㆎㆍw',FR,'w㉵fffffffffㆎㆍㆎw',FR,'w㈄fffffffffff㋼w','wwwwwwwxwwwwwww'],sign:{'2,1':'101호','7,1':'102호','12,1':'도미토리','13,8':'2층'},bd:{'13,8':['pension2',2,8],'2,1':['penRoom1',7,8],'7,1':['penRoom2',7,8],'12,1':['penDorm',7,8]},d:{'7,9':['beach',11,4]},p:[{x:11,y:3,c:'#0ea5e9',h:'#3f2a1c',lh:1,stay:1,n:'펜션 사장',s:['어서 옵서. 객실은 1층부터 3층까지 있수다. 🌊','문에 불이 초록색이면 빈방, 빨간색이면 투숙 중이우다.']}]},
penRoom1:{n:'펜션 101호',par:'pension',bgm:'beach',cozy:'#0ea5e9',m:['w'.repeat(W),'wwⓦwwⓦwwwⓦwwⓦww','wßßffffffþðfffw','wfffffffffffffw','w㈀fff㉴㉴fffffffw',FR,'w㉵ffffffffffffw',FR,FR,'wwwwwwwxwwwwwww'],sign:{'7,1':'오션뷰'},d:{'7,9':['pension',2,2]},p:[]},
penRoom2:{n:'펜션 102호',par:'pension',bgm:'beach',cozy:'#0ea5e9',m:['w'.repeat(W),'wwⓦwwⓦwwwⓦwwⓦww','wßßfffßßfffþðfw','wfffffffffffffw','wfffff㉴㉴fffff㈀w',FR,'w㈄fffffffffff㉵w',FR,FR,'wwwwwwwxwwwwwww'],sign:{'7,1':'트윈룸'},d:{'7,9':['pension',7,2]},p:[]},
penDorm:{n:'펜션 도미토리',par:'pension',bgm:'beach',cozy:'#0ea5e9',m:['w'.repeat(W),'wwⓦwwwⓦwⓦwwwⓦww','w㋶㋶f㋶㋶f㋶㋶f㋶㋶ffw','wfffffffffffffw','wfffffffffffffw','w㋶㋶f㋶㋶f㋶㋶f㋶㋶ffw','wfffffffffffffw','w㈄㈄fffffffff㉵fw',FR,'wwwwwwwxwwwwwww'],sign:{'7,1':'도미토리'},d:{'7,9':['pension',12,2]},p:[{x:4,y:2,c:'#2563eb',h:'#3f2a1c',when:()=>{const h=jejuNow().h;return h>=22||h<7},sl:[128,64,'#e2e8f0',1],n:'자는 여행객',s:['(쿨쿨 자고 있다. 깨우지 말자.)']},{x:10,y:5,c:'#f59e0b',h:'#222',when:()=>{const h=jejuNow().h;return h>=22||h<7},sl:[320,160,'#e2e8f0',1],n:'자는 여행객',s:['(쿨쿨 자고 있다.)']},{x:9,y:3,c:'#10b981',h:'#222',w:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'배낭 여행객',s:['도미토리는 저렴해서 오래 머물기 좋아요. 🎒','내일은 오름에 가 보려고요.']}]},
bowl:{n:'볼링장',par:'rest',bgm:'town',wide:1,land:[11,12],m:['wwwwwwwwwwwwwwwwwwwwwww','w㋒w㋒w㋒w㋒w㋒w㋒w㋒w㋒w㋒w㋒w㋒w','wfffffffffffffffffffffw','w㋔f㋔f㋔f㋔f㋔f㋔f㋔f㋔f㋔f㋔ffw','w㋔f㋔f㋔f㋔f㋔f㋔f㋔f㋔f㋔f㋔ffw','w㋔f㋔f㋔f㋔f㋔f㋔f㋔f㋔f㋔f㋔ffw','w㋕f㋕f㋕f㋕f㋕f㋕f㋕f㋕f㋕f㋕ffw','wfffffffffffffffffffff㉼','wfffffffffffffffffffffw','w㉴㉴fffkkkkkfffffff㉴㉴fww','wfffffffffffffffffffffw','w㉵f㋟㋟㋟㋟㋟㋟fffffffffff㉵fw','wfffffffffffffffffffffw','wwwwwwwwwwwxwwwwwwwwwww'],sign:{'11,7':'레인 앞에서 A','6,9':'대여·계산','6,11':'공 고르는 곳','21,7':'장비 가게'},d:{'11,13':['rest',3,6],'22,7':['bowlShop',1,5]},p:[{x:5,y:8,c:'#7c3aed',h:'#3f2a1c',lh:1,stay:1,n:'신발 대여 직원',s:['볼링화 사이즈 말씀해 주세요. 👟']},{x:9,y:8,c:'#7c3aed',h:'#111',stay:1,n:'계산 직원',s:['게임 끝나고 계산하시면 돼요.']},{x:18,y:7,c:'#7c3aed',h:'#222',w:1,n:'레인 관리 직원',s:['레인에 오일을 새로 칠했어요. 공이 잘 굴러가요.']},{x:7,y:8,c:'#7c3aed',h:'#222',stay:1,n:'볼링장 직원',s:['레인 앞에서 A를 누르면 굴릴 수 있어요. 🎳','5프레임 점수로 순위에 올라가요.'],ch:{'🎳 볼링 치기':()=>showMini('bowl')}},{x:3,y:7,c:'#0ea5e9',h:'#222',w:1,n:'공 고르는 손님',s:['제 손에 맞는 공이 없어요…']},{x:15,y:7,c:'#be123c',h:'#3f2a1c',lh:1,w:1,n:'스트라이크 친 손님',s:['방금 스트라이크 봤어요? 🎳']}]},
jjim:{n:'찜질방',par:'rest',bgm:'indoor',wide:1,land:[11,12],m:['wwwwwwwwwwwwwwwwwwwwwww','wwwwwwwwwwwwwwwwwwwwwww','www㋖㋖㋖www㋗㋗㋗www㋙㋙㋙wwwww','wfffffffffffffffffffffw','w㉺㉺f㉺㉺f㉺㉺fffff㉺㉺f㉺㉺f㉺㉺w','wfffffffffffffffffffffw','w㉺㉺f㉺㉺f㉺㉺fffff㉺㉺f㉺㉺f㉺㉺w','wfffffffffffffffffffffw','wkkkkffffffffffffffffww','wfffffffffffffffffffffw','wwwwwwwwwwwxwwwwwwwwwww'],sign:{'4,2':'불가마','10,2':'황토방','16,2':'아이스방','2,7':'매점'},bd:{'4,2':['jjimFire',7,8],'10,2':['jjimClay',7,8],'16,2':['jjimIce',7,8]},d:{'11,10':['rest',7,6]},p:[{x:1,y:4,c:'#f59e0b',h:'#222',when:()=>{const h=jejuNow().h;return h>=22||h<7},sl:[32,128,'#e2e8f0',1],n:'자는 손님',s:['(쿨쿨 자고 있다. 깨우지 말자.)']},{x:4,y:4,c:'#2563eb',h:'#3f2a1c',when:()=>{const h=jejuNow().h;return h>=22||h<7},sl:[128,128,'#e2e8f0',1],n:'자는 손님',s:['(쿨쿨 자고 있다. 깨우지 말자.)']},{x:7,y:4,c:'#be185d',h:'#111',when:()=>{const h=jejuNow().h;return h>=22||h<7},sl:[224,128,'#e2e8f0',1],n:'자는 손님',s:['(쿨쿨 자고 있다. 깨우지 말자.)']},{x:13,y:4,c:'#0f766e',h:'#222',when:()=>{const h=jejuNow().h;return h>=22||h<7},sl:[416,128,'#e2e8f0',1],n:'자는 손님',s:['(쿨쿨 자고 있다. 깨우지 말자.)']},{x:16,y:6,c:'#ea580c',h:'#d1d5db',when:()=>{const h=jejuNow().h;return h>=22||h<7},sl:[512,192,'#e2e8f0',1],n:'자는 손님',s:['(쿨쿨 자고 있다. 깨우지 말자.)']},{x:19,y:6,c:'#475569',h:'#222',when:()=>{const h=jejuNow().h;return h>=22||h<7},sl:[608,192,'#e2e8f0',1],n:'자는 손님',s:['(쿨쿨 자고 있다. 깨우지 말자.)']},{x:6,y:7,c:'#ea580c',h:'#111',stay:1,n:'찜질방 직원',s:['수건 더 필요하면 말씀하세요.','24시간 열려 있어요.']},{x:2,y:7,c:'#ea580c',h:'#3f2a1c',lh:1,stay:1,n:'매점 이모',s:['찜질방엔 식혜랑 구운 계란이지! 🥚'],ch:{'🥚 주문하기':()=>showCafe()}},{x:1,y:5,c:'#f59e0b',h:'#d1d5db',sit:1,fd:0,eat:'🥚',n:'식혜 마시는 어르신',s:['땀 빼고 먹는 계란이 제일이지.']},{x:13,y:5,c:'#fb923c',h:'#222',w:1,n:'양머리한 손님',s:['수건으로 양머리 만들 줄 알아요? 🐑']}]},
atelier:{n:'창작 공방',par:'studio',bgm:'indoor',m:['w'.repeat(W),'w㋓w㋓w㋓w㋓w㋓w㋓w㋓w',FR,FR,'wf㉶㉶ff㉶㉶ff㉶㉶ffw',FR,'wf㉶㉶ff㉶㉶ff㉶㉶ffw',FR,FR,'wwwwwwwxwwwwwww'],sign:{'7,3':'책상 앞에서 A로 그리기'},d:{'7,9':['studio',11,5]},p:[{x:12,y:7,c:'#a855f7',h:'#f472b6',lh:1,stay:1,n:'공방 선생님',s:['작은 도트 그림을 그려 벽에 걸어 보세요. 🎨','벽의 그림을 누르면 다른 사람 작품도 볼 수 있어요.'],ch:{'🎨 그림 그리기':()=>showPaint(),'🖼 작품 보기':()=>showArt(),'📷 사진 전시 보기':()=>showPhotoWall(),'📤 내 사진 내기':()=>showPhotoUp()}},{x:3,y:6,c:'#475569',h:'#222',sit:1,fd:1,n:'그림 그리는 학생',s:['점 하나 찍는 게 이렇게 어렵네요.']}]},
bowlShop:{n:'볼링 장비 가게',par:'bowl',bgm:'town',m:['w'.repeat(W),'w㋟㋟㋟㋟㋟wwww㋟㋟㋟㋟w',FR,'wfkkkkfffff㋟㋟fw',FR,'㉼fffffffffffffw','wf㋟㋟㋟fff㋟㋟㋟fffw',FR,'wf㉵fffffffff㉵fw','w'.repeat(W)],sign:{'3,1':'볼링공','11,1':'신발·장갑'},d:{'0,5':['bowl',21,7]},p:[{x:3,y:2,c:'#0f766e',h:'#222',stay:1,n:'장비 가게 사장',s:['손에 맞는 공을 골라 봐요. 🎳'],ch:{'🛒 장비 구경':()=>showBowlShop()}},{x:10,y:5,c:'#0ea5e9',h:'#3f2a1c',lh:1,stay:1,n:'지공 직원',s:['손가락 구멍을 맞춰 드려요.']},{x:6,y:7,c:'#be123c',h:'#222',w:1,n:'공 고르는 손님',s:['12파운드가 저한테 딱이에요.']}]},
jjimFire:{n:'찜질방 불가마',par:'jjim',bgm:'indoor',m:['w'.repeat(W),'w㋖㋖㋖www㋖㋖㋖www㋖w'.slice(0,15),'w㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚w','w㋚㉺㉺㋚㉺㉺㋚㉺㉺㋚㉺㉺㋚w','w㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚w','w㋚㉺㉺㋚㉺㉺㋚㉺㉺㋚㉺㉺㋚w','w㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚w','w㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚w','w㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚㋚w','wwwwwwwxwwwwwww'],sign:{'7,1':'불가마 80℃'},d:{'7,9':['jjim',4,3]},p:[{x:4,y:6,c:'#f59e0b',h:'#d1d5db',stay:1,n:'땀 빼는 어르신',s:['딱 5분만 더 있다 나갈 거예요. 🥵']},{x:9,y:7,c:'#fb923c',h:'#222',w:1,n:'수건 쓴 손님',s:['뜨겁다! 뜨거워도 시원해요. 🔥']}]},
jjimClay:{n:'찜질방 황토방',par:'jjim',bgm:'indoor',m:['w'.repeat(W),'w'.repeat(W),'w㋛㋛㋛㋛㋛㋛㋛㋛㋛㋛㋛㋛㋛w','w㋛㉺㉺㋛㉺㉺㋛㉺㉺㋛㉺㉺㋛w','w㋛㋛㋛㋛㋛㋛㋛㋛㋛㋛㋛㋛㋛w','w㋛㉺㉺㋛㉺㉺㋛㉺㉺㋛㉺㉺㋛w','w㋛㋛㋛㋛㋛㋛㋛㋛㋛㋛㋛㋛㋛w','w㋛㉵㋛㋛㋛㋛㋛㋛㋛㋛㋛㉵㋛w','w㋛㋛㋛㋛㋛㋛㋛㋛㋛㋛㋛㋛㋛w','wwwwwwwxwwwwwww'],sign:{'7,1':'황토방'},d:{'7,9':['jjim',10,3]},p:[{x:6,y:6,c:'#b45309',h:'#3f2a1c',lh:1,stay:1,n:'황토방 단골',s:['황토 냄새가 참 구수해요. 🌾']}]},
jjimIce:{n:'찜질방 아이스방',par:'jjim',bgm:'indoor',m:['w'.repeat(W),'w㋞㋞ww㋞㋞www㋞㋞ww㋞w'.slice(0,15),'w㋜㋜㋜㋜㋜㋜㋜㋜㋜㋜㋜㋜㋜w','w㋜㋞㋜㋜㋜㋞㋜㋜㋜㋞㋜㋜㋜w','w㋜㋜㋜㋜㋜㋜㋜㋜㋜㋜㋜㋜㋜w','w㋜㉴㉴㋜㋜㋜㋜㋜㋜㋜㉴㉴㋜w','w㋜㋜㋜㋜㋜㋜㋜㋜㋜㋜㋜㋜㋜w','w㋜㋜㋜㋞㋜㋜㋜㋜㋜㋞㋜㋜㋜w','w㋜㋜㋜㋜㋜㋜㋜㋜㋜㋜㋜㋜㋜w','wwwwwwwxwwwwwww'],sign:{'7,1':'아이스방 -5℃'},d:{'7,9':['jjim',16,3]},p:[{x:7,y:4,c:'#38bdf8',h:'#222',w:1,n:'더위 식히는 손님',s:['불가마 다녀와서 여기 오면 천국이에요. 🥶']}]},
sara:{n:'사라봉',o:1,par:'sports',wide:1,bgm:'sports',land:[11,14],m:['㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘','㋘T㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘T㋘','㋘㋘㋘=================㋘㋘㋘','㋘㋘㋘=㋘㋘㋘㋘㋘T㋘㋘㋘㋘T㋘㋘㋘㋘=㋘㋘㋘','㋘㋘㋘=㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘=㋘㋘㋘','㋘㋘㋘=㋘㋘==========㋘㋘㋘=㋘㋘㋘','㋘㋘㋘=㋘㋘=㋘㋘㋘㋘㋘㋘㋘㋘=㋘㋘㋘=㋘㋘㋘','㋘㋘T=㋘㋘=㋘...㋠....㋘㋘㋘=T㋘㋘','㋘㋘㋘=㋘㋘=㋘.㋡...㋡..㋘㋘㋘=㋘㋘㋘','㋘㋘㋘=㋘㋘=㋘..b...T.㋘㋘㋘=㋘㋘㋘','㋘㋘㋘=㋘㋘=㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘=㋘㋘㋘','㋘㋘㋘=㋘㋘==============㋘㋘㋘','㋘㋘㋘=㋘㋘㋘㋘㋘T㋘㋘㋘㋘T㋘㋘㋘㋘㋘㋘㋘㋘','㋘㋘㋘=========㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘','㋘T㋘㋘㋘㋘㋘㋘㋘㋘㋘=㋘㋘㋘㋘㋘㋘㋘㋘㋘T㋘','㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘=㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘㋘'],sign:{'11,7':'사라봉 정상','9,8':'운동기구','4,12':'오르는 길'},d:{'11,15':['sports',14,5]},p:[{x:12,y:9,c:'#65a30d',h:'#d1d5db',w:1,n:'아침 운동 어르신',s:['사라봉 꼭대기에서 몸 풀면 하루가 개운해요. 💪']},{x:6,y:6,c:'#0ea5e9',h:'#222',w:1,n:'오르는 사람',s:['빙글빙글 돌아 올라가요. 힘내요! 🥾']}]},
nongmak:{n:'과수원 농막',par:'orchard',bgm:'indoor',cozy:'#b45309',m:['w'.repeat(W),'wwⓦwwwⓦwwwⓦwwww',FR.replace('fff','fff'),'wßßfff㈂ffþðfffw','wfffffffffffffw','w㈀㈀fff㈃㈃fffff㉵w','wfffffffffffffw','w㈄fffffffffff&w'.replace('&','㋵'),FR,'wwwwwwwxwwwwwww'],sign:{'7,1':'농막'},d:{'7,9':['orchard',2,3]},p:[{x:1,y:3,c:'#475569',h:'#374151',when:()=>{const H=jejuNow().h;return dadStay()&&(H>=21||H<6)},sl:[32,96,'#e2e8f0',1],n:'보성 아버지',s:['(주무시고 계신다. 조용히 나가자.)']},{x:5,y:4,c:'#475569',h:'#374151',stay:1,when:()=>{const H=jejuNow().h;return dadStay()&&(H>=18&&H<21)},n:'보성 아버지',s:['오늘 일 끝내고 쉬는 중이에요. 🍊','귤 철엔 여기서 자는 날이 많아요.']}]},
blackHouse:{n:'검은 하우스',par:'orchard',bgm:'indoor',m:['㋴'.repeat(W),'㋴㋲㋲㋲㋴㋴㋴㋴㋴㋴㋴㋲㋲㋲㋴','㋴㋳㋳㋳㋳㋳㋳㋳㋳㋳㋳㋳㋳㋳㋴','㋴㋵㋵㋵㋳㋳㋳㋳㋳㋳㋳㋵㋵㋵㋴','㋴㋵㋵㋵㋳㋳㌡㌢㌢㋳㋳㋵㋵㋵㋴','㋴㋳㋳㋳㋳㋳㋳㋳㋳㋳㋳㋳㋳㋳㋴','㋴㋵㋵㋳㋳㋲㋲㋳㋳㋳㋳㋵㋵㋳㋴','㋴㋳㋳㋳㋳㋳㋳㋳㋳㋳㋳㋳㋳㋳㋴','㋴㋳㋳㋳㋳㋳㋳㋳㋳㋳㋳㋳㋳㋳㋴','㋴㋴㋴㋴㋴㋴㋴x㋴㋴㋴㋴㋴㋴㋴'],sign:{'2,1':'농기구','11,3':'콘테나'},d:{'7,9':['orchard',6,3]},p:[]},
swim:{n:'수영장',par:'oreumF',wide:1,land:[16,18],bgm:'indoor',m:['wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww','wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww','wⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓw','wⓓⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓓ㋌㋌㋌㋌ⓓw','wⓓⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓓ㋌㋌㋌㋌ⓓw','wⓓⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓓ㋌㋌㋌㋌ⓓw','wⓓⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓓ㋌㋌㋌㋌ⓓw','wⓓⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓓ㋌㋌㋌㋌ⓓw','wⓓⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓓⓓⓓⓓⓓⓓw','wⓓⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓓⓓⓓⓓⓓⓓw','wⓓⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓓⓓⓓⓓⓓⓓw','wⓓⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓓⓓⓓⓓⓓⓓw','wⓓⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓟⓓⓓⓓⓓⓓⓓw','wⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓw','wⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓw','wⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓkkkkkⓓw','wⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓw','wⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓw','wⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓⓓw','wwwwwwwwwwwwwwwwxwwwwwwwwwww㉼w㉼ww'],sign:{'12,2':'성인 풀','28,2':'어린이·초보 풀','28,18':'남 탈의실','30,18':'여 탈의실','28,16':'안내 데스크'},d:{'16,19':['oreumF',10,5],'28,19':['swimLock',7,8],'30,19':['swimLockF',7,8]},p:[
{x:3,y:3,c:'#dc2626',h:'#111827',when:poolOpen,swim:[2,24,0],n:'수영하는 사람',s:['(열심히 수영 중이다. 🏊)']},
{x:3,y:5,c:'#2563eb',h:'#f8fafc',when:poolOpen,swim:[2,24,2.5],n:'수영하는 사람',s:['(열심히 수영 중이다. 🏊)']},
{x:3,y:7,c:'#111827',h:'#fbbf24',when:poolOpen,swim:[2,24,5],n:'수영하는 사람',s:['(열심히 수영 중이다. 🏊)']},
{x:3,y:9,c:'#16a34a',h:'#111827',when:poolOpen,swim:[2,24,8],n:'수영하는 사람',s:['(열심히 수영 중이다. 🏊)']},
{x:3,y:4,c:'#7c3aed',h:'#111827',when:poolBusy,swim:[2,24,11],n:'수영하는 사람',s:['(줄지어 수영 중이다. 🏊)']},
{x:3,y:6,c:'#0ea5e9',h:'#f8fafc',when:poolBusy,swim:[2,24,14],n:'수영하는 사람',s:['(줄지어 수영 중이다. 🏊)']},
{x:3,y:8,c:'#ea580c',h:'#111827',when:poolBusy,swim:[2,24,17],n:'수영하는 사람',s:['(줄지어 수영 중이다. 🏊)']},
{x:3,y:10,c:'#be123c',h:'#111827',when:poolBusy,swim:[2,24,20],n:'수영하는 사람',s:['(줄지어 수영 중이다. 🏊)']},
{x:3,y:3,c:'#0f766e',h:'#fbbf24',when:poolBusy,swim:[2,24,9],n:'수영하는 사람',s:['(줄지어 수영 중이다. 🏊)']},
{x:3,y:7,c:'#475569',h:'#111827',when:poolBusy,swim:[2,24,24],n:'수영하는 사람',s:['(줄지어 수영 중이다. 🏊)']},
{x:3,y:9,c:'#db2777',h:'#f8fafc',when:poolBusy,swim:[2,24,30],n:'수영하는 사람',s:['(줄지어 수영 중이다. 🏊)']},
{x:3,y:11,c:'#475569',h:'#9ca3af',when:poolOpen,swim:[2,24,0],wade:1,n:'물속 걷는 어르신',s:['걷기만 해도 운동이 돼요. 🚶']},
{x:3,y:12,c:'#be123c',h:'#222',when:poolOpen,swim:[2,24,8],wade:1,n:'물속 걷는 어르신',s:['걷기만 해도 운동이 돼요. 🚶']},
{x:3,y:11,c:'#b45309',h:'#d1d5db',when:poolBusy,swim:[2,24,13],wade:1,n:'물속 걷는 어르신',s:['걷기만 해도 운동이 돼요. 🚶']},
{x:3,y:12,c:'#0f766e',h:'#111',when:poolBusy,swim:[2,24,20],wade:1,n:'물속 걷는 어르신',s:['걷기만 해도 운동이 돼요. 🚶']},
{x:28,y:4,c:'#fbbf24',h:'#3f2a1c',when:poolOpen,swim:[27,30,0],wade:1,n:'물놀이하는 아이',s:['여기는 얕아요! 🐤']},
{x:28,y:6,c:'#fbbf24',h:'#3f2a1c',when:poolOpen,swim:[27,30,3],wade:1,n:'물놀이하는 아이',s:['여기는 얕아요! 🐤']},
{x:5,y:14,c:'#1d4ed8',h:'#222',p:'#1d4ed8',lk:{hair:'short',leg:'#f2c9a0'},w:1,when:poolOpen,n:'수영복 입은 사람',s:['샤워하고 나왔어요. 물이 시원해요. 🏊']},
{x:20,y:14,c:'#be123c',h:'#222',p:'#be123c',lk:{hair:'bob',leg:'#f2c9a0'},w:1,when:poolOpen,n:'수영복 입은 사람',s:['샤워하고 나왔어요. 물이 시원해요. 🏊']},
{x:12,y:13,c:'#111827',h:'#222',p:'#111827',lk:{hair:'short',leg:'#f2c9a0'},w:1,when:poolBusy,n:'수영복 입은 사람',s:['샤워하고 나왔어요. 물이 시원해요. 🏊']},
{x:25,y:2,c:'#0f766e',h:'#222',p:'#0f766e',lk:{hair:'bob',leg:'#f2c9a0'},w:1,when:poolBusy,n:'수영복 입은 사람',s:['샤워하고 나왔어요. 물이 시원해요. 🏊']},
{x:8,y:17,c:'#dc2626',h:'#222',p:'#dc2626',lk:{hair:'short',leg:'#f2c9a0'},w:1,when:poolBusy,n:'수영복 입은 사람',s:['샤워하고 나왔어요. 물이 시원해요. 🏊']},
{x:28,y:14,c:'#0ea5e9',h:'#222',stay:1,n:'수영장 안내원',s:()=>[poolMsg()],ch:{'🩲 남성 수영복 받기':()=>{poolPick('m')},'🩱 여성 수영복 받기':()=>{poolPick('f')},'🕘 이용 안내 보기':()=>showPool()}},
{x:25,y:13,c:'#ef4444',h:'#111',stay:1,n:'안전 요원',s:['뛰지 마세요! 물에 들어가기 전엔 준비운동 먼저요.','수영모는 꼭 쓰셔야 해요. 🏊']}]},
swimLock:{n:'남자 탈의실',par:'swim',bgm:'indoor',m:['w'.repeat(W),'w㋍㋍㋍㋍㋍wwww㋍㋍㋍㋍w',FR,'wfㆎffffffffㆎffw'.replace('ㆎ','f'),FR,'w㋍㋍㋍fffffff㋍㋍㋍w',FR,FR,FR,'wwwwwwwxwwwwwww'],sign:{'7,1':'탈의실'},d:{'7,9':['swim',28,18]},p:[]},
swimLockF:{n:'여자 탈의실',par:'swim',bgm:'indoor',m:['w'.repeat(W),'w㋍㋍㋍㋍㋍wwww㋍㋍㋍㋍w',FR,'wfㆎffffffffㆎffw'.replace('ㆎ','f'),FR,'w㋍㋍㋍fffffff㋍㋍㋍w',FR,FR,FR,'wwwwwwwxwwwwwww'],sign:{'7,1':'여자 탈의실'},d:{'7,9':['swim',30,18]},p:[]},

jaldo:{n:'잘도식당',par:'route2',bgm:'indoor',wide:1,land:[7,12],m:['ⓎⓎⓎⓎⓎⓎⓎⓎⓎⓎⓎⓎⓎⓎⓎ','ⒹⒹⓂⒹⓉⒹⒹⓊⓊⒹⒹⓂⒹⒹⒹ','ⒹⓁⓁffffffffⓀⓀfⒹ','ⒹkkkkkkkkkkkkkⒹ','ⒹfffffffffffffⒹ','ⒹfⒸⒸffⒸⒸfffⒸⒸfⒹ','ⒹfㆍㆍffㆍㆍfffㆍㆍfⒹ','ⒹfⒸⒸffⒸⒸfffⒸⒸfⒹ','ⒹfffffffffffffⒹ','ⒹfⒸⒸffⒸⒸfffⒸⒸfⒹ','ⒹfㆍㆍffㆍㆍfffㆍㆍfⒹ','ⒹfⒸⒸffⒸⒸfffⒸⒸfⒹ','ⒹfffffffffffffⒹ','ⒹⒹⒹⒹⒹⒹⒹxⒹⒹⒹⒹⒹⒹⒹ'],d:{'7,13':['route2',9,8]},p:[
{x:7,y:2,stay:1,c:'#f8fafc',h:'#27272a',n:'보성 사촌 매형',s:['어서 오세요! 잘도식당입니다. 🐟','갈치조림 맛있게 끓여 드릴게요.'],ch:{'🍽 주문하기':()=>showCafe(),'🐟 가게 정보·위치':()=>showJaldo()}},
{x:3,y:4,stay:1,c:'#be123c',h:'#1c1917',lh:1,n:'보성 사촌 누나',s:['어서 오세요~ 보성이 사촌 누나예요. 편한 자리에 앉으세요. 😊','갈치조림은 밥 한 공기로 모자랄 수 있어요.'],ch:{'🍽 주문하기':()=>showCafe(),'🐟 가게 정보·위치':()=>showJaldo()}},
{x:2,y:5,c:'#2563eb',h:'#222',sit:1,fd:0,eat:'🐟',n:'가족 손님 아버지',s:['가족들이랑 제주 오면 꼭 여기 와요. 🐟']},{x:3,y:5,c:'#db2777',h:'#3f2a1c',lh:1,sit:1,fd:0,eat:'🍚',n:'가족 손님 어머니',s:['애들이 생선을 잘 먹어서 좋아요.']},{x:2,y:7,c:'#f59e0b',h:'#222',sit:1,fd:1,eat:'🍚',n:'가족 손님 아이',s:['이 밥 진짜 맛있어요!']},{x:3,y:7,c:'#22c55e',h:'#3f2a1c',sit:1,fd:1,eat:'🍳',n:'가족 손님 동생',s:['계란후라이 제가 먹을 거예요!']},
{x:11,y:5,c:'#0ea5e9',h:'#222',sit:1,fd:0,eat:'🐟',n:'식사하는 손님',s:['국물에 밥 비벼 먹는 게 제일이에요. 🍚','제주 오면 갈치조림은 먹고 가야죠.']},{x:12,y:7,c:'#a855f7',h:'#374151',sit:1,fd:1,eat:'🍚',n:'여행 온 손님',s:['공항 가기 전에 들렀어요. 잘 왔네요.']},{x:6,y:9,c:'#64748b',h:'#d1d5db',sit:1,fd:0,eat:'🐟',n:'단골 어르신',s:['여긴 맛이 변하지 않아서 좋아.']}]},

suisan:{n:'노량진 수산시장',par:'noryangjin',bgm:'indoor',m:['w'.repeat(W),'w㉧㉧㉧㉧㉧㉧ㅸ㉧㉧㉧㉧㉧㉧w',FR,'wf㉨㉨㉨㉨fff㉨㉨㉨㉨fw',FR,FR,'wf㉧㉧㉧㉧fff㉨㉨㉨㉨fw',FR,FR,'wwwwwwwxwwwwwww'],sign:{'7,1':'2층 식당'},d:{'7,9':['noryangjin',3,8],'7,1':['suisan2',7,8]},p:[
{x:3,y:4,c:'#f8fafc',h:'#222',stay:1,n:'활어 상인',s:['구경하고 가요! 오늘 광어 좋아요. 🐟','고르면 회 떠 드릴게. 2층 식당에서 드시면 돼요.'],ch:{'🐟 회 떠 달라고 하기':()=>showCafe()}},
{x:11,y:4,c:'#0ea5e9',h:'#444',lh:1,stay:1,n:'대게집 이모',s:['대게 쪄 줄까요? 올라가서 먹으면 돼요. 🦀'],ch:{'🦀 찜 부탁하기':()=>showCafe()}},
{x:3,y:7,c:'#16a34a',h:'#9ca3af',stay:1,n:'조개 상인',s:['조개는 구워도 좋고 탕으로 끓여도 좋아요.'],ch:{'🐚 고르기':()=>showCafe()}},
{x:11,y:7,c:'#475569',h:'#222',w:1,n:'장 보러 온 손님',s:['여기 오면 구경만 해도 재밌어요.']},
{x:7,y:3,c:'#be123c',h:'#3f2a1c',lh:1,w:1,n:'사진 찍는 관광객',s:['수조 앞에서 한 장 찍었어요. 📸']},
{x:7,y:5,c:'#f59e0b',h:'#222',stay:1,when:()=>{const h=jejuNow().h;return h>=1&&h<6},n:'경매사',s:['새벽 경매 시간이에요! 손짓 하나로 값이 정해져요. 🔔']}]},
suisan2:{n:'수산시장 2층 식당',par:'suisan',bgm:'indoor',m:['w'.repeat(W),'wwⓦwwⓦwwwⓦwwⓦww',FR,'wKKfffffffffKKw',FR,'wfㆎㆍㆎfffffㆎㆍㆎfw',FR,'wfㆎㆍㆎfffffㆎㆍㆎfw',FR,'wwwwwwwㅸwwwwwww'],sign:{'7,9':'1층 시장'},d:{'7,9':['suisan',7,2]},p:[
{x:7,y:4,c:'#f8fafc',h:'#3f2a1c',lh:1,stay:1,n:'식당 이모',s:['1층에서 고른 건 여기서 차려 드려요. 자리 앉아요! 🍽'],ch:{'🍽 주문하기':()=>showCafe()}},
{x:2,y:5,c:'#2563eb',h:'#222',sit:1,fd:3,eat:'🍣',n:'회식 온 직장인',s:['퇴근하고 회 한 점이 최고죠.']},
{x:12,y:7,c:'#a855f7',h:'#374151',sit:1,fd:2,eat:'🦀',n:'여행 온 손님',s:['대게 까먹느라 말이 없어져요.']}]},
cupbap:{n:'노량진 컵밥거리',o:1,wide:1,land:[15,12],par:'noryangjin',bgm:'route',m:['ㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱ','ㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣ','ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ','ㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣ','ㅣㅣㅣㆎㆍㆎㅣㅣㅣㆎㆍㆎㅣㅣㅣㆎㆍㆎㅣㅣㅣㆎㆍㆎㅣㅣㅣㅣㅣㅣㅣ','ㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣ','ㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣ','ㅣㅣㅣㆎㆍㆎㅣㅣㅣㆎㆍㆎㅣㅣㅣㆎㆍㆎㅣㅣㅣㆎㆍㆎㅣㅣㅣㅣㅣㅣㅣ','ㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣ','ㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣ','ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅣㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ','ㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣ','ㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㅣㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱ','ㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱ㉥ㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱ'],sign:{"15,0": "컵밥거리", "3,2": "불고기", "10,2": "제육", "17,2": "참치마요", "24,2": "스팸", "3,10": "김치", "10,10": "닭갈비", "20,10": "어묵탕", "27,10": "떡볶이"},d:{'15,13':['noryangjin',28,8]},p:[
{x:3,y:1,c:'#ea580c',h:'#222',stay:1,when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'불고기 컵밥 사장',s:['고기 듬뿍, 밥은 더 달라면 더 줘요! 🍚'],ch:{'🍚 주문하기':()=>showCafe()}},
{x:10,y:1,c:'#dc2626',h:'#222',stay:1,when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'제육 컵밥 이모',s:['매콤한 게 땡기는 날엔 제육이지. 🌶'],ch:{'🍚 주문하기':()=>showCafe()}},
{x:17,y:1,c:'#2563eb',h:'#222',stay:1,when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'참치마요 컵밥 사장',s:['시험 앞둔 날엔 든든하게 먹고 가요.'],ch:{'🍚 주문하기':()=>showCafe()}},
{x:24,y:1,c:'#16a34a',h:'#222',stay:1,when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'스팸 컵밥 사장',s:['스팸은 두 장 넣어 드립니다. 😄'],ch:{'🍚 주문하기':()=>showCafe()}},
{x:3,y:11,c:'#be123c',h:'#222',stay:1,when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'김치 컵밥 이모',s:['김치볶음 냄새 좋지요? 바로 볶아 줄게요.'],ch:{'🍚 주문하기':()=>showCafe()}},
{x:10,y:11,c:'#7c3aed',h:'#222',stay:1,when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'닭갈비 컵밥 사장',s:['오늘 닭갈비 양념 잘 됐어요. 🍗'],ch:{'🍚 주문하기':()=>showCafe()}},
{x:20,y:11,c:'#0ea5e9',h:'#222',stay:1,when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'어묵탕 이모',s:['국물 먼저 한 컵 하고 가요.'],ch:{'🍚 주문하기':()=>showCafe()}},
{x:27,y:11,c:'#f59e0b',h:'#222',stay:1,when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'떡볶이 사장',s:['떡볶이 한 컵 같이 하면 든든해요.'],ch:{'🍚 주문하기':()=>showCafe()}},
{x:3,y:4,c:'#1e3a8a',h:'#222',sit:1,stay:1,fd:3,eat:'🍚',when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'밥 먹는 수험생',s:['10분 만에 먹고 다시 독서실 가야 해요.']},
{x:5,y:4,c:'#0f766e',h:'#222',sit:1,stay:1,fd:2,eat:'🍚',when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'학원 끝난 학생',s:['노량진에 오면 이걸 먹어 봐야죠.']},
{x:9,y:7,c:'#475569',h:'#222',sit:1,stay:1,fd:3,eat:'🍚',when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'수험생',s:['오늘은 제육이에요.']},
{x:11,y:7,c:'#a855f7',h:'#222',sit:1,stay:1,fd:2,eat:'🍚',when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'수험생',s:['여기 앉아서 먹으니 좋네요.']},
{x:15,y:4,c:'#ea580c',h:'#222',sit:1,stay:1,fd:3,eat:'🍚',when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'공시생',s:['한 그릇 뚝딱입니다.']},
{x:21,y:7,c:'#be185d',h:'#222',sit:1,stay:1,fd:3,eat:'🍚',when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'구경 온 사람',s:['가게마다 메뉴가 달라서 고르는 재미가 있어요.']},
{x:23,y:7,c:'#16a34a',h:'#222',sit:1,stay:1,fd:2,eat:'🍚',when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'친구',s:['다음엔 저 가게 가 보자.']},
{x:7,y:3,c:'#475569',h:'#17151c',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'줄 선 손님',s:['메뉴 고민할 시간에 한 문제 더 풀래요… 그래도 고민돼요.']},
{x:13,y:9,c:'#2563eb',h:'#17151c',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'줄 선 손님',s:['메뉴 고민할 시간에 한 문제 더 풀래요… 그래도 고민돼요.']},
{x:19,y:3,c:'#0f766e',h:'#17151c',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'줄 선 손님',s:['메뉴 고민할 시간에 한 문제 더 풀래요… 그래도 고민돼요.']},
{x:25,y:9,c:'#db2777',h:'#17151c',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'줄 선 손님',s:['메뉴 고민할 시간에 한 문제 더 풀래요… 그래도 고민돼요.']},
{x:5,y:9,c:'#ca8a04',h:'#17151c',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=7&&h<23},n:'줄 선 손님',s:['메뉴 고민할 시간에 한 문제 더 풀래요… 그래도 고민돼요.']}]},
sayuk:{n:'사육신역사관',par:'noryangjin',bgm:'indoor',m:['w'.repeat(W),'w㉪w㉪w㉪w㉪w㉪w㉪w㉪w',FR,FR,'wffff㉫㉫㉫㉫㉫ffffw',FR,FR,FR,FR,'wwwwwwwxwwwwwww'],d:{'7,9':['noryangjin',26,6]},panel:{'1,1':['📜 사육신이란',['조선 세조 때 어린 임금 단종을 다시 왕위에 올리려다 목숨을 잃은 여섯 신하예요.','성삼문, 박팽년, 이개, 하위지, 유성원, 유응부를 함께 부르는 이름입니다.']],'3,1':['📜 문종의 부탁',['문종은 어린 아들을 걱정하며 신하들에게 뒷일을 부탁했어요.','이 부탁을 고명이라고 합니다. 여섯 신하가 끝까지 지키려 한 약속이에요.']],'5,1':['📈 복위 시도 연표',['1456년, 단종 복위 계획이 발각되었어요.','이들은 고문을 받고도 뜻을 굽히지 않았고 끝내 처형되었습니다.']],'7,1':['✍ 집현전 학사',['성삼문과 박팽년은 집현전 학사 출신으로 훈민정음 창제에 참여했어요.','한글과 이어지는 인물들이기도 합니다.']],'9,1':['🗡 무신 유응부',['유응부는 여섯 사람 가운데 무신으로 꼽히는 인물이에요.','문신과 무신이 한 뜻으로 움직인 셈입니다.']],'11,1':['📖 복권까지',['오랫동안 역적으로 남았던 이들은 숙종 때부터 정조 때에 걸쳐 복권되었어요.','기록을 남긴 후대 사람들 덕분에 이름이 전해집니다.']],'13,1':['🗺 유적 지도',['단종이 유배된 영월 청령포를 비롯해, 관련 유적이 전국에 흩어져 있어요.','이곳 공원의 의절사에는 여섯 신하의 위패를 모십니다.']],'5,4':['忠 벽',['벽 전체가 충(忠) 글자로 채워져 있다.']],'6,4':['忠 벽',['벽 전체가 충(忠) 글자로 채워져 있다.']],'7,4':['忠 벽',['벽 전체가 충(忠) 글자로 채워져 있다.']],'8,4':['忠 벽',['벽 전체가 충(忠) 글자로 채워져 있다.']],'9,4':['忠 벽',['벽 전체가 충(忠) 글자로 채워져 있다.']]},p:[
{x:3,y:6,c:'#7c2d12',h:'#222',stay:1,n:'역사관 해설사',s:['벽의 안내판 앞에서 A를 눌러 읽어 보세요. 📜','다 보고 나가면 의절사도 들러 보세요.']},
{x:11,y:6,c:'#475569',h:'#9ca3af',w:1,n:'역사 공부하는 어르신',s:['노량진 언덕에 이런 곳이 있는 줄 모르는 사람도 많아요.']},
{x:9,y:3,c:'#0ea5e9',h:'#222',w:1,n:'견학 온 학생',s:['영화 보고 궁금해서 와 봤어요.']}]},

cafe:{n:'바당 무인 카페',par:'route2',wide:1,land:[11,11],bgm:'indoor',m:['wwwwwwwwwwwwwwwwwwwwwww','wwⓦwwⓦwwⓦwwⓦwwⓦwwⓦwwⓦww','wff㌛㌛㌛㌛㌛㌛㌛㌛㌛㌛㌛㌛㌛㌛㌛㌛㌛ffw','wff㌚f㌚f㌚f㌚f㌚f㌚f㌚f㌚f㌚ffw','wfffffffffffffffffffffw','wf㉴㉴ff㉴㉴ffffffffffff㌜fw','wfㆍㆍffㆍㆍfffㆎㆍㆎffㆎㆍㆎfffw','wf㉴㉴ff㉴㉴ffffffffffff㌜fw','wfffffffffffffffffffffw','wffffff㉵fffㆎㆍㆎffㆎㆍㆎf㌜fw','wf㊀㊁㊂㊀fKKfffffffffffffw','wfffffffffffffffffffffw','wwwwwwwwwwwxwwwwwwwwwww'],sign:{'3,10':'무인 주문','11,2':'창가 바','2,5':'소파석','20,5':'빈백'},d:{'11,12':['route2',11,4]},p:[
{x:5,y:3,c:'#60a5fa',h:'#3f2a1c',sit:1,stay:1,cup:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<23},n:'창가 손님',s:['바다 보면서 멍 때리는 중이에요. 🌊']},
{x:9,y:3,c:'#f43f5e',h:'#222',sit:1,stay:1,cup:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<23},n:'창가 손님',s:['여기 창가 자리가 제일 좋아요.']},
{x:15,y:3,c:'#14b8a6',h:'#222',sit:1,stay:1,cup:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<23},n:'혼자 온 손님',s:['노트북 하기 딱 좋아요. 💻']},
{x:2,y:5,c:'#a855f7',h:'#3f2a1c',sit:1,stay:1,cup:1,fd:0,when:()=>{const h=jejuNow().h;return h>=8&&h<23},n:'소파 손님',s:['소파가 푹신해서 일어나기 싫어요.']},
{x:3,y:7,c:'#f59e0b',h:'#222',sit:1,stay:1,cup:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<23},n:'소파 손님',s:['수다 떨다 보면 시간이 금방 가요.']},
{x:6,y:5,c:'#be185d',h:'#222',sit:1,stay:1,cup:1,fd:0,when:()=>{const h=jejuNow().h;return h>=8&&h<23},n:'여행 온 손님',s:['자판기 커피인데 생각보다 맛있어요. ☕']},
{x:11,y:6,c:'#16a34a',h:'#222',sit:1,stay:1,cup:1,fd:3,when:()=>{const h=jejuNow().h;return h>=8&&h<23},n:'커피 든 손님',s:['기계로 주문하니까 눈치 안 보고 오래 있어요.']},
{x:13,y:6,c:'#0ea5e9',h:'#6b3e26',sit:1,stay:1,cup:1,fd:2,when:()=>{const h=jejuNow().h;return h>=8&&h<23},n:'커피 든 손님',s:['앉아서 바다 보는 게 오늘 일정이에요. 🌊']},
{x:16,y:9,c:'#ea580c',h:'#3f2a1c',sit:1,stay:1,cup:1,fd:3,when:()=>{const h=jejuNow().h;return h>=8&&h<23},n:'책 읽는 손님',s:['여기 오면 책이 잘 읽혀요. 📖']},
{x:20,y:5,c:'#7c3aed',h:'#222',sit:1,stay:1,cup:1,fd:0,when:()=>{const h=jejuNow().h;return h>=8&&h<23},n:'빈백 손님',s:['빈백에 누우면 못 일어나요. 😌']},
{x:20,y:9,c:'#10b981',h:'#3f2a1c',sit:1,stay:1,cup:1,fd:0,when:()=>{const h=jejuNow().h;return h>=8&&h<23},n:'빈백 손님',s:['잠깐만 쉬었다 가려고요.']},
{x:9,y:3,c:'#475569',h:'#222',sit:1,stay:1,cup:1,fd:1,when:()=>{const h=jejuNow().h;return h>=23||h<8},n:'밤샘 손님',s:['잠이 안 와서 나왔어요. 🌙']},
{x:12,y:9,c:'#334155',h:'#222',sit:1,stay:1,cup:1,fd:3,when:()=>{const h=jejuNow().h;return h>=23||h<8},n:'밤샘 손님',s:['24시간이라 이 시간에 올 데가 여기뿐이에요.']},
{x:2,y:7,c:'#64748b',h:'#3f2a1c',sit:1,stay:1,cup:1,fd:1,when:()=>{const h=jejuNow().h;return h>=23||h<8},n:'새벽 손님',s:['첫 비행기 기다리는 중이에요. ✈']}]},

pcRoom:{n:'PC방',par:'arcade',wide:1,land:[20,16],bgm:'town',m:['wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww','wwwww㌰wwwwwww㌰wwwww㌰wwwwwww㌰wwwww','wfππππππfπππππfπππππ㌱wf㌨㌨f㌨㌨f㌨㌨fw','wfffffffffffffffffff㌱wf㌫㌫f㌫㌫f㌫㌫fw','wfffffffffffffffffff㌱wf㌨㌨f㌨㌨f㌨㌨fw','wfππππππfπππππfπππππ㌱wf㌫㌫f㌫㌫f㌫㌫fw','wfffffffffffffffffff㌱wf㌨㌨f㌨㌨f㌨㌨fw','wfffffffffffffffffff㌱wf㌫㌫f㌫㌫f㌫㌫fw','wfππππππfπππππfπππππ㌱wffffffffffw','wfffffffffffffffffffffffffffffffw','wffffffffffffffffffffw㌪㌪f㌪㌪㌪f㌪㌪ww','w㌭㌮㌯㌯㌯㌭㌭fπππππfπππππfw㌪πππ㌪πππ㌪ww','wffffffffffffffffffffw㌪fff㌪fff㌪ww','wffffff㌪㌪㌪f㌪㌪㌪㌪㌪f㌪㌪㌪fw㌪㌪㌪㌪㌪㌪㌪㌪㌪ww','wkkkkkk㌪πππππ㌪πππππ㌪f㌪fffffffffww','wffffff㌪fffff㌪fffff㌪f㌲ff㌩fff㌩ffww','w㌬㌬㌬㌬㌬㌬㌪㌪㌪㌪㌪㌪㌪㌪㌪㌪㌪㌪㌪f㌪ffff㉴㉴fffww','wwwwwwwwwwwwwwwwwwwwxwwwwwwwwwwww'],sign:{'26,1':'커플석','24,10':'3인룸','28,10':'3인룸','10,13':'5인룸','16,13':'5인룸','21,15':'흡연실','4,14':'카운터','1,11':'컵라면','2,11':'결제','4,11':'시간 충전','20,2':'게임 CD'},d:{'20,17':['arcade',21,10]},p:[
{x:4,y:15,c:'#f43f5e',h:'#1b1b26',stay:1,n:'PC방 알바',s:['오른쪽 끝으로 가면 커플석, 3인룸, 5인룸도 있어요. 🖥','주인장은 롤이랑 스타를 좋아한대요. 자리 비었어요.'],ch:{'🖥 컴퓨터 쓰기':()=>showPc()}},
{x:3,y:3,c:'#475569',h:'#111',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=12||h<3},n:'PC방 손님',s:['한 판만 더 하고 갈게요.']},
{x:9,y:3,c:'#2563eb',h:'#222',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=12||h<3},n:'PC방 손님',s:['오늘은 이기는 날이에요.']},
{x:16,y:3,c:'#16a34a',h:'#3f2a1c',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=12||h<3},n:'PC방 손님',s:['라면 언제 나와요?']},
{x:5,y:6,c:'#ea580c',h:'#222',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=12||h<3},n:'PC방 손님',s:['팀 게임은 역시 말이 잘 통해야 해요.']},
{x:11,y:6,c:'#7c3aed',h:'#222',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=12||h<3},n:'PC방 손님',s:['오늘 밤새기로 했어요.']},
{x:17,y:9,c:'#0ea5e9',h:'#6b3e26',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=12||h<3},n:'PC방 손님',s:['자리 좋네요.']},
{x:23,y:3,c:'#be185d',h:'#3f2a1c',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=12||h<3},n:'커플석 손님',s:['둘이 같이 하니까 더 재밌어요. 🎮']},
{x:24,y:3,c:'#2563eb',h:'#222',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=12||h<3},n:'커플석 손님',s:['지금 한창 중요할 때예요!']},
{x:29,y:5,c:'#db2777',h:'#222',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=12||h<3},n:'커플석 손님',s:['여기 소파가 편해요.']},
{x:30,y:5,c:'#0f766e',h:'#3f2a1c',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=12||h<3},n:'커플석 손님',s:['둘이 오면 여기가 딱이에요.']},
{x:26,y:7,c:'#f97316',h:'#222',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=12||h<3},n:'커플석 손님',s:['한 판만 더 하자.']},
{x:27,y:7,c:'#a855f7',h:'#3f2a1c',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=12||h<3},n:'커플석 손님',s:['아까 그 판은 네 탓이야. 😆']}]},
academy:{n:'공무원학원',par:'noryangjin',wide:1,land:[11,12],bgm:'knowledge',m:['wwwwwwwwwwwwwwwwwwwwwww','www㉷㉷㉷㉷㉷㉷wwwww㉷㉷㉷㉷㉷㉷www','wffffffffffwffffffffffw','wffffffffffwffffffffffw','wf㉶㉶f㉶㉶f㉶㉶fwf㉶㉶f㉶㉶f㉶㉶fw','wffffffffffwffffffffffw','wf㉶㉶f㉶㉶f㉶㉶fwf㉶㉶f㉶㉶f㉶㉶fw','wffffffffffwffffffffffw','wfㆎㆎffㆎfㆎㆎfwfㆎㆎfㆎffㆎㆎfw','wwwwwfwwwwwwwwwwwfwwwww','wfffffffffffffffffff㉵fw','wffkkkffffffffffff㉴㉴ffw','wfffffffffffffffffffffw','wwwwwwwwwwwxwwwwwwwwwww'],sign:{'5,1':'한국사','16,1':'행정법','2,9':'안내'},d:{'11,13':['noryangjin',15,13]},p:[
{x:5,y:2,c:'#1e3a8a',h:'#222',stay:1,teach:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'한국사 강사',s:['자, 여기 밑줄 치세요. 시험에 꼭 나옵니다!','연도는 외우지 말고 흐름으로 잡으세요.']},
{x:16,y:2,c:'#7c2d12',h:'#3f2a1c',stay:1,teach:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'행정법 강사',s:['판례는 결론만 보지 마세요. 이유까지 보세요.','오늘 진도 여기까지 끝내고 갑니다.']},
{x:4,y:10,c:'#475569',h:'#222',stay:1,n:'학원 안내 직원',s:['왼쪽은 한국사, 오른쪽은 행정법 강의실이에요.','뒤쪽 빈 의자에 앉아서 들어도 돼요.']},
{x:2,y:5,c:'#2563eb',h:'#222',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['(필기하느라 바쁘다. ✏)']},
{x:3,y:5,c:'#16a34a',h:'#111',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['(형광펜으로 줄을 긋고 있다.)']},
{x:5,y:5,c:'#ea580c',h:'#3f2a1c',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['올해는 꼭 합격하고 싶어요.']},
{x:6,y:5,c:'#7c3aed',h:'#6b3e26',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['졸리면 안 되는데…']},
{x:8,y:5,c:'#0ea5e9',h:'#222',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['쉬는 시간에 컵밥 먹으러 가요.']},
{x:9,y:5,c:'#be123c',h:'#111',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['(필기하느라 바쁘다. ✏)']},
{x:2,y:7,c:'#475569',h:'#3f2a1c',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['(형광펜으로 줄을 긋고 있다.)']},
{x:3,y:7,c:'#0f766e',h:'#6b3e26',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['올해는 꼭 합격하고 싶어요.']},
{x:5,y:7,c:'#2563eb',h:'#222',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['졸리면 안 되는데…']},
{x:6,y:7,c:'#16a34a',h:'#111',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['쉬는 시간에 컵밥 먹으러 가요.']},
{x:8,y:7,c:'#ea580c',h:'#3f2a1c',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['(필기하느라 바쁘다. ✏)']},
{x:9,y:7,c:'#7c3aed',h:'#6b3e26',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['(형광펜으로 줄을 긋고 있다.)']},
{x:13,y:5,c:'#0ea5e9',h:'#222',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['올해는 꼭 합격하고 싶어요.']},
{x:14,y:5,c:'#be123c',h:'#111',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['졸리면 안 되는데…']},
{x:16,y:5,c:'#475569',h:'#3f2a1c',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['쉬는 시간에 컵밥 먹으러 가요.']},
{x:17,y:5,c:'#0f766e',h:'#6b3e26',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['(필기하느라 바쁘다. ✏)']},
{x:19,y:5,c:'#2563eb',h:'#222',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['(형광펜으로 줄을 긋고 있다.)']},
{x:20,y:5,c:'#16a34a',h:'#111',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['올해는 꼭 합격하고 싶어요.']},
{x:13,y:7,c:'#ea580c',h:'#3f2a1c',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['졸리면 안 되는데…']},
{x:14,y:7,c:'#7c3aed',h:'#6b3e26',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['쉬는 시간에 컵밥 먹으러 가요.']},
{x:16,y:7,c:'#0ea5e9',h:'#222',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['(필기하느라 바쁘다. ✏)']},
{x:17,y:7,c:'#be123c',h:'#111',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['(형광펜으로 줄을 긋고 있다.)']},
{x:19,y:7,c:'#475569',h:'#3f2a1c',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['올해는 꼭 합격하고 싶어요.']},
{x:20,y:7,c:'#0f766e',h:'#6b3e26',sit:1,stay:1,fd:1,when:()=>{const h=jejuNow().h;return h>=8&&h<22},n:'수험생',s:['졸리면 안 되는데…']}]},
yongsanSt:{n:'용산역',par:'yongsan',wide:1,land:[22,21],bgm:'indoor',m:['wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww','www㌶w㌶w㌶wwww㌶w㌶w㌶wwwww㎄㎄㎄㎄㎄㎄㎄wwwwwㅸwwwww㎃wwww','w㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㌪fffffffff㌪㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁w','w㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㌪fffffffff㌪㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁w','w㎀㎀㌳㎀㌳㎀㌳㎀㌳㎀㎀kkkkkkk㎀㌪fffffffff㌪㎁㎁㌳㎁㌳㎁㎁㌳㎁㌳㎁㎁㎁w','w㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㌪fffffffff㌪㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁w','w㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㌪fffffffff㌪㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁w','w㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀fffffffffff㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁w','w㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀㎀fffffffffff㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁㎁w','wffff㎅ffffffff㎅ffffffff㎅ffffffff㎅fffffffffffw','wfffffffffffffffffffffffffffffffffffffffffffw','wfff㉴㉴㉴㉴fffff㉴㉴㉴㉴fffff㉴㉴㉴㉴fffff㉴㉴㉴㉴fffffffff㌷','wfffffffffffffffffffffffffffffffffffffffffff㌷','wfff㉴㉴㉴㉴fffff㉴㉴㉴㉴fffff㉴㉴㉴㉴fffff㉴㉴㉴㉴fffffffff㌷','wfffffffffffffffffffffffffffffffffffffffffffw','wfff㉴㉴㉴㉴fffff㉴㉴㉴㉴fffff㉴㉴㉴㉴fffff㉴㉴㉴㉴fffffffffw','wfffffffffffffffffffffffffffffffffffffffffffw','wfffffffffffffffffffffffffffffffffffffffffffw','wf㌸㌸㌸㌸㌸f㌸㌸㌸㌸㌸ffffffffffffffffffff㌸㌸㌸㌸㌸f㌸㌸㌸㌸fw','wfffffffffffffffffffffffffffffffffffffffffffw','wfkkkkkfkkkkkffffffffffffffffffffkkkkkfkkkkfw','wfffffffffffffffffffffffffffffffffffffffffffw','wfㆎㆍㆎfffㆎㆍㆎffffffffffffffffffffffㆎㆍㆎfffㆎㆍㆎffw','wwwwwwwwwwwwwwwwwwwwwwxwwwwwwwwwwwwwwwwwwwwww'],sign:{'5,1':'KTX 타는 곳','14,1':'무궁화호 타는 곳','34,1':'1호선','40,1':'경의중앙선','10,7':'🚄 기차 타는 곳','37,7':'🚇 지하철 타는 곳','6,4':'승차권 키오스크','15,4':'매표소','34,4':'교통카드 충전','4,18':'국밥·덮밥','10,18':'분식','35,18':'카페','40,18':'편의점','44,12':'아이파크몰 연결','5,9':'TV','14,9':'TV','23,9':'TV','32,9':'TV'},d:{'22,23':['yongsan',9,3],'34,1':['cc_yongsan',7,8]},bd:{'44,11':['ipark',15,12],'44,12':['ipark',15,12],'44,13':['ipark',15,12]},p:[
{x:15,y:3,c:'#1e3a8a',h:'#222',stay:1,n:'매표 직원',s:['KTX와 무궁화호는 아직 개통 준비 중이에요. 🚧','지하철은 오른쪽 구역으로 가시면 돼요.']},
{x:4,y:19,c:'#ea580c',h:'#222',stay:1,n:'식당가 직원',s:['지하철 타기 전에 한 끼 든든하게 드세요.'],ch:{'🍽 주문하기':()=>showCafe()}},
{x:10,y:19,c:'#dc2626',h:'#3f2a1c',stay:1,n:'분식집 직원',s:['라면이랑 핫도그 금방 나와요.'],ch:{'🍽 주문하기':()=>showCafe()}},
{x:35,y:19,c:'#0f766e',h:'#222',stay:1,n:'카페 직원',s:['커피 한잔 하고 가세요. ☕'],ch:{'🍽 주문하기':()=>showCafe()}},
{x:40,y:19,c:'#16a34a',h:'#3f2a1c',stay:1,n:'편의점 직원',s:['음료랑 간식 있어요.'],ch:{'🍽 주문하기':()=>showCafe()}},
{x:2,y:22,c:'#7c3aed',h:'#222',sit:1,stay:1,fd:1,when:()=>{const q=jejuNow().h;return q>=7&&q<22},n:'밥 먹는 손님',s:['역에서 먹는 국밥이 은근히 맛있어요.']},
{x:10,y:22,c:'#0ea5e9',h:'#3f2a1c',sit:1,stay:1,fd:3,when:()=>{const q=jejuNow().h;return q>=10&&q<22},n:'분식 먹는 손님',s:['라면 먹고 쇼핑하러 가요.']},
{x:33,y:22,c:'#ec4899',h:'#6b3e26',sit:1,stay:1,cup:1,fd:3,when:()=>{const q=jejuNow().h;return q>=7&&q<22},n:'커피 마시는 손님',s:['지하철 오기 전까지 잠깐 앉아 있어요.']},
{x:6,y:13,c:'#475569',h:'#d1d5db',sit:1,stay:1,fd:1,when:()=>{const q=jejuNow().h;return q>=6&&q<23},n:'TV 보는 어르신',s:['뉴스 틀어 놨네. 📺']},
{x:24,y:11,c:'#f59e0b',h:'#222',sit:1,stay:1,fd:1,when:()=>{const q=jejuNow().h;return q>=6&&q<23},n:'TV 보는 손님',s:['대기 시간에 TV 보기 딱이에요.']},
{x:37,y:6,c:'#16a34a',h:'#222',w:1,stay:1,n:'지하철 이용객',s:['1호선 곧 오나 봐요. 🚇']},
{x:9,y:6,c:'#2563eb',h:'#3f2a1c',w:1,stay:1,n:'기차 구경하는 손님',s:['KTX 개통하면 제일 먼저 타 보려고요. 🚄']}]},
ipark:{n:'용산 아이파크몰',par:'yongsanSt',wide:1,land:[15,12],bgm:'town',m:['wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww','wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww','wf㌸㌸㌸㌸f㌸㌸㌸㌸㌸f㌸㌸f㌸㌸f㌸㌸㌸㌸㌸f㌸㌸㌸㌸fw','wfffffffffffffffffffffffffffffw','wfffffffffffffffffffffffffffffw','wfffffffffffffffffffffffffffffw','wf㌸㌸㌸㌸f㌸㌸㌸㌸㌸f㌸㌸f㌸㌸f㌸㌸㌸㌸㌸f㌸㌸㌸㌸fw','wfffffffffffffffffffffffffffffw','wfffffffffffffffffffffffffffffw','wfffffffffffffffffffffffffffffw','wf㌸㌸㌸㌸f㌸㌸㌸㌸㌸f㌸㌸f㌸㌸f㌸㌸㌸㌸㌸f㌸㌸㌸㌸fw','wfffffffffffffffffffffffffffffw','wfffffffffffffffffffffffffffffw','wwwwwwwwwwwwwwwxwwwwwwwwwwwwwww'],sign:{'15,1':'아이파크몰'},d:{'15,13':['yongsanSt',43,12]},p:[
{x:6,y:4,c:'#2563eb',h:'#222',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['용산역이랑 바로 이어져서 편해요. 🛍']},
{x:12,y:3,c:'#ec4899',h:'#3f2a1c',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['영화 보고 밥 먹으러 왔어요.']},
{x:20,y:4,c:'#16a34a',h:'#6b3e26',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['전자제품 구경하러 왔어요.']},
{x:26,y:8,c:'#f59e0b',h:'#222',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['용산역이랑 바로 이어져서 편해요. 🛍']},
{x:3,y:8,c:'#7c3aed',h:'#3f2a1c',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['영화 보고 밥 먹으러 왔어요.']},
{x:10,y:8,c:'#0ea5e9',h:'#6b3e26',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['전자제품 구경하러 왔어요.']},
{x:17,y:8,c:'#2563eb',h:'#222',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['용산역이랑 바로 이어져서 편해요. 🛍']},
{x:23,y:12,c:'#ec4899',h:'#3f2a1c',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['영화 보고 밥 먹으러 왔어요.']},
{x:7,y:12,c:'#16a34a',h:'#6b3e26',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['전자제품 구경하러 왔어요.']},
{x:14,y:12,c:'#f59e0b',h:'#222',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['용산역이랑 바로 이어져서 편해요. 🛍']},
{x:2,y:4,c:'#7c3aed',h:'#3f2a1c',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['영화 보고 밥 먹으러 왔어요.']},
{x:28,y:4,c:'#0ea5e9',h:'#6b3e26',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['전자제품 구경하러 왔어요.']}]},
timeSq:{n:'영등포 타임스퀘어',par:'yeongdeungpo',wide:1,land:[15,12],bgm:'town',m:['wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww','wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww','wf㌸㌸㌸㌸f㌸㌸㌸㌸㌸f㌸㌸f㌸㌸f㌸㌸㌸㌸㌸f㌸㌸㌸㌸fw','wfffffffffffffffffffffffffffffw','wfffffffffffffffffffffffffffffw','wfffffffffffffffffffffffffffffw','wf㌸㌸㌸㌸f㌸㌸㌸㌸㌸f㌸㌸f㌸㌸f㌸㌸㌸㌸㌸f㌸㌸㌸㌸fw','wfffffffffffffffffffffffffffffw','wfffffffffffffffffffffffffffffw','wfffffffffffffffffffffffffffffw','wf㌸㌸㌸㌸f㌸㌸㌸㌸㌸f㌸㌸f㌸㌸f㌸㌸㌸㌸㌸f㌸㌸㌸㌸fw','wfffffffffffffffffffffffffffffw','wfffffffffffffffffffffffffffffw','wwwwwwwwwwwwwwwxwwwwwwwwwwwwwww'],sign:{'15,1':'타임스퀘어'},d:{'15,13':['yeongdeungpo',1,3]},p:[
{x:6,y:4,c:'#2563eb',h:'#222',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['여기 오면 하루가 금방 가요. 🛍']},
{x:12,y:3,c:'#ec4899',h:'#3f2a1c',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['서점 들렀다 밥 먹으러 가요.']},
{x:20,y:4,c:'#16a34a',h:'#6b3e26',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['날 궂을 땐 여기가 최고예요.']},
{x:26,y:8,c:'#f59e0b',h:'#222',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['여기 오면 하루가 금방 가요. 🛍']},
{x:3,y:8,c:'#7c3aed',h:'#3f2a1c',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['서점 들렀다 밥 먹으러 가요.']},
{x:10,y:8,c:'#0ea5e9',h:'#6b3e26',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['날 궂을 땐 여기가 최고예요.']},
{x:17,y:8,c:'#2563eb',h:'#222',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['여기 오면 하루가 금방 가요. 🛍']},
{x:23,y:12,c:'#ec4899',h:'#3f2a1c',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['서점 들렀다 밥 먹으러 가요.']},
{x:7,y:12,c:'#16a34a',h:'#6b3e26',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['날 궂을 땐 여기가 최고예요.']},
{x:14,y:12,c:'#f59e0b',h:'#222',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['여기 오면 하루가 금방 가요. 🛍']},
{x:2,y:4,c:'#7c3aed',h:'#3f2a1c',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['서점 들렀다 밥 먹으러 가요.']},
{x:28,y:4,c:'#0ea5e9',h:'#6b3e26',w:1,stay:1,when:()=>{const h=jejuNow().h;return h>=10&&h<22},n:'쇼핑객',s:['날 궂을 땐 여기가 최고예요.']}]},
hangang:{n:'한강버스',par:'yeouinaru',wide:1,land:[11,9],bgm:'beach',m:['wwwwwwwwwwwwwwwwwwwwwww','w㌹㌹㌹㌹㌹㌹㌹㌹㌹㌹㌹㌹㌹㌹㌹㌹㌹㌹㌹㌹㌹w','wfffffffffffffffffffffw','wfㆎㆎffㆎㆎfffㆎㆎffㆎㆎffㆎㆎfw','wfffffffffffffffffffffw','wfㆎㆎffㆎㆎfffㆎㆎffㆎㆎffㆎㆎfw','wfffffffffffffffffffffw','wfㆎㆎffㆎㆎfffㆎㆎffㆎㆎffㆎㆎfw','wfffffffffffffffffffffw','wfffffffffffffffffffffw','wwwwwwwwwwwxwwwwwwwwwww'],sign:{'11,1':'한강버스'},d:{'11,10':['yeouinaru',12,4]},p:[
{x:10,y:2,c:'#0f766e',h:'#222',stay:1,n:'한강버스 승무원',s:['한강버스에 오신 걸 환영합니다. 🚢','자리에 앉아 창밖을 구경하세요.']},
{x:3,y:3,c:'#2563eb',h:'#222',sit:1,stay:1,fd:1,n:'승객',s:['출근길에 배 타니까 기분이 좋아요.']},
{x:7,y:5,c:'#ec4899',h:'#3f2a1c',sit:1,stay:1,fd:1,n:'승객',s:['여기서 보는 한강이 제일 예뻐요. 🌊']},
{x:16,y:3,c:'#16a34a',h:'#222',sit:1,stay:1,fd:1,n:'승객',s:['다리 밑으로 지나갈 때 재밌어요.']},
{x:12,y:7,c:'#f59e0b',h:'#6b3e26',sit:1,stay:1,fd:1,n:'여행객',s:['배로 서울 구경하는 건 처음이에요.']}]},
hamdeok:{n:'함덕서우봉해변',o:1,wide:1,land:[6,10],bgm:'beach',m:['T=~~~~~~~~~~~~~~~~~TTTT','T=~~~~~~~~~~~~~~~~~㋘㋘㋘㋘','T=ss㌺㌺㌺㌺㌺㌺㌺㌺㌺㌺㌺㌺㌺㌺㌺㋘㋘㋘㋘','T=ssGGG㌺㌺㌺㌺㌺㌺㌺㌺%%㌺㌺㋘㋘㋘㋘','T=ssHDHsssssss%%㌺㌺㌺㋘㋘㋘㋘','T=sssssssssssssssss㋘㋘㋘㋘','T=s?s?s?s?s?ssss...=㋘㋘㋘','T=ss;sssssss;sss...=㋘㋘㋘','T=s㌾s㌾s㌾s㌾s㌾s㌾ss...㋘㋘㋘㋘','T=.㍀.㍀..㌿.㌿..㍀.㍀...㋘㋘㋘㋘','T=.㍀..........㍀....㋘㋘㋘㋘','===================㋘㋘㋘㋘','..ㅈㅈ..ㅈㅈ..ㅈㅈ..ㅈㅈ...㋘㋘㋘㋘','TTTTTTTTTTTTTTTTTTTTTTT'],sign:{'8,4':'함덕서우봉해변','19,6':'서우봉 오르기','17,8':'잔디공원','5,3':'카페 함덕','9,9':'해변 조형물','6,8':'해변 상점','2,12':'바다 카페','6,12':'아이스크림','10,12':'고기국수','14,12':'해산물','1,0':'해안 산책로'},d:{'19,6':['seoubong',11,12],'5,4':['hdDel',7,8]},e:{u:['sports',11,13],l:['cityhall',22,5]},p:[
{x:6,y:7,c:'#ec4899',h:'#3f2a1c',w:1,stay:1,n:'해수욕 온 여행객',s:['물빛이 진짜 에메랄드색이에요. 🌊','서우봉까지 산책하면 더 예뻐요.']},
{x:10,y:7,c:'#2563eb',h:'#222',w:1,stay:1,n:'모래찜 하는 사람',s:['모래가 고와서 맨발이 좋아요.']},
{x:17,y:7,c:'#f59e0b',h:'#6b3e26',w:1,stay:1,n:'잔디공원 나들이객',s:['노을 볼 때까지 있으려고요. 공연도 본대요. 🌇']},
{x:8,y:5,c:'#16a34a',h:'#222',w:1,stay:1,n:'서핑 초보',s:['파도 오면 바로 갑니다! 🏄']},
{x:12,y:10,c:'#7c3aed',h:'#3f2a1c',w:1,stay:1,n:'카페 찾는 사람',s:['길 건너 카페 창가에서 바다가 보여요. ☕']},
{x:8,y:3,c:'#0ea5e9',h:'#222',swim:[5,13,1],n:'물놀이 하는 사람',s:['(물놀이 중이다. 🌊)']}]},
cityhall:{n:'제주시청',o:1,wide:1,land:[7,5],bgm:'route',m:['TTTTTTT=TTTTTTT㍂TTTTTTT','T......=..㍁㍁㍁㍁㍁㍂㍁㍁㍁㍁㍁.T','T.GGG..=..㍁㍁㍁㍁㍁㍂㍁㍁㍁㍁㍁.T','T.HDH..=.㉾㍁㍁㍁㍁㍁D㍁㍁㍁㍁㍁.T','T.....㌴=......%.%.....T','T......================','T.F....=.F..F.㌋㌌㌌㌋㌌㌋㌌㌋T','T.b....=.b.㍃.F㌋㌋㌋㌋㌋㌋㌋㌋T','T..F...=.F.F.F㌋㌌㌋㌌㌋㌌㌋㌌T','TTTTTTT=TTTTTTTTTTTTTTT'],board:{'9,3':'cityhallIn'},sign:{'15,1':'제주시청','3,3':'시외버스터미널','6,4':'시외버스','11,6':'시청 공원','18,6':'주차장'},d:{'15,3':['cityhallIn',11,12],'3,3':['busTerm',7,8]},e:{u:['samgeori',7,9],d:['town',7,0],r:['hamdeok',0,11]},p:[
{x:4,y:4,c:'#334155',h:'#222',w:1,stay:1,n:'버스 기다리는 시민',s:['시외버스 타고 서귀포 가려고요. 🚌']},
{x:10,y:7,c:'#be185d',h:'#3f2a1c',w:1,stay:1,n:'산책하는 어르신',s:['오른쪽 길로 쭉 가면 함덕 바다가 나와요. 🌊']}]},
cityhallIn:{n:'제주시청 민원실',par:'cityhall',wide:1,land:[11,12],bgm:'indoor',m:['wwwwwwwwwwwwwwwwwwwwwww','wwwwww㌻wwww㌼wwww㌻wwwwww','wfffffffffffffffffffffw','wffkkkkkkkkkkkkkkkkkffw','wfffffffffffffffffffffw','wfffffffffffffffffffffw','wf㋹㋹fffffffffffffff㋹㋹fw','wfffffffffffffffffffffw','wfff㉴㉴㉴㉴㉴㉴fff㉴㉴㉴㉴㉴㉴fffw','wfffffffffffffffffffffw','wfff㉴㉴㉴㉴㉴㉴fff㉴㉴㉴㉴㉴㉴fffw','wfffffffffffffffffffffw','wfffffffkkffffffffffffw','wwwwwwwwwwwxwwwwwwwwwww'],sign:{'3,1':'민원 창구','19,1':'민원 창구','2,6':'번호표','20,6':'번호표','9,12':'청원경찰'},d:{'11,13':['cityhall',15,4]},p:[
{x:4,y:2,c:'#1e3a8a',h:'#222',stay:1,when:()=>!shopClosed('cityhallIn'),n:'가족관계·등본 담당',s:['등본, 가족관계증명서는 여기서 도와드려요.']},
{x:6,y:2,c:'#0f766e',h:'#3f2a1c',stay:1,when:()=>!shopClosed('cityhallIn'),n:'여권 담당',s:['여권은 사진 규격 확인부터 할게요.']},
{x:8,y:2,c:'#7c2d12',h:'#222',stay:1,when:()=>!shopClosed('cityhallIn'),n:'세무 담당',s:['지방세 납부 확인해 드릴게요.']},
{x:10,y:2,c:'#475569',h:'#3f2a1c',stay:1,when:()=>!shopClosed('cityhallIn'),n:'복지 담당',s:['복지 상담은 신분증을 준비해 주세요.']},
{x:12,y:2,c:'#1e3a8a',h:'#222',stay:1,when:()=>!shopClosed('cityhallIn'),n:'건축·주택 담당',s:['건축 민원은 서류가 조금 많아요.']},
{x:14,y:2,c:'#0f766e',h:'#3f2a1c',stay:1,when:()=>!shopClosed('cityhallIn'),n:'환경·청소 담당',s:['대형폐기물 신고 도와드립니다.']},
{x:16,y:2,c:'#7c2d12',h:'#222',stay:1,when:()=>!shopClosed('cityhallIn'),n:'교통 담당',s:['주정차 민원은 이쪽이에요.']},
{x:18,y:2,c:'#475569',h:'#3f2a1c',stay:1,when:()=>!shopClosed('cityhallIn'),n:'일반 민원 담당',s:['번호표 보시고 순서대로 와 주세요. 🎫']},
{x:9,y:11,c:'#1f2937',h:'#111',stay:1,n:'청원경찰',s:['안녕하세요. 필요한 창구를 안내해 드릴게요. 👮','번호표는 양쪽 기계에서 뽑으세요.']},
{x:5,y:7,c:'#475569',h:'#222',w:1,stay:1,when:()=>!shopClosed('cityhallIn'),n:'민원인',s:['번호가 언제 불리려나…']},
{x:14,y:7,c:'#ec4899',h:'#222',w:1,stay:1,when:()=>!shopClosed('cityhallIn'),n:'민원인',s:['등본 떼러 왔어요.']},
{x:8,y:9,c:'#16a34a',h:'#222',w:1,stay:1,when:()=>!shopClosed('cityhallIn'),n:'민원인',s:['여권 만들러 왔어요.']},
{x:16,y:9,c:'#ca8a04',h:'#222',w:1,stay:1,when:()=>!shopClosed('cityhallIn'),n:'민원인',s:['오늘 대기가 길어요.']},
{x:6,y:11,c:'#7c3aed',h:'#222',w:1,stay:1,when:()=>!shopClosed('cityhallIn'),n:'민원인',s:['TV 보면서 기다려요.']},
{x:18,y:11,c:'#0ea5e9',h:'#222',w:1,stay:1,when:()=>!shopClosed('cityhallIn'),n:'민원인',s:['전광판 번호를 봐야지.']}]},
busTerm:{n:'제주 시외버스터미널',par:'cityhall',bgm:'indoor',m:['w'.repeat(W),'wwⓦwwⓦwwwⓦwwⓦww',FR,'wkkkkkfffkkkkkw',FR,'wf㉴㉴ff㉴㉴ff㉴㉴fw',FR,'wf㉴㉴ff㉴㉴ff㉴㉴fw',FR,'wwwwwwwxwwwwwww'],sign:{'3,1':'매표소','11,1':'승차권'},d:{'7,9':['cityhall',3,4]},p:[
{x:3,y:2,c:'#1e3a8a',h:'#222',stay:1,n:'매표소 직원',s:['어디로 가세요? 시외버스 표 끊어 드릴게요. 🚌'],ch:()=>BUS_J()},
{x:11,y:2,c:'#0f766e',h:'#3f2a1c',stay:1,n:'매표소 직원',s:['표선, 서귀포, 민속촌, 함덕 다 갑니다.'],ch:()=>BUS_J()},
{x:5,y:4,c:'#475569',h:'#222',w:1,stay:1,n:'버스 기다리는 시민',s:['첫차 타려고 일찍 나왔어요.']},
{x:9,y:6,c:'#ec4899',h:'#3f2a1c',w:1,stay:1,n:'여행객',s:['제주는 버스로 다니는 재미가 있어요.']},
{x:12,y:8,c:'#16a34a',h:'#222',w:1,stay:1,n:'여행객',s:['다음 버스 몇 시죠?']}]},
seoubong:{n:'서우봉',o:1,wide:1,land:[11,12],par:'hamdeok',bgm:'route',m:['~~~~~~~~~~~~~~~~~~~~~~~','~~sssssssssssssssssss~~','~~s.......F...F.....s~~','~~s.F.T....b.b....T.s~~','~~s.....=====..F....s~~','~~s..F..=...........s~~','~~s.....=........F..s~~','~~s.....========....s~~','~~s...F.......T=....s~~','~~s............=..F.s~~','~~s.T......=====....s~~','~~s.....F..=....F...s~~','~~s........=........s~~','~~s........x........s~~'],sign:{'12,3':'서우봉 전망대','11,12':'산책로'},d:{'11,13':['hamdeok',19,7]},p:[{x:12,y:5,c:'#16a34a',h:'#222',w:1,stay:1,n:'산책하는 사람',s:['여기서 내려다보는 함덕 바다가 최고예요. 🌊','봄엔 유채꽃도 예뻐요.']},{x:9,y:8,c:'#ec4899',h:'#3f2a1c',w:1,stay:1,n:'여행객',s:['생각보다 금방 올라와요!']}]},
maeul:{n:'마을 경로당',par:'route1',cozy:'#b45309',bgm:'indoor',m:['w'.repeat(W),'wwⓦwwⓦwwwⓦwwⓦww',FR,'wf㈂ff㉺㉺㉺ff㈄fffw',FR,'wf㉺㉺ffㆎㆍㆎff㉺㉺fw',FR,'wfㆎㆍㆎffffff㉵ffw',FR,'wwwwwwwxwwwwwww'],sign:{'7,1':'마을 경로당'},d:{'7,9':['route1',16,11]},p:[{x:7,y:4,c:'#57534e',h:'#d1d5db',stay:1,when:()=>!shopClosed('maeul'),n:'경로당 회장님',s:['어서 옵서. 차 한잔 허영 갑서. 🍵','오늘 윷 한판 어떵허코?']},{x:3,y:4,c:'#166534',h:'#e5e7eb',stay:1,when:()=>!shopClosed('maeul'),n:'동네 할망',s:['요즘 귤값이 어떵 되는지 몰라.']},{x:12,y:6,c:'#7c2d12',h:'#9ca3af',stay:1,when:()=>!shopClosed('maeul'),n:'동네 어르신',s:['TV 뉴스 보멍 쉬는 중이우다. 📺']}]},
gameRoom:{n:'오락실',par:'arcade',wide:1,land:[16,12],bgm:'town',cozy:'#7c3aed',mach:{"10,2": "sec3", "12,2": "sec5", "14,2": "sec7", "16,2": "sec10", "8,6": "react", "11,6": "tap", "14,6": "mole"},m:['wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww','wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww','w¤¤f¤¤f¤¤f㌎f㌎f㌎f㌎fw㌏㌏㌏㌏㌏㌏㌏㌏㌏㌏㌏w','wfffffffffffffffffw㌑㌑㌑㌑㌑㌑㌑㌑㌑㌑㌑w','wfffffffffffffffffff㌐㌐㌐㌐㌐㌐㌐㌐㌐fw','wfffffffffffffffffwfffffffffffw','wfㆋㆋㆋㆋff㌎ff㌎ff㌎fffwfffffffffffw','wfffffffffffffffffwwwwwwwwwwwww','wfffffffffffffffffwfffffffffffw','wfffffffffffffffffwfff㌑㌑㌑㌑㌑㌑㌑㌑w','wffffffffffffffffffff㌓㌑㌑㌑㌑㌑㌑㌑㌒w','wfffffffffffffffffwfff㌑㌑㌑㌑㌑㌑㌑㌑w','wfffffffffffffffffwfffffffffffw','wwwwwwwwwwwwwwwwxwwwwwwwwwwwwww'],sign:{'4,2':'테트리스','13,2':'초 맞추기','3,6':'인형뽑기','11,6':'순위 게임','24,5':'사격장','20,10':'활쏘기'},d:{'16,13':['arcade',5,10]},p:[
{x:15,y:10,c:'#a855f7',h:'#111',stay:1,n:'오락실 사장',s:['주인장이 테트리스를 좋아해서 테트리스를 잔뜩 넣었수다. 저쪽엔 인형뽑기도 이서마씸.','농구, 야구, 포격전, 레이싱 기계도 새로 들어왔수다. 순위도 남습니다.'],ch:{'🎮 테트리스 하기':()=>showTetris(),'🧸 인형뽑기 하기':()=>showClaw(),'⏱ 순위 게임 하기':()=>showMini(),'🕹 새 게임 고르기':()=>showGameList()}},
{x:5,y:3,c:'#2563eb',h:'#222',w:1,n:'오락실 손님',s:['7초 기계가 제일 어려워요. 🎯']},
{x:11,y:4,c:'#ec4899',h:'#3f2a1c',w:1,n:'오락실 손님',s:['딱 맞추면 인형을 준대요! 🧸']},
{x:24,y:6,c:'#16a34a',h:'#222',w:1,n:'사격장 손님',s:['300점 넘으면 인형을 줘요. 🔫']},
{x:20,y:9,c:'#f59e0b',h:'#222',stay:1,n:'활쏘기 강사',s:['과녁이 오기 조금 전에 쏘세요. 화살도 날아가는 시간이 있어요. 🏹']}]},
cinema:{n:'영화관',par:'rest',wide:1,land:[7,8],bgm:'indoor',m:['wwwwwwwwwwwwwwwwwwwwwww','w㉽㉽㉽㉽㉽㉽㉽㉽㉽㉽㉽㉽㉽wwwwwwwww','w㉲w㉲w㉼w㉼w㉼w㉲w㉲w㉲w㉲w㉲w㉲w','wfffffffffffffwfffffffw','wfffffffffffffwf㋀ff㉻f㋂w','w㉱㉱㉱fffffff㉰㉰㉰wf㋁ffff㋃w','wfffffffffffffffffffffw','wf㉴㉴f㌉fff㌉f㉴㉴fwf㉴㉴ff㋄fw','wfㆎㆎㆎㆎfffㆎㆎㆎㆎfwfffff㋅fw','wwwwwwwxwwwwwwwwwwwwwww'],sign:{'5,3':'1관','7,3':'2관','9,3':'3관','2,4':'매표소','12,4':'매점','18,3':'평점 라운지','19,4':'평점 단말기','16,4':'로봇 피규어','21,4':'공룡 피규어','20,7':'우주인 피규어'},d:{'7,9':['rest',4,11],'5,2':['cineH1',7,8],'7,2':['cineH2',7,8],'9,2':['cineH3',7,8]},p:[
{x:2,y:4,c:'#b91c1c',h:'#222',stay:1,n:'매표소 삼춘',s:['어서 옵서. 오늘 상영작 예매해 드리쿠다. 🎟','돈은 안 듭니다. 놀이용 표우다.'],ch:{'🎟 영화 예매':()=>showBook(),'🎫 내 티켓':()=>showTicket()}},
{x:12,y:4,c:'#ea580c',h:'#3f2a1c',lh:1,stay:1,n:'매점 알바',s:['팝콘은 방금 튀겼어요! 🍿','들고 들어가서 자리에 앉으면 돼요.'],ch:{'🍿 매점 메뉴':()=>showCafe()}},
{x:18,y:5,c:'#7c3aed',h:'#222',gl:'#27272a',stay:1,n:'평점 기록원',s:['본 영화 있으면 별점 남기고 가세요. ⭐','주인장이 매긴 별점도 볼 수 있어요.'],ch:{'⭐ 영화 별점 보기':()=>showMovies()}},
{x:17,y:6,c:'#0f766e',h:'#3f2a1c',w:1,n:'포스터 구경하는 손님',s:['포스터 앞에서 A를 누르면 상영작을 볼 수 있어요.']},
{x:6,y:3,c:'#475569',h:'#222',w:1,n:'상영 기다리는 손님',s:['상영 10분 전이라 팝콘 사러 왔어요.']},
{x:9,y:6,c:'#be185d',h:'#3f2a1c',lh:1,w:1,n:'데이트 온 손님',s:['뭘 볼지 아직도 못 정했어요. 😅']},
{x:3,y:8,c:'#1d4ed8',h:'#222',sit:1,fd:0,eat:'🍿',n:'대기 중인 손님',s:['입장 시간까지 여기 앉아 기다려요.']},
{x:11,y:8,c:'#a16207',h:'#3f2a1c',sit:1,fd:0,n:'표 들고 기다리는 손님',s:['친구가 아직 안 왔어요…']}]},
cineH1:{n:'영화관 1관',par:'cinema',bgm:'indoor',dim:1,m:['w'.repeat(W),'w'+'ㆀ'.repeat(W-2)+'w',FR,'wfㆁㆁㆁㆁㆁfㆁㆁㆁㆁㆁfw','wfㆁㆁㆁㆁㆁfㆁㆁㆁㆁㆁfw',FR,'wfㆁㆁㆁㆁㆁfㆁㆁㆁㆁㆁfw','wfㆁㆁㆁㆁㆁfㆁㆁㆁㆁㆁfw',FR,'wwwwwwwxwwwwwww'],sign:{'7,1':'1관 · 대형 상영관'},d:{'7,9':['cinema',5,3]},p:[{x:3,y:4,c:'#334155',h:'#222',sit:1,fd:1,eat:'🍿',n:'관객',s:['쉿! 곧 시작해요.']},{x:10,y:6,c:'#7c3aed',h:'#3f2a1c',sit:1,fd:1,n:'관객',s:['광고가 꽤 길어요.']},{x:11,y:6,c:'#0f766e',h:'#222',sit:1,fd:1,eat:'🥤',n:'관객',s:['여기가 명당이에요.']}]},
cineH2:{n:'영화관 2관',par:'cinema',bgm:'indoor',dim:1,m:['w'.repeat(W),'www'+'ㆀ'.repeat(W-6)+'www',FR,'wfffㆁㆁㆁfㆁㆁㆁfffw',FR,'wfffㆁㆁㆁfㆁㆁㆁfffw',FR,'wfffㆁㆁㆁfㆁㆁㆁfffw',FR,'wwwwwwwxwwwwwww'],sign:{'7,1':'2관 · 소형 상영관'},d:{'7,9':['cinema',7,3]},p:[{x:5,y:5,c:'#a16207',h:'#222',sit:1,fd:1,eat:'🍿',n:'관객',s:['작은 관이 집중이 잘 돼요.']}]},
cineH3:{n:'영화관 3관',par:'cinema',bgm:'indoor',dim:1,m:['w'.repeat(W),'w'+'ㆀ'.repeat(W-2)+'w',FR,'wfㆁㆁfㆁㆁfㆁㆁfㆁㆁfw',FR,FR,'wfㆁㆁfㆁㆁfㆁㆁfㆁㆁfw',FR,FR,'wwwwwwwxwwwwwww'],sign:{'7,1':'3관 · 커플석'},d:{'7,9':['cinema',9,3]},p:[{x:5,y:3,c:'#be185d',h:'#222',sit:1,fd:1,n:'관객',s:['둘이 앉기 딱 좋아요.']},{x:6,y:3,c:'#2563eb',h:'#222',sit:1,fd:1,eat:'🥤',n:'관객',s:['다리 뻗을 자리가 넉넉해요.']}]},

arcade:{n:'게임 센터 · PC방 · 노래방',par:'rest',wide:1,land:[13,12],bgm:'town',m:['wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww','wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww','wwwwwwwwwwㆌⓚㆌwㆌⓚㆌwwwwwwwwwwwwwwwwwwwwww','wwwwwwwwwwㆌㆌㆌwㆌㆌㆌwwwwwwwwwwwwwwwwwwwwww','wwwwwwwwwwㆁㆌㆁwㆁㆌㆁwwwwwwwwwwwwwwwwwwwwww','wwwwwwwwwwㆌㆌㆌwㆌㆌㆌwwwwwwwwwwwwwwwwwwwwww','wwwwwwwwwwㆁㆌㆁwㆁㆌㆁwwwwwwwwwwwwwwwwwwwwww','wwwwwwwwwwㆌㆌㆌwㆌㆌㆌwwwwwwwwwwwwwwwwwwwwww','wwwwwwwwwwwㆌwwwㆌwwwwwwwwwwwwwwwwwwwwwww','w㌔㌔㌔㌔f㌔㌔㌔wwfwwwfwwwwwfwwwwwwwwwwwwwwwww','wfffffffffffffffffffffffffwwwwwwwwwwwww','w㉵ffffffffffffffkkkfff㉴㉴ffwwwwwwwwwwwww','wfffffffffffffffffffffffffwwwwwwwwwwwww','wwwwwwwwwwwwwxwwwwwwwwwwwwwwwwwwwwwwwww'],sign:{'5,8':'오락실','2,9':'순위표','7,9':'순위표','11,8':'1번방','15,8':'2번방','13,9':'코인 노래방','21,9':'PC방','17,10':'노래방 카운터'},d:{'13,13':['rest',11,11],'5,9':['gameRoom',16,12],'21,9':['pcRoom',20,16]},p:[
{x:14,y:4,c:'#ec4899',h:'#3f2a1c',sit:1,fd:1,n:'노래 부르는 손님',s:['고음 올라가기 전에 잠깐 쉬는 중이에요. 🎤']},
{x:17,y:10,c:'#0ea5e9',h:'#222',stay:1,n:'노래방 사장',s:['1번방, 2번방 비었어요. 화면 앞에서 A를 누르면 번호를 찾아요. 🎤'],ch:{'🎤 노래 번호 찾기':()=>showTj()}},
{x:3,y:11,c:'#475569',h:'#111',when:()=>{const h=jejuNow().h;return h>=22||h<7},w:1,n:'밤샘 게이머',s:['첫차 기다리면서 한 판 더 하는 중이에요. 🕹']},
{x:7,y:11,c:'#22d3ee',h:'#222',w:1,n:'동전 든 학생',s:['라인 넉 줄 한 번에 지우면 그날은 럭키비키죠.']}]},

gpHome:{n:'할아버지댁',par:'route1',bgm:'indoor',cozy:'#b45309',m:ELDER_M,d:{'7,9':['route1',15,4]},p:[
{x:5,y:4,c:'#854d0e',h:'#d1d5db',sit:1,when:elderHome,n:'보성 할아버지',s:['어서 옵서. 밥은 먹언 옵디가?','오늘은 집이서 쉬는 중이우다.'],ch:{'강아지 이야기':['우리 개는 힘이 넘쳐부난 산책 나가민 내가 끌려 댕겨.','그래도 그 녀석 덕분에 많이 걷주게.'],'감귤 이야기':['귤은 사람 발소리 듣고 큰다고 허주. 🍊']}},
{x:9,y:4,c:'#1f2937',h:'#d1d5db',sit:1,when:()=>elderHome()&&!hnMeal(),n:'보성 할머니',s:['혼저 옵서. 귤 하나 까 먹읍서. 🍊','옛날엔 나도 물질 허멍 살았주게.'],ch:hnCh}]},

gmHome:{n:'외할아버지댁',par:'route1',bgm:'indoor',cozy:'#0f766e',m:ELDER_M,d:{'7,9':['route1',3,4]},p:[
{x:5,y:4,c:'#166534',h:'#e5e7eb',sit:1,when:elderHome,n:'보성 외할아버지',s:['잘 왔수다게. 아랫목이 또똣허여.','보성이 만나걸랑 안부 전해줍서.'],ch:{'감귤 이야기':['겨울 되민 노랗게 익은 밭이 그렇게 곱닥허여. 🍊']}},
{x:9,y:4,c:'#334155',h:'#e5e7eb',sit:1,when:()=>elderHome()&&!hnMeal(),n:'보성 외할머니',s:['이 맨도롱헌 차 한 잔 들엉 갑서. ☕','나도 옛날엔 테왁 하나 들엉 바당에 들었주.'],ch:hnCh}]},

agency:{n:'자격·프로젝트 센터 1층',par:'studio',bgm:'knowledge',m:AGM.map((r,i)=>i==9?'wwwwwwwxwwwㅸwww':r),sign:{'11,8':'2층 프로젝트'},d:{'7,9':['studio',3,5],'11,9':['projects',7,8]},p:[
{x:7,y:2,c:'#2563eb',h:'#333',n:'접수 데스크',s:['어서 오세요. 국가 자격 검정원입니다.','시험 접수는 안쪽 컴퓨터에서 하실 수 있어요.'],ch:{'자격증':['📜 정보처리기사 · 컴퓨터활용능력 1급 · 워드프로세서','📊 사회조사분석사 2급 · 한국사능력검정시험 2급','🥋 태권도 2단 (1품 · 2품에서 전환)','🔤 TOEIC 최고 775점'],'공모전·수상':['🏆 2016 지역기업 청년 희망이음 프로젝트 경진대회 대상 (산업통상자원부 장관상)','🥇 2017 같은 대회 금상 (산업통상자원부 장관상)'],'접수 방법':['컴퓨터 앞에서 A를 누르면 접수 화면이 열려요.','Q-Net, TOEIC, 한국사능력검정시험 접수 페이지로 바로 갈 수 있고, 접수내역도 확인할 수 있어요.'],'벽의 증명서':['좌우 벽의 액자를 눌러 보세요.','증명서 목록을 자세히 볼 수 있어요.']}},
{x:4,y:2,c:'#0ea5e9',h:'#1b1b26',n:'접수 도우미',s:['컴퓨터에서 시험 접수를 하실 수 있어요.','Q-Net이랑 TOEIC, 둘 다 가능해요!']},
{x:9,y:6,c:'#94a3b8',h:'#222',w:1,n:'시험 준비생',s:['으아… 정처기 실기 공부 중이에요.','저분 기록 보면 희망이 생겨요!']}]},

mensa:{n:'멘사 지능 연구소',par:'gotF',bgm:'knowledge',m:MNM,d:{'7,9':['gotF',9,5]},sh:['🧠 멘사 전시','IQ 156 · Percentile 99% · 입회 시험 합격 (준회원)'],p:[
{x:7,y:2,c:'#7c3aed',h:'#eee',n:'멘사 연구소장',s:['멘사 지능 연구소에 온 걸 환영합니다.','BS World의 운영자, 강보성의 입회 시험 결과는 IQ 156, Percentile 99%. 입회 시험 합격자입니다.','당신도 IQ 테스트 한번 진행해 보겠습니까?'],ch:{'🧠 IQ 테스트 해 보기':()=>showIq(),'연구소 둘러보기':['좌우 벽의 전시물을 눌러 보세요.','주인장의 멘사 기록을 볼 수 있습니다.']}}]},

vol:{n:'나눔·헌혈 센터 1층',par:'gotF',bgm:'indoor',m:['w'.repeat(W),'wwwⓦwwwⓦwwwⓦwww',FR,'wfkkkff㋹ff㋺㋺㋺fw',FR,FR,'wwwww㋸㋸㋸㋸㋸wwwww','w㉵fffffffffff㋼w',FR,'wwwwwwwxwwwwwww'],sign:{'3,6':'봉사 나눔센터','13,7':'2층'},bd:{'13,7':['vc',12,7]},d:{'7,9':['gotF',3,5]},p:[
{x:3,y:2,c:'#fb923c',h:'#222',stay:1,when:()=>!shopClosed('volC'),n:'접수 자원봉사자',s:['어서 오세요! 봉사 나눔센터입니다. 😊','오른쪽 기계에서 번호표 먼저 뽑아 주세요.'],ch:{'봉사활동':['🤝 주인장도 상상 Volunteer 활동에 참여했대요.','작은 나눔이 모이면 큰 기록이 돼요.']}},
{x:11,y:4,c:'#fb923c',h:'#3f2a1c',stay:1,when:()=>!shopClosed('volC'),n:'봉사원',s:['오늘도 봉사 활동 중! 😊','기부 물품을 정리하고 있어요. 📦']},
{x:4,y:8,c:'#64748b',h:'#222',stay:1,n:'건물 안내원',s:['1층 봉사 나눔센터는 08시부터 18시까지예요.','2층 헌혈의 집은 09시부터 20시까지고요. 계단은 오른쪽이에요.']}]},
vc:{n:'헌혈의 집',par:'vol',bgm:'indoor',m:['w'.repeat(W),'wUwwwUwwwUwwwUw','w㋻㋻f㋻㋻f㋻㋻f㋻㋻ffw','wfffffffffffXfw','wkkkff㋻㋻f㋻㋻fffw','wffffffffff㉮㉮㉯w','wwwww㋸㋸㋸㋸㋸wwwww','w㉵fffffffffff㋼w',FR,'wwwwwww㋷wwwwwww'],sign:{'3,6':'헌혈의 집','13,7':'1층','7,9':'명예의 전당'},bd:{'13,7':['vol',12,7],'7,9':['vcHall',7,8]},p:[
{x:2,y:3,c:'#dc2626',h:'#444',stay:1,when:()=>!shopClosed('vcB'),n:'접수 간호사',s:['어서 오세요. 헌혈의 집입니다.','문진표 작성하시고 빈 침대에서 기다려 주세요. 🩸'],ch:{'헌혈':['벽 쪽 침대에 누워 보세요. 금방 끝나요.','끝나고 간식대에서 초코파이도 챙겨 가세요. 🍫']}},
{x:3,y:2,c:'#dc2626',h:'#222',stay:1,when:()=>!shopClosed('vcB'),n:'간호사',s:['따끔합니다~ 주먹 쥐었다 폈다 해 주세요.']},
{x:8,y:4,c:'#dc2626',h:'#3f2a1c',stay:1,when:()=>!shopClosed('vcB'),n:'간호사',s:['헌혈 전에 물 많이 드셨죠? 😊']},
{x:4,y:2,c:'#2563eb',h:'#222',when:()=>!shopClosed('vcB'),sl:[128,64,'#e2e8f0',1],n:'헌혈 중인 시민',s:['(헌혈 중이다. 팔을 쥐었다 폈다 한다.)']},
{x:9,y:4,c:'#10b981',h:'#3f2a1c',when:()=>!shopClosed('vcB'),sl:[288,128,'#e2e8f0',1],n:'헌혈 중인 시민',s:['(누워서 천장을 보고 있다.)']},
{x:6,y:5,c:'#a855f7',h:'#222',stay:1,when:()=>!shopClosed('vcB'),n:'기다리는 시민',s:['이 월드 주인장은 헌혈을 167회 했다네요~ ㅎㅎ','명예의 전당이 복도 아래쪽에 있대요.']}]},
vcHall:{n:'명예의 전당',par:'vc',bgm:'indoor',cozy:'#ca8a04',m:['w'.repeat(W),'www^w^w^wCwCwww',FR,FR,'wfffffㆎㆍㆎfffffw',FR,FR,'w㉵fffffffffff㉵w',FR,'wwwwwwwxwwwwwww'],sign:{'3,1':'은장','5,1':'금장','7,1':'명예장','10,1':'수료증'},d:{'7,9':['vc',7,8]},sh:['🩸 헌혈유공장','은장(30회) · 금장(50회) · 명예장(100회)','헌혈 167회 · 대한적십자사','🤝 봉사활동 · 상상 Volunteer 활동'],p:[]},
};
M.sara.p.push({x:15,y:8,c:'#16a34a',h:'#222',w:0,stay:1,n:'정상에 오른 사람',s:['사라봉 올라오면 제주항이 한눈에 보여요. 🌅','노을 질 때 오면 더 좋아요.']});
/* 제주도 둘레 바다: 가장자리는 바다, 그 안쪽은 모래. 길은 그대로 둠 */
[['shoreF','t'],['studio','t'],['rest','t'],['oreumF','tr'],['sports','r'],['orchard','r'],['minsok','br'],['gotF','b'],['beach','b']].forEach(([id,ed])=>{const z=M[id],R=z.m.map(r=>[...r]),H=R.length,Wd=R[0].length,sand=(x,y)=>{if('T.F'.includes(R[y][x]))R[y][x]='s'};
  if(ed.includes('t')){R[0]=R[0].map(()=>'~');for(let x=0;x<Wd;x++)sand(x,1)}
  if(ed.includes('b')){R[H-1]=R[H-1].map(()=>'~');for(let x=0;x<Wd;x++)sand(x,H-2)}
  if(ed.includes('r')){for(let y=0;y<H;y++){if(R[y][Wd-1]!='=')R[y][Wd-1]='~';sand(Wd-2,y)}}
  z.m=R.map(r=>r.join(''))});
/* 해안 모래길은 옆 맵의 같은 줄로 이어짐 */
[['shoreF',14,1,'studio',0,1],['studio',22,1,'rest',0,1],['rest',14,1,'oreumF',0,1],['oreumF',21,13,'sports',21,0],['minsok',0,12,'route1',23,13],['route1',0,13,'gotF',14,8],['gotF',0,8,'beach',14,8]].forEach(([a,ax,ay,b,bx,by])=>{(M[a].ex=M[a].ex||{})[ax+','+ay]=[b,bx,by];(M[b].ex=M[b].ex||{})[bx+','+by]=[a,ax,ay]});
Object.values(M).forEach(z=>{if(!z.wide)z.m=z.m.map(r=>r.padEnd(W,'T').slice(0,W))});
/* 지하철 노선과 역: 대합실 cc_역, 승강장 pf_역_호선 을 자동으로 만듦 */

/* 공덕·서울역·부산역 바깥 지도와 역 건물·승강장 */
(function bigStations(){const rp=(s,n)=>s.repeat(n);
 M.gongdeok={n:'공덕',o:1,bgm:'route',land:[7,4],m:['TTTTTTTTTTTTTTT','T.ㅊㅊ.ㅈㅈ.ㅊㅊ.ㅈㅈ.T','T.ㅊㅊ.ㅈㅈ.ㅊㅊ.ㅈㅈ.T','TF...F...T...FT',rp('ㅣ',15),rp('ㄹ',15),'T..........FT..','..F......T...FT','T.F...T...F..TT',rp('T',15)],sign:{},d:{},p:[{x:12,y:4,c:'#475569',h:'#222',w:1,n:'공덕역 앞 직장인',s:['공덕은 노선이 네 개나 지나가요. 🚇','왼쪽으로 가면 마포, 오른쪽으로 가면 서울역이에요.']}],ex:{'0,5':['mapo',14,5],'14,5':['seoul',0,14]}};
 const W0=36,row=(a,b,c,d)=>{const r=Array(W0).fill(a);for(let x=b;x<c;x++)r[x]=d;return r},G=[];for(let y=0;y<7;y++)G.push(row('.',1,35,'㎯'));G.push(row('ㅣ',5,19,'㎵'));G.push(row('ㅣ',5,19,'㎵'));for(let y=9;y<14;y++)G.push(row('ㅣ',0,0,'ㅣ'));G.push(row('ㄹ',0,0,'ㄹ'));G.push(row('ㅣ',0,0,'ㅣ'));G.push(Array(W0).fill('T'));G[16][17]='ㅣ';G[6][11]='ㅀ';G[6][12]='ㅀ';G[9][21]='㎶';G[10][21]='㎶';const SUB=[[23,1],[25,4],[19,32],[29,64],[31,65]];for(let y=10;y<=12;y++)for(let x=22;x<34;x++)G[y][x]='㎯';for(let y=10;y<=12;y++)for(let x=18;x<=20;x++)G[y][x]='㎯';SUB.forEach(([x])=>{G[12][x]='ㅀ'});for(let x=3;x<16;x++)G[13][x]='㏅';G[6][14]='ㅀ';
 M.seoul={n:'서울역',o:1,wide:1,bgm:'route',land:[12,9],bus:14,m:G.map(r=>r.join('')),stB:{x:1,y:0,w:34,h:7,kind:'seoul',nm:'서울',doors:[],dl:[],lines:[1]},stB2:{x:22,y:10,w:12,h:3,kind:'seoulSub',nm:'서울',doors:SUB.filter(a=>a[1]!=32).map(a=>a[0]),dl:SUB.filter(a=>a[1]!=32).map(a=>a[1]),lines:[1]},stBs:[{x:18,y:10,w:3,h:3,kind:'gtxBox',doors:[19],dl:[32],lines:[32]}],sign:{'11,8':'서울역 맞이방','28,7':'문화역서울284','8,7':'광장','21,11':'시계탑','27,9':'지하철 타는 곳','19,9':'GTX-A','9,12':'버스환승센터','14,7':'아울렛','17,15':'용산 방면','1,13':'공덕 방면'},d:{'11,6':['seoulSt',16,12],'12,6':['seoulSt',17,12],'14,6':['seoulMall',15,12]},ex:{'0,14':['gongdeok',14,5],'17,16':['yongsan',17,1]},p:[{x:9,y:10,c:'#0f766e',h:'#222',w:1,n:'광장의 여행객',s:['기차 시간까지 조금 남았어요. 🧳']},{x:15,y:11,c:'#7c3aed',h:'#3f2a1c',w:1,n:'캐리어 든 사람',s:['부산 가는 KTX 타러 왔어요. 🚄']},{x:25,y:9,c:'#475569',h:'#222',w:1,n:'역 앞 직장인',s:['옛 서울역 건물은 지금 전시 공간이에요.']},{x:5,y:12,c:'#dc2626',h:'#111',w:1,n:'광장 산책객',s:['저 유리 건물 안에 쇼핑몰도 있어요.']}]};
 const Gb=[];for(let y=0;y<7;y++)Gb.push(row('.',2,34,'㎯'));Gb.push(row('T',4,32,'ㅣ'));for(let y=8;y<14;y++)Gb.push(row('ㅣ',0,0,'ㅣ'));Gb.push(row('ㄹ',0,0,'ㄹ'));Gb.push(row('ㅣ',0,0,'ㅣ'));[16,17,18,19].forEach(a=>{Gb[6][a]=a==17||a==18?'ㅀ':'㎯'});[[10,10],[11,10],[10,11],[11,11]].forEach(([x,y])=>{Gb[y][x]='㎼'});[[22,8],[23,8],[29,8],[30,8],[3,9],[4,9],[32,9],[33,9]].forEach(([x,y])=>{Gb[y][x]='F'});Gb[12][26]='ㅠ';
 M.busan={n:'부산역',o:1,wide:1,bgm:'route',land:[17,9],m:Gb.map(r=>r.join('')),stB:{x:2,y:0,w:32,h:7,kind:'busan',nm:'부산',doors:[],dl:[],lines:[101]},fo:[10,10],sign:{'17,8':'부산역 맞이방','10,9':'광장 분수','26,13':'부산 1호선'},d:{'17,6':['busanSt',16,12],'18,6':['busanSt',17,12]},p:[{x:14,y:10,c:'#0ea5e9',h:'#222',w:1,n:'여행 온 사람',s:['부산 오면 일단 국밥부터 먹어야죠. 🍲','바다 냄새가 벌써 나는 것 같아요.']},{x:22,y:11,c:'#f97316',h:'#3f2a1c',w:1,n:'부산 주민',s:['서울 가는 KTX는 안에서 표 받으면 돼요.']},{x:6,y:12,c:'#334155',h:'#222',w:1,n:'택시 기다리는 손님',s:['해운대까지 얼마나 걸리려나요. 🚕']}]};
 const hall=(k,nm,out,cc,back)=>{const W=33,F=()=>Array(W).fill('f'),Q=[];Q.push(Array(W).fill('w'));const t=Array(W).fill('w');[2,3,4].forEach(x=>t[x]='㎷');[7,8,9].forEach(x=>t[x]='㎺');for(let x=12;x<=26;x++)t[x]='㎹';Q.push(t);for(let y=2;y<13;y++){const r=F();r[0]=r[W-1]='w';Q.push(r)}Q.push(Array(W).fill('w'));Q[13][16]=Q[13][17]='x';Q[13][10]='ㅸ';Q[13][23]='ㅸ';[3,5].forEach(x=>{Q[3][x]='㎻'});[29,30].forEach(x=>{Q[7][x]='㎴'});[26,27].forEach(x=>{Q[4][x]='㎰'});[29,30].forEach(x=>{Q[4][x]='㎱'});[1,31].forEach(x=>{Q[10][x]='㎲';Q[11][x]='㎲'});[[8,6],[8,9],[20,6],[20,9]].forEach(([x,y])=>{for(let i=0;i<5;i++)Q[y][x+i]='㉴'});
  M[k+'St']={n:nm+' 맞이방',par:out,wide:1,land:[16,11],bgm:'indoor',railHall:k,m:Q.map(r=>r.join('')),sign:{'3,2':'KTX 타는 곳','8,2':'무궁화호 타는 곳','26,5':'편의점','30,5':'카페','10,12':'지하철','23,12':'지하철','4,4':'승차권 키오스크','30,8':'먹거리','1,9':'보관함','31,9':'보관함','16,12':'출구'},d:{'16,13':[out,back[0],back[1]],'17,13':[out,back[0]+1,back[1]],'10,13':['cc_'+cc,7,8],'23,13':['cc_'+cc,7,8]},
   p:[{x:7,y:4,stay:1,c:'#1e3a8a',h:'#222',n:nm+' 역무원',s:['KTX는 승차권 키오스크에서 표를 받고 왼쪽 위 개찰구로 들어가세요. 🚄','지하철은 아래쪽 계단으로 내려가면 바로예요.']},...[[12,5,'#7c3aed'],[22,5,'#0f766e'],[11,8,'#dc2626'],[24,8,'#475569'],[6,11,'#2563eb'],[26,11,'#ea580c'],[14,3,'#16a34a']].map(([x,y,c],i)=>({x,y,c,h:i%2?'#222':'#3f2a1c',w:1,n:'기차 기다리는 사람',s:[['곧 플랫폼으로 내려가야 해요. 🧳','표 시간 다시 확인 중이에요.','도시락 하나 사 갈까요?','부산에 친구 만나러 가요.'][i%4]]}))]};
  const WP=25,tr=()=>Array(WP).fill('㎸');const pfm=(sf,lab,gx,mu)=>{M[k+sf]={n:nm+' '+lab+' 승강장',par:out,wide:1,land:[12,4],bgm:'indoor',ktxPf:k,muPf:mu,m:[Array(WP).fill('w').join(''),'㎷'.repeat(0)+tr().join(''),tr().join(''),Array(WP).fill('ㅰ').join(''),'w'+'f'.repeat(WP-2)+'w','w'+'f'.repeat(WP-2)+'w','w'+'f'.repeat(11)+'ㅸ'+'f'.repeat(WP-13)+'w',Array(WP).fill('w').join(''),Array(WP).fill('w').join(''),Array(WP).fill('w').join('')],sign:{'12,5':'맞이방'},d:{'12,6':[k+'St',gx,2]},p:[{x:4,y:4,stay:1,c:'#1e3a8a',h:'#222',n:'승강장 안전요원',s:['열차를 보고 A(Z)를 누르면 타요. 🚆']},{x:18,y:5,c:'#475569',h:'#222',w:1,n:'열차 기다리는 사람',s:[mu?'무궁화호는 천천히 가는 맛이 있어요. 🚃':'KTX는 정말 빠르죠. 🚄']}]}};pfm('Ktx','KTX',3,0);pfm('Mu','무궁화호',8,1)};
 /* 해운대 비치 호텔: 1층 로비, 2층 식당·연회장, 3~8층 객실, 9층 스카이 라운지 */
 const HLIFT={};const RT=[{w:'#334155',w2:'#475569',f:'#e7dcc0',l:'#d6c8a4',st:0},{w:'#7c2d12',w2:'#9a3412',f:'#f5e6c8',l:'#e2cda0',st:1},{w:'#0f766e',w2:'#14b8a6',f:'#e2e8f0',l:'#cbd5e1',st:0},{w:'#312e81',w2:'#4338ca',f:'#d6d3d1',l:'#c4c0bb',st:1},{w:'#854d0e',w2:'#a16207',f:'#fef3c7',l:'#fde68a',st:0},{w:'#831843',w2:'#be185d',f:'#fce7f3',l:'#fbcfe8',st:1}];
 const ROOM={std:{n:'스탠다드',W:15,m:['wwⓦwwⓦwwwⓦwwⓦww','wßßf㍒ffffffþðfw','wfffffffffffffw','wffff㉴㉴ffffff㉵w']},twin:{n:'트윈',W:15,m:['wwⓦwwⓦwwwⓦwwⓦww','wßßfffßßfffþðfw','wfffffffffffffw','w㉵ffffff㉴㉴fffw']},ondol:{n:'온돌',W:15,m:['wwⓦwwⓦwwwⓦwwⓦww','wfffffffffþðffw','wfffKKKfffffffw','w㈀fffffffffff㉵w']},deluxe:{n:'오션뷰 디럭스',W:15,m:['wⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦw','wßßffffff㉴㉴fffw','wffffffffffff㉵w','w㈀ffffffþðffffw']},family:{n:'패밀리',W:21,m:['wwⓦwwⓦwwⓦwwⓦwwⓦwwⓦww','wßßfßßfffffffffþðfffw','wfffffffffffffffffffw','w㉵ffßßff㉴㉴㉴fffff㈀fw']},suite:{n:'스위트',W:25,m:['wⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦⓦw','wßßfffffffwfffff㉴㉴㉴ffþðfw','wfffffffffwfffffffffffffw','w㈀ff㉵fffffffff㉴㉴fffff㉵fw']}};
 const mkRoom=(id,nm,kind,rt,back)=>{const R0=ROOM[kind],W1=R0.W,fr='w'+'f'.repeat(W1-2)+'w',dx=W1>>1,bot=[...'w'.repeat(W1)];bot[dx]='x';const pad=r=>r.padEnd(W1,'f').slice(0,W1-1)+'w';M[id]={n:nm+'호 '+R0.n,par:'haeundae',wide:W1>15?1:undefined,land:[dx,8],bgm:'indoor',rt,cozy:'#0ea5e9',m:['w'.repeat(W1),R0.m[0].padEnd(W1,'w').slice(0,W1),pad(R0.m[1]),pad(R0.m[2]),pad(R0.m[3]),fr,fr,fr,fr,bot.join('')],d:{[dx+',9']:back},p:[]}};
 const LF=(f,x,y)=>{HLIFT[f]=[x,y]};
 {const WF=31,mk=(f)=>{const id='hotel'+f,Q=[Array(WF).fill('w')],t=Array(WF).fill('w'),bd={},rt=RT[f%RT.length],kinds=f==8?['suite','deluxe','suite','deluxe','suite','deluxe','suite']:['std','twin','deluxe','std','family','ondol','twin','deluxe'];t[2]='㎊';t[28]='㎊';t[15]='㏈';[5,8,11,18,21,24].forEach((x,i)=>{t[x]='㋷'});Q.push(t);for(let y=2;y<4;y++){const r=Array(WF).fill('f');r[0]=r[WF-1]='w';Q.push(r)}const b=Array(WF).fill('w');b[1]=b[29]='f';[5,8,11,14,17,20,23,26].forEach(x=>{b[x]='㋷'});Q.push(b);for(let y=5;y<7;y++){const r=Array(WF).fill('f');r[0]=r[WF-1]='w';Q.push(r)}Q[5][4]='㉵';Q[5][27]='㉵';Q.push(Array(WF).fill('w'));Q.push(Array(WF).fill('w'));Q.push(Array(WF).fill('w'));let no=1;const sign={};[[5,1],[8,1],[11,1],[18,1],[21,1],[24,1]].concat([[5,4],[8,4],[11,4],[14,4],[17,4],[20,4],[23,4],[26,4]]).forEach(([x,y],i)=>{const n0=f*100+no++,rid='hRoom'+n0,kind=kinds[i%kinds.length];mkRoom(rid,n0,kind,RT[(f+i)%RT.length],[id,x,y+1]);const R0=ROOM[kind];bd[x+','+y]=[rid,R0.W>>1,8];sign[x+','+y]=n0+''});sign['15,1']='엘리베이터';sign['2,2']='계단';sign['28,2']='계단';M[id]={n:'비치 호텔 '+f+'층',par:'haeundae',wide:1,land:[15,2],bgm:'indoor',rt,m:Q.map(r=>r.join('')),bd,sign,d:{'2,1':[f>3?'hotel'+(f-1):'hotel2',f>3?28:28,2],'28,1':[f<8?'hotel'+(f+1):'hotel9',2,2]},p:[{x:10,y:3,c:'#475569',h:'#222',w:1,n:'객실 청소 직원',s:['방 정리 중이에요. 필요한 거 있으시면 말씀하세요. 🧹']},{x:20,y:6,c:'#0ea5e9',h:'#3f2a1c',w:1,n:'투숙객',s:[kinds[f%kinds.length]=='suite'?'이 층 스위트룸은 바다 전망이 끝내줘요. 🌊':'방에서 바다가 살짝 보여요. 🌊']}]};LF(f,15,2)};[3,4,5,6,7,8].forEach(mk);
  const open=(ch)=>Array(WF).fill(ch);
  /* 1층 */{const Q=[open('w')],t=open('w');t[3]='㏈';t[7]='㎆';t[26]='㎊';t[14]=t[15]='㎱';t[18]=t[19]='㎰';t[10]='ⓦ';t[22]='ⓦ';Q.push(t);for(let y=2;y<13;y++){const r=open('f');r[0]=r[WF-1]='w';Q.push(r)}for(let x=10;x<21;x++)Q[4][x]='k';for(let x=6;x<11;x++){Q[8][x]='㉴';Q[8][x+14]='㉴'}Q[6][3]='㉵';Q[6][27]='㉵';Q[11][8]='㉵';Q[11][22]='㉵';Q[10][1]='㎲';Q[11][1]='㎲';Q.push(open('w'));Q[13][15]='x';Q[13][26]='x';Q[13][4]='x';M.hotel1={n:'비치 호텔 로비',par:'haeundae',wide:1,land:[15,12],bgm:'indoor',m:Q.map(r=>r.join('')),bd:{},sign:{'15,5':'프런트','3,2':'엘리베이터','7,2':'에스컬레이터 ↑','26,2':'계단 ↑','14,2':'라운지 카페','18,2':'편의점','15,12':'정문','26,12':'후문','4,12':'해변 출구','1,9':'짐 보관'},d:{'15,13':['haeundae',34,17],'26,13':['haeundae',28,17],'4,13':['haeundae',28,21],'7,1':['hotel2',7,2],'26,1':['hotel2',26,2]},p:[...[11,13,15,17,19].map((x,i)=>({x,y:3,stay:1,c:'#1e3a8a',h:i%2?'#3f2a1c':'#222',n:'프런트 직원',s:['어서 오세요, 비치 호텔입니다. 객실은 3층부터 8층까지 있어요. 🏨','9층 스카이 라운지는 투숙객이 아니어도 오실 수 있어요.']})),{x:13,y:12,stay:1,c:'#7f1d1d',h:'#222',n:'도어맨',s:['어서 오십시오. 정문은 해변로 쪽이에요. 🎩']},{x:6,y:12,stay:1,c:'#7f1d1d',h:'#222',n:'해변 출구 안내원',s:['이 문으로 나가면 백사장이 바로예요. 🏖']},{x:24,y:12,stay:1,c:'#0f766e',h:'#222',n:'벨맨',s:['짐 올려 드릴까요? 🧳']},{x:17,y:7,c:'#be123c',h:'#222',w:1,n:'체크인 기다리는 손님',s:['3시부터 체크인이래요. 🕒']},{x:23,y:10,c:'#7c3aed',h:'#3f2a1c',w:1,n:'로비의 투숙객',s:['호텔 로비에서 커피 마시는 게 좋아요. ☕']}]};LF(1,3,2)}
  /* 2층 */{const Q=[open('w')],t=open('w');t[3]='㏈';t[7]='㎆';t[26]='㎊';t[28]='㎊';Q.push(t);for(let y=2;y<9;y++){const r=open('f');r[0]=r[WF-1]='w';Q.push(r)}for(let y=4;y<8;y+=3)for(let x=4;x<13;x+=3){Q[y][x]='㉴';Q[y][x+1]='ㆍ'}for(let x=17;x<28;x++)Q[4][x]=x%2?'㉴':'f';for(let x=17;x<28;x++)Q[6][x]=x%2?'㉴':'f';Q.push(open('w'));M.hotel2={n:'비치 호텔 2층',par:'haeundae',wide:1,land:[7,2],bgm:'indoor',m:Q.map(r=>r.join('')),sign:{'8,2':'뷔페 식당','22,2':'연회장','3,2':'엘리베이터','7,1':'에스컬레이터 ↓','26,2':'계단 ↓','28,2':'계단 ↑'},d:{'7,1':['hotel1',7,2],'26,1':['hotel1',26,2],'28,1':['hotel3',2,2]},p:[{x:9,y:3,stay:1,c:'#f8fafc',h:'#222',n:'식당 직원',s:['조식 뷔페는 아침 10시까지예요. 🍳'],ch:{'🍽 주문하기':()=>showCafe('hotelF')}},{x:22,y:8,stay:1,c:'#1e3a8a',h:'#222',n:'연회장 담당',s:['주말엔 결혼식이 많아요. 💐']},{x:12,y:8,c:'#475569',h:'#222',w:1,n:'식사하는 손님',s:['해산물이 싱싱하네요. 🦀']}]};LF(2,3,2)}
  /* 9층 */{const Q=[open('w')],t=open('ⓦ');t[0]=t[WF-1]='w';t[2]='㎊';t[15]='㏈';Q.push(t);for(let y=2;y<9;y++){const r=open('f');r[0]=r[WF-1]='w';Q.push(r)}for(let y=3;y<8;y+=2)for(let x of [4,8,20,24]){Q[y][x]='㉴';Q[y][x+1]='ㆍ'}for(let x=11;x<20;x++)Q[7][x]='k';Q.push(open('w'));M.hotel9={n:'비치 호텔 스카이 라운지',par:'haeundae',wide:1,land:[15,2],bgm:'indoor',m:Q.map(r=>r.join('')),sign:{'15,3':'스카이 라운지','15,6':'바','2,2':'계단 ↓'},d:{'2,1':['hotel8',28,2]},p:[{x:15,y:8,stay:1,c:'#111827',h:'#222',n:'바텐더',s:['해운대 야경이 제일 좋은 자리예요. 🌃'],ch:{'🍹 주문하기':()=>showCafe('hotelB')}},{x:6,y:2,c:'#be123c',h:'#3f2a1c',w:1,n:'전망 보는 손님',s:['저 멀리 수평선까지 다 보이네요. 🌊']},{x:22,y:4,c:'#0f766e',h:'#222',w:1,n:'라운지 직원',s:['창가 자리 안내해 드릴게요. 🪟']}]};LF(9,15,2)}
 }
 window.showLift=()=>{const cf=+String(cur).replace('hotel','');openM('<h3>🛗 엘리베이터</h3><div class="xcol">'+[9,8,7,6,5,4,3,2,1].map(f=>`<button class="xb big" onclick="liftGo(${f})">${f==9?'9층 스카이 라운지':f==2?'2층 식당·연회장':f==1?'1층 로비':f+'층 객실'}${f==cf?' (현재)':''}</button>`).join('')+'</div>')};window.liftGo=f=>{closeM();const L=HLIFT[f];warp('hotel'+f,L[0],L[1],0)};
 /* 토산: 서귀포와 표선 사이, 키위를 키우는 곳 */
 {const W=30,row=c=>Array(W).fill(c),Q=[row('T')];for(let y=1;y<5;y++){const r=row('.');r[0]=r[W-1]='T';Q.push(r)}Q.push(row('='));for(let y=6;y<8;y++){const r=row('.');r[0]=r[W-1]='T';Q.push(r)}Q.push(row('s'));Q.push(row('~'));Q.push(row('~'));for(let y=1;y<5;y++)for(let x=2;x<28;x++)Q[y][x]='㎯';const D=[6,15,24];D.forEach(x=>{Q[4][x]='ㅀ'});for(let x=3;x<27;x+=1){Q[6][x]=x%2?'d':'㏎';Q[7][x]='d'}[8,14,20].forEach(x=>{Q[6][x]='d';Q[7][x]='.'});
  M.town.n='삼화지구';M.tosan={n:'토산',o:1,wide:1,bgm:'route',land:[15,5],bus:5,m:Q.map(r=>r.join('')),stB:{x:2,y:1,w:26,h:4,kind:'vinyl',doors:D,dl:[],lines:[1]},sign:{'6,5':'골드키위 1동','15,5':'골드키위 2동','24,5':'그린키위 하우스','4,7':'키위 덕','1,4':'백사장 방면','28,4':'표선 방면'},e:{l:['gotF',14,5],r:['route1',0,7]},ex:{'0,8':['gotF',14,8],'29,8':['route1',0,13]},d:{},p:[{x:10,y:5,c:'#65a30d',h:'#1c1917',stay:1,n:'보성 외숙모',s:['어서 오세요~ 보성이 외숙모예요. 여기서 키위 농사 지어요. 🥝','골드키위는 후숙해서 말랑말랑할 때 먹으면 정말 맛있어요.','판매 안내는 마을 게시판에 붙여 놨어요.'],ch:{'📌 판매 안내 보기':()=>showKiwi()}},{x:20,y:7,c:'#16a34a',h:'#222',w:1,n:'키위 따는 일꾼',s:['키위는 덕 아래에 주렁주렁 달려요. 고개 들고 따야 해요. 🥝']}]};
  [['골드키위 1동',6,'#ca8a04'],['골드키위 2동',15,'#eab308'],['그린키위',24,'#65a30d']].forEach(([nm,x,c],i)=>{const id='tosanH'+(i+1),WH=25,R0=[Array(WH).fill('w'),Array(WH).fill('w')];for(let y=2;y<11;y++){const r=Array(WH).fill('d');r[0]=r[WH-1]='w';R0.push(r)}R0.push(Array(WH).fill('w'));R0[11][12]='x';[3,5,8,10].forEach(y=>{for(let a=2;a<WH-2;a++)if(a!=12&&a%2==0)R0[y][a]='㏎'});for(let y=2;y<11;y++)R0[y][12]='.';R0[2][1]='㉵';R0[10][23]='ⓡ'=='x'?'d':'d';
   M[id]={n:'토산 '+nm+' 하우스',par:'tosan',wide:1,land:[12,10],bgm:'indoor',rt:{w:'#dbeafe',w2:'#bfdbfe',f:'#a16207',l:'#854d0e',st:0},m:R0.map(r=>r.join('')),sign:{'12,2':nm+' 하우스'},d:{'12,11':['tosan',x,5]},p:[{x:9,y:4,c:c,h:'#3f2a1c',w:1,n:'키위 농장 일꾼',s:['키위는 덕을 세워서 넝쿨을 올려 키워요. 🥝','수확하고 나서 후숙해야 달아져요.']},{x:16,y:7,c:'#475569',h:'#222',w:1,n:'수확하는 사람',s:['올해 키위 알이 굵어요. 게시판에 판매 안내도 붙여 놨어요. 🥝']},{x:12,y:9,c:'#16a34a',h:'#222',stay:1,n:'하우스 일꾼',s:['문 닫고 다녀 주세요. 온기가 빠져요. 🌡','여기 사장님이 키위 하나는 정말 잘 키우세요. 🥝']}]};M.tosan.d[x+',4']=[id,12,10]});
  M.tosan.p.push({x:22,y:5,c:'#0f766e',h:'#d1d5db',stay:1,when:()=>tosanGp(),n:'보성 외할아버지',s:['아들네 키위 밭 구경 왔수다. 🥝','귤도 좋지만 키위도 맛 좋수다.']},{x:13,y:5,c:'#334155',h:'#e5e7eb',stay:1,when:()=>tosanGm(),n:'보성 외할머니',s:['메누리 일 거들레 왔수다. 🥝','올해 키위도 잘 뒈신게.']},{x:18,y:5,c:'#57534e',h:'#222',w:1,when:()=>tosanUn(),n:'보성 큰외삼촌',s:['어서 옵서. 보성이 큰외삼촌이우다. 🥝','오늘은 잠깐 덕 손보레 왔수다.']});M.tosanH1.p.push({x:7,y:6,c:'#57534e',h:'#222',w:1,when:()=>tosanUn2(),n:'보성 큰외삼촌',s:['어서 옵서. 보성이 큰외삼촌이우다. 🥝','넝쿨 묶는 중이우다. 이거 손이 많이 가요.']});
  M.gotF.e.r=['tosan',0,5];M.gotF.ex['14,8']=['tosan',0,8];M.route1.e.l=['tosan',29,5];M.route1.ex['0,13']=['tosan',29,8]}
 /* 모슬포항 */
 {const W=26,row=c=>Array(W).fill(c),Q=[row('T'),row('.'),row('.'),row('.'),row('.'),row('='),row('ㅣ'),row('ㅣ'),row('~'),row('~'),row('~'),row('~')];for(let x=3;x<7;x++){Q[2][x]='ㅊ';Q[3][x]='ㅊ'}Q[3][4]='ㅠ'=='x'?'.':'ㅊ';for(let x=10;x<14;x++){Q[3][x]='㎴';}[16,18,20,22].forEach(x=>{Q[2][x]=x%4?'T':'F'});[8,9,10,11].forEach(y=>{Q[y][6]='ㅣ';Q[y][7]='ㅣ';Q[y][18]='ㅣ';Q[y][19]='ㅣ'});Q[9][11]='3';Q[10][14]='2';Q[9][22]='3';Q[10][3]='1';
  M.moseulpo={n:'모슬포항',o:1,wide:1,bgm:'beach',land:[12,6],m:Q.map(r=>r.join('')),food:'mslF',sign:{'5,4':'여객선 터미널','12,4':'방어 식당가','7,7':'가파도 · 마라도 공사 중','19,7':'어선 부두'},e:{l:['beach',14,5],r:['tosan',0,5]},d:{},p:[{x:9,y:6,stay:1,c:'#1e3a8a',h:'#222',n:'여객선 직원',s:['가파도, 마라도 가는 배가 여기서 떠요. 🛳','게임 속 뱃길은 아직 공사 중이에요. 🚧']},{x:12,y:4,stay:1,c:'#f8fafc',h:'#222',n:'방어 식당 주인',s:['겨울엔 모슬포 방어가 제일이우다. 🐟'],ch:{'🍽 주문하기':()=>showCafe('mslF')}},{x:19,y:9,stay:1,c:'#0f766e',h:'#3f2a1c',n:'어부',s:['새벽에 나갔다 막 들어왔수다. 🎣']},{x:15,y:7,c:'#475569',h:'#222',w:1,n:'항구 구경꾼',s:['배 들어오는 거 보는 재미가 있어요. ⚓']}]}}
 /* 우도 */
 {const W=30,H=20,Q=Array.from({length:H},()=>Array(W).fill('~')),fill=(a,b,c,d,t)=>{for(let y=b;y<d;y++)for(let x=a;x<c;x++)Q[y][x]=t};fill(6,2,25,3,'s');fill(4,3,27,4,'s');fill(3,4,28,16,'.');fill(4,16,27,17,'s');fill(6,17,24,18,'s');fill(3,4,4,16,'s');fill(27,4,28,16,'s');fill(5,5,25,6,'=');fill(5,5,6,15,'=');fill(24,5,25,15,'=');fill(5,14,25,15,'=');fill(14,5,15,15,'=');fill(19,7,23,12,'㋘');Q[9][21]='㋠';fill(0,14,5,15,'ㅣ');fill(7,7,10,8,'ㅊ');fill(7,8,10,9,'ㅊ');fill(7,11,10,12,'㎴');[11,12].forEach(x=>{Q[8][x]='T';Q[11][x]='T'});[16,17].forEach(x=>{Q[8][x]='F';Q[12][x]='T'});fill(6,15,14,17,'s');[8,10,12].forEach(x=>{Q[15][x]='?'});for(let x=25;x<27;x++)Q[9][x]='T';
  M.udo={n:'우도',o:1,wide:1,bgm:'beach',land:[3,14],food:'udoF',m:Q.map(r=>r.join('')),sign:{'2,13':'천진항','8,6':'우도봉 게스트하우스','8,10':'땅콩 아이스크림','9,15':'서빈백사','21,6':'우도봉','21,8':'우도봉 정상'},d:{},p:[{x:2,y:13,stay:1,c:'#1e3a8a',h:'#222',n:'도항선 직원',s:['성산항 가는 배예요. 15분쯤 걸려요. ⛴','배 시간은 달마다 달라요.'],ch:{'⛴ 배 시간 보기':()=>showFerry('seongsan')}},{x:8,y:12,stay:1,c:'#f97316',h:'#222',n:'땅콩 가게 주인',s:['우도 땅콩 아이스크림 먹고 갑서. 🍦'],ch:{'🍽 주문하기':()=>showCafe('udoF')}},{x:12,y:13,c:'#16a34a',h:'#222',w:1,n:'스쿠터 빌린 여행객',s:['섬 한 바퀴 도는 데 금방이에요. 🛵']},{x:20,y:13,c:'#ec4899',h:'#3f2a1c',w:1,n:'사진 찍는 사람',s:['바다 색이 진짜 예뻐요. 📷']},{x:15,y:7,c:'#475569',h:'#d1d5db',stay:1,n:'우도 어르신',s:['소가 누워 있는 모양이라 우도라 허주. 🐄']}]}}
 /* 성산: 성산일출봉 */
 {const W=34,H=28,Q=Array.from({length:H},()=>Array(W).fill('㏄')),fill=(a,b,c,d,t)=>{for(let y=b;y<d;y++)for(let x=a;x<c;x++)Q[y][x]=t};fill(8,0,26,11,'㎯');fill(9,11,25,12,'.');fill(7,12,27,14,'.');fill(5,14,29,20,'.');fill(3,20,31,25,'.');fill(0,25,W,26,'=');fill(0,26,W,28,'.');for(let x=30;x<W;x++){Q[25][x]='㏄';Q[26][x]='㏄';Q[27][x]='㏄'}
  const path=[[17,24],[17,21],[12,21],[12,18],[20,18],[20,15],[15,15],[15,12],[17,12],[17,11]];for(let i=0;i<path.length-1;i++){let[x,y]=path[i];const[a,b]=path[i+1];Q[y][x]='㏋';while(x!=a||y!=b){if(x!=a)x+=Math.sign(a-x);else y+=Math.sign(b-y);Q[y][x]='㏋'}}fill(10,23,25,25,'ㅣ');for(let x=11;x<15;x++)Q[22][x]='㏖';[[6,23],[7,23],[6,24],[7,24]].forEach(([x,y])=>{Q[y][x]='㎾'});[[21,23],[22,23],[23,23],[27,23],[28,23]].forEach(([x,y])=>{Q[y][x]='㎾'});for(let x=7;x<10;x++){Q[19][x]='㏕'}for(let x=23;x<26;x++){Q[19][x]='㏕'}[6,10,24,28].forEach(x=>{Q[14][x]='㏌'});fill(3,26,6,28,'ㅊ');fill(10,26,13,28,'ㅊ');fill(15,26,18,28,'ㅈ');fill(21,26,24,28,'ㅊ');Q[26][7]=Q[27][7]='=';Q[11][19]='㋠';Q[11][18]='㏋';
  M.seongsan={n:'성산',o:1,wide:1,bgm:'route',land:[17,24],slow:230,m:Q.map(r=>r.join('')),stB:{x:8,y:0,w:18,h:11,kind:'seongsanTop',doors:[],dl:[],lines:[1]},sign:{'17,11':'성산일출봉 정상','8,18':'해녀물질 공연장','24,18':'말타는 곳','12,21':'유네스코 세계자연유산','17,24':'매표소','6,22':'주차장','27,23':'우도 가는 배','4,25':'성산 마을','16,25':'기념품 거리','8,26':'민속촌 방면'},d:{},p:[{x:27,y:24,stay:1,c:'#0f766e',h:'#222',n:'도항선 직원',s:['우도 가는 배예요. 15분쯤 걸려요. ⛴','배 시간은 달마다 달라요.'],ch:{'⛴ 배 시간 보기':()=>showFerry('udo')}},{x:19,y:24,stay:1,c:'#1e3a8a',h:'#222',n:'매표소 직원',s:['어서 오세요. 성산일출봉입니다. 🌄','정상까지 천천히 걸어 25분쯤 걸려요. 계단이 꽤 많아요.']},{x:9,y:20,stay:1,c:'#0f766e',h:'#e5e7eb',n:'해녀 삼춘',s:['해녀 물질 공연 보고 갑서. 🐚','바당 일은 숨비소리로 시작허는 거주.']},{x:24,y:20,stay:1,c:'#92400e',h:'#222',n:'승마 체험 직원',s:['말 타고 일출봉 한번 봅서. 🐎']},{x:16,y:13,c:'#2563eb',h:'#3f2a1c',w:1,n:'등산객',s:['계단이 끝이 없네요. 그래도 경치가 좋아요. 🥵']},{x:20,y:11,stay:1,c:'#dc2626',h:'#222',n:'일출 보러 온 사람',s:()=>{const h0=jejuNow().h;return[h0<8?'해 뜨는 거 보려고 새벽부터 올라왔어요. 🌅':'다음엔 새벽에 와서 일출 보려고요. 🌅','분화구가 진짜 넓네요.']}},{x:6,y:25,c:'#ea580c',h:'#222',w:1,n:'성산 주민',s:['관광객 많이 오는 날은 길이 꽉 막혀요. 🚗']},{x:18,y:26,c:'#f59e0b',h:'#222',stay:1,n:'기념품 가게 직원',s:['귤 초콜릿 하나 사 가세요. 🍊']}]}}
 /* 한라산: 성판악 → 삼나무 숲 → 속밭 → 사라오름 입구 → 진달래밭 → 구상나무 지대 → 백록담. 구불구불 길고, 올라갈수록 걸음이 느려짐 */
 {const W=31,S=(Q)=>Q.map(r=>r.join(''));const mk=(H,seed,bg,path,x0)=>{let s=seed;const rd=()=>(s=(s*16807)%2147483647)/2147483647,Q=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>bg(rd(),x,y))),cells=[];const put=(x,y)=>{Q[y][x]=path;cells.push([x,y])};let x=x0,y=H-1;put(x,y);while(y>4){const dy=3+(rd()*3|0),ny=Math.max(2,y-dy);while(y>ny){y--;put(x,y)}let tx;do{tx=2+(rd()*(W-4)|0)}while(Math.abs(tx-x)<9);const st=tx>x?1:-1;while(x!=tx){x+=st;put(x,y);if(rd()<.14&&y>2&&y<H-2){const yy=y+(rd()<.5?1:-1);if(Q[yy][x]!=path)Q[yy][x]=path}}}const st=x0>x?1:-1;while(y>1){y--;put(x,y)}while(x!=x0){x+=st;put(x,1)}put(x0,0);const at=f=>cells[Math.min(cells.length-1,f*cells.length|0)];return{Q,cells,at}};
  const rest=(T,f,w,h0,fill)=>{const[cx,cy]=T.at(f),H=T.Q.length;for(let y=Math.max(2,cy-(h0>>1));y<Math.min(H-2,cy+h0-(h0>>1));y++)for(let x=Math.max(2,cx-(w>>1));x<Math.min(W-2,cx+w-(w>>1));x++)if(T.Q[y][x]!='=' &&T.Q[y][x]!='㏋')T.Q[y][x]=fill;return[cx,cy]};
  /* 1구간: 삼나무 숲 */const A=mk(50,7741,(r,x,y)=>r<.62?'㏏':r<.8?'T':r<.92?'㏐':r<.96?'F':'.','=',15);for(let y=43;y<50;y++)for(let x=5;x<26;x++)A.Q[y][x]='.';for(let x=7;x<11;x++){A.Q[44][x]='ㅊ';A.Q[45][x]='ㅊ'}for(let x=18;x<25;x++)A.Q[47][x]='㎾';[43,44,45,46,47,48,49].forEach(y=>{A.Q[y][15]='='});A.Q[46][5]='㉵';const a1=rest(A,.42,5,3,'.'),a2=rest(A,.86,9,5,'.');A.Q[a1[1]][a1[0]+2]='㉴';for(let x=a2[0]-3;x<a2[0]-1;x++)if(A.Q[a2[1]-1])A.Q[a2[1]-1][x]='㏕';A.Q[a2[1]+1][a2[0]+3]='㉴';A.Q[a1[1]+1][a1[0]-2]='㏒';A.cells.forEach(([x,y])=>{A.Q[y][x]='='});{const g0=A.cells.find(c=>c[1]<43);A.Q[g0[1]][g0[0]]='㏊'}
  /* 2구간: 조릿대와 진달래 */const B=mk(52,3313,(r,x,y)=>r<.3?'㏐':r<.5?'T':r<.66?'㏑':r<.78?'㏌':r<.88?'㏏':'.','=',15);const b1=rest(B,.33,5,3,'.'),b2=rest(B,.86,11,5,'.');B.Q[b1[1]-1][b1[0]+2]='㏔';B.Q[b1[1]+1][b1[0]-2]='㉴';for(let x=b2[0]-4;x<b2[0]-1;x++)if(B.Q[b2[1]-2])B.Q[b2[1]-2][x]='㏕';B.Q[b2[1]+2]&&(B.Q[b2[1]+2][b2[0]+4]='㉴');B.cells.forEach(([x,y])=>{B.Q[y][x]='='});const gateC=B.cells[B.cells.length-4];B.Q[gateC[1]][gateC[0]]='㏊';
  /* 사라오름 갈림길: 오른쪽 끝으로 빠지는 샛길 */const brY=(B.at(.52))[1],brX=(B.at(.52))[0];for(let x=brX;x<W;x++)if(B.Q[brY][x]!='=')B.Q[brY][x]='㏋';
  /* 3구간: 구상나무와 돌계단 */const C=mk(46,9127,(r,x,y)=>r<.28?'㏓':r<.46?'㏍':r<.72?'㏌':r<.88?'㏐':'.','㏋',15);const c1=rest(C,.5,5,3,'.');C.Q[c1[1]+1][c1[0]-2]='㉴';C.Q[c1[1]-1][c1[0]+2]='㏒';C.cells.forEach(([x,y])=>{C.Q[y][x]='㏋'});{const g0=C.cells[C.cells.length-4];C.Q[g0[1]][g0[0]]='㏊';C.gate=g0}
  /* 정상 */const WD=31,D=Array.from({length:12},(_,y)=>Array.from({length:WD},(_,x)=>y<9&&x>=3&&x<28?'㎯':'㏌'));for(let y=9;y<12;y++)D[y][15]='㏋';for(let x=4;x<27;x++){D[9][x]='㏋';D[10][x]='㏋'}D[10][19]='㋠';[8,23].forEach(x=>{D[11][x]='㉴'});
  /* 사라오름 */const E=Array.from({length:14},(_,y)=>Array.from({length:21},(_,x)=>y<7&&x>=2&&x<19?'㎯':(y>=8&&y<=9&&x<19)?'㏋':(x+y)%3==0?'㏓':'㏐'));for(let x=0;x<3;x++)E[8][x]='㏋';
  const bot=(T)=>T.Q.length-1;
  M.halla={n:'한라산 성판악',o:1,wide:1,bgm:'route',land:[15,47],slow:240,snow:1,m:S(A.Q),sign:{'8,43':'탐방안내소','15,46':'성판악 해발 750m','21,46':'주차장',[A.at(.25).join()]:'삼나무 숲길',[a1.join()]:'쉼터 해발 850m',[A.at(.65).join()]:'해발 950m',[a2.join()]:'속밭 대피소 해발 1,000m'},ex:{'15,0':['halla2',15,bot(B)-1]},d:{},p:[{x:12,y:46,stay:1,c:'#166534',h:'#222',n:'탐방안내소 직원',s:()=>['백록담까지 편도 4시간 반은 잡으셔야 해요. 물이랑 간식 꼭 챙기세요. 🥾',hallaWin()?'지금은 동절기예요. 입산과 진달래밭 통과는 오전 11시 30분까지, 정상 하산은 오후 1시 30분까지예요.':'지금은 하절기예요. 입산은 오후 12시 30분까지예요.','실제로 갈 땐 진달래밭~정상 구간 탐방 예약이 필요해요. 공원 안내를 꼭 확인하세요.']},{x:17,y:48,stay:1,c:'#1e3a8a',h:'#222',n:'버스 기사',s:['삼화지구 가는 버스예요. 🚌'],ch:{'🚌 삼화지구 가기':()=>busGo('town','한라산 버스',7000)}},{x:12,y:48,c:'#dc2626',h:'#3f2a1c',w:1,n:'등산객',s:['오늘 날씨 좋아서 백록담 보일 것 같아요. 🥾']},{x:a1[0]-1,y:a1[1]-1,c:'#ea580c',h:'#222',stay:1,n:'쉬어 가는 등산객',s:['아직 초입인데 벌써 숨차요. 😮‍💨','삼나무 향이 참 좋네요. 🌲']},{x:a2[0]+2,y:a2[1]+1,c:'#0f766e',h:'#3f2a1c',stay:1,n:'속밭 대피소 직원',s:['여기까지가 몸풀기예요. 여기부터 조금씩 가팔라져요. ⛰']}]};
  M.halla2={n:'한라산 진달래밭',par:'halla',o:1,wide:1,bgm:'route',land:[15,bot(B)-1],slow:300,snow:1,m:S(B.Q),sign:{[(b1.join())]:'샘터',[B.at(.52).join()]:'사라오름 입구 해발 1,300m',[(W-3)+','+brY]:'사라오름 →',[b2.join()]:'진달래밭 대피소 해발 1,500m',[gateC.join()]:'진달래밭 통제소',[B.at(.7).join()]:'가파른 오르막'},ex:{['15,'+bot(B)]:['halla',15,1],'15,0':['halla3',15,bot(C)-1],[(W-1)+','+brY]:['saraoreum',0,8]},d:{},p:[{x:b2[0]+2,y:b2[1]+1,stay:1,c:'#166534',h:'#222',n:'진달래밭 대피소 직원',s:['정상 가려면 통제소를 시간 안에 지나야 해요. 동절기엔 오전 11시 30분까지예요. ⛰','여기가 마지막 쉼터예요. 위로는 많이 험해요.','봄엔 이 주변이 온통 털진달래로 물들어요. 🌸']},{x:b1[0]-1,y:b1[1],c:'#2563eb',h:'#222',stay:1,n:'지친 등산객',s:['샘물 한 모금 마시니 살 것 같아요. 🥵','다리가 후들거려요. 그래도 왔으니 가야죠.']}]};
  M.saraoreum={n:'사라오름',par:'halla',o:1,wide:1,bgm:'route',land:[1,8],slow:300,m:S(E),stB:{x:2,y:0,w:17,h:7,kind:'baek',doors:[],dl:[],lines:[1]},sign:{'10,7':'사라오름 산정호수','3,8':'전망대'},ex:{'0,8':['halla2',W-2,brY]},d:{},p:[{x:14,y:9,c:'#a78bfa',h:'#222',stay:1,n:'전망대의 등산객',s:['비 온 다음 날이면 호수에 물이 가득 차요. 🌊','정상 안 가도 여기 경치가 끝내줘요.']}]};
  M.halla3={n:'한라산 구상나무 지대',par:'halla',o:1,wide:1,bgm:'route',land:[15,bot(C)-1],slow:380,snow:1,m:S(C.Q),sign:{[C.at(.1).join()]:'해발 1,600m',[c1.join()]:'구상나무 숲 쉼터',[C.at(.75).join()]:'해발 1,800m',[C.at(.95).join()]:'정상까지 조금만 더'},ex:{['15,'+bot(C)]:['halla2',15,1],'15,0':['halla4',15,10]},d:{},p:[{x:c1[0]-1,y:c1[1]-1,c:'#7c3aed',h:'#222',stay:1,n:'계단에서 쉬는 등산객',s:['바람이 정말 세네요. 정상이 눈앞인데 안 나와요. 💨']},{x:c1[0]+2,y:c1[1]+1,c:'#0f766e',h:'#3f2a1c',stay:1,n:'사진 찍는 등산객',s:['말라 죽은 구상나무도 멋있어요. 📷','한라산에서 제일 멋진 풍경이에요.']}]};
  M.halla4={n:'한라산 정상 백록담',par:'halla',o:1,wide:1,bgm:'route',land:[15,10],slow:380,snow:1,m:S(D),stB:{x:3,y:0,w:25,h:9,kind:'baek',doors:[],dl:[],lines:[1]},sign:{'15,8':'백록담','19,9':'동능 정상 해발 1,947m','8,10':'쉼터'},ex:{'15,11':['halla3',15,1]},d:{},p:[{x:10,y:10,c:'#dc2626',h:'#222',stay:1,n:'정상의 등산객',s:['드디어 왔다! 남한에서 제일 높은 곳이에요. 🏔']},{x:18,y:10,c:'#2563eb',h:'#3f2a1c',stay:1,n:'인증 사진 줄 선 사람',s:['표지석 앞에서 사진 찍으려고 줄 서 있어요. 📸']},{x:6,y:9,c:'#166534',h:'#222',stay:1,n:'국립공원 직원',s:['고생하셨어요. 내려갈 때 무릎 조심하세요. 🥾','정상에서는 오후 1시 30분까지는 하산을 시작해 주세요.']}]};
  const nearOf=(id,dx)=>{const Z=M[id],L=Z.land||[7,5];for(let r=1;r<8;r++)for(const[a,b]of [[r,0],[-r,0],[0,r],[0,-r],[r,r],[-r,r],[r,-r],[-r,-r]]){const X=L[0]+a,Y=L[1]+b,c=Z.m[Y]&&Z.m[Y][X];if(c&&'.ㅣf'.includes(c)&&!(Z.p||[]).some(n=>n.x==X&&n.y==Y)&&!(Z.d&&(Z.d[X+','+Y]||Z.d[X+','+(Y-1)])))return{x:X,y:Y}}return{x:L[0]+dx,y:L[1]}};[['airport',4],['town',3],['cityhall',3]].forEach(([id,dx])=>{const q=nearOf(id,dx);M[id].p=M[id].p||[];M[id].p.push({x:q.x,y:q.y,stay:1,c:'#166534',h:'#222',n:'한라산 버스 기사',s:['성판악까지 가요. 등산은 아침 일찍 시작하셔야 해요. ⛰'],ch:{'🚌 한라산 가기':()=>busGo('halla','한라산 버스',8000)}})})}
 hall('seoul','서울역','seoul','seoul',[11,7]);hall('busan','부산역','busan','busan',[17,7]);hall('yeongdeungpo','영등포역','yeongdeungpo','yeongdeungpo',[5,5]);
 {const Z=M.seoulSt,Q=Z.m.map(r=>[...r]);Q[13][26]='x';Z.m=Q.map(r=>r.join(''));Z.d['26,13']=['seoulMall',15,12];Z.sign['26,12']='아울렛 연결'}
 const MK=(id,n,par,W,rows,exit,extra)=>{const y0=[2,6,10].slice(0,rows.length),Hh=y0[y0.length-1]+4,Q=[];Q.push(Array(W).fill('w'));Q.push(Array(W).fill('w'));for(let y=2;y<Hh-1;y++){const r=Array(W).fill('f');r[0]=r[W-1]='w';Q.push(r)}Q.push(Array(W).fill('w'));const dx=W>>1;Q[Hh-1][dx]='x';const G0=[[2,5],[7,11],[13,14],[16,17],[19,23],[25,28]],stall={},sign={[dx+',1']:n};y0.forEach((y,ro)=>G0.forEach(([a,b],gi)=>{const[nn,ic,c,food,L]=rows[ro][gi],S={n:nn,ic,food,it:L};for(let x=a;x<=b;x++){Q[y][x]='㎉';stall[x+','+y]={c,art:L[(x-a)%L.length],S}}sign[(a+b>>1)+','+y]=nn}));const Y1=y0[0]+2;[[13,Y1],[17,Y1]].forEach(([x,y])=>{Q[y][x]='ㆎ';Q[y][x+1]='ㆍ';Q[y][x+2]='ㆎ'});M[id]={n,par,wide:1,land:[dx,Hh-2],bgm:'town',m:Q.map(r=>r.join('')),stall,sign,d:{[dx+','+(Hh-1)]:exit},p:[...[[4,Y1,'#7c3aed'],[9,Y1+1,'#0f766e'],[21,Y1,'#dc2626'],[26,Y1+1,'#2563eb'],[11,Hh-2,'#ea580c'],[22,Hh-2,'#475569']].map(([x,y,c],i)=>({x,y,c,h:i%2?'#222':'#3f2a1c',w:1,n:'구경하는 손님',s:[['둘러보다 보니 시간 다 갔네요. 🛍','이거 괜찮지 않아요?','기차 시간까지 구경하는 중이에요.','먹고 쇼핑할까요, 쇼핑하고 먹을까요?'][i%4]]})),...(extra||[])]}};
 MK('seoulMall','서울역 아울렛 1층','seoulSt',31,[[['스포츠웨어','👟','#2563eb',0,['트레이닝복','운동화','바람막이','후드티']],['가방·잡화','👜','#b45309',0,['백팩','크로스백','지갑','벨트','머플러']],['모자','🧢','#0ea5e9',0,['야구 모자','비니']],['양말','🧦','#db2777',0,['양말','수면 양말']],['남성복','👔','#334155',0,['셔츠','코트','정장 바지','니트','재킷']],['여성복','👗','#a855f7',0,['원피스','블라우스','가디건','스커트']]],[['신발','👞','#78350f',0,['구두','스니커즈','샌들','부츠']],['화장품','💄','#ec4899',0,['립스틱','핸드크림','향수','선크림','스킨']],['안경','👓','#0f766e',0,['안경','선글라스']],['시계','⌚','#475569',0,['손목시계','탁상시계']],['캐주얼','👕','#16a34a',0,['맨투맨','청바지','반팔 티셔츠','패딩','조끼']],['아동복','🧒','#f59e0b',0,['아동 티셔츠','아동 패딩','아동 운동화','아동 모자']]],[['아웃도어','🏕','#15803d',0,['등산화','등산복','등산 가방','텐트']],['여행용품','🧳','#1d4ed8',0,['캐리어','목베개','여행 파우치','보조 배터리','우산']],['기념품','🎁','#dc2626',0,['서울 엽서','열쇠고리']],['문구','✏','#ca8a04',0,['다이어리','볼펜']],['서점','📚','#7c2d12',0,['소설책','여행 책','수험서','잡지','만화책']],['꽃집','💐','#e11d48',0,['꽃다발','작은 화분','장미','튤립']]]],['seoulSt',26,12]);
 MK('seoulMall2','서울역 아울렛 2층','seoulMall',31,[[['한식','🍲','#b91c1c',1,['된장찌개','비빔밥','불고기','제육덮밥']],['일식','🍣','#0f766e',1,['돈가스','초밥','우동','연어덮밥','냉모밀']],['중식','🍜','#dc2626',1,['짜장면','짬뽕']],['양식','🍝','#ca8a04',1,['파스타','피자']],['분식','🍢','#ea580c',1,['떡볶이','김밥','라면','튀김','만두']],['치킨·버거','🍗','#92400e',1,['치킨','햄버거','감자튀김','콜라']]],[['빵집','🥐','#b45309',1,['소금빵','크루아상','식빵','단팥빵']],['카페','☕','#0f766e',1,['아이스 아메리카노','따뜻한 라떼','바닐라 라떼','녹차 라떼','감귤 주스']],['도넛','🍩','#db2777',1,['글레이즈 도넛','초코 도넛']],['디저트','🍰','#a855f7',1,['티라미수','당근 케이크']],['아이스크림','🍦','#0ea5e9',1,['딸기 아이스크림','초코 아이스크림','바닐라 아이스크림','녹차 아이스크림','감귤 아이스크림']],['식료품','🛒','#16a34a',0,['과일 바구니','도시락','생수','과자']]],[['가전','📱','#334155',0,['이어폰','스피커','전기포트','선풍기']],['장난감','🧸','#f59e0b',0,['곰 인형','블록','보드게임','미니카','퍼즐']],['음반','💿','#7c3aed',0,['음반','엘피']],['사진','📷','#475569',0,['필름 카메라','앨범']],['생활용품','🛋','#0891b2',0,['쿠션','담요','머그컵','수건','디퓨저']],['운동','🏀','#ea580c',0,['농구공','요가 매트','아령','줄넘기']]]],['seoulMall',3,12]);
 {const A=M.seoulMall,B=M.seoulMall2,QA=A.m.map(r=>[...r]),QB=B.m.map(r=>[...r]);QA[12][3]='㎊';QB[12][3]='㎊';QA[12][27]='㎊';QB[12][27]='㎊';A.m=QA.map(r=>r.join(''));B.m=QB.map(r=>r.join(''));Object.assign(A.d,{'3,12':['seoulMall2',4,12],'27,12':['seoulMall2',26,12]});Object.assign(B.d,{'3,12':['seoulMall',4,12],'27,12':['seoulMall',26,12]});A.sign['3,11']='2층 ↑';A.sign['27,11']='2층 ↑';B.sign['3,11']='1층 ↓';B.sign['27,11']='1층 ↓';B.d={...B.d};delete B.d['15,13'];QB[13][15]='w';B.m=QB.map(r=>r.join(''))}
 MK('hdMarket','해운대 전통시장','haeundae',31,[[['밀면','🍜','#0284c7',1,['물밀면','비빔밀면','만두']],['돼지국밥','🍲','#b91c1c',1,['돼지국밥','순대국밥','수육']],['호떡','🥞','#b45309',1,['씨앗호떡']],['어묵','🍢','#ea580c',1,['어묵','어묵바']],['곰장어','🔥','#7f1d1d',1,['곰장어 구이','양념 곰장어']],['횟집','🐟','#0f766e',1,['모둠회','물회','매운탕']]],[['건어물','🐙','#92400e',0,['쥐포','오징어','멸치','김']],['떡볶이','🌶','#dc2626',1,['떡볶이','튀김','순대']],['과일','🍊','#f97316',0,['귤','사과']],['기념품','🎁','#7c3aed',0,['부산 엽서','갈매기 인형']],['옷가게','👕','#2563eb',0,['반팔 티셔츠','모자','슬리퍼','비치타월']],['전집','🥘','#ca8a04',1,['해물파전','김치전']]]],['haeundae',8,17]);
 {const W=40,H0=34,Q=Array.from({length:H0},()=>Array(W).fill('.')),fill=(a,b,c,d,t)=>{for(let y=b;y<d;y++)for(let x=a;x<c;x++)Q[y][x]=t};
  fill(0,0,13,6,'㎯');fill(13,0,27,6,'㎯');fill(27,0,40,6,'㎯');Q[5][20]='ㅀ';fill(0,6,40,7,'ㅣ');fill(0,7,40,9,'ㄹ');fill(0,9,40,10,'ㅣ');
  /* 구남로 */fill(16,10,24,18,'ㅣ');fill(0,10,15,17,'㎯');fill(25,10,40,17,'㎯');fill(15,10,16,18,'F');fill(24,10,25,18,'F');[11,13,15].forEach(y=>{Q[y][17]='T';Q[y][22]='T'});fill(0,17,16,18,'ㅣ');fill(24,17,40,18,'ㅣ');Q[16][8]='ㅀ';Q[16][34]='ㅀ';Q[16][28]='ㅀ';
  /* 해변로와 산책로 */fill(0,18,40,20,'ㄹ');fill(0,20,40,21,'ㅣ');[2,6,10,14,25,29,33,37].forEach(x=>{Q[21][x]='T'});fill(0,21,40,22,'ㅣ');[3,7,11,14,25,29,33,37].forEach(x=>{Q[21][x]='T'});fill(15,21,25,24,'ㅣ');[[18,22],[19,22],[20,22],[21,22],[18,23],[19,23],[20,23],[21,23]].forEach(([x,y])=>{Q[y][x]='ㅣ'});
  /* 백사장과 바다 */fill(0,22,15,28,'s');fill(25,22,40,28,'s');fill(15,24,25,28,'s');[3,7,11,28,32,36].forEach(x=>{Q[24][x]='?';Q[25][x]=';'});fill(0,28,40,29,'㏂');fill(0,29,40,H0,'㏄');
  M.haeundae={n:'해운대',o:1,wide:1,bgm:'beach',land:[20,6],fo:null,m:Q.map(r=>r.join('')),stB:{x:13,y:0,w:14,h:6,kind:'hdSt',nm:'해운대',doors:[20],dl:[],lines:[1]},stBs:[{x:0,y:0,w:13,h:6,kind:'hdTow',doors:[],dl:[],lines:[1]},{x:27,y:0,w:13,h:6,kind:'hdTow',doors:[],dl:[],lines:[1]},{x:0,y:10,w:15,h:7,kind:'hdBlock',doors:[8],dl:[],lines:[1],seed:0},{x:25,y:10,w:15,h:7,kind:'hdBlock',doors:[34,28],lb:'비치 호텔',dl:[],lines:[1],seed:1}],sign:{'20,6':'해운대역','20,9':'구남로','8,17':'해운대 시장','20,21':'해운대해수욕장 광장','5,22':'백사장','10,8':'BRT 정류장','34,17':'비치 호텔 정문','28,17':'호텔 후문'},d:{'8,16':['hdMarket',15,8],'34,16':['hotel1',15,12],'28,16':['hotel1',26,12]},p:[{x:6,y:9,stay:1,c:'#1e3a8a',h:'#222',n:'부산역 가는 버스 기사',s:['부산역까지 금방이에요. 🚌'],ch:{'🚌 부산역 가기':()=>busGo('busan','부산역 버스',8000)}},{x:12,y:24,c:'#38bdf8',h:'#222',w:1,n:'맨발로 걷는 사람',s:['모래가 참 곱네요. 🏖']},{x:30,y:26,c:'#f43f5e',h:'#3f2a1c',w:1,n:'사진 찍는 여행객',s:['오늘 바다 색 진짜 예뻐요. 📷']},{x:19,y:12,c:'#475569',h:'#d1d5db',w:1,n:'부산 토박이 어르신',s:['구남로 따라 쭉 내려가면 바로 바다다 아이가. 🌊','여름엔 사람이 억수로 많다.']},{x:21,y:15,c:'#16a34a',h:'#222',w:1,n:'구남로 산책객',s:['해변까지 걷는 이 길이 제일 좋아요. 🌳']},{x:34,y:20,c:'#ea580c',h:'#222',w:1,n:'조깅하는 사람',s:['해변 따라 달리기 딱이에요. 🏃']},{x:20,y:31,c:'#0ea5e9',h:'#222',stay:1,swim:[12,28,3],n:'수영하는 사람',s:['(열심히 수영 중이다. 🏊)']}]};
  M.busan.p.push({x:12,y:13,stay:1,c:'#1e3a8a',h:'#222',n:'해운대 가는 버스 기사',s:['해운대 바다 보러 가세요? 🌊'],ch:{'🚌 해운대 가기':()=>busGo('haeundae','해운대 버스',8000)}});M.busan.sign['12,12']='해운대 버스'}
 /* 공항: 국내선과 국제선 청사는 떨어져 있어 바깥 지도를 따로 둠 */
 /* 김포공항: 한 지도 안에 국내선 청사와 떨어진 국제선 청사 */
 {const G=M.gimpo,W0=40,ext=[['.'],['r'],['y'],['u'],['u'],['.'],['.'],['ㄹ'],['.'],['T']];const Q=G.m.map((r,y)=>[...r,...Array(W0-15).fill(ext[y][0])]);Q[6][11]='j';[[3,20],[4,20],[3,21],[4,21],[3,22],[4,22],[3,32],[4,32],[3,33],[4,33],[3,34],[4,34]].forEach(([y,x])=>{Q[y][x]='e'});for(let x=24;x<37;x++){Q[5][x]='n';Q[6][x]='j'}Q[6][30]='D';[16,17,18].forEach(x=>{Q[5][x]='+';Q[6][x]=','});for(let x=15;x<W0;x+=3)if(x%2)Q[8][x]='T';Q[8][21]='F';G.m=Q.map(r=>r.join(''));G.wide=1;G.plane2=[27,3];delete G.d['11,6'];delete G.sign['11,5'];Object.assign(G.sign,{'30,5':'김포공항 국제선 청사','17,4':'격납고','20,8':'국제선 청사 →'});G.d['30,6']=['gimpoI',7,8];M.gimpoI.d['7,9']=['gimpo',30,7];G.p.push({x:22,y:8,stay:1,c:'#0f766e',h:'#222',n:'청사 안내원',s:['국내선 청사는 왼쪽, 국제선 청사는 오른쪽이에요. 꽤 떨어져 있어요. 🚶']},{x:34,y:8,c:'#a78bfa',h:'#222',w:1,n:'캐리어 든 여행객',s:['국제선은 저쪽 건물이더라고요. 잘못 내릴 뻔했어요. 🧳']});M.gimpoT.p.find(q=>/수속/.test(q.n)).ch={'✈ 비행기 타기':()=>showFlight(),'📡 실제 김포공항 현황':()=>{FB.air='GMP';showAirBoard('D')}};M.gimpoT.p.find(q=>/수속/.test(q.n)).s=['BS 에어입니다. 어디로 가시나요? ✈']}
 /* 김해공항: 왼쪽 국내선 청사, 가운데 경전철 공항역과 주차장, 오른쪽 국제선 청사 */
 {const WG=46,Q=[Array(WG).fill('.'),Array(WG).fill('r'),Array(WG).fill('y')];for(let y=3;y<5;y++){const r=Array(WG).fill('u');[3,4,5,14,15,16,29,30,31,40,41,42].forEach(x=>r[x]='e');Q.push(r)}for(let y=5;y<10;y++)Q.push(Array(WG).fill('u'));for(let y=5;y<10;y++){for(let x=3;x<18;x++)Q[y][x]='㎯';for(let x=28;x<44;x++)Q[y][x]='㎯'}Q[9][10]='ㅀ';Q[9][35]='ㅀ';for(let y=7;y<10;y++)for(let x=20;x<25;x++)Q[y][x]='.';[20,21,22].forEach(x=>{Q[5][x]='+';Q[6][x]=','});Q.push(Array(WG).fill('ㅣ'));Q.push(Array(WG).fill('ㄹ'));Q.push(Array(WG).fill('ㅣ'));Q.push(Array(WG).fill('T'));[19,20,21,22,23,24,25,26].forEach(x=>{Q[12][x]='㎾'});
  M.gimhae={n:'김해공항',o:1,wide:1,bgm:'route',plane:[8,3],plane2:[34,3],land:[10,10],m:Q.map(r=>r.join('')),fac:{'11,1':'ttP'},stB2:{x:3,y:5,w:15,h:5,kind:'gimhaeD',nm:'국내선',doors:[10],dl:[],lines:[1]},stB3:{x:28,y:5,w:16,h:5,kind:'gimhaeI',nm:'국제선',doors:[35],dl:[],lines:[1]},sign:{'10,10':'국내선 청사','35,10':'국제선 청사','22,10':'경전철 공항역','22,12':'주차장','6,12':'공항 리무진','21,4':'격납고'},d:{'10,9':['gimhaeT',15,14],'35,9':['gimhaeI',15,14]},p:[{x:6,y:12,stay:1,c:'#1e3a8a',h:'#222',n:'리무진 기사',s:['부산역이랑 해운대 가는 리무진이에요. 🚌'],ch:{'🚌 부산역 가기':()=>busGo('busan','공항 리무진',8000),'🚌 해운대 가기':()=>busGo('haeundae','공항 리무진',8000)}},{x:14,y:10,c:'#fb7185',h:'#3f2a1c',w:1,n:'부산 온 여행객',s:['국밥 먹으러 바로 갑니다. 🍲']},{x:30,y:10,c:'#a78bfa',h:'#222',w:1,n:'캐리어 든 사람',s:['국제선 청사는 저쪽이래요. 국내선 청사랑 꽤 떨어져 있네요. 🧳']},{x:27,y:10,c:'#0f766e',h:'#222',stay:1,n:'청사 안내원',s:['국내선 청사는 왼쪽, 국제선 청사는 오른쪽이에요. 걸어서도 갈 수 있어요. 🚶']}]}}
 const TERM=(id,nm,out,intl,sign)=>{const WT=31,HT=16,Q=[Array(WT).fill('㎽')],t=Array(WT).fill('w');[4,10,16,22].forEach(x=>t[x]='l');Q.push(t);for(let y=2;y<HT-1;y++){const r=Array(WT).fill('f');r[0]=r[WT-1]='w';Q.push(r)}Q.push(Array(WT).fill('w'));Q[HT-1][15]='x';
  /* 카운터 뒤 수하물 벨트: 카운터에 맡긴 짐이 벨트를 타고 벽 안으로 들어감 */for(let x=2;x<29;x++){Q[2][x]='㏇';Q[4][x]='k'}Q[2][29]='ⓡ';
  /* 지그재그 줄: 입구는 가운데 통로 쪽, 줄 끝은 카운터 앞 */[[3,13],[17,27]].forEach(([a,b],g0)=>{for(let x=a;x<=b;x++){Q[6][x]='㎾';Q[8][x]='㎾';Q[10][x]='㎾'}if(g0==0){Q[6][a]='f';Q[8][b]='f'}else{Q[6][b]='f';Q[8][a]='f'}});
  [[22,12],[23,12],[24,12],[25,12],[26,12]].forEach(([x,y])=>{Q[y][x]='㎻'});[3,4,5].forEach(x=>{Q[12][x]='k'});[[8,13],[16,13]].forEach(([x,y])=>{for(let i=0;i<5;i++)Q[y][x+i]='㉴'});Q[13][1]='㎲';Q[14][1]='㎲';Q[14][26]=Q[14][27]='㎴';
  const COL=['#1e3a8a','#0369a1','#0f766e','#1d4ed8'],staff=[];for(let x=3;x<28;x+=3)staff.push({x,y:3,stay:1,c:COL[(x/3|0)%4],h:(x%2)?'#222':'#3f2a1c',n:intl?'체크인 직원':'수속 직원',s:intl?['국제선 청사입니다. 여권 먼저 보여 주세요. BS 에어 국제선은 아직 취항 준비 중이에요. ✈']:['BS 에어입니다. 어디로 가시나요? 짐은 저울에 올려 주세요. 🧳'],ch:intl?{'🗺 여행 지도 보기':()=>showTravel(),'📡 실제 현황':()=>{FB.air=map.bb?map.bb.air:'PUS';showAirBoard('I')}}:{'✈ 비행기 타기':()=>showFlight(),'📡 실제 현황':()=>{FB.air=map.bb?map.bb.air:'PUS';showAirBoard('D')}}});
  const queue=[[4,5],[5,5],[6,5],[8,5],[10,5],[18,5],[20,5],[21,5],[23,5],[25,5],[5,7],[7,7],[9,7],[11,7],[19,7],[21,7],[24,7],[6,9],[9,9],[20,9],[23,9]].map(([x,y],i)=>({x,y,stay:1,dir:0,c:['#7c3aed','#0ea5e9','#be123c','#ca8a04','#16a34a','#475569'][i%6],h:i%2?'#222':'#3f2a1c',n:'줄 선 승객',s:[['짐 부치려고 줄 서 있어요. 🧳','줄이 생각보다 빨리 줄어드네요.','캐리어 무게가 걱정이에요.','창가 자리 달라고 해야지.'][i%4]],when:()=>{const h0=jejuNow().h;return h0>=6&&h0<22&&(i<8||(h0>=7&&h0<10)||(h0>=17&&h0<20)||i%2==0)}}));
  M[id]={n:nm,par:out,wide:1,land:[15,14],bgm:'indoor',airT:1,m:Q.map(r=>r.join('')),sign,d:{'15,15':[out,intl?35:10,10]},p:[...staff,...queue,{x:4,y:11,stay:1,c:'#0f766e',h:'#222',n:'안내 데스크 직원',s:intl?['출국장은 안쪽이에요. 국내선 청사는 밖으로 나가 왼쪽이에요. 🛂']:['표는 오른쪽 키오스크에서도 받을 수 있어요. ✈','국제선 청사는 밖으로 나가 오른쪽이에요.']},{x:20,y:14,c:'#f472b6',h:'#222',w:1,n:'공항 이용객',s:['비행 시간까지 앉아서 쉬려고요. ✈']}]}};
 {const WI=56,Q=[Array(WI).fill('.'),Array(WI).fill('r'),Array(WI).fill('y')];for(let y=3;y<5;y++){const r=Array(WI).fill('u');[6,7,8,24,25,26,44,45,46].forEach(x=>r[x]='e');Q.push(r)}for(let y=5;y<11;y++){const r=Array(WI).fill('.');for(let x=4;x<52;x++)r[x]='㎯';Q.push(r)}[14,27,40].forEach(x=>{Q[10][x]='ㅀ'});Q.push(Array(WI).fill('ㅣ'));Q.push(Array(WI).fill('ㄹ'));Q.push(Array(WI).fill('ㅣ'));for(let y=14;y<16;y++){const r=Array(WI).fill('.');[2,8,14,20,34,40,46,52].forEach(x=>r[x]='T');[5,11,17,37,43,49].forEach(x=>r[x]='F');Q.push(r)}Q.push(Array(WI).fill('T'));
  M.incheon={n:'인천국제공항',o:1,wide:1,bgm:'route',plane:[10,3],plane2:[34,3],land:[27,13],m:Q.map(r=>r.join('')),stB2:{x:4,y:5,w:48,h:6,kind:'icn',doors:[14,27,40],dl:[],lines:[1]},sign:{'14,11':'출발 A·B','27,11':'여객터미널 입구','40,11':'출발 C·D','27,13':'공항철도','47,13':'2터미널 공사 중'},d:{'14,10':['incheonT',15,14],'27,10':['incheonT',15,14],'40,10':['incheonT',15,14]},p:[{x:20,y:11,c:'#a78bfa',h:'#222',w:1,n:'출국하는 여행객',s:['공항철도 타고 왔어요. 인천공항은 정말 크네요. 🧳']},{x:34,y:11,c:'#0ea5e9',h:'#3f2a1c',w:1,n:'막 도착한 여행객',s:['시내로 가려면 공항철도가 제일 편해요. 🚆']},{x:47,y:13,stay:1,c:'#0f766e',h:'#222',n:'셔틀 안내원',s:['2터미널 가는 길은 아직 공사 중이에요. 🚧']},{x:8,y:11,c:'#475569',h:'#222',w:1,n:'마중 나온 사람',s:['입국장에 아직 안 나왔나 봐요. 👋']}]}}
 TERM('incheonT','인천국제공항 여객터미널','incheon',true,{'15,5':'체크인 카운터','24,11':'셀프 체크인','4,11':'안내','27,13':'식당','1,12':'보관함','8,11':'수속 줄','22,11':'수속 줄'});{const T=M.incheonT;T.icn=1;T.d={'15,15':['incheon',27,11]};T.p.forEach(n=>{if(/수속/.test(n.n)){n.n='체크인 직원';n.s=['인천국제공항입니다. BS 에어 국제선은 아직 취항 준비 중이에요. ✈'];n.ch={'🗺 여행 지도 보기':()=>showTravel(),'📡 실제 인천공항 현황':()=>{FB.air='ICN';showAirBoard('I')}}}if(/안내 데스크/.test(n.n))n.s=['출국장은 안쪽이에요. 시내로 가시면 밖으로 나가 공항철도를 타세요. 🚆'];if(/출국하는/.test(n.n))n.s=['유럽까지 열두 시간은 걸린대요. 🧳']})}
 TERM('gimhaeT','김해공항 국내선 청사','gimhae',false,{'15,5':'BS 에어 수속 카운터','24,11':'셀프 체크인','4,11':'안내','27,13':'식당','1,12':'보관함','8,11':'수속 줄','22,11':'수속 줄'});TERM('gimhaeI','김해공항 국제선 청사','gimhae',true,{'15,5':'국제선 수속 카운터','24,11':'셀프 체크인','4,11':'안내','27,13':'식당','1,12':'보관함','8,11':'수속 줄','22,11':'수속 줄'});
 /* 부산항: 부산역 오른쪽 길 끝 */
 {const WP=30,Q=[];for(let y=0;y<4;y++)Q.push(Array(WP).fill('㎯'));Q.push(Array(WP).fill('ㅣ'));Q.push(Array(WP).fill('ㄹ'));Q.push(Array(WP).fill('ㅣ'));Q.push(Array(WP).fill('s'));for(let y=8;y<12;y++)Q.push(Array(WP).fill('~'));
  M.busanPort={n:'부산항',par:'busan',o:1,wide:1,bgm:'beach',land:[14,6],m:Q.map(r=>r.join('')),stB:{x:0,y:0,w:30,h:4,kind:'port',nm:'부산항',doors:[],dl:[],lines:[1]},sign:{'14,4':'부산항 국제여객터미널','27,7':'크루즈 부두'},d:{},ex:{'0,5':['busan',35,14]},p:[{x:9,y:6,c:'#475569',h:'#222',w:1,n:'항구 산책객',s:['큰 배 들어올 때 보면 정말 멋져요. 🛳']},{x:20,y:6,c:'#0f766e',h:'#222',stay:1,n:'여객터미널 안내원',s:['일본 가는 배도 여기서 타요. 게임 속 뱃길은 아직 공사 중이에요. 🚧']}]};M.busan.ex={...(M.busan.ex||{}),'35,14':['busanPort',0,5]};M.busan.sign['33,13']='부산항 방면'}
 M.busan.p.push({x:14,y:13,stay:1,c:'#1e3a8a',h:'#222',n:'공항 리무진 기사',s:['김해공항 가는 리무진이에요. ✈'],ch:{'🚌 김해공항 가기':()=>busGo('gimhae','공항 리무진',8000)}});M.busan.sign['15,13']='공항 리무진';M.haeundae.p.push({x:10,y:6,stay:1,c:'#1e3a8a',h:'#222',n:'공항 리무진 기사',s:['김해공항까지 모셔다 드려요. ✈'],ch:{'🚌 김해공항 가기':()=>busGo('gimhae','공항 리무진',8000)}});
 })();
const STN={incheon:['인천공항1터미널','incheon',[[27,14]],[27,13]],hdStn:['해운대','haeundae',[[20,5]],[20,6]],airportLrt:['공항','gimhae',[[22,9]],[22,10]],gongdeok:['공덕','gongdeok',[[5,6]],[5,5]],seoul:['서울','seoul',[[23,12]],[23,13]],busan:['부산','busan',[[26,12]],[26,13]],sindorim:['신도림','sindorim',[[3,4]],[3,5]],mapo:['마포','mapo',[[3,4]],[3,5]],gaehwa:['개화','gaehwa',[[3,4]],[3,5]],saetgang:['샛강','saetgang',[[2,4]],[2,5]],yeouinaru:['여의나루','yeouinaru',[[4,4]],[4,5]],assembly:['국회의사당','assembly',[[3,4]],[3,5]],dangsan:['당산','dangsan',[[11,4]],[11,5]],yeongdeungpo:['영등포','yeongdeungpo',[[3,4]],[3,5]],gimpo:['김포공항','gimpo',[[11,8]],[11,7]],yeouido:['여의도','yeouido',[[19,9]],[19,8]],noryangjin:['노량진','noryangjin',[[15,7],[17,7]],[15,8]],nodeul:['노들','nodeul',[[10,26],[12,26]],[10,25]],heukseok:['흑석','heukseok',[[3,4]],[3,5]],yongsan:['용산','yongsan',[[11,2]],[11,3]],daebang:['대방','daebang',[[9,4]],[9,5]],singil:['신길','singil',[[3,4]],[3,5]],jangseung:['장승배기','jangseung',[[3,4]],[3,5]],sangdo:['상도','sangdo',[[9,4]],[9,5]],soongsil:['숭실대입구','soongsil',[[10,4]],[10,5]]};
const METRO={103:{n:'부산 2호선',s:'2',up:1,col:'#81BF48',id:'b2',st:['hdStn']},102:{n:'부산김해경전철',s:'경',up:1,col:'#8652A1',id:'lrt',st:['airportLrt']},32:{n:'GTX-A',s:'A',up:-1,col:'#9A6292',id:'1032',st:['seoul']},4:{n:'4호선',up:-1,col:'#00A5DE',id:'1004',st:['seoul']},6:{n:'6호선',up:1,col:'#CD7C2F',id:'1006',st:['gongdeok']},63:{n:'경의중앙선',s:'경',up:1,col:'#77C4A3',id:'1063',st:['yongsan','gongdeok']},64:{n:'경의중앙선',s:'경',up:1,col:'#77C4A3',id:'1063',st:['seoul']},65:{n:'공항철도',s:'공',up:1,col:'#0090D2',id:'1065',st:['seoul','gongdeok','gimpo','incheon']},101:{n:'부산 1호선',s:'1',up:1,col:'#F06A00',id:'busan1',st:['busan']},1:{n:'1호선',up:-1,col:'#0052A4',id:'1001',st:['seoul','yongsan','noryangjin','daebang','singil','yeongdeungpo','sindorim']},5:{n:'5호선',up:-1,col:'#996CAC',id:'1005',st:['gimpo','singil','yeouido','yeouinaru','mapo','gongdeok']},7:{n:'7호선',up:1,col:'#747F00',id:'1007',st:['jangseung','sangdo','soongsil']},9:{n:'9호선',up:-1,col:'#BDB092',id:'1009',st:['gaehwa','gimpo','dangsan','assembly','yeouido','saetgang','noryangjin','nodeul','heukseok']}};
/* up: 노선 목록에서 상행으로 갈 때의 방향. 호선마다 상행·하행 승강장이 따로 있고, 종착 쪽으로는 갈 역이 있는 방향만 만듦 */
const DIRN={u:'상행',d:'하행'};
const mDest=(L,k,d)=>{const st=METRO[L].st,i=st.indexOf(k),sgn=(d=='u'?1:-1)*METRO[L].up;return sgn>0?st.slice(i+1):st.slice(0,i).reverse()};
const realEnd=(L,k,d)=>(L==9&&k=='gaehwa'&&d=='u')||(L==64&&d=='d')||(L==65&&k=='seoul'&&d=='d');
/* 현실엔 이어지지만 게임에 아직 없는 방향: 계단을 막고 공사 중으로 표시 */
const REAL_NEXT={'1u':'시청','1d':'구로','4u':'회현','4d':'숙대입구','5u':'송정','5d':'애오개','6u':'대흥','6d':'효창공원앞','7u':'남성','7d':'신대방삼거리','9d':'동작','32u':'연신내','32d':'수서','63u':'서강대','63d':'이촌','64u':'신촌','65u':'인천공항2터미널','101u':'초량','101d':'중앙','102u':'서부산유통지구','102d':'덕두','103u':'중동','103d':'장산'};
const consDir=(L,k,d)=>!realEnd(L,k,d)&&!mDest(L,k,d).length;
const consMsg=(L,k,d)=>`${METRO[L].n} ${DIRN[d]}은 아직 공사 중이에요. ${REAL_NEXT[L+d]||'다음'}역 쪽으로 가는 길을 잇고 있어요. 🚧`;
const pfId=(L,k,d)=>'pf_'+k+'_'+L+'_'+(mDest(L,k,d).length?d:(d=='u'?'d':'u'));
Object.entries(STN).forEach(([k,[nm,out,doors,stand]])=>{
  const L=Object.keys(METRO).filter(l=>METRO[l].st.includes(k)),slot=L.length>1?[[1,4],[10,13]]:[[4,10]],r=[...'wfffffffffffffw'];
  const dd={'7,9':[out,stand[0],stand[1]]},sg={},back={},cons={};L.forEach((l,i)=>['u','d'].forEach((d,j)=>{if(realEnd(l,k,d))return;const x=(slot[i]||slot[0])[j];back[l+d]=x;if(consDir(l,k,d)){r[x]='㎩';cons[x+',2']=[+l,d];sg[x+',3']=METRO[l].n+' '+DIRN[d]+' 공사 중';return}r[x]='ㅸ';dd[x+',2']=['pf_'+k+'_'+l+'_'+d,7,6];sg[x+',3']=METRO[l].n+' '+DIRN[d]}));if(L.length>1)r[7]='w';const r2=r.join('');
  M['cc_'+k]={n:nm+'역 대합실',par:out,bgm:'indoor',stKey:k,m:['w'.repeat(W),'wwwwwwㅯwㅯwwwwww',r2,L.length>1?FR.slice(0,7)+'㎮'+FR.slice(8):FR,L.length>1?FR.slice(0,7)+'㎮'+FR.slice(8):FR,L.length>1?'ww㎭wwㅱㅱwㅱㅱww㎭ww':'ww㎭wwㅱㅱㅱㅱㅱww㎭ww',FR,'wfKKffffffffKKw',FR,'wwwwwwwxwwwwwww'],sign:{...sg,'2,5':'교통카드','12,5':'교통카드'},d:dd,cons,gl:L.length>1,p:[{x:3,y:8,stay:1,c:METRO[L[0]].col,h:'#222',n:nm+'역 역무원',s:['개찰구에 교통카드를 찍고 들어가면 승강장 계단이 있어요. 🚇 카드는 옆 충전기에서 사고 충전해요.',L.length>1?'환승도 여기서 하세요. 왼쪽이 '+METRO[L[0]].n+', 오른쪽이 '+METRO[L[1]].n+'이에요. 계단이 상행과 하행으로 나뉘어 있어요.':'계단이 상행과 하행으로 나뉘어 있어요. 벽 전광판을 누르면 실제 도착 정보를 볼 수 있어요.']}]};
  L.forEach(l=>['u','d'].forEach(d=>{const dest=mDest(l,k,d);if(realEnd(l,k,d))return;M['pf_'+k+'_'+l+'_'+d]={n:nm+'역 '+METRO[l].n+' '+DIRN[d]+' 승강장'+(dest.length?' ('+STN[dest[dest.length-1]][0]+' 방면)':''),par:out,bgm:'indoor',stKey:k,line:l,dir:d,pf:1,m:['w'.repeat(W),'ㅳ'.repeat(W),'ㅳ'.repeat(W),'ㅰ'.repeat(W),FR,'wfKKffffffffKKw',FR,'wffffffㅸffffffw','w'.repeat(W),'w'.repeat(W)],sign:{'7,7':'대합실'},d:{'7,7':['cc_'+k,back[l+d],3]},p:[]}}));
  const z=M[out];z.d=z.d||{};doors.forEach(([x,y])=>{z.d[x+','+y]=['cc_'+k,7,8]});
});
Object.entries({sindorim:5,mapo:5,gaehwa:5,saetgang:5,yeouinaru:5,assembly:5,dangsan:5,yeongdeungpo:5,gimpo:7,yongsan:3,yeouido:8,daebang:5,singil:5,noryangjin:8,nodeul:25,heukseok:5,jangseung:5,soongsil:5,sangdo:5}).forEach(([k,v])=>{M[k].bus=v});
/* 서울 거리 다듬기: 큰길 옆은 인도, 강가는 한강공원 산책로, 곧은 인도엔 가로수와 가로등 */
['sindorim','mapo','gaehwa','saetgang','yeouinaru','assembly','dangsan','yeongdeungpo','yongsan','yeouido','daebang','singil','noryangjin','nodeul','heukseok','jangseung','soongsil','sangdo'].forEach(id=>{const z=M[id],R=z.m.map(r=>[...r]),Q=(x,y)=>(R[y]||[])[x],road=(x,y)=>Q(x,y)=='ㄹ',used=new Set((z.p||[]).map(n=>n.x+','+n.y));
  R.forEach((r,y)=>r.forEach((k,x)=>{if(k=='s')r[x]='ㅝ';else if(k=='.'&&(road(x-1,y)||road(x+1,y)||road(x,y-1)||road(x,y+1)))r[x]='ㅣ'}));
  R.forEach((r,y)=>r.forEach((k,x)=>{if(k!='ㅣ'||used.has(x+','+y))return;const hz=(road(x,y-1)&&road(x-1,y-1)&&road(x+1,y-1))||(road(x,y+1)&&road(x-1,y+1)&&road(x+1,y+1)),vt=(road(x-1,y)&&road(x-1,y-1)&&road(x-1,y+1))||(road(x+1,y)&&road(x+1,y-1)&&road(x+1,y+1));if(hz&&x%6==2)r[x]='ㅜ';else if(hz&&x%6==5)r[x]='ㅞ';else if(!hz&&vt&&y%5==2)r[x]='ㅜ'}));
  z.m=R.map(r=>r.join(''))});
Object.keys(SONG_XY).forEach(id=>{const z=M[id],[tx,ty]=SONG_XY[id],used=new Set((z.p||[]).map(n=>n.x+','+n.y));let best=null,bd=1e9;for(let y=0;y<z.m.length;y++){const row=[...z.m[y]];for(let x=0;x<row.length;x++){if(!'.F'.includes(row[x])||used.has(x+','+y)||(z.d&&z.d[x+','+y])||(z.umb||[]).some(u=>u[0]==x&&u[1]==y&&id!='rest'))continue;const q=Math.abs(x-tx)+Math.abs(y-ty);if(q<bd){bd=q;best=[x,y]}}}if(best&&bd>0)SONG_XY[id]=best;z.p.push(songNpc(id))});
const ME_LOOK={hair:'cover',cl:'plaid',leg:'#1f2937'};
/* 인물 표현: 받은 사진의 분위기를 도트로 옮김 */
const LOOKS=[
  [n=>n=='거울 속의 나',{c:'#2b3140',h:'#17151c',p:'#17151c',lk:ME_LOOK}],
  [n=>n=='강보성',{c:'#2b3140',h:'#17151c',p:'#17151c',lk:ME_LOOK}],
  [n=>n.startsWith('창끼'),{c:'#1b2a33',h:'#17121a',p:'#17121a',lk:{hair:'bang',cl:'collar',leg:'#1f2937'}}],
  [n=>n=='송',{c:'#1e3a8a',h:'#1f1a1a',p:'#1f1a1a',gl:'#3f2a1c',lk:{hair:'short',cl:'puffer',sh:'#9ca3af',leg:'#111827'}}],
  [n=>n=='보성 아버지',{c:'#1f2433',h:'#3f3f46',p:'#3f3f46',gl:'#27272a',lk:{hair:'slick',hl:'#71717a',cl:'suit',sh:'#ddd6fe',tie:'#1e3a8a',leg:'#1f2433'}}],
  [n=>n=='보성 어머니',{c:'#b91c1c',h:'#1c1917',p:'#1c1917',gl:'#1c1917',lh:0,lk:{hair:'bob',cl:'collar',sh:'#fff',leg:'#1e3a8a'}}]
];
Object.entries(M).forEach(([id,z])=>(z.p||[]).forEach(n=>{
  LOOKS.forEach(([t,v])=>{if(t(n.n))Object.assign(n,v)});
  if(n.n=='보성 할아버지')Object.assign(n,{h:'#27272a',p:'#27272a',gl:'#9ca3af',c:id=='gpHome'?'#1e2a4a':'#6b5b3e',lk:id=='gpHome'?{hair:'slick',hl:'#52525b',cl:'suit',sh:'#bfdbfe',tie:'#2563eb',leg:'#1e2a4a'}:{hair:'slick',hl:'#52525b',cl:'collar',sh:'#e7e5e4',leg:'#44403c'}});
  if(n.n=='보성 할머니')Object.assign(n,{h:'#1c1917',p:'#f2c9a0',lk:id=='gpHome'?{hair:'perm',cl:'hanbok',sh:'#fff',tie:'#7c3aed',skirt:'#f5f0dc',sit:1}:{hair:'perm',cl:'collar',sh:'#374151',leg:'#111827'},c:id=='gpHome'?'#9ca3af':'#1f2937'});
}));
/* 주인장(운영자 로그인)과 게스트 */
const isOwner=()=>!!DB.tok;
function ckWoodang(i){const W0=TX.ckWd||[];if(!W0.length)return['…'];const L=W0[i!=null?i:Math.random()*W0.length|0],me=Math.random()<.5;return L.map((t,j)=>((j%2==0)==me?'보성: ':'창끼: ')+t)}
const G_LOOKS=[{i:'🧳',n:'여행자',c:'#0ea5e9',h:'#3f2a1c',lk:{hair:'short',cl:'puffer',sh:'#e0f2fe',leg:'#1e3a8a'}},{i:'🎒',n:'대학생',c:'#f472b6',h:'#1c1917',lk:{hair:'bob',cl:'collar',sh:'#fff',leg:'#334155'}},{i:'🏃',n:'러너',c:'#22c55e',h:'#27272a',lk:{hair:'bang',cl:'collar',sh:'#dcfce7',leg:'#111827'}},{i:'🧑‍🎨',n:'예술가',c:'#a855f7',h:'#92400e',lk:{hair:'perm',cl:'plaid',leg:'#44403c'}},{i:'💼',n:'직장인',c:'#1f2937',h:'#111827',lk:{hair:'slick',cl:'suit',sh:'#e2e8f0',tie:'#b91c1c',leg:'#1f2937'}}];
const GUEST={name:'',look:0};try{Object.assign(GUEST,JSON.parse(localStorage.getItem('bsw_guest')||'{}'))}catch(e){}
const ckMe=()=>!isOwner()&&!!TX.ckSelf;
const CK_LOOK={c:'#1b2a33',h:'#17121a',p:'#17121a',lk:{hair:'bang',cl:'collar',leg:'#1f2937'}};
const POOL={suit:null,pick:null};
function playerLook(){if(POOL.suit&&/^swim/.test(cur))return POOL.suit=='m'?{c:'#1e3a8a',h:'#17151c',p:'#1e3a8a',lk:{hair:'short',leg:'#f2c9a0'}}:{c:'#be123c',h:'#17151c',p:'#be123c',lk:{hair:'bob',leg:'#f2c9a0'}};if(ckMe())return CK_LOOK;if(isOwner())return{c:S.end?'#fb923c':'#2b3140',h:'#17151c',p:'#17151c',lk:ME_LOOK};const L=G_LOOKS[GUEST.look]||G_LOOKS[0];return{c:S.end?'#fb923c':L.c,h:L.h,p:L.h,lk:L.lk}}
function idRender(){
  const m=$('#idMark');if(!m)return;const ow=isOwner(),L=G_LOOKS[GUEST.look]||G_LOOKS[0];
  if(ow){const ic=(document.querySelector('link[rel=icon][sizes="192x192"]')||{}).href;if(ic){m.innerHTML='<img src="'+ic+'" alt="BS World" style="width:84%;height:84%;object-fit:contain;image-rendering:pixelated;display:block;margin:auto">'}else m.textContent='🧑🏻‍💻'}else m.textContent=L.i;const fr=!ow&&typeof RT!='undefined'&&RT.fr;$('#idName').textContent=ow?'KANG BO-SUNG':(fr?'FRIEND':'GUEST')+(fr&&RT.name?' · '+RT.name:FRIEND?' · '+FRIEND.short:GUEST.name?' · '+GUEST.name:'');$('#idSub').textContent=ow?'BS WORLD 주인장':'BS WORLD '+L.n;
  $('#idBtns').innerHTML=ow?'<button class="xb" style="padding:3px 8px;font-size:11px" onclick="DB.logout();toast(\'게스트로 돌아왔어요.\')">로그아웃</button>':'<button class="xb" style="padding:3px 8px;font-size:11px" onclick="guestEdit()">꾸미기</button>'+(fr?'<button class="xb" style="padding:3px 8px;font-size:11px" onclick="friendOut()">로그아웃</button>':'<button class="xb" style="padding:3px 8px;font-size:11px" onclick="showLogin(\'me\')">운영자</button>');
  if(typeof map!='undefined'&&map&&!busy&&!modal&&!dlg&&typeof buildNpcs=='function')buildNpcs();
}
function showProfilePic(){openM('<h3>🖼 내 프로필 사진</h3><div style="text-align:center"><canvas id="pfPic" width="240" height="240" style="width:240px;max-width:100%;border:6px solid #e0b840;border-radius:6px;image-rendering:pixelated"></canvas><p style="font-size:13px;margin-top:8px">강보성</p></div>');const x=$('#pfPic').getContext('2d');x.fillStyle='#38bdf8';x.fillRect(0,0,240,240);spr(x,24,24,16,{l:false,c:'#2b3140',h:'#17151c',p:'#17151c',lk:ME_LOOK})}
/* 자기 자신의 NPC에게 말을 걸면 전용 대사 */
/* 친구 이름이면 서버에서 그 친구 전용 대사를 받아 옴 */
let FRIEND=null;
async function friendLoad(nm){if(!nm){FRIEND=null;return'none'}try{const r=await DB.rpc('friend_by_name',{p_name:nm});if(r&&r.ok){FRIEND={short:r.short,greet:r.greet||[],lines:r.lines||[],self:r.self||null,kind:r.kind||'friend',title:r.title||'',parent:r.parent||null,lTalk:r.lTalk||null,side:r.side||'',ckTalk:r.ckTalk||null};return'ok'}FRIEND=null;return r&&r.err||'none'}catch(e){FRIEND=null;return'none'}}
function friendOut(){if(!confirm('친구 코드에서 로그아웃할까요?'))return;try{localStorage.removeItem('bsw_fr')}catch(e){}RT.fr=null;toast('게스트로 돌아왔어요.');setTimeout(()=>location.reload(),600)}
function friendBoot(){talkLoad();if(GUEST.name)friendLoad(GUEST.name).then(v=>{if(v=='ok')idRender()})}
const GS={pending:false,pick:0};
function guestEdit(start){GS.pick=GUEST.look||0;GS.pending=!!start;
  openM(`<h3>${start?'🧳 게스트로 시작하기':'🧳 게스트 꾸미기'}</h3><p style="font-size:12px;opacity:.8">${start?'BS World에 온 걸 환영해요. 이름을 쓰고 캐릭터를 골라 주세요.':'이름과 모습은 이 브라우저에 저장돼요.'}</p><input id="gName" class="xin" maxlength="10" placeholder="이름 (비워도 돼요)" value="${esc(GUEST.name)}" onkeydown="if(event.key=='Enter'){event.stopPropagation();guestSave()}">
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:10px 0">${G_LOOKS.map((L,i)=>`<button type="button" class="gpick" id="gp${i}" onclick="guestPick(${i})" style="padding:6px 2px;border:2px solid var(--bd);border-radius:6px;background:#eef2ff;cursor:pointer;font:700 11px sans-serif;color:#1e293b"><canvas id="gc${i}" width="48" height="56" style="display:block;margin:0 auto 3px;image-rendering:pixelated;max-width:100%"></canvas>${L.n}</button>`).join('')}</div>
  <div class="xcol"><button class="xb big" id="gGo" onclick="guestSave()">${start?'▶ 이 캐릭터로 시작':'저장'}</button></div>${start?`<div class="qbtn" style="justify-content:center;margin-top:6px"><button class="xb" onclick="showLogin('start')">🔑 운영자 로그인</button></div>`:''}`);
  G_LOOKS.forEach((L,i)=>spr($('#gc'+i).getContext('2d'),0,0,4,{c:L.c,h:L.h,p:L.h,lk:L.lk}));guestPick(GS.pick);KC.on=false;kcSel(null)}
function guestPick(i){GS.pick=i;G_LOOKS.forEach((_,k)=>{const b=$('#gp'+k);if(b){b.style.borderColor=k==i?'#f59e0b':'';b.style.background=k==i?'#fef3c7':'#eef2ff'}})}
async function guestSave(){GUEST.look=GS.pick;const n=$('#gName');GUEST.name=n?n.value.trim().slice(0,10):GUEST.name;try{localStorage.setItem('bsw_guest',JSON.stringify(GUEST))}catch(e){}closeM();const v=await friendLoad(GUEST.name);await talkLoad();if(RT.pid)rtStart();if(v=='which')toast('같은 이름이 있어요. 성까지 입력해 주세요.');else if(v=='ok')toast('어, 아는 이름인데요? 세상 어딘가의 친구를 찾아보세요. 😄');idRender();accessHit()}
/* 주인장으로 들어오면 가족이 알아봄 */
const FRIEND_TALK={...Object.fromEntries([['보성 외할머니',N=>[N+' 왔구나게~ 🍊','밥은 먹언? 혼저 앉으라.']],['보성 외할아버지',N=>[N+' 왔구나~ 잘 지냄시냐? 🍊','이 귤 한번 맛봐라.']],['보성 큰외삼촌',N=>[N+' 왔니~ 🥝','키위 좀 챙겨 가라.']],['보성 외숙모',N=>[N+' 왔니~ 🥝','후숙해서 말랑해지면 먹어. 맛있어.']]].map(([k,f])=>[k,(N,F)=>F.kind=='cousin'&&F.side=='oe'?f(N):null])),'작은아버지':(N,F)=>F.side=='chin'?[N+' 왔구나! 밥 먹고 가라. 🍲']:null,'작은엄마':(N,F)=>F.side=='chin'?[N+' 왔네~ 편한 데 앉아. 😊']:null,'보성 아버지':(N,F)=>F.kind=='lpal'||F.kind=='lgun'?null:F.kind=='cousin'?['어이구, '+N+' 왔니? 많이 컸네. 반갑다.','보성이는 지금 외출 중이야~ 잘 지내지~?']:[N+' 왔니? 반갑다. 보성이 외출 중이야~','잘 지내지~? 밥은 먹고 다니냐?'].concat(F.parent&&F.parent.dad?[F.parent.dad]:[]),'보성 어머니':(N,F)=>F.kind=='lpal'||F.kind=='lgun'?null:F.kind=='cousin'?['어머, 우리 '+N+' 왔구나! 잘 지내지~?','밥은 먹었어? 귤 좀 싸 줄 테니까 가져가. 🍊']:['어머, '+N+' 왔구나! 잘 지내지~?','보성이는 지금 밖에 나갔어. 귤이라도 하나 먹고 가. 🍊'].concat(F.parent&&F.parent.mom?[F.parent.mom]:[]),'보성 여동생':(N,F)=>F.kind=='lgun'||F.kind=='lpal'?null:F.kind=='cousin'?['어~ '+N+' 왔어?','잘 지내~? 오빠는 지금 밖에 있어.']:!F.title?null:[F.short+(F.title?' '+F.title:'')+' 오셨어요? 안녕하세요~','오빠 지금 밖에 있어요. 어디 돌아다니고 있을 거예요. 😄']};
const OWNER_TALK={'보성 큰외삼촌':['보성이 왔구나. 🥝','외숙모 고생 많다. 키위 좀 가져가라.'],'보성 외숙모':['보성아, 왔어? 🥝','키위 좀 챙겨 줄 테니까 후숙해서 먹어.'],'보성 할머니':['아이고 우리 손지 왔구나! 🍊','귤 따는 거 구경허당 하나 먹으라.'],'보성 외할머니':['우리 보성이 왔구나게. 🍊','힘든디 뭐 허레 왔시냐. 귤이나 먹으라.'],'보성 사촌 누나':['보성아, 왔어? 밥 먹고 가. 🐟','갈치 제일 큰 걸로 올려 줄게.'],'보성 사촌 매형':['보성이 왔어? 앉아, 갈치조림 올려 줄게. 🐟'],'보성 아버지':['왔냐, 아들. 밥은 먹고 다니냐?','시간 나면 밭 일이나 좀 도와라. 🍊'],'보성 어머니':['아들 왔어? 얼굴이 왜 이렇게 말랐어.','밥 차려 줄게. 귤도 좀 싸 가고. 🍊'],'보성 여동생':['오빠 왔네? 또 사이트 고치고 있었지? 😄'],'보성 할아버지':['보성이 왔구나! 밥은 먹언?','귤 하영 먹엉 가라. 🍊'],'보성 외할아버지':['우리 보성이 왔구나. 잘 지냄시냐?','이 귤 한번 맛봐라. 🍊'],'보성 할머니':['아이고 우리 손지 왔구나! 🐚','물질 얘기 또 들으러 왔나?'],'보성 외할머니':['우리 보성이 왔구나게. 바당 바람 맞으멍 쉬다 가라. 🐚'],'동네 주민':['어, 안녕하세요! 오늘도 컵밥 드시러 나왔어요?'],'작은아버지':['보성이 왔구나! 밥은 먹고 다니냐?','앉아라, 국물 끓여 줄게. 🍲'],'작은엄마':['어머, 보성이 왔네! 살 빠진 거 아니야?','많이 먹고 가~ 😊'],'가게 돕는 사촌동생':['어, 형 왔어요? 오늘 여기 일 돕는 중이에요.'],'서빙하는 사촌동생':['오빠! 오랜만이에요. 고기 많이 달라고 할게요. 😄']};
/* 게스트 눈에는 강보성이 세계 어딘가에 있음. 거울도 비추는 사람이 달라짐 */
{const mir=M.house.p.find(n=>n.n=='거울 속의 나'),mw=mir.when;mir.when=()=>isOwner()&&(!mw||mw());
 M.house.p.push({x:mir.x,y:mir.y,when:()=>!isOwner(),c:'#0ea5e9',h:'#3f2a1c',n:'거울',s:()=>['거울에 '+(GUEST.name||'게스트')+'님의 모습이 비친다. 🪞','주인장 강보성은 지금 어딘가를 돌아다니는 중이다.']});
 /* 강보성 NPC 배치는 bsRoll 참고 */
 BS_CH=mir.ch;}

const PG=['...HHHHHH...','..HHHHHHHH..','.HHHHHHHHHH.','.HHSSSSSSHH.','.HSSSSSSSSH.','.PSEESSEESP.','.PSSSSSSSSP.','..SSSMMSSS..','...SSSSSS...','..CCCCCCCC..','.CCCCCCCCCC.','.CCCCCCCCCC.'];
/* 인물별 머리·옷 표현 */
function sprLook(c,x,y,s,o,col,d){
  const k=o.lk;if(!k)return;const P=(cc,L)=>{c.fillStyle=cc;L.forEach(([a,b,w=1,q=1])=>c.fillRect(x+a*s,y+b*s,w*s,q*s))},front=d!=1,H=col.H,SK=col.S;
  if(k.hair=='bang'){P(H,[[2,3,8,1],[3,4,5,1],[2,4,1,2],[9,4,1,1]]);if(front)P(SK,[[8,4,1,1]])}          // 옆으로 내린 앞머리
  if(k.hair=='cover'){P(H,[[2,3,8,1],[2,4,7,1],[1,5,1,1],[10,5,1,1]])}                                     // 눈썹까지 덮는 앞머리
  if(k.hair=='short'){P(H,[[3,-1,6,1],[2,0,8,1]]);if(front)P(SK,[[3,3,6,1],[4,2,3,1]]);P(H,[[2,3,1,2],[9,3,1,2]])}   // 짧게 세운 머리
  if(k.hair=='slick'){P(H,[[3,0,6,1],[2,1,8,2]]);if(front)P(SK,[[3,3,6,1],[4,2,5,1]]);if(k.hl)P(k.hl,[[4,1,4,1],[2,2,1,1],[9,2,1,1]])}   // 뒤로 넘긴 머리
  if(k.hair=='perm'){P(H,[[3,0,6,1],[1,1,10,2],[0,2,1,3],[11,2,1,3],[1,5,1,3],[10,5,1,3],[2,3,8,1]]);P('#ffffff22',[[3,1,1,1],[6,1,1,1],[9,2,1,1],[1,3,1,1]])}   // 둥근 파마
  if(k.hair=='bob'){P(H,[[0,3,2,6],[10,3,2,6],[2,8,1,1],[9,8,1,1]]);if(front)P(H,[[2,3,6,1],[2,4,3,1]])}     // 단발
  const T=9;
  if(k.cl=='suit'){if(front){P(k.sh||'#bfdbfe',[[5,T,2,3]]);P(k.tie||'#1d4ed8',[[5,T+1,2,2]]);P('#0002',[[4,T,1,3],[7,T,1,3]])}}
  if(k.cl=='puffer'){P('#ffffff30',[[1,T+1,10,1]]);if(front)P(k.sh||'#9ca3af',[[5,T,2,3]])}
  if(k.cl=='plaid'){P('#ffffff40',[[3,T,1,3],[8,T,1,3],[1,T+1,10,1]]);if(front)P('#0005',[[5,T,1,3]])}
  if(k.cl=='collar'&&front)P(k.sh||'#f8fafc',[[4,T,1,2],[7,T,1,2],[5,T,2,1]]);
  if(k.cl=='hanbok'){if(front){P(k.sh||'#fff',[[4,T,1,1],[7,T,1,1],[5,T+1,2,1]]);if(k.tie)P(k.tie,[[6,T+1,3,1],[7,T+2,1,1]])}if(o.l===false&&!k.sit)return}
}
function spr(c,x,y,s,o={}){const d=o.d||0,col={H:o.h||'#1b1b26',S:'#f2c9a0',E:'#111',P:o.p||'#8a94a8',M:'#b5655a',C:o.c||'#ece4d0'};
PG.forEach((r,j)=>[...r].forEach((k,i)=>{if(k=='.')return;if(d==1&&j>2&&j<9&&'SEM'.includes(k))k='H';if(d==2&&k=='E'&&i>5)k='S';if(d==3&&k=='E'&&i<6)k='S';c.fillStyle=col[k];c.fillRect(x+i*s,y+j*s,s,s)}));
sprLook(c,x,y,s,o,col,d);
if(o.gl&&d!=1){c.fillStyle=o.gl;const F=(l,r)=>{for(let i=l;i<=r;i++){c.fillRect(x+i*s,y+5*s,s,s/2);c.fillRect(x+i*s,y+7*s+s/2,s,s/2)}c.fillRect(x+l*s,y+5*s,s/2,3*s);c.fillRect(x+r*s+s/2,y+5*s,s/2,3*s)};if(d!=3)F(2,5);if(d!=2)F(6,9);if(!d)c.fillRect(x+5*s,y+5.5*s,2*s,s/2);}
if(o.lh){c.fillStyle=col.H;[[0,4],[0,5],[0,6],[0,7],[0,8],[1,7],[1,8],[11,4],[11,5],[11,6],[11,7],[11,8],[10,7],[10,8]].forEach(([a,b])=>c.fillRect(x+a*s,y+b*s,s,s))}
if(o.lk&&o.lk.skirt&&o.l!==false){c.fillStyle=o.lk.skirt;c.fillRect(x+2*s,y+12*s,8*s,2*s)}
else if(o.l!==false){c.fillStyle=o.lk&&o.lk.leg||'#34495e';c.fillRect(x+3*s,y+12*s,2*s,o.w?s:2*s);c.fillRect(x+7*s,y+12*s,2*s,o.w?2*s:s)}}

/* 같은 타일이 가로로 이어진 줄에서 몇 번째 칸인지 (간판 글씨용) */
function runIx(x,y,k){let i=0;while(i<8&&at(x-i-1,y)==k)i++;return i}
