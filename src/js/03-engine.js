const DV=[[0,1],[0,-1],[-1,0],[1,0]],EK=['d','u','l','r'],WALK='㍿㍾㍽㏊㏋㏆㎪㎫㎬㎵㎊㎆㎇㎀㎁㍚㌲㌦㌊㌋㌀㌁㌈㋸㋭㋯㋳㋤㋚㋛㋜㉼㉥㉦㉢㉤ⓒⓓㆌㆊㅻ.F=stDfxdu!:`ㄹㅂㅗㅛㅣㅝㅚㅢㅕㅖㅓㅠㅀㅆㅸ';
const at=(x,y)=>map.m[y]&&map.m[y][x],MW=()=>map.m[0].length,MH=()=>map.m.length;

/* 창끼: 제주에서 과수원·공항·활주로·표선을 뺀 곳에 무작위로 나타남 */
const CK_MAPS=['town','sports','coast','route2','rest','beach','studio'],CK={at:null};
/* 강보성 NPC: 특정 친구가 접속하면 창끼 자리에, 친구·게스트에겐 집·친척 가게·과수원·아지트 위주로, 가끔 이곳저곳 */
var BS_CH;const BS_HOME=['house','shabu','jaldo','orchard','home'],BS_MAPS=['town','sports','coast','route2','rest','beach','studio','samgeori','route1','oreumF','gotF','noryangjin','yeouido','nodeul'],BS={at:null,miss:0};
function bsRoll(id){if(isOwner()||ckMe()){BS.at=null;return}{const{h}=jejuNow();if(h>=1&&h<7){BS.at=id=='home'?id:null;return}}if(BS_HOME.includes(id)){BS.at=Math.random()<.6?id:null;return}if(BS_MAPS.includes(id))BS.at=Math.random()<.15?id:(BS.at==id?null:BS.at)}
const BS_GUEST=[['어! 여기까지 찾아오셨네요? 저 강보성입니다. 😄','BS World 재미있게 둘러보세요.'],['어서 오세요. 천천히 둘러보세요. 😊'],['오셨어요? 저도 잠깐 나와 봤어요.'],['재밌게 구경하고 가세요. 🍊'],['궁금한 건 Q&A에 남겨 주세요.']];
function bsTalk(){if(ckMe())return ckWoodang();if(FRIEND&&FRIEND.lines&&Math.random()<.6){const L=FRIEND.lines.filter(q=>!/보성/.test(q));if(L.length)return[L[Math.random()*L.length|0]]}const N=friendCall();if(N)return['오~ '+N+'! 여기까지 찾아왔네? 😄','잘 지냈지? 천천히 둘러보고 가.'];return BS_GUEST[Math.random()*BS_GUEST.length|0]}
function ckRoll(id){if(!CK_MAPS.includes(id))return;CK.at=Math.random()<.35?id:(CK.at==id?null:CK.at)}
/* 영업시간. jaldo는 저장된 공식 시간이 없어 10시 오픈만 표시하고 게임 안 마감은 20시로 둠: 실제 시간을 알면 여기만 고치면 됨 */
const SHOP_H={maeul:{n:'마을 경로당',a:480,b:1080,txt:'매일 08:00~18:00'},cityhallIn:{n:'제주시청',a:540,b:1080,wk:1,txt:'평일 09:00~18:00'},atelier:{n:'창작 공방',always:1,a:0,b:1440,txt:'24시간 OPEN'},court:{n:'농구 코트',a:480,b:1320,txt:'매일 08:00~22:00 · 그 외 시간 출입 금지'},camp:{n:'캠핑장',always:1,a:0,b:1440,txt:'24시간 OPEN'},gym:{n:'체육관',always:1,a:0,b:1440,txt:'24시간 OPEN'},volC:{n:'봉사 나눔센터',a:480,b:1080,txt:'매일 08:00~18:00'},vcB:{n:'헌혈의 집',a:540,b:1200,txt:'매일 09:00~20:00'},shabu:{n:'제주미소',a:1020,b:1350,off:0,txt:'월~토 17:00~22:30 · 일요일 휴무'},jaldo:{n:'잘도식당',a:600,b:1200,txt:'10:00 오픈 · 재료 소진 시 일찍 마감'},bowl:{n:'볼링장',a:480,b:60,txt:'매일 08:00~다음 날 01:00'},arcade:{n:'게임 센터',always:1,a:0,b:1440,txt:'24시간 OPEN'},jjim:{n:'찜질방',always:1,a:0,b:1440,txt:'24시간 OPEN'},minsokIn:{n:'제주민속촌',a:540,b:1080,txt:'매일 09:00~18:00 · 매표 마감 17:00',more:['성인 15,000원 · 경로 13,000원','청소년·군경 12,000원 · 어린이 11,000원']},swim:{n:'수영장',fn:()=>!poolOpen(),a:0,b:0,txt:'평일 06:00~21:00 · 주말 06:00~18:00',more:['12:00~14:00 물 교환 · 매주 화요일 휴관']},woodang:{n:'우당 도서관',a:480,b:1380,off:5,txt:'열람실 08:00~23:00 · 매주 금요일 휴무',more:['문헌·디지털정보자료실: 월~목 09:00~22:00, 토·일 09:00~18:00','어린이자료실: 09:00~18:00 (금요일 휴무)','자료실은 대체공휴일과 12월 31일에도 쉬어요.','제주시 사라봉동길 30']}};
const kstDow=()=>{const q=QS.get('dow');return q!=null&&q!==''?+q:new Date(Date.now()+9*36e5).getUTCDay()};
function libRoomOpen(){const d=kstDow();if(d==5)return false;const j=jejuNow(),m=j.h*60+(j.m||0);return m>=540&&m<(d==0||d==6?1080:1320)}
function shopClosed(id){const s=SHOP_H[id];if(!s)return false;if(s.fn)return s.fn();if(s.a>s.b){const j0=jejuNow(),m0=j0.h*60+(j0.m||0);return m0>=s.b&&m0<s.a}if(s.wk&&[0,6].includes(kstDow()))return true;if(s.off!=null&&kstDow()==s.off)return true;const j=jejuNow(),m=j.h*60+(j.m||0);return m<s.a||m>=s.b}
const shopLock=(x,y)=>{const d=map&&map.d&&map.d[x+','+y];return d&&SHOP_H[d[0]]&&map.par!=d[0]&&shopClosed(d[0])?SHOP_H[d[0]]:null};
const anbangLock=(x,y)=>cur=='house'&&x==14&&y==7&&!isOwner();
const sleepHours=()=>{const{h}=jejuNow();return h>=22||h<6};
/* 한라산 통제 시간(성판악 코스). 10~3월 동절기는 2026년 공지 기준, 하절기 진달래밭 시간은 입산 마감에 맞춘 근사값 */
const hallaWin=()=>{const m0=new Date(Date.now()+9*36e5).getUTCMonth();return m0>=9||m0<3},hallaClose=()=>cur=='halla3'?(13*60+30):hallaWin()?(11*60+30):(12*60+30),hallaOpen=()=>{const{h:a,m:b}=jejuNow(),n=a*60+b;return n>=300&&n<hallaClose()},hallaMsg=()=>{const c=hallaClose(),T=String(c/60|0)+':'+String(c%60).padStart(2,'0');return cur=='halla3'?'정상 하산 시간('+T+')이 지나 더 못 올라가요. 내려가 주세요.':cur=='halla2'?'진달래밭 통제소는 05:00~'+T+'에만 지나갈 수 있어요.':'성판악 입산은 05:00~'+T+'까지예요. 내일 아침 일찍 와 주세요.'};
const WNT=()=>{const m0=new Date(Date.now()+9*36e5).getUTCMonth();return m0==11||m0<2};
const tosanGp=()=>{const h0=jejuNow().h;return h0>=9&&h0<15&&dayRnd('tosan-gp')<.3},tosanGm=()=>{const h0=jejuNow().h;return h0>=10&&h0<16&&dayRnd('tosan-gm')<.3},tosanUn=()=>{const h0=jejuNow().h;return h0>=8&&h0<12&&dayRnd('tosan-un')<.4},tosanUn2=()=>{const h0=jejuNow().h;return h0>=13&&h0<18&&dayRnd('tosan-un')<.4};
const dayRnd=s=>{const d=new Date(Date.now()+9*36e5).toISOString().slice(0,10);let n=2166136261;for(const c of d+s)n=Math.imul(n^c.charCodeAt(0),16777619);n^=n>>>13;n=Math.imul(n,1274126177);n^=n>>>16;return (n>>>0)/4294967296};
const citrusSeason=()=>{const d=new Date(Date.now()+9*36e5),m=d.getUTCMonth()+1;return m>=11||(m==1&&d.getUTCDate()<=20)};
const dadStay=()=>dayRnd('dad')<(citrusSeason()?.85:.12);
const kinHelp=s=>{const{h}=jejuNow();return citrusSeason()&&h>=8&&h<17&&dayRnd(s)<.1};
const penBusy=id=>/^penR/.test(id)&&dayRnd(id)<.45;
const momVisit=()=>{const{h}=jejuNow(),off=dayRnd('momoff')<.3,w=dayRnd('momwhere')*4|0,go=k=>elderSlot(k)=='home'?k:null;if(dayRnd('momgo')>=(off?.8:.35))return null;if(off&&h>=10&&h<12)return citrusSeason()?'or':null;if(off&&h>=12&&h<14)return go(w%2?'gp':'gm');if(h>=19&&h<21){if(w==3&&dadStay())return 'nm';return go(w%2?'gp':'gm')}return null};
const marketDay=()=>{const q=+QS.get('day')||new Date(Date.now()+9*36e5).getUTCDate();return q%5==2};
const marketOpen=()=>{const{h}=jejuNow();return marketDay()&&h>=8&&h<16};
const elderSlot=k=>{const{h}=jejuNow();if(typeof WET=='function'&&WET())return 'home';if(kinHelp(k=='gp'?'gp1':'gp2'))return 'help';const r0=dayRnd('slot'+k);if(h<7||h>=18)return 'home';if(h<9)return 'yard';if(h<12){if(marketOpen()&&r0<.5)return 'market';return r0<.65?'hall':'yard'}if(h<14)return 'home';if(h<16){if(marketOpen())return 'market';return r0>.5?'walk':'hall'}return 'sea'};
const homeLock=(x,y)=>{if(isOwner()||!sleepHours()||!map||!map.d)return false;const d=map.d[x+','+y];return !!d&&['gpHome','gmHome','nongmak','blackHouse'].includes(d[0])};   // 보성의 집은 방명록이 있어 늘 열어 둠. 안방만 운영자 전용
let lockT=0;
const shutterKey=()=>cur=='gym'?'court':cur=='vol'?'volC':'vcB',shutterShut=()=>shopClosed(shutterKey());
function free(x,y){
  if(at(x,y)=='㏊'&&!hallaOpen()&&py>y){if(Date.now()-lockT>2500&&held!=null){lockT=Date.now();toast('🚧 '+hallaMsg())}return false}
  if(cur=='swim'&&y==19&&(x==28||x==30)&&(POOL.pick!=(x==28?'m':'f'))){if(Date.now()-lockT>2500&&held!=null){lockT=Date.now();toast(POOL.pick?(POOL.pick=='f'?'여 탈의실을 이용해 주세요.':'남 탈의실을 이용해 주세요.'):'먼저 안내 데스크에서 수영복을 받아 주세요.')}return false}
  if(at(x,y)=='㋸'&&py>y&&shutterShut()){if(Date.now()-lockT>2500&&held!=null){lockT=Date.now();const L=SHOP_H[shutterKey()];toast('🔒 셔터가 내려가 있어요 · '+L.n+' '+L.txt)}return false}
  if(homeLock(x,y)){if(Date.now()-lockT>2500&&held!=null){lockT=Date.now();toast(cur=='orchard'?'늦은 시간에는 문이 잠겨 있어요. 아침에 다시 와 주세요. 🌙':'어르신들이 주무시는 시간이에요. 아침에 다시 와 주세요. 🌙')}return false}
  {const L=shopLock(x,y);if(L){if(Date.now()-lockT>2500&&held!=null){lockT=Date.now();toast('🔒 '+L.n+' CLOSED · '+L.txt)}return false}}
  if(cur=='woodang'&&x==15&&(y==2||y==10)&&!libRoomOpen()){if(Date.now()-lockT>2500&&held!=null){lockT=Date.now();toast('🔒 자료실은 지금 운영시간이 아니에요. 평일 22시, 주말 18시까지예요.')}return false}
  if(cur=='cinema'&&y==2&&[5,7,9].includes(x)&&cineHall((x-5)/2).closed){if(Date.now()-lockT>2500&&held!=null){lockT=Date.now();toast('🔒 상영관 문이 닫혀 있어요. 09:00부터 상영해요.')}return false}
  if(anbangLock(x,y)){if(Date.now()-lockT>2500&&held!=null){lockT=Date.now();toast('부모님 안방이에요. 들어갈 수 없어요. 🚪')}return false}
  if(busBlocks(x,y))return false;
  if(x<0||y<0||x>=MW()||y>=MH()||!WALK.includes(at(x,y)))return false;
  if(npcs.some(n=>(n.x==x&&n.y==y)||(n.mv&&n.mv.tx==x&&n.mv.ty==y)))return false;
  if(rtTileBusy(x,y))return false;
  return !(x==px&&y==py);
}

const UMC=['#3b82f6','#ef4444','#f59e0b','#10b981','#a855f7','#ec4899','#0ea5e9'];
function drawUmb(nx,ny,col){const ux=nx*TS+16,uy=ny*TS+3;g.fillStyle=col;g.beginPath();g.ellipse(ux,uy,15,9,0,Math.PI,0);g.fill();g.fillStyle='#0003';g.fillRect(ux-15,uy-1,30,2);g.fillStyle='#4b5563';g.fillRect(ux+11,uy,2,13)}
const QUIET_M=/^(cafe|cinema|cineH\d|photo|library|bowl|bowlShop|pension|woodang|woodang2|woodangF|fit|vc|agency|mensa|projects|haenyeo|suisan2|jaldo|shabu)$/;
function buildNpcs(){
  const rain=WX.kind=='rain';
  const deep=(h=>h>=1&&h<5)(jejuNow().h);   // 새벽엔 밖에 거의 아무도 없음
  const away=map.o&&(isNight()||WET());   // 밤이나 궂은 날엔 몇 명만 남고 귀가
  const hq=jejuNow().h,quiet=QUIET_M.test(cur)&&(hq>=23||hq<7);
  npcs=map.p.filter((o,i)=>!(quiet&&(o.w||o.sit||o.eat||o.cup||o.swim)&&!o.stay)&&!(rain&&o.run&&!o.allw)&&(!o.when||o.when())&&(!away||o.stay||FAMILY.includes(o.n)||o.eg||o.n=='송'||(i%3==0&&!deep))).map((o,i)=>{const n={...o,hx:o.x,hy:o.y,dir:o.fd||0};if(rain&&map.o&&!n.pet&&!n.ani&&!n.allw)n.um=UMC[i%UMC.length];if(n.run&&TRACK[n.ti]){n.x=TRACK[n.ti][0];n.y=TRACK[n.ti][1]}return n});
  if(rain&&map.o&&map.umb&&!isNight())map.umb.forEach(([x,y,c],i)=>npcs.push({x,y,hx:x,hy:y,dir:0,c:'#6b7280',h:'#222',w:1,um:c,n:'우산 쓴 주민',s:UMB[i%UMB.length]}));
  metroCrowd();
  declog();
}
/* 지하철 이용객: 출퇴근 > 낮 > 저녁 늦게 > 새벽 순으로 많음 */
const RIDER_C=['#334155','#1e40af','#7c3aed','#b91c1c','#0f766e','#a16207','#475569','#be185d','#111827','#0369a1'],RIDER_H=['#222','#3f2a1c','#111','#5b4636','#9ca3af'],RIDER_T=[['열차가 곧 들어온대요.'],['오늘 사람 정말 많네요.'],['환승하러 가는 길이에요.'],['이어폰 끼고 가면 금방이에요. 🎧'],['퇴근하면 뭐 먹지…'],['한 칸만 더 가면 돼요.']];
function metroLoad(){const h=jejuNow().h;if(h>=1&&h<5)return 0;if((h>=7&&h<10)||(h>=17&&h<20))return 1;if(h>=10&&h<17)return .6;if(h>=20&&h<23)return .35;if(h>=5&&h<7)return .25;return .12}
function rider(x,y,up){return{x,y,hx:x,hy:y,dir:up?1:(Math.random()*4|0),c:RIDER_C[Math.random()*RIDER_C.length|0],h:RIDER_H[Math.random()*RIDER_H.length|0],n:'지하철 승객',rider:1,w:up?0:1,s:RIDER_T[Math.random()*RIDER_T.length|0]}}
function riderSpot(rows){const a=[];rows.forEach(y=>{for(let x=1;x<MW()-1;x++){if(Math.abs(x-7)<=1||(map.sides&&map.sides.some(q=>Math.abs(x-q.door)<=1||Math.abs(x-q.door+7)<=1))||!WALK.includes(at(x,y))||(map.d&&(map.d[x+','+y]||map.d[x+','+(y-1)])))continue;if(!npcs.some(n=>n.x==x&&n.y==y)&&!(x==px&&y==py))a.push([x,y])}});return a.length?a[Math.random()*a.length|0]:null}
function metroCrowd(){if(!map||!(map.pf||/^cc_/.test(cur)))return;const L=metroLoad(),n=Math.round((map.pf?14:12)*L);for(let i=0;i<n;i++){const s=riderSpot(map.pf?(i%3==2?[6]:[4]):[3,4,6,8]);if(s)npcs.push(rider(s[0],s[1],map.pf&&s[1]==4))}}
/* 열차가 서 있으면 타고 내리고, 떠나면 다시 사람들이 모임 */
function metroFlow(){if(!map||!map.pf||!npcs)return;const on=pfReady(),rs=npcs.filter(n=>n.rider),want=Math.round(14*metroLoad());
  if(on){const q=rs.filter(n=>n.y==4&&!n.off);if(q.length){const a=q[Math.random()*q.length|0];npcs.splice(npcs.indexOf(a),1)}
    if(rs.filter(n=>n.off).length<want/3){const s=riderSpot([4]);if(s){const o=rider(s[0],s[1],0);o.off=1;o.w=1;o.n='막 내린 승객';o.s=['겨우 내렸어요.'];npcs.push(o)}}}
  else{const of=rs.find(n=>n.off);if(of&&Math.random()<.6)npcs.splice(npcs.indexOf(of),1);else if(rs.length<want&&Math.random()<.7){const s=riderSpot([4,4,6]);if(s)npcs.push(rider(s[0],s[1],s[1]==4))}}}
setInterval(()=>{if(!dlg&&!modal&&!busy)metroFlow()},900);
/* 길막 방지: 문·출구로 가는 길을 끊는 사람은 옆으로 비켜 세움. 돌아다니는 사람은 문 앞·맵 끝에 서지 않음 */
function keyCells(){const W=MW(),H=MH(),s=new Set();Object.keys(map.d||{}).forEach(k=>s.add(k));Object.keys(map.ex||{}).forEach(k=>s.add(k));const e=map.e||{};if(e.u)for(let x=0;x<W;x++)s.add(x+',0');if(e.d)for(let x=0;x<W;x++)s.add(x+','+(H-1));if(e.l)for(let y=0;y<H;y++)s.add('0,'+y);if(e.r)for(let y=0;y<H;y++)s.add((W-1)+','+y);return[...s].filter(k=>{const[x,y]=k.split(',').map(Number);return WALK.includes(at(x,y))})}
function reach(sx,sy,block){const seen=new Set([sx+','+sy]),q=[[sx,sy]];while(q.length){const[a,b]=q.pop();DV.forEach(([dx,dy])=>{const n=a+dx,o=b+dy,k=n+','+o;if(n<0||o<0||n>=MW()||o>=MH()||seen.has(k)||block.has(k)||!WALK.includes(at(n,o)))return;seen.add(k);q.push([n,o])})}return seen}
function declog(){if(!map||!map.m)return;const keys=keyCells();if(!keys.length)return;
  let st=null,bs=-1;keys.forEach(k=>{const[x,y]=k.split(',').map(Number),r=reach(x,y,new Set());if(r.size>bs){bs=r.size;st=[x,y,r]}});
  const want=keys.filter(k=>st[2].has(k));
  const start=()=>{const o=new Set(npcs.map(n=>n.x+','+n.y));const k=want.find(k=>!o.has(k));return k?k.split(',').map(Number):null};
  const score=(ig)=>{const b=new Set(npcs.filter(n=>n!==ig).map(n=>n.x+','+n.y)),s0=start();if(!s0)return[0,0];const r=reach(s0[0],s0[1],b);return[want.filter(k=>r.has(k)).length,r.size]};
  for(let round=0;round<3;round++){let moved=false;for(const n of npcs){if(n.sit||n.run||!WALK.includes(at(n.x,n.y)))continue;const a=score(null),c=score(n);if(!(c[0]>a[0]||(map.o&&c[1]-a[1]>=8)))continue;
    let best=null,bd=1e9;for(let y=0;y<MH();y++)for(let x=0;x<MW();x++){if(!'.F'.includes(at(x,y))||npcs.some(o=>o.x==x&&o.y==y)||(map.d&&map.d[x+','+y]))continue;const q=Math.abs(x-n.x)+Math.abs(y-n.y);if(q>=bd)continue;const ox=n.x,oy=n.y;n.x=x;n.y=y;const v=score(null);n.x=ox;n.y=oy;if(v[0]>=c[0]&&v[1]>=c[1]-1){bd=q;best=[x,y]}}
    if(best){n.x=n.hx=best[0];n.y=n.hy=best[1];moved=true}}if(!moved)break}
}
function nearKey(x,y){if(x==0||y==0||x==MW()-1||y==MH()-1)return true;return !!(map.d&&(map.d[x+','+(y-1)]||map.d[x+','+y]))}

/* 도착한 자리가 나무·NPC에 갇혀 있으면 가장 가까운 열린 자리로 옮김 */
function roomAt(x,y,blocked){
  const seen=new Set([x+','+y]),q=[[x,y]];
  while(q.length&&seen.size<12){const[a,b]=q.pop();DV.forEach(([dx,dy])=>{const n=a+dx,o=b+dy,k=n+','+o;
    if(n<0||o<0||n>=MW()||o>=MH()||seen.has(k)||!WALK.includes(at(n,o))||blocked.has(k))return;seen.add(k);q.push([n,o])})}
  return seen.size;
}
function unstick(){
  if(cur=='pcRoom'&&pcRoomOf(px,py))return;
  const blocked=new Set(npcs.filter(n=>!n.w&&!n.run).map(n=>n.x+','+n.y));
  const ok=(x,y)=>WALK.includes(at(x,y))&&!blocked.has(x+','+y)&&roomAt(x,y,blocked)>=12;
  if(ok(px,py))return;
  for(let r=1;r<MW()+MH();r++)for(let y=0;y<MH();y++)for(let x=0;x<MW();x++)
    if(Math.abs(x-px)+Math.abs(y-py)==r&&!(map.d&&map.d[x+','+y])&&ok(x,y)){px=x;py=y;return}
}
/* 벤치·정자·놀이기구에 앉기 */
let SIT=null;
/* 침대에서 자기: 화면이 어두워지고 쿨쿨, 일어나면 한마디 */
let SLEEP=null;const WAKE=['후~ 푹 잤다! 😌','아~ 잘 잤다. 개운하다! ☀','벌써 아침인가? 한숨 더 잘까…'];
let PB_NO=0,PB=null;
function pbStop(){if(PB){clearInterval(PB.tm);clearTimeout(PB.to);if(PB.v)PB.v.remove();if(PB.st)PB.st.getTracks().forEach(t=>t.stop());PB=null}}
const PB_SC=[['','🎨 단색'],['orange','🍊 귤밭'],['stone','🗿 돌하르방'],['plane','✈ 비행기'],['palm','🌴 야자수'],['sea','🌊 바다'],['halla','⛰ 한라산'],['cherry','🌸 벚꽃'],['night','🎆 밤하늘'],['mix','🎲 컷마다 다르게']];
function pbScene(c,w,h,id,sky){const u=w/40,R=(col,x,y,a,b)=>{c.fillStyle=col;c.fillRect(x*u,y*u,a*u,b*u)},O=(col,x,y,r)=>{c.fillStyle=col;c.beginPath();c.arc(x*u,y*u,r*u,0,7);c.fill()},H=h/u;
 const tree=(x,b)=>{R('#78350f',x-1,b-6,2,6);O('#15803d',x,b-9,5);O('#16a34a',x-1,b-10,3.5);[[-3,-8],[2,-11],[3,-7],[-1,-6],[-2,-12]].forEach(([a,d])=>O('#f97316',x+a,b+d,1.1))},
 stone=(x,b)=>{R('#44403c',x-3,b-11,6,11);R('#57534e',x-3,b-11,6,1);R('#292524',x-3,b-16,6,1);O('#44403c',x,b-13,3.4);R('#292524',x-3,b-17,6,1.5);R('#1c1917',x-2,b-14,1.4,1.4);R('#1c1917',x+.6,b-14,1.4,1.4);R('#292524',x-.6,b-13,1.2,2);R('#292524',x-3,b-8,4,1.2);R('#292524',x-1,b-5.5,4,1.2)},
 palm=(x,b)=>{for(let i=0;i<8;i++)R('#92400e',x+Math.sin(i/2)*.8-.7,b-i*2-2,1.5,2.2);[[-6,-1],[-4,-3],[0,-4],[4,-3],[6,-1]].forEach(([a,d])=>{R('#16a34a',x+Math.min(a,0),b-18+d,Math.abs(a),1.2);R('#15803d',x+a-.5,b-18+d+1,1.5,1.5)});O('#78350f',x-1,b-16,.9);O('#78350f',x+1,b-16,.9)},
 plane=(x,y)=>{R('#f8fafc',x-7,y,14,2.6);O('#f8fafc',x+7,y+1.3,1.3);R('#2563eb',x-7,y+1.8,14,.8);R('#cbd5e1',x-2,y+2,5,1);R('#2563eb',x-7,y-2.5,2,2.6);[-3,-1,1,3,5].forEach(a=>R('#0ea5e9',x+a,y+.6,.8,.8))},
 sun=(x,y,r,col)=>O(col,x,y,r),cloud=(x,y)=>{O('#ffffffd0',x,y,1.8);O('#ffffffd0',x+2,y-.5,2.2);O('#ffffffd0',x+4,y,1.6)};
 const G=H-5;
 if(sky){const S={orange:['#bae6fd','#86efac'],stone:['#fde68a','#a3e635'],plane:['#7dd3fc','#94a3b8'],palm:['#fdba74','#fde68a'],sea:['#7dd3fc','#0ea5e9'],halla:['#bfdbfe','#4ade80'],cherry:['#fce7f3','#bbf7d0'],night:['#1e1b4b','#0f172a']}[id];R(S[0],0,0,40,H);R(S[1],0,G,40,5);
  if(id=='orange'){sun(34,5,3,'#fde047');cloud(14,5)}
  if(id=='stone'){for(let x=0;x<40;x+=4){R('#57534e',x,G-2,3.6,1.8);R('#44403c',x+2,G-3.6,3.6,1.6)}sun(6,6,3,'#fbbf24')}
  if(id=='plane'){cloud(4,8);cloud(28,6);R('#475569',0,G+1.8,40,.5);for(let x=2;x<40;x+=8)R('#f8fafc',x,G+1.8,4,.5)}
  if(id=='palm'){sun(20,10,6,'#fb7185');R('#38bdf8',0,G-4,40,4);R('#ffffff80',6,G-3,6,.5);R('#ffffff80',26,G-2,7,.5)}
  if(id=='sea'){sun(33,6,3,'#fde047');cloud(6,6);R('#0284c7',0,G-6,40,6);R('#ffffff90',4,G-4,7,.5);R('#ffffff90',24,G-2,8,.5);R('#ffffff90',12,G+2,9,.5);R('#fde68a',0,H-2,40,2)}
  if(id=='halla'){c.fillStyle='#64748b';c.beginPath();c.moveTo(0,G*u);c.lineTo(20*u,(G-16)*u);c.lineTo(40*u,G*u);c.fill();c.fillStyle='#f8fafc';c.beginPath();c.moveTo(16*u,(G-12.8)*u);c.lineTo(20*u,(G-16)*u);c.lineTo(24*u,(G-12.8)*u);c.fill();cloud(3,7);cloud(30,9)}
  if(id=='night'){[[3,4],[9,8],[14,3],[25,4],[31,9],[37,5],[20,7],[6,13],[35,14]].forEach(([x,y])=>R('#fef9c3',x,y,.5,.5));O('#fde68a',32,5,2.4);O('#1e1b4b',33,4.5,2.1)}
 }
 if(id=='orange'){tree(5,G+2);tree(35,G+2)}
 if(id=='stone'){stone(6,G+3);stone(34,G+3)}
 if(id=='plane')plane(9,6);
 if(id=='palm'){palm(5,G+3);palm(35,G+3)}
 if(id=='sea'){O('#f97316',5,G+2,2.4);R('#fff7ed',3,G+1.6,4,.6);O('#f8fafc',36,G+3,1.2);O('#fbbf24',33,G+3.4,.8)}
 if(id=='halla'){[3,8,32,37].forEach(x=>{R('#14532d',x-.6,G+.5,1.2,3);O('#166534',x,G,2)})}
 if(id=='cherry'){[[3,3],[7,1],[12,4],[1,8],[33,2],[37,4],[29,1],[38,9]].forEach(([x,y])=>O('#f9a8d4',x,y,2.3));[[5,14],[34,12],[9,20],[30,18],[3,22],[37,20]].forEach(([x,y])=>O('#fbcfe8',x,y,.6))}
 if(id=='night'){[[5,10,'#f472b6'],[35,12,'#38bdf8'],[8,4,'#fde047']].forEach(([x,y,col])=>{for(let a=0;a<8;a++){const q=a*Math.PI/4;R(col,x+Math.cos(q)*2.4,y+Math.sin(q)*2.4,.5,.5);R(col,x+Math.cos(q)*1.2,y+Math.sin(q)*1.2,.4,.4)}})}
}
const pbSc=(P,pose)=>P.scene=='mix'?PB_SC[1+(pose+(P.mix||0))%8][0]:P.scene;
function showBooth(kind){pbStop();const F=kind=='four',BG=F?['#fbcfe8','#bfdbfe','#bbf7d0','#fde68a','#1f2937']:['#ffffff','#bfdbfe','#d1d5db'];PB={kind,bg:BG[0],fr:F?'#111827':'#fff',shots:[],st:null,v:null,tm:0,to:0,busy:false};
 openM(`<h3>${F?'📸 즉석사진 기계':'🪪 증명사진 기계'}</h3><div class="cd" style="font-size:12px">${F?'4번 연속으로 찍어 한 장으로 뽑아 줘요.':'배경을 고르고 찍으면 네 장짜리로 뽑아 줘요.'} 찍은 사진은 이 기기에만 남아요.</div><div style="text-align:center"><canvas id="pbC" width="${F?400:300}" height="${F?300:400}" style="max-width:100%;max-height:44vh;border-radius:8px;background:#111"></canvas></div><div class="qbtn" style="justify-content:center;margin:6px 0">${BG.map(c=>`<button class="xb" style="background:${c};width:34px;height:26px;border:1px solid #6b7280" aria-label="배경색" onclick="PB.bg='${c}';PB.scene='';pbPrev()"></button>`).join('')}</div>${F?`<div class="qbtn" style="justify-content:center;flex-wrap:wrap;margin:6px 0">${PB_SC.slice(1).map(([k,n])=>`<button class="xb" onclick="PB.scene='${k}';PB.mix=Math.random()*8|0;pbPrev()">${n}</button>`).join('')}</div>`:''}<div class="qbtn" style="justify-content:center"><button class="xb" id="pbCam" onclick="pbCam()">📷 내 카메라 쓰기</button><button class="xb big" id="pbGo" onclick="pbShoot()">찍기</button></div><div id="pbOut" style="text-align:center;margin-top:8px"></div>`);pbPrev();PB.tm=setInterval(pbPrev,120)}
function pbFace(c,w,h,pose){const P=PB,SC=P.kind=='four'&&P.scene?pbSc(P,Math.max(0,pose)):'';c.fillStyle=P.bg;c.fillRect(0,0,w,h);if(SC)pbScene(c,w,h,SC,true);const VS=P.v&&P.v.videoWidth?P.v:P.img;if(VS){const vw=VS.videoWidth||VS.naturalWidth,vh=VS.videoHeight||VS.naturalHeight,sc=Math.max(w/vw,h/vh),dw=vw*sc,dh=vh*sc;c.save();if(VS===P.v){c.translate(w,0);c.scale(-1,1)}c.drawImage(VS,(w-dw)/2,(h-dh)/2,dw,dh);c.restore();if(SC)pbScene(c,w,h,SC,false);return}
 c.save();c.imageSmoothingEnabled=false;const s=Math.floor(Math.min(w,h)*(P.kind=='id'?.05:.035));c.translate(Math.round(w/2-6*s),Math.round(P.kind=='id'?h*.2:h*.18+(pose%2)*s));spr(c,0,0,s,{d:0,l:false,...playerLook()});c.restore();if(P.kind=='four'&&pose>=0){c.font=Math.round(h*.16)+'px sans-serif';c.textAlign='center';c.fillText(['✌️','😄','💖','🍊'][pose%4],w*.82,h*.28)}}
function pbPrev(){const C=$('#pbC');if(!PB||!C||PB.busy&&PB.flash==null)return;const c=C.getContext('2d');pbFace(c,C.width,C.height,PB.shots.length);if(PB.cd){c.fillStyle='#0006';c.fillRect(0,0,C.width,C.height);c.fillStyle='#fff';c.font='bold 90px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(PB.cd,C.width/2,C.height/2);c.textBaseline='alphabetic'}if(PB.flash){c.fillStyle='#fff';c.fillRect(0,0,C.width,C.height)}}
async function pbCam(){if(!PB)return;try{const st=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});if(!PB){st.getTracks().forEach(t=>t.stop());return}const v=document.createElement('video');v.muted=true;v.autoplay=true;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('muted','');v.setAttribute('webkit-playsinline','');v.style.cssText='position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none;z-index:-1';document.body.appendChild(v);v.srcObject=st;PB.st=st;PB.v=v;try{await v.play()}catch(e){}const P=PB,t0=Date.now();const wait=()=>{if(PB!==P)return;if(v.videoWidth&&v.readyState>=2){$('#pbCam').disabled=true;pbPrev();return}try{v.play().catch(()=>{})}catch(e){}if(Date.now()-t0>4000){pbCamFail('카메라 화면을 받지 못했어요.');return}setTimeout(wait,200)};wait()}catch(e){pbCamFail(e&&e.name=='NotAllowedError'?'카메라 권한이 거부됐어요.':'이 브라우저에서 카메라를 열 수 없어요.')}}
function pbCamFail(msg){if(PB&&PB.v){PB.v.remove();PB.v=null}if(PB&&PB.st){PB.st.getTracks().forEach(t=>t.stop());PB.st=null}toast(msg);const b=$('#pbCam');if(b&&!$('#pbFile')){b.insertAdjacentHTML('afterend','<label class="xb" style="display:inline-block;cursor:pointer">📷 휴대폰 카메라 앱으로 찍기<input id="pbFile" type="file" accept="image/*" capture="user" hidden onchange="pbFileUse(this)"></label>')}}
function pbFileUse(i){const f=i.files&&i.files[0];if(!f||!PB)return;const m=new Image();m.onload=()=>{if(PB){PB.img=m;pbPrev()}};m.src=URL.createObjectURL(f)}
function pbShot(){const C=document.createElement('canvas'),F=PB.kind=='four';C.width=F?400:300;C.height=F?300:400;pbFace(C.getContext('2d'),C.width,C.height,PB.shots.length);PB.shots.push(C)}
function pbShoot(){if(!PB||PB.busy)return;const P=PB,n=P.kind=='four'?4:1;P.busy=true;P.shots=[];$('#pbGo').disabled=true;$('#pbOut').innerHTML='';const one=()=>{let t=3;const tick=()=>{if(PB!==P)return;if(t>0){P.cd=t;t--;sfx('s');P.to=setTimeout(tick,650);return}P.cd=0;pbShot();P.flash=1;tone(9,.08,'square',.05);P.to=setTimeout(()=>{if(PB!==P)return;P.flash=0;if(P.shots.length<n)one();else{P.busy=false;$('#pbGo').disabled=false;pbPrint()}},160)};tick()};one()}
function pbPrint(){const P=PB,C=document.createElement('canvas'),c=C.getContext('2d'),d=new Date(),ds=d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0');
 if(P.kind=='four'){C.width=440;C.height=1370;c.fillStyle=P.fr;c.fillRect(0,0,C.width,C.height);P.shots.forEach((s,i)=>c.drawImage(s,20,20+i*310));c.fillStyle='#fff';c.textAlign='center';c.font='bold 30px sans-serif';c.fillText('BS WORLD',220,1302);c.font='18px sans-serif';c.fillText(ds,220,1340)}
 else{C.width=660;C.height=860;c.fillStyle='#f8fafc';c.fillRect(0,0,C.width,C.height);for(let y=0;y<2;y++)for(let x=0;x<2;x++){const a=20+x*320,b=20+y*420;c.drawImage(P.shots[0],a,b);c.strokeStyle='#cbd5e1';c.strokeRect(a,b,300,400)}}
 const u=C.toDataURL('image/png');$('#pbOut').innerHTML=`<img src="${u}" alt="찍은 사진" style="max-width:100%;max-height:50vh;border-radius:6px"><div class="qbtn" style="justify-content:center;margin-top:6px"><a class="xb" href="${u}" download="bsworld-${P.kind=='four'?'photo':'id'}.png">💾 저장</a></div>`;toast('🖨 사진이 나왔어요!')}
const EX_N={push:'💪 팔굽혀펴기',situp:'🔥 윗몸일으키기',rope:'🪢 줄넘기',run:'🏃 러닝머신',bench:'🏋 벤치프레스',bar:'🤸 철봉'};
function exAll(){try{const o=JSON.parse(localStorage.getItem('bsw_ex')||'{}')||{};for(const k in o)if(typeof o[k]=='number')o[k]={best:o[k],sum:o[k]};return o}catch(e){return{}}}
function exLog(k,n){const o=exAll(),r=o[k]||{best:0,sum:0};r.best=Math.max(r.best,n);r.sum+=n;o[k]=r;try{localStorage.setItem('bsw_ex',JSON.stringify(o))}catch(e){}return r}
function exCard(){const o=exAll(),K0=Object.keys(EX_N).filter(k=>o[k]);return '<div class="qform"><b>🏃 내 체험 기록</b>'+(K0.length?K0.map(k=>`<div class="xrow" style="margin:3px 0;padding:4px 8px"><span>${EX_N[k]}</span><b>최고 ${o[k].best}회 · 누적 ${o[k].sum.toLocaleString('ko-KR')}회</b></div>`).join(''):'<p style="font-size:12px;margin:4px 0;opacity:.7">기구를 체험하면 여기에 쌓여요.</p>')+'</div>'}
function exStart(x,y,m){sitDown(x,y,'ex',EX_N[m]+' 시작! A(Z)를 누를 때마다 1회, B(X)로 끝내기');SIT.ex=m}
function goSleep(x,y,tent){sitDown(x,y,tent?'tent':'bed','');busy=true;SLEEP={a:null,tent:!!tent};if(bgm)tone(-5,.5,'sine',.04)}
function drawSleep(t){if(SLEEP.a==null)SLEEP.a=t;const e=t-SLEEP.a,DUR=4200,w=cv.width,h=cv.height,al=e<900?e/900:e>DUR-800?Math.max(0,(DUR-e)/800):1;if(SLEEP.tent){g.save();g.setTransform(1,0,0,1,0,0);g.fillStyle=`rgba(2,6,23,${al*.42})`;g.fillRect(0,0,w,h);g.restore();if(e>=DUR){SLEEP=null;busy=false;sitUp();say('나',['텐트에서 푹 잤다. 새소리가 들린다. 🌿'])}return}
  g.fillStyle='rgba(3,5,15,'+al+')';g.fillRect(0,0,w,h);
  if(e>500&&e<DUR-500){g.fillStyle='#e2e8f0';g.font='bold 18px sans-serif';g.textAlign='center';g.fillText('잠에 듭니다…',w/2,h/2-26);g.fillStyle='#93c5fd';g.font='bold 24px sans-serif';g.fillText('쿨쿨'+'.'.repeat((e/500|0)%4),w/2,h/2+12);g.font='bold 16px sans-serif';[0,1,2].forEach(i=>{const q=((e/1400+i/3)%1);g.globalAlpha=1-q;g.fillText('Z',w/2+50+q*40+i*6,h/2-10-q*50);g.globalAlpha=1});g.textAlign='start'}
  if(e>=DUR){SLEEP=null;busy=false;sitUp();say('나',[WAKE[Math.random()*WAKE.length|0]])}}
function seatDir(x,y,id,fb){const z=id?M[id]:map,cid=id||cur,T=(a,b)=>(z.m[b]||'')[a],TB='ㆍ㈃㉵';if(/^(academy|cineH)/.test(cid))return 1;for(let i=1;i<=5;i++){if('㍛㍜'.includes(T(x,y-i)||' '))return 1;if('㍛㍜'.includes(T(x,y+i)||' '))return 0}const SC='㌻㌼Ⓣ㎅㈂㉽';for(let i=1;i<=6;i++){if(SC.includes(T(x,y-i)||' '))return 1;if(SC.includes(T(x,y+i)||' '))return 0;if(SC.includes(T(x-i,y)||' '))return 2;if(SC.includes(T(x+i,y)||' '))return 3}if(T(x+1,y)=='ㆍ')return 3;if(T(x-1,y)=='ㆍ')return 2;if(T(x,y-1)=='ㆍ')return 1;if(T(x,y+1)=='ㆍ')return 0;for(let i=1;i<=4;i++){if('㎅㈂'.includes(T(x,y-i)||' ')||[-1,1,-2,2].some(a=>'㎅㈂'.includes(T(x+a,y-i)||' ')))return 1;if('㎅㈂'.includes(T(x,y+i)||' '))return 0}if(z.bb&&!z.o)return 1;{let be=null,bd=99;const FS='㌻㌼㉽';z.m.forEach((rw,b)=>[...rw].forEach((c,a)=>{if(FS.includes(c)){const q=Math.abs(a-x)+Math.abs(b-y);if(q<bd){bd=q;be=[a,b]}}}));if(be&&bd<=14){const dx=be[0]-x,dy=be[1]-y;return Math.abs(dy)>=1?(dy<0?1:0):(dx<0?2:3)}}if(!fb)return null;if(z.o){for(let i=1;i<=7;i++){if(T(x,y+i)=='~')return 0;if(T(x-i,y)=='~')return 2;if(T(x+i,y)=='~')return 3;if(T(x,y-i)=='~')return 1}}const SE='㉴㉺ㆎ㍝ㆁbgh',so=c=>c&&!WALK.includes(c)&&!SE.includes(c);if(so(T(x,y-1)))return 0;if(so(T(x,y+1)))return 1;if(so(T(x-1,y)))return 3;if(so(T(x+1,y)))return 2;return 0}
function sitDown(x,y,k,msg){SIT={x,y,k,fx:px,fy:py,n:0,up:0,at:performance.now()};px=x;py=y;dir=k=='bar'?1:0;if(k!='bar'){const d0=seatDir(x,y,undefined,k=='bench');if(d0!=null)dir=d0}mv=null;held=null;if(msg)toast(msg)}
function sitUp(pref){if(!SIT)return;libDone();if(SIT.k=='ex'&&SIT.n){const L0=exLog(SIT.ex,SIT.n);toast(EX_N[SIT.ex]+' '+SIT.n+'회 기록! 내 최고 '+L0.best+'회 💪')}const b=SIT.k=='bar'&&SIT.n?SIT.n:0;if(b)exLog('bar',b);const ok0=(x,y)=>WALK.includes(at(x,y))&&!npcs.some(n=>n.x==x&&n.y==y);let gx=SIT.fx,gy=SIT.fy,done0=false;if(pref!=null&&DV[pref]){const[dx,dy]=DV[pref],wd=SIT.k=='bed'&&dx>0?2:1,tx=SIT.x+dx*wd,ty=SIT.y+dy;if(ok0(tx,ty)){gx=tx;gy=ty;done0=true}}if(!done0&&!ok0(gx,gy)){const C0=[];for(let r=1;r<=3&&!C0.length;r++)for(let a=-r;a<=r;a++)for(let e=-r;e<=r;e++)if(Math.abs(a)+Math.abs(e)==r&&ok0(SIT.x+a,SIT.y+e))C0.push([SIT.x+a,SIT.y+e]);if(C0.length){gx=C0[0][0];gy=C0[0][1]}}px=gx;py=gy;SIT=null;held=null;if(b)toast('턱걸이 '+b+'회 수고했어요! 💪')}
const LIB_T={fire:['🔥','불멍 시작…','불멍'],read:['📖','책을 펼쳤어요.','독서'],study:['✏','공부를 시작해요.','공부'],rest:['😌','잠깐 쉬어요.','휴식']};
function libSit(x,y,m,up){sitDown(x,y,'bench',LIB_T[m][1]);SIT.lib=m;if(up)dir=1}
function libDone(){const S0=SIT;if(!S0||!S0.lib)return;const sec=Math.round((performance.now()-S0.at)/1000);if(S0.lib=='rest')return;if(sec>=5)toast(LIB_T[S0.lib][0]+' '+LIB_T[S0.lib][2]+' '+(sec>=60?Math.floor(sec/60)+'분 ':'')+(sec%60)+'초 했어요. 수고했어요!')}
function sitFx(t){if(!SIT||SIT.k!='bench')return;if(SIT.lib){if(SIT.lib=='rest')return;const p=((t-SIT.at)/1800)%1;g.font='15px sans-serif';g.fillText(LIB_T[SIT.lib][0],SIT.x*TS+20,SIT.y*TS+8-p*6);return}if(SIT.cafe)return cafeFx(t);const p=((t-SIT.at)/1600)%1;g.globalAlpha=1-p;g.font='14px sans-serif';g.fillText('💤',SIT.x*TS+20,SIT.y*TS+6-p*16);g.globalAlpha=1}
let RIDE_Q=0;
function drawRide(t){if(FLY.a==null)FLY.a=t;const F=FLY,p=(t-F.a)/F.dur,w=cv.width,h=cv.height,up=F.to=='yongsanSt2',fl=up?'2층':'1층';if(F.ride=='esc'){g.fillStyle='#cbd5e1';g.fillRect(0,0,w,h);g.fillStyle='#94a3b8';g.fillRect(0,0,w,h*.14);const n=9,sw=w/n,sh=h/n,off=((t-F.a)/110%1)*(up?1:-1);for(let i=-1;i<=n+1;i++){const q=i+off,X=q*sw,Y=up?h-q*sh:q*sh;g.fillStyle='#334155';g.fillRect(X,Y-10,sw+2,h);g.fillStyle='#64748b';g.fillRect(X,Y-10,sw+2,6);g.fillStyle='#fde047';g.fillRect(X,Y-10,sw+2,2)}g.fillStyle='#000b';g.fillRect(0,h/2-30,w,60);g.fillStyle='#fff';g.font='bold 22px sans-serif';g.textAlign='center';g.fillText(fl+'으로 '+(up?'올라가고':'내려가고')+' 있습니다.',w/2,h/2+8);g.textAlign='start'}else{const fin=p>.62,num=fin?fl:(up?'1층':'2층');if(fin&&!F.said){F.said=1;tone(19,.18,'sine',.06);SAY_KO(fl+'입니다.')}g.fillStyle='#475569';g.fillRect(0,0,w,h);const op=fin?Math.min(1,(p-.72)/.25):0,dw=w*.38*(1-Math.max(0,op));g.fillStyle='#0f172a';g.fillRect(w*.12,h*.2,w*.76,h*.8);g.fillStyle='#fde68a';g.fillRect(w*.14,h*.22,w*.72,h*.78);g.fillStyle='#94a3b8';g.fillRect(w*.12,h*.2,dw,h*.8);g.fillRect(w*.88-dw,h*.2,dw,h*.8);g.fillStyle='#cbd5e1';g.fillRect(w*.12,h*.2,Math.max(0,dw-4),6);g.fillStyle='#111827';g.fillRect(w/2-60,18,120,46);g.fillStyle='#fbbf24';g.font='bold 28px sans-serif';g.textAlign='center';g.fillText(num+(fin?'':up?' ▲':' ▼'),w/2,52);g.fillStyle='#000b';g.fillRect(0,h-64,w,44);g.fillStyle='#fff';g.font='bold 20px sans-serif';g.fillText(fin?fl+'입니다.':'엘리베이터 이동 중',w/2,h-35);g.textAlign='start'}if(p>=1){FLY=null;RIDE_Q=1;warp(F.to,F.x,F.y,F.d);RIDE_Q=0}}
function warp(id,x,y,d){
  if(!RIDE_Q&&!FLY&&/^yongsanSt/.test(cur)&&/^yongsanSt/.test(id)&&id!=cur){const k0=at(px,py);if(k0=='㎆'||k0=='㎇'){busy=true;mv=null;held=null;FLY={bus:1,ride:k0=='㎆'?'esc':'ele',dur:k0=='㎆'?800:1200,to:id,x,y,d,a:null};return}}
  const qt=RIDE_Q;SIT=null;busy=true;if(!qt)sfx('w');$('#fade').style.opacity=1;
  setTimeout(()=>{
    if(id=='house')ytLoad().catch(()=>{});const from=cur,isNewV=!visited.has(id);if(id=='route1'&&window.marketSync)marketSync();cur=id;map=M[id];visited.add(id);if(isNewV){stampNew(id);if(mmEls&&mmEls[id])setTimeout(()=>toast('🗺 '+M[id].n+' 해금! 이제 전체 지도로 이동할 수 있어요.'),2200)}if(typeof mmLocks=='function')mmLocks();wxSwitch();pfEnter(id);if(id=='photo')wallLoad();
    if(x==7&&y==8&&map.land)[x,y]=map.land;   // 지도·비행으로 올 때 내리는 자리
    updateHUD();px=x;py=y;dir=d;mv=null;
    songRoll(id);ckRoll(id);bsRoll(id);buildNpcs();unstick();
    if(id=='woodang'&&from!='woodang2'&&from!='woodangF'&&(isOwner()||ckMe())&&TX.ckWd&&TX.ckWd.length)setTimeout(()=>{if(cur=='woodang'&&!dlg&&!modal&&!busy)say(ckMe()?'강보성':'창끼',ckWoodang(0))},1100);
    rtMap(id);if(!/^swim/.test(id)){POOL.suit=null;POOL.pick=null}if(/^swimLock/.test(id))setTimeout(()=>{if(/^swimLock/.test(cur)&&!modal&&!dlg)poolChange()},900);if(id=='atelier')artLoad().catch(()=>{});if(id=='library')plLoad();if(id=='cinema'||/^cineH/.test(id))cineLoad();
    music();
    $('#fade').style.opacity=0;
    setTimeout(()=>{
      busy=false;banner(map.n);flashMiniMap();saveGame();
    },300);
  },380);
}

function banner(t){const b=$('#bn');b.textContent=t;b.style.opacity=1;setTimeout(()=>b.style.opacity=0,1700)}
function zone(){if(!map)return null;let id=map.o&&!map.par?cur:map.par;while(M[id]&&M[id].par)id=M[id].par;return id}

/* [월드맵] 각 지역의 실제 타일맵을 작은 캔버스로 그려 사각형 안에 투영 */
const MM_COL={'ɡ':'#c9a36b','ʊ':'#c9a36b','ɦ':'#c9a36b','℧':'#dc2626','Ж':'#a8875a','Ю':'#c2410c','ŋ':'#b45309','Ω':'#6cc04a','?':'#fde047',';':'#fde047','$':'#e2e8f0','¢':'#f8fafc','>':'#7c3aed','<':'#312e81',T:'#1e7a31','.':'#6cc04a',F:'#6cc04a','=':'#f3db98','~':'#38bdf8',s:'#fde047',
  R:'#d64541',Q:'#3b6fd6',G:'#2f9e5f',Y:'#7e57c2',H:'#fef3c7',D:'#78350f',t:'#c8693f',
  W:'#0f766e','@':'#ea580c','+':'#94a3b8',',':'#475569','#':'#7a4a22','[':'#6cc04a',']':'#6cc04a','|':'#6cc04a','%':'#44403c','&':'#2563eb',r:'#374151',y:'#374151',u:'#9ca3af',e:'#f8fafc',n:'#2563eb',j:'#bae6fd',S:'#475569',d:'#8b5a2b',o:'#8b5a2b',V:'#bfdbfe',v:'#dbeafe',m:'#1e7a31','1':'#38bdf8','2':'#38bdf8','3':'#38bdf8','4':'#38bdf8'};
Object.assign(MM_COL,{'㍿':'#565b66','㍾':'#475569','㍽':'#475569','㌾':'#f8fafc','㌿':'#e2e8f0','㍀':'#16a34a','㍁':'#f8fafc','㍂':'#f8fafc','㍃':'#d6d3d1','㌻':'#111827','㌼':'#111827','㌺':'#2dd4bf','㌶':'#1e3a8a','㌷':'#7dd3fc','㌸':'#e5e7eb','㌹':'#334155','㌵':'#1e3a8a','㌴':'#1d4ed8','㌳':'#1d4ed8','㌬':'#64748b','㌭':'#78350f','㌮':'#0f766e','㌯':'#1d4ed8','㌰':'#f8fafc','㌱':'#3f2a1c','㌲':'#bae6fd','㌪':'#bae6fd','㌫':'#ec4899','㌨':'#be185d','㌩':'#57534e','㌦':'#111827','㌧':'#16a34a','㌟':'#f8fafc','㌠':'#e5e7eb','㌡':'#dc2626','㌢':'#475569','㌣':'#f472b6','㌤':'#22c55e','㌥':'#166534','㌛':'#92400e','㌚':'#0f766e','㌜':'#ea580c','㌙':'#fef3c7','㌕':'#475569','㌖':'#64748b','㌗':'#e2e8f0','㌘':'#0f766e','㌎':'#7e22ce','㌏':'#1c1917','㌐':'#78350f','㌑':'#3f6212','㌒':'#ef4444','㌓':'#92400e','㌔':'#0f172a','㌊':'#b08968','㌋':'#475569','㌌':'#ef4444','㌀':'#16a34a','㌂':'#16a34a','㌁':'#0f766e','㌈':'#d97706','㌃':'#f97316','㌅':'#ef4444','㌆':'#475569','㌇':'#334155','㌉':'#1f2937','㋸':'#9ca3af','㋹':'#1d4ed8','㋺':'#78350f','㋻':'#fce7f3','㋼':'#78716c','㋽':'#ec4899','㋾':'#0369a1','㋷':'#78350f','㋶':'#93c5fd','㋪':'#111827','㋮':'#111827','㋯':'#374151','㋫':'#991b1b','㋬':'#f8fafc','㋭':'#78350f','㋰':'#f8fafc','㋱':'#2563eb','㋲':'#3f3f46','㋳':'#57534e','㋴':'#111827','㋵':'#1d4ed8','㋢':'#f8fafc','㋣':'#292524','㋤':'#e7e5e4','㋥':'#f97316','㋦':'#dc2626','㋧':'#f8fafc','㋨':'#292524','㋩':'#44403c','㋠':'#a16207','㋡':'#475569','㋙':'#0ea5e9','㋚':'#9a3412','㋛':'#c2610c','㋜':'#e0f2fe','㋞':'#e0f2fe','㋟':'#57534e','㋘':'#16a34a','㋐':'#f97316','㋑':'#ea580c','㋒':'#111827','㋓':'#3f2a1c','㋔':'#d4a35a','㋕':'#d4a35a','㋖':'#44403c','㋗':'#a16207','㋆':'#a58b5c','㋇':'#78716c','㋎':'#422006','㋈':'#44403c','㋉':'#9a3412','㋊':'#ef4444','㋋':'#991b1b','㋌':'#7dd3fc','㋍':'#64748b','㋀':'#94a3b8','㋁':'#64748b','㋂':'#16a34a','㋃':'#16a34a','㋄':'#f8fafc','㋅':'#f8fafc','㉽':'#0b1120','㊄':'#78716c','㊅':'#15803d','㊆':'#b45309','㊇':'#f8fafc','㊈':'#111827','㊉':'#f8fafc','㊋':'#a3e635','㊌':'#57534e','㊃':'#1e293b','㉾':'#1f2937','㊀':'#334155','㊁':'#7c2d12','㊂':'#1d4ed8','㉼':'#7f1d1d','㉥':'#b91c1c','㉦':'#1e3a5f','㉧':'#0369a1','㉨':'#e0f2fe','㉪':'#fef3c7','㉫':'#7c2d12','㉠':'#16803c','㉡':'#b45309','㉢':'#a8a29e','㉤':'#c9a36b','Ⓨ':'#a16207','Ⓓ':'#9a3412','Ⓜ':'#92400e','Ⓣ':'#111827','Ⓤ':'#fde047','Ⓚ':'#94a3b8','Ⓛ':'#64748b','Ⓒ':'#111827','Ⓢ':'#0d9488','Ⓗ':'#d6b98c','Ⓑ':'#cbd5e1','ⓡ':'#1f2937','ⓐ':'#6b3a2a','ⓑ':'#6b3a2a','ⓒ':'#d1d5db','ⓟ':'#0ea5e9','ⓓ':'#e2e8f0','ⓦ':'#7dd3fc','ㆌ':'#3b0764','ⓚ':'#111827','ⓔ':'#92400e','ㆎ':'#92400e','ㆍ':'#a16207','ㆋ':'#be185d','ㆄ':'#111827','ㆅ':'#b91c1c','ㆇ':'#450a0a','ㆈ':'#6cc04a','ㆊ':'#111827','ㄹ':'#6b7280','ㅂ':'#9ca3af','ㅅ':'#57534e','ㅈ':'#b45309','ㅊ':'#94a3b8','ㄱ':'#cbd5e1','ㄴ':'#1d4ed8','ㄷ':'#0284c7','ㅌ':'#f8fafc','ㅍ':'#15803d','ㅎ':'#fbbf24','ㅐ':'#f9a8d4','ㅔ':'#a8a29e','ㅑ':'#2f8f3a','ㅗ':'#c2553a','ㅛ':'#9ca3af','ㅉ':'#f8fafc','ㅋ':'#f97316','ㅣ':'#c9c1b1','ㅜ':'#c9c1b1','ㅞ':'#c9c1b1','ㅝ':'#e7dcc0','ㅢ':'#3f9148','ㅟ':'#14532d','ㅚ':'#a8a29e','ㅓ':'#a8a29e','ㅕ':'#a97142','ㅒ':'#7c6f64','ㅘ':'#1f2937','ㅙ':'#fef3c7','ㅖ':'#b91c1c','ㅡ':'#0f766e','ㅹ':'#7c2d12','ㅺ':'#e7d3b0','ㅻ':'#78350f','ㅠ':'#bdb092','ㅁ':'#a8533a','ㅃ':'#b5583f','ㅆ':'#92400e','ㅀ':'#1d4ed8'});
const MM_FL=['#f472b6','#ffffff','#facc15','#a78bfa','#60a5fa','#fb923c','#e11d48'];
const MM_NODES=[['cityhall','제주시청','제주시청'],['hamdeok','함덕','함덕서우봉해변'],['shoreF','해안숲','해안 숲길'],['gotF','서귀포','서귀포'],['oreumF','건입동','건입동'],['samgeori','공원','공원'],['beach','백사장','하얀 백사장'],['studio','용담','용담'],['route2','원도심','원도심 거리'],['rest','놀멍쉬멍','놀멍쉬멍'],['airport','공항','제주 공항'],['orchard','과수원','감귤 과수원'],['minsok','민속촌','제주민속촌'],['route1','표선','표선'],['coast','해변','제주해변'],['seongsan','성산','성산일출봉'],['moseulpo','모슬포','모슬포항'],['udo','우도','우도'],['tosan','토산','토산'],['halla','한라산','한라산'],['town','삼화지구','삼화지구'],['sports','사라봉','사라봉']];
const MM_SEOUL=[['sindorim','신도림','신도림'],['mapo','마포','마포'],['gaehwa','개화','개화'],['saetgang','샛강','샛강'],['yeouinaru','여의나루','여의나루'],['assembly','국회','국회의사당'],['dangsan','당산','당산'],['yeongdeungpo','영등포','영등포'],['gimpo','김포공항','김포공항'],['yeouido','여의도','여의도'],['yongsan','용산','용산'],['singil','신길','신길'],['daebang','대방','대방'],['noryangjin','노량진','노량진'],['nodeul','노들','노들섬'],['heukseok','흑석','흑석·중앙대'],['jangseung','장승배기','장승배기'],['soongsil','숭실대','숭실대입구'],['sangdo','상도','상도'],['gongdeok','공덕','공덕'],['seoul','서울역','서울역']];
const MM_INCHEON=[['incheon','인천공항','인천국제공항']],INCHEON_IDS=['incheon'];
const MM_BUSAN=[['busan','부산역','부산역'],['haeundae','해운대','해운대'],['gimhae','김해공항','김해공항']],BUSAN_IDS=MM_BUSAN.map(n=>n[0]);
const SEOUL_IDS=MM_SEOUL.map(n=>n[0]),mmRegion=()=>zone()=='incheon'?'incheon':['busan','haeundae','gimhae'].includes(zone())?'busan':SEOUL_IDS.includes(zone())?'seoul':'jeju';
let mmEls={},mmDot=null,mmLast=null,mmNow='';

function mmShape(id){
  const P=8,c=document.createElement('canvas'),MWi=M[id].m[0].length;c.width=MWi*P;c.height=M[id].m.length*P;
  const x=c.getContext('2d'),d=(col,a,b,w,h)=>{x.fillStyle=col;x.fillRect(a,b,w,h)};
  M[id].m.forEach((row,j)=>{for(let i=0;i<MWi;i++){
    const k=row[i]||'T',X=i*P,Y=j*P;
    d(MM_COL[k]||'#6cc04a',X,Y,P,P);
    if(k==='T'||k==='m'||k==='o')d('#2eb84d',X+1,Y,P-2,P-3);
    if(k==='m'||k==='o'){d('#fb923c',X+2,Y+2,2,2);d('#fb923c',X+5,Y+4,2,2)}
    else if(k==='F')d(MM_FL[(i*3+j*5+(i>>1))%7],X+3,Y+3,2,2);
    else if(k==='~'&&(i+j)%3===0)d('#ffffff90',X+1,Y+3,4,1);
    else if(k==='t')d('#e5d5c0',X,Y,P,1);
    else if(k==='1')d('#f97316',X+4,Y+3,3,3);
    else if(k==='2'){d('#7c2d12',X+1,Y+4,6,2);d('#fff',X+4,Y+1,2,3)}
    else if(k==='3')d('#fb923c',X+2,Y+3,4,2);
    else if(k==='4')d('#ef4444',X+3,Y+3,3,3);
  }});
  return c.toDataURL();
}

/* 실내 가구 */
function furn(t,f,fl,wl,x,y){const n=performance.now();switch(t){
  case '㉰': fl(); f('#b91c1c',1,14,30,16); f('#fef3c7',1,12,30,4); f('#fbbf24',4,2,12,10); f('#fde68a',6,4,3,3); f('#fff',10,6,3,3); f('#94a3b8',4,1,12,2); f('#ef4444',20,5,8,7); f('#f8fafc',22,3,4,2); break;
  case '㉱': fl(); f('#1e3a8a',1,14,30,16); f('#fde047',1,12,30,3); f('#bae6fd',6,2,20,10); f('#334155',6,2,20,2); break;
  case '㉲': { wl(); f('#111827',6,3,20,26); const im=cinePoster(x); if(im&&im.complete&&im.naturalWidth){g.drawImage(im,x*TS+7,y*TS+4,18,24)}else{const q=(x*5)%6,B=['#1e3a8a','#7f1d1d','#14532d','#312e81','#78350f','#0f766e'][q],A=['#fde047','#f97316','#4ade80','#f472b6','#fef3c7','#38bdf8'][q];f(B,7,4,18,24);if(q%3==0){f(A,12,7,8,8);f('#111827',7,20,18,8)}else if(q%3==1){f(A,14,6,4,16);f(A,10,10,12,3);f('#111827',9,24,14,4)}else{f(A,9,16,14,6);f(A,13,10,6,6);f('#f8fafc',9,24,14,2)}} break}
  case '㉼': wl(); f('#111827',4,2,24,30); f('#7f1d1d',6,4,9,28); f('#7f1d1d',17,4,9,28); f('#fbbf24',13,16,2,4); f('#fbbf24',17,16,2,4); f('#22c55e',10,0,12,3); break;
  case '㉳': fl(); f('#475569',3,24,26,4); f('#f1f5f9',2,12,28,12); f('#fda4af',2,12,8,12); f('#dc2626',24,3,3,10); f('#fecaca',22,2,7,5); f('#94a3b8',25,12,1,14); break;
  case '㉴': fl(); f('#00000022',2,27,28,3); f('#1d4ed8',2,8,28,8); f('#2563eb',3,15,26,10); f('#1e3a8a',1,12,4,14); f('#1e3a8a',27,12,4,14); break;
  case '㉵': fl(); f('#92400e',10,21,12,9); f('#78350f',10,21,12,2); f('#15803d',7,7,18,14); f('#22c55e',11,3,10,10); f('#4ade80',13,6,3,3); break;
  case '㉶': fl(); f('#a16207',3,10,26,8); f('#ca8a04',3,10,26,2); f('#78350f',5,18,3,10); f('#78350f',24,18,3,10); f('#f8fafc',11,11,10,5); f('#475569',13,20,6,6); break;
  case '㉷': wl(); f('#14532d',2,4,28,21); f('#78350f',2,25,28,3); f('#d1fae5',6,9,14,1); f('#d1fae5',6,13,18,1); f('#d1fae5',6,17,10,1); f('#f8fafc',22,25,5,2); break;
  case '㉸': fl(); f('#1f2937',3,18,26,8); f('#374151',5,20,22,4); f('#111827',23,6,3,14); f('#111827',16,4,12,4); f('#22d3ee',18,5,6,2); f('#6b7280',((n/80|0)%18)+5,21,3,2); break;
  case '㉹': fl(); f('#1f2937',3,14,26,4); f('#9ca3af',1,10,30,2); f('#111827',1,5,4,12); f('#111827',27,5,4,12); f('#374151',8,18,3,9); f('#374151',21,18,3,9); break;
  case '㉺': fl(); f('#0f766e',1,3,30,26); f('#14b8a6',1,3,30,3); f('#115e59',1,15,30,1); break;
  case '㉻': fl(); f('#57534e',7,16,18,14); f('#78716c',7,16,18,3); f('#111827',6,3,20,13); f('#38bdf8',8,5,16,9); f('#bae6fd',10,7,7,2); break;
  case '㉮': fl(); f('#d1d5db',1,16,30,12); f('#9ca3af',1,16,30,2); f('#fbbf24',5,6,6,10); f('#f8fafc',17,4,10,12); f('#64748b',19,6,6,2); break;
  case '㉯': fl(); f('#f8fafc',3,5,26,23); f('#e2e8f0',3,5,26,5); f('#dc2626',8,12,16,12); f('#f8fafc',14,14,4,8); f('#f8fafc',12,16,8,4); break;
  case '㈀': fl(); f('#7c4a22',1,1,30,29); f('#5c3618',15,1,2,29); f('#fbbf24',11,14,2,4); f('#fbbf24',19,14,2,4); f('#00000033',1,28,30,2); break;
  case '㈁': fl(); f('#a16207',4,16,24,12); f('#bae6fd',9,1,14,15); f('#e0f2fe',11,3,4,6); f('#78350f',7,0,18,2); f('#f472b6',6,12,3,4); f('#fff',23,13,3,3); break;
  case '㈂': fl(); f('#78350f',1,18,30,11); f('#111827',4,3,24,15); f('#1e293b',6,5,20,11); f('#ca8a04',14,22,4,2); break;
  case '㈃': fl(); f('#b45309',4,11,24,8); f('#d97706',4,11,24,2); f('#78350f',7,19,3,7); f('#78350f',22,19,3,7); f('#fff',8,8,6,4); f('#ef4444',18,8,6,4); break;
  case '㈄': fl(); f('#854d0e',2,6,28,24); f('#a16207',2,6,28,2); f('#422006',4,12,24,1); f('#422006',4,20,24,1); f('#1f2937',6,15,6,4); f('#dc2626',16,23,7,4); break;
  case '㈅': fl(); f('#334155',2,6,28,22); f('#f8fafc',5,9,22,16); f('#334155',7,12,18,1); f('#334155',7,16,14,1); f('#334155',7,20,16,1); break;
  case '㈆': fl(); f('#a16207',1,12,30,8); f('#ca8a04',1,12,30,2); f('#78350f',1,5,30,7); f('#fde68a',14,7,4,3); f('#f8fafc',8,14,8,4); f('#78350f',4,20,3,8); f('#78350f',25,20,3,8); break;
  case '㈇': fl(); f('#a16207',2,14,28,6); f('#78350f',4,20,3,8); f('#78350f',25,20,3,8); f('#111827',9,3,14,11); f('#22c55e',11,5,10,7); f('#374151',14,13,4,2); break;
  case '㈈': fl(); f('#475569',2,13,28,15); f('#e2e8f0',2,11,28,4); f('#ef4444',6,6,6,6); f('#fbbf24',12,6,6,6); f('#3b82f6',18,6,6,6); f('#22c55e',12,1,6,5); break;
  case '㈉': fl(); f('#111827',15,10,2,18); f('#111827',8,27,16,2); f('#fef3c7',7,1,18,10); f('#fde047',9,3,14,6); break;
}}
/* 가구 말 걸기 */
const FURN_T={'㉰':['매점',['고소한 냄새가 난다. 🍿']],'㉱':['매표소',['오늘 볼 영화를 고르는 곳이다.']],'㉼':['상영관 문',['조용히 들어가자.']],'㉳':['헌혈 의자',['반쯤 누운 채 헌혈하는 의자다. 🩸','주인장은 여기 167번 앉았다.']],'㉵':['화분',['잎이 반질반질하다. 🌿']],'㉶':['책상',['시험지와 연필이 놓여 있다. ✏']],'㉷':['칠판',['빽빽하게 필기가 되어 있다.']],'㉸':['러닝머신',['벨트가 돌아간다. 🏃']],'㉹':['벤치프레스',['봉이 꽤 무거워 보인다. 🏋']],'㉺':['매트',['스트레칭하기 좋은 매트다.']],'㉻':['전시 화면',['작업물 소개가 돌아가고 있다. 🖥']],'㉮':['헌혈 간식대',['초코파이와 음료가 놓여 있다.','헌혈 끝나고 먹는 초코파이는 왜 이렇게 맛있을까. 🍫']],'㉯':['구급함',['응급 물품이 정리되어 있다.']],'㈀':['장롱',['이불과 겨울옷이 차곡차곡 들어 있다.']],'㈁':['화장대',['거울이 깨끗하다. 🪞']],'㈂':['TV장',['리모컨이 가지런히 놓여 있다. 📺']],'㈃':['밥상',['귤 한 바구니와 반찬이 차려져 있다. 🍊']],'㈄':['신발장',['신발이 나란히 들어 있다. 👟']],'㈅':['안내판',['층별 안내와 이용 규칙이 적혀 있다.']],'㈆':['열람석',['스탠드 불빛 아래 조용히 공부하는 자리다. 📖']],'㈇':['컴퓨터 책상',['작은 모니터가 켜져 있다. 💻']],'㈈':['퍼즐 탁자',['색깔 블록이 맞춰지다 말았다. 🧩']],'㈉':['촬영 조명',['찰칵! 눈이 부시다. 📸']]};
function buildMiniMap(){
  const box=$('#minimap-container');if(!box)return;
  box.innerHTML='';mmEls={};mmNow=mmRegion();mmLast=null;
  box.classList.toggle('seoul',mmNow=='seoul');box.classList.toggle('busan',mmNow=='busan');box.classList.toggle('incheon',mmNow=='incheon');const tt=$('#mmTitle');if(tt)tt.textContent=mmNow=='seoul'?'서울 지도':mmNow=='busan'?'부산 지도':mmNow=='incheon'?'인천 지도':'제주 지도';
  (mmNow=='seoul'?MM_SEOUL:mmNow=='busan'?MM_BUSAN:mmNow=='incheon'?MM_INCHEON:MM_NODES).forEach(([id,label,full])=>{
    const b=document.createElement('button');
    b.type='button';b.className='minimap-node '+id;b.title=full;
    b.style.backgroundImage='url('+mmShape(id)+')';
    b.innerHTML='<span class="lb">'+label+'</span>';
    b.addEventListener('click',()=>{if(busy||modal)return;if(!mmOpen(id))return mmLockMsg();mmPin=false;mmFlash=false;syncMiniMap();fastGo(id)});
    box.appendChild(b);mmEls[id]=b;
  });
  mmLocks();mmDot=document.createElement('i');mmDot.id='mm-dot';
}

/* 현재 지역 강조 (DOM을 다시 만들지 않고 클래스만 토글) */
function updateMiniMapOverlay(){
  if(map&&mmRegion()!=mmNow)buildMiniMap();
  const z=zone();if(z===mmLast)return;mmLast=z;
  Object.keys(mmEls).forEach(k=>mmEls[k].classList.toggle('me',k===z));
}

/* 플레이어 위치를 땅 모양 위에 점으로 표시 (실내면 건물 입구 위치) */
function updateMiniDot(){
  if(!map||!mmDot)return;
  const z=zone(),n=mmEls[z];if(!n)return;
  let x=px,y=py;
  if(!map.o){
    const d=M[map.par].d||{},k=Object.keys(d).find(q=>d[q][0]===cur);
    if(k){[x,y]=k.split(',').map(Number)}
  }
  if(mmDot.parentNode!==n)n.appendChild(mmDot);
  const zm=M[z].m;mmDot.style.left=((x+.5)/zm[0].length*100)+'%';mmDot.style.top=((y+.5)/zm.length*100)+'%';
}

let mmPin=false,mmFlash=false,mmTimer=null;
function mmLocks(){for(const id in mmEls)if(mmEls[id])mmEls[id].classList.toggle('mm-lock',!mmOpen(id))}
function syncMiniMap(){const ov=$('#minimap-overlay');if(ov)ov.classList.toggle('on',mmPin||mmFlash)}
/* 모바일: 아래쪽 패널에 지도·프로필·모험 일지 */
const mobMq=matchMedia('(max-width:620px)'),mobOn=()=>mobMq.matches,wideMq=matchMedia('(min-width:1100px)'),wideOn=()=>wideMq.matches;
function mobTab(t){document.querySelectorAll('#mobPanel [data-t]').forEach(e=>e.classList.toggle('on',e.dataset.t==t));const b=$('#mobBody');if(b)b.scrollTop=0}
function mobVh(){document.documentElement.style.setProperty('--vh',innerHeight+'px');if(typeof bgmPlace=='function')bgmPlace()}
addEventListener('resize',mobVh);
function mobLayout(){
  mobVh();
  const P=$('#mobPanel'),L=$('#leftPanel'),R=$('#rightPanel'),O=$('#minimap-overlay'),A=$('#app'),S=$('#scr');
  if(!P)return;
  if(mobOn()){P.hidden=false;
    P.querySelector('.mt[data-t=map]').append(O);P.querySelector('.mt[data-t=me]').append(L);P.querySelector('.mt[data-t=log]').append(R);
    if(!P.querySelector('.mt.on'))mobTab('map');
  }else{P.hidden=true;A.prepend(L);A.append(R);if(wideOn()){const C=$('#ctl');C.insertBefore(O,C.querySelector('.ab'))}else S.append(O)}
}
function flashMiniMap(){if(!map||!map.o){mmFlash=false;syncMiniMap();return}mmFlash=true;syncMiniMap();clearTimeout(mmTimer);mmTimer=setTimeout(()=>{mmFlash=false;syncMiniMap()},3600)}
function toggleMap(){
  if(mobOn()){mobTab('map');return}
  if(wideOn()){$('#minimap-overlay').classList.toggle('mm-off');return}
  if(busy)return;
  if(mmPin||mmFlash){mmPin=false;mmFlash=false;clearTimeout(mmTimer)}else{mmPin=true;toast('가고 싶은 지역을 눌러 이동하세요!')}
  syncMiniMap();
}
function showMap(){toggleMap()}
/* 전체 지도: 서울과 제주를 위아래로 */
const mmThumb={};
function wmGroup(title,nodes,cls){return `<h4 style="margin:8px 0 4px;font-size:13px">${title}</h4><div class="minimap-grid ${cls}" style="margin-bottom:4px">`+nodes.map(([id,label,full])=>`<button type="button" class="minimap-node ${id}${id==zone()?' me':''}${mmOpen(id)?'':' mm-lock'}" title="${esc(full)}" style="background-image:url(${mmThumb[id]||(mmThumb[id]=mmShape(id))})" onclick="wmGo('${id}')"><span class="lb">${esc(label)}</span>${id==zone()?'<i class="wmhere">📍</i>':''}</button>`).join('')+'</div>'}
function showWorld(){if(busy||dlg)return;const P=(lo,la)=>[(lo-125.5)*105,(38.75-la)*105],PL=[[126.6,37.75],[127.2,38.3],[128.3,38.6],[128.6,38.1],[129.4,37.05],[129.55,36.05],[129.4,35.35],[128.9,35.05],[128,34.72],[127.5,34.62],[126.9,34.42],[126.4,34.4],[126.2,34.85],[126.45,35.65],[126.6,36.3],[126.2,36.72],[126.75,37.02],[126.6,37.35]].map(q=>P(q[0],q[1]).map(v=>v.toFixed(0)).join(',')).join(' '),here=mmRegion(),pin=(lo,la,nm,r,on)=>{const[x,y]=P(lo,la);return `<g style="cursor:pointer" onclick="${on?`wmRegion('${r}')`:`toast('🚧 ${nm}은 아직 공사 중이에요.')`}"><circle cx="${x}" cy="${y}" r="${on?11:6}" fill="${on?(here==r?'#fbbf24':'#2563eb'):'#94a3b8'}" stroke="#fff" stroke-width="2"/><text x="${x+(on?14:9)}" y="${y+4}" font-size="${on?14:10}" font-weight="700" fill="${on?'#0f172a':'#64748b'}">${nm}${here==r?' 📍':''}</text></g>`},[jx,jy]=P(126.55,33.38);openM(`<h3>🌏 BS World 전체 지도</h3><p style="font-size:12px;opacity:.8">파란 지역을 누르면 크게 볼 수 있어요. 📍가 지금 있는 곳이에요.</p><svg viewBox="0 0 470 590" style="width:100%;max-width:420px;display:block;margin:0 auto;background:#e0f2fe;border-radius:10px"><polygon points="${PL}" fill="#bbf7d0" stroke="#15803d" stroke-width="2"/><ellipse cx="${jx}" cy="${jy}" rx="34" ry="15" fill="#bbf7d0" stroke="#15803d" stroke-width="2"/>${pin(128.6,35.87,'대구','x',0)}${pin(127.38,36.35,'대전','x',0)}${pin(126.85,35.16,'광주','x',0)}${pin(128.9,37.75,'강릉','x',0)}${pin(126.45,37.46,'인천','incheon',1)}${pin(127,37.53,'서울','seoul',1)}${pin(129.07,35.15,'부산','busan',1)}${pin(126.55,33.38,'제주','jeju',1)}</svg><p style="font-size:12px;opacity:.75;text-align:center;margin-top:6px">✈ 김포·김해·제주 · 🚄 서울역⇄부산역 · 🚆 공항철도 인천공항</p>`)}
function wmRegion(r){const T={incheon:['인천',MM_INCHEON,'incheon'],seoul:['서울',MM_SEOUL,'seoul'],busan:['부산',MM_BUSAN,'busan'],jeju:['제주',MM_NODES,'']}[r];openM(`<h3>🗺 ${T[0]}</h3><p style="font-size:12px;opacity:.8">한 번 가 본 곳은 눌러서 바로 이동할 수 있어요.</p>`+wmGroup(T[0],T[1],T[2])+'<div class="qbtn"><button class="xb" onclick="closeM();showWorld()">← 대한민국 지도</button></div>')}
const mmOpen=id=>isOwner()||visited.has(id);
function mmLockMsg(){toast('🔒 아직 안 가 본 곳이에요. 한 번 가 보면 지도로 이동할 수 있어요.')}
const roP=s=>{const c=String(s).trim().slice(-1).charCodeAt(0)-44032;if(c<0||c>11171)return '로';const j=c%28;return j==0||j==8?'로':'으로'};
const nearJ=(a,b)=>{const N=z=>{const q=M[z]||{};return[...Object.values(q.e||{}),...Object.values(q.ex||{})].map(v=>v[0])};return N(a).includes(b)||N(b).includes(a)};
function jejuBg(t,w,h,NT){const G0=h-96,S=[...String(FLY.to)].reduce((a,c)=>a+c.charCodeAt(0),0)%3,mv=(sp,i,gap,pad=120)=>w-((t/sp+i*gap)%(w+pad));
 if(S!=1){const Y0=G0-90;g.fillStyle=NT?'#0c4a6e':'#0ea5e9';g.fillRect(0,Y0,w,90);g.fillStyle=NT?'#075985':'#38bdf8';g.fillRect(0,Y0,w,14);g.fillStyle='#ffffff90';for(let i=0;i<10;i++)g.fillRect(mv(9,i,110),Y0+24+(i*17)%54,38,3);if(S==0){g.fillStyle='#fde68a';g.fillRect(0,G0-16,w,16)}}
 else{g.fillStyle=NT?'#14532d':'#86efac';g.fillRect(0,G0-110,w,110);g.fillStyle=NT?'#475569':'#94a3b8';g.beginPath();g.moveTo(w*.15,G0-110);g.lineTo(w*.5,G0-190);g.lineTo(w*.85,G0-110);g.fill();g.fillStyle='#f8fafc';g.beginPath();g.moveTo(w*.44,G0-179);g.lineTo(w*.5,G0-190);g.lineTo(w*.56,G0-179);g.fill()}
 const citrus=(X,b)=>{g.fillStyle='#78350f';g.fillRect(X-5,b-44,10,44);g.fillStyle=NT?'#166534':'#15803d';g.beginPath();g.arc(X,b-66,36,0,7);g.fill();g.fillStyle='#22c55e';g.beginPath();g.arc(X-10,b-74,18,0,7);g.fill();g.fillStyle='#f97316';[[-20,-58],[14,-78],[20,-52],[-4,-46],[-10,-88]].forEach(([a,c])=>{g.beginPath();g.arc(X+a,b+c,7,0,7);g.fill()})},
 palm=(X,b)=>{g.fillStyle='#92400e';for(let i=0;i<8;i++)g.fillRect(X+Math.sin(i/2)*5-5,b-i*16-16,11,17);g.fillStyle=NT?'#14532d':'#16a34a';[[-44,-8],[-30,-22],[0,-30],[30,-22],[44,-8]].forEach(([a,c])=>{g.save();g.translate(X,b-132);g.rotate(Math.atan2(c,a));g.fillRect(0,-4,Math.hypot(a,c)+10,8);g.restore()});g.fillStyle='#78350f';g.beginPath();g.arc(X-7,b-126,6,0,7);g.arc(X+7,b-126,6,0,7);g.fill()};
 for(let i=0;i<4;i++){const X=mv(4,i,250);if(S==0)palm(X,G0);else if(S==1)citrus(X,G0-6);else(i%2?palm:citrus)(X,G0-(i%2?0:6))}
 if(S!=0){const Y=G0-30;for(let r=0;r<3;r++)for(let i=0;i<40;i++){const X=mv(2.6,i,34,60)+(r%2?14:0),H0=9+((i*5+r)%4);g.fillStyle=(i+r)%3?'#44403c':'#292524';g.fillRect(X,Y+r*10,30,H0);g.fillStyle='#57534e';g.fillRect(X,Y+r*10,30,2)}}}
function bikeGo(id,eb){const a=M[zone()].n,b=M[id].n,L=M[id].land||(M[id].bus?[7,M[id].bus+1]:[7,5]);closeM();trainMusic(true,'bus');busy=true;FLY={bus:1,bike:1,dur:4200,to:id,a:null,x:L[0],y:L[1],d:1,col:'#16a34a',eb:!!eb,label:eb?'전기자전거':'따릉이',bellAt:0,plan:{head:a+'에서 '+b+roP(b)+' 가고 있습니다.',ev:[]}};sfx('w')}
const JPOS={shoreF:[0,0],studio:[1,0],route2:[2,0],rest:[3,0],oreumF:[4,0],airport:[.5,1.3],cityhall:[2,1.2],samgeori:[3,1],sports:[4,1],town:[3,2],hamdeok:[4,2],coast:[0,3],halla:[1.5,3],orchard:[3,3],seongsan:[4,3],beach:[0,4],moseulpo:[.9,4],gotF:[2,4],tosan:[3,4],route1:[3.6,4],minsok:[4.4,4]},JBUS=['cityhall','route1','gotF','minsok','hamdeok'];
function jejuGo(id){const a=JPOS[zone()],b=JPOS[id];if(!a||!b)return busGo(id,'빠른 이동 버스',3500);const dd=Math.hypot(a[0]-b[0],a[1]-b[1]);if(dd<=1.7)return bikeGo(id,1);if(JBUS.includes(zone())&&JBUS.includes(id))return busGo(id,'시외버스',5000);busGo(id,'택시',4500);FLY.taxi=1;FLY.bellAt=0;FLY.label='택시 · '+M[id].n+' 방면';FLY.plan.head=M[id].n+'까지 택시로 모시겠습니다.';FLY.plan.ev=[]}
function fastGo(id){if(id==zone())return;if(id=='udo'||zone()=='udo')return showFerry(id=='udo'?'udo':'seongsan');if(id=='incheon'||zone()=='incheon'){if(id=='incheon'&&!SEOUL_IDS.includes(zone()))return toast('🚆 인천공항은 서울에서 공항철도로 갈 수 있어요.');if(zone()=='incheon'&&!SEOUL_IDS.includes(id))return toast('🚆 공항철도로 서울에 간 뒤 이동해 주세요.');return busGo(id,'빠른 이동 버스',3500)}{const A0=BUSAN_IDS.includes(id),B0=BUSAN_IDS.includes(zone());if(A0&&B0)return busGo(id,'빠른 이동 버스',3500);if(A0||B0)return flyTo(id)}if(SEOUL_IDS.includes(id))return bikeGo(id);jejuGo(id)}
function wmGo(id){if(!mmOpen(id))return mmLockMsg();closeM();if(id==zone())return;if(id=='incheon'||zone()=='incheon')return fastGo(id);const RG=i=>BUSAN_IDS.includes(i)?'busan':SEOUL_IDS.includes(i)?'seoul':'jeju';if(id=='udo'&&mmRegion()!='jeju')return toast('⛴ 우도는 성산에서 배로 갈 수 있어요.');if(RG(id)==mmRegion())fastGo(id);else flyTo(id)}

/* 가족 NPC 이름: 운영자와 외가 사촌에게는 호칭 그대로, 게스트에게는 '보성이 ○○' */
const KIN_OE={'보성 외할머니':'외할머니','보성 외할아버지':'외할아버지','보성 큰외삼촌':'큰외삼촌','보성 외숙모':'큰외숙모'};
function kinName(n){if(!/^보성 /.test(n))return n;const oe=KIN_OE[n];if(isOwner())return oe||n.slice(3);if(oe&&typeof FRIEND!='undefined'&&FRIEND&&FRIEND.kind=='cousin'&&FRIEND.side=='oe')return oe;return n.replace(/^보성 /,'보성이 ').replace('큰외삼촌','외삼촌')}
function say(n,l,ch){n=kinName(n);dlg={n,l:l.slice(),i:0,ch,s:'t',sel:0,keys:ch?Object.keys(ch).concat('그만 듣기'):0};$('#dl').style.display='block';$('#dn').textContent=n;typ(l[0])}
const OWNER_LINE={"보성이가 그렇게 가족들을 사랑하고 존경한다고 하더라~": "보성이 왔구나. 네가 그렇게 가족들을 아낀다고 하더라~", "요즘 그런 젊은이 드물어. 부모님이 복 받으셨지. 🍊": "요즘 너 같은 젊은이 드물어. 부모님이 복 받으셨지. 🍊", "이 하늘을 보면 보성이 생각이 나.": "왔나, 보성이. 이 하늘 보면 옛날 생각 나지?", "특전사 낙하산정비병 출신이지. 🪂": "특전사 낙하산정비병 시절 말이야. 🪂", "열기구에서 낙하산으로 5번 뛰었어. 🎈": "열기구에서 낙하산으로 5번 뛰었잖아. 🎈", "그중 한 번은 자기가 직접 포장한 낙하산으로 뛰었지.": "그중 한 번은 네가 직접 포장한 낙하산으로 뛰었지.", "자기 손으로 접은 낙하산을 메고 뛰는 기분, 상상이 돼?": "자기 손으로 접은 낙하산을 메고 뛰는 기분, 잊을 수 없지?", "보성이 오는 날인가 해서 기다렴수다게.": "보성이 왔구나! 마중 나온 보람이 있수다게.", "보성이 직접 만든 것들을 모아 둔 곳입니다.": "직접 만드신 것들, 잘 모아 두었습니다.", "어서 오세요. 주인장이 고른 노래가 벽에 걸려 있어요. 🎵": "어서 오세요. 고르신 노래, 벽에 잘 걸어 두었어요. 🎵", "보성이가 Suno AI로 만든 노래를 제가 틀어 드려요. 🎧": "직접 만드신 Suno AI 노래, 틀어 드릴까요? 🎧", "주인장이 Suno AI로 직접 만든 노래들이에요.": "직접 만드신 Suno AI 노래들이잖아요. 😄", "주인장이 찍은 사진들을 걸어 두었어요. 📷": "찍으신 사진들, 잘 걸어 두었어요. 📷", "주인장이 다음 나라를 고르면 바로 엽니다.": "다음 나라를 고르시면 바로 엽니다.", "주인장이 테트리스를 좋아해서 테트리스를 잔뜩 넣었수다. 저쪽엔 인형뽑기도 이서마씸.": "좋아허시는 테트리스, 잔뜩 넣어 뒀수다. 저쪽엔 인형뽑기도 이서마씸.", "주인장이 매긴 별점도 볼 수 있어요.": "직접 매기신 별점도 여기 있어요.", "주인장은 롤이랑 스타를 좋아한대요. 자리 비었어요.": "늘 하시던 롤이랑 스타, 자리 비었어요.", "🤝 주인장도 상상 Volunteer 활동에 참여했대요.": "🤝 상상 Volunteer 활동에도 참여하셨잖아요.", "이 월드 주인장은 헌혈을 167회 했다네요~ ㅎㅎ": "어, 헌혈 167회 하신 분 아니에요? 대단하세요~ ㅎㅎ", "주인장은 여기 167번 앉았다.": "여기 167번 앉았다.", "주인장은 양치를 꼭 하고 잔다고 한다. 🪥": "자기 전에 양치는 꼭 한다. 🪥", "주인장의 기타, Crafter Sure Plus다. 🎸": "내 기타, Crafter Sure Plus다. 🎸", "마라톤 하프코스를 3번 완주한 러너의 기록실이지.": "네 하프코스 3번 완주 기록, 여기 잘 걸어 뒀어.", "BS World의 운영자, 강보성의 입회 시험 결과는 IQ 156, Percentile 99%. 입회 시험 합격자입니다.": "운영자님의 입회 시험 결과는 IQ 156, Percentile 99%. 잘 보관하고 있습니다.", "당신도 IQ 테스트 한번 진행해 보겠습니까?": "IQ 테스트 다시 한번 해 보시겠습니까?", "주인장의 멘사 기록을 볼 수 있습니다.": "운영자님의 멘사 기록이 전시되어 있습니다."};
function typ(s){if(OWNER_LINE[s]&&isOwner())s=OWNER_LINE[s];clearInterval(tw);let k=0;$('#dt').textContent='';tw=setInterval(()=>{k++;$('#dt').textContent=s.slice(0,k);if(k%3==0)sfx('t');if(k>=s.length){clearInterval(tw);tw=null}},26)}
function menu(){dlg.s='m';clearInterval(tw);tw=null;$('#dt').innerHTML=dlg.keys.map((l,i)=>`<div class="ch${i==dlg.sel?' on':''}" data-i="${i}">▶ ${l}</div>`).join('')}
function endDlg(){clearInterval(tw);tw=null;dlg=null;$('#dl').style.display='none'}
function pick(i){const k=dlg.keys[i];if(k=='그만 듣기')return endDlg();const v=dlg.ch[k];if(typeof v=='function'){endDlg();return v()}dlg.l=v;dlg.i=0;dlg.s='t';typ(v[0])}
function advance(){if(tw){clearInterval(tw);tw=null;$('#dt').textContent=dlg.l[dlg.i];return}if(dlg.s=='m')return pick(dlg.sel);if(dlg.i<dlg.l.length-1){dlg.i++;typ(dlg.l[dlg.i])}else if(dlg.ch)menu();else endDlg()}

$('#dt').addEventListener('click',e=>{if(dlg&&dlg.s=='m'&&e.target.dataset.i!=null){dlg.sel=+e.target.dataset.i;e.stopPropagation();pick(dlg.sel)}});
$('#dl').addEventListener('click',()=>dlg&&advance());

function act(){
  if(PCG)return pcSkip();
  if(modal&&TET.run)return tetRot();
  if(modal&&lbOn())return lbZoom();
  if(modal)return kcAct();
  if(SIT){if(SIT.k=='ex'){SIT.n++;SIT.up=performance.now();sfx('s');banner(EX_N[SIT.ex]+' '+SIT.n+'회');return}if(SIT.k=='bar'){SIT.n++;SIT.up=performance.now();sfx('s');banner('💪 턱걸이 '+SIT.n+'회');return}return sitUp()}
  if(busy)return;
  if(dlg)return advance();
  const[dx,dy]=DV[dir],x=px+dx,y=py+dy,n=npcs.find(o=>o.x==x&&o.y==y);
  {const PD=Object.keys(RT.peers).find(k=>{const P=RT.peers[k];return (P.tx==x&&P.ty==y)||(P.tx==px&&P.ty==py)});if(PD){sfx('s');return rtTalk(PD)}}
  if((cur=='sports'||cur=='oreumF')&&ballKick(7.5)){sfx('s');return}
  sfx('s');
  if(busBlocks(x,y))return showBusMenu();
  if(n){n.dir=[1,0,3,2][dir];npcMet(n);return say(n.n=='L 군'&&lgunKnown()?TX.lName:n.n,typeof n.s=='function'?n.s():n.s,typeof n.ch=='function'?n.ch():n.ch)}
  if(homeLock(x,y))return say('문',['불이 꺼져 있다. 모두 주무시는 시간이다. 🌙']);
  {const L=shopLock(x,y);if(L)return say(L.n,['🔒 지금은 영업시간이 아니에요.',L.txt])}
  if(map.board&&map.board[x+','+y]){const B=map.board[x+','+y];if(B=='cafe')return say('바당 카페 안내판',['☕ 24 OPEN · 무인 카페','사장님 없이 기계로 주문해요. 언제든 들어오세요.']);const s=SHOP_H[B];return say(s.n+' 안내판',[(shopClosed(B)?'🔒 CLOSED':'🟢 OPEN'),s.txt,...(s.more||[])])}
  if(anbangLock(x,y))return say('안방 문',['부모님 안방이다. 함부로 들어가면 안 된다. 🚪']);
  if(map.bus!=null&&busOn()&&Math.abs(py-map.bus)<=1&&BUS.m===cur&&Math.abs(BUS.x+42-(px*TS+16))<70)return say('심야버스 기사',['이 시간엔 막차 끊긴 사람들 태우고 다녀요. 🌙','조심히 들어가세요!']);
  const k=at(x,y);
  if(k=='㌟'||k=='㌠')return say('흰 트럭',['귤 콘테나를 실어 나르는 흰 트럭이다. 🚚']);if(k=='㌡'||k=='㌢')return say('경운기',[k=='㌡'?'경운기 앞부분이다. 시동 걸면 소리가 크다.':'경운기 뒤에 달아 짐을 싣는 칸이다.']);if(k=='㌣')return say('꽃밭',['어머니가 심은 꽃들이다. 🌸']);if(k=='㌤')return say('쪽파',['쪽파가 파릇파릇 올라와 있다.']);if(k=='㌥')return say('깻잎',['깻잎 향이 은은하다. 🌿']);if(k=='㌧')return say('감귤나무',['나무 아래 땅을 덮어 둔 타이벡 재배 밭이다. 🍊']);
  if(k=='㋪'||k=='㋮')return say('검은 하우스',['콘테나와 농기구를 넣어 두는 검은 하우스다.']);if(k=='㋫'||k=='㋬')return say('농막',['빨간 지붕 농막이다. 안에서 먹고 잘 수 있다. 🏠']);if(k=='㋰')return say('흰 차',['농막 앞에 세워 둔 흰 차다. 🚗']);if(k=='㋱')return say('파란 대문',['돌담 사이의 파란 대문이다.']);if(k=='㋲')return say('농기구',['가위, 톱, 삽 같은 농기구가 정리되어 있다. 🧰']);if(k=='㋵')return say('감귤 콘테나',['귤을 담는 파란 콘테나가 쌓여 있다. 🍊']);if(k=='㋴')return say('하우스 벽',['검은 차광막으로 덮인 벽이다.']);
  if(k=='ㆎ'&&!CAFE_M[cur]){sitDown(x,y,'bench','🪑 의자에 앉았어요.');return}
  if(k=='㎭')return showCard();
  if(k=='㏗'&&map.pc&&map.pc[x+','+y]){const P1=map.pc[x+','+y];return say(P1[0],P1[2],{'🌐 사이트 열기':()=>window.open(P1[1],'_blank','noopener')})}
  if(k=='㏎')return say('키위 덕',['덕 아래로 키위가 주렁주렁 달려 있다. 🥝','마을 게시판에 골드키위 판매 안내가 있다.'],{'📌 판매 안내 보기':()=>showKiwi()});
  if(k=='㏈')return showLift();
  if(map.icn&&(k=='㎻'||k=='l'))return say('체크인',['BS 에어 국제선은 아직 취항 준비 중이에요. ✈','실제 비행기를 보고 싶으면 여행 지도를 열어 보세요.'],{'🗺 여행 지도 보기':()=>showTravel()});if(k=='㎻')return map.airT?showFlight():showKtxTicket();if(k=='㏅')return say('서울역 버스환승센터',['버스 타는 곳이에요. 심야버스는 길가에서 탈 수 있어요. 🚌']);if(k=='㎾')return say(map.airT?'줄 서는 곳':'주차장',map.airT?['수속 줄을 안내하는 줄이에요.']:[(map.m.join('').includes('r')&&/공항/.test(map.n)?'공항 주차장':map.n+' 주차장')+'이에요. 차가 빼곡하네요. 🚗']);if(k=='㎸'||(k=='ㅰ'&&map.ktxPf))return ktxBoard();if(k=='㎷')return ktxGate('K');if(k=='㎹')return showRailBoard();
  if(k=='㎺')return ktxGate('M');if(k=='㎶')return say('시계탑',['약속 장소로 많이 쓰이는 광장의 시계탑이에요. 🕰']);if(k=='㎼')return say('분수',['시원하게 물이 솟는다. ⛲']);
  if(k=='㎯'&&cur=='seoul'&&x>=19)return say('문화역서울284',['옛 서울역 건물이에요. 지금은 전시와 공연이 열리는 문화 공간이에요. 🏛']);
  if(k=='㎰')return showCafe('ysV');if(k=='㎱')return showCafe('ysC');if(k=='㎴')return showCafe(map.food||'ysS');
  if(k=='㎲')return showLocker();
  if(k=='㎳')return say(map.airT?'공항 사무실':'역 사무실',['직원들이 일하는 사무실이에요. 아래쪽 문으로 들어갈 수 있어요. 🚪']);
  if(k=='㋧')return say('해녀의 집 안내판',['혼저옵서! 해녀들이 바당에서 직접 잡은 해산물을 파는 집이우다. 🌊']);if(k=='㋥')return say('테왁과 망사리',['물질할 때 쓰는 주황색 테왁과 그물이다.','숨비소리 끝에 잡은 것들을 여기 담는다.']);if(k=='㋦')return say('상자',['해산물을 담는 빨간 상자와 파란 상자다.']);if(k=='㋣'||k=='㋨'||k=='㋢')return say('현무암 벽',['구멍이 숭숭 난 제주 현무암이다.']);if(k=='㋩'){sitDown(px,py,'bench','불턱 앞에서 몸을 녹여요. 🔥');SIT.lib='fire';return}
  if(k=='㋠')return showSpot((map.spots&&map.spots[x+','+y])||cur);if(k=='㋡')return say('운동기구',['정상에 있는 야외 운동기구다. 💪','사람들이 몸을 풀고 있다.']);
  if(k=='㋘')return say('오름',['풀이 곱게 자란 오름이다. 올라가는 길이 나 있다. ⛰']);
  if(k=='㋐'){if((x==12&&y==6)||(x==7&&y==9)){const nt=jejuNow().h;return say('텐트',[nt>=22||nt<7?'(텐트 안에서 zzz… 조용히 지나가자.)':'누가 쓰고 있는 파란 텐트다. 짐이 놓여 있다.'])}return goSleep(x,y,1)}if(k=='㌌'&&cur!='shoreF')return say('주차장',['주차된 차다. 🚗']);if(k=='㌌'){const nt=jejuNow().h;return say('자동차',[(x+y)%2==0&&(nt>=22||nt<8)?'(차박 중이다. zzz…)':'캠핑장에 세워 둔 차다. 🚗'])}if(k=='㋑'){sitDown(px,py,'bench','불멍 시작… 🔥');SIT.lib='fire';return}if(k=='㋒')return say('핀',['핀 10개가 서 있다. 🎳']);if(k=='㋔'||k=='㋕')return showMini('bowl');if(k=='㋖'||k=='㋗'||k=='㋙')return say('찜질방',[k=='㋖'?'뜨끈뜨끈한 불가마다. 🔥':k=='㋗'?'황토 향이 구수하다. 🌾':'차가운 바람이 나온다. 🥶']);if(k=='㋞')return say('얼음 기둥',['차가운 얼음이다. 손이 시리다. 🧊']);if(k=='㋟'){return cur=='bowl'&&x<23?showBowlBalls():showBowlShop()}if(k=='㋓')return showArt();if(k=='㉶'&&cur=='atelier')return showPaint();if(k=='㉺'&&/^jjim/.test(cur)){const has=CAFE.drink&&CAFE.at==cur;return say('매트',['어떻게 할까요?'],{[has?'🍽 앉아서 먹기':'🪑 앉아서 쉬기']:()=>cafeSit(x,y),'💤 누워서 자기':()=>goSleep(x,y)})}
  if(k=='㋈')return say('돌하르방',['돌하르방이 커다란 눈으로 쳐다본다. 🗿']);if(k=='㋆'||k=='㋇'||k=='㋎')return say('초가집',['바람에 날아가지 않게 지붕을 줄로 동여맨 초가집이다.']);if(k=='㋉')return say('항아리',['커다란 옹기 항아리다.']);if(k=='㋊'&&cur=='studio')return showStall();if(k=='㋊')return say('장터',['귤, 떡, 기념품이 가득한 천막 가게다. 🍊']);if(k=='㋋')return say('드라마 세트장',['단청이 곱게 칠해진 붉은 문이다. 📸']);
  if(k=='ⓟ'||k=='㋌')return poolAct(k=='㋌');if(k=='㋍')return /^swimLock/.test(cur)?poolChange():say('사물함',['옷과 짐을 넣어 두는 사물함이다.']);
  if(cur=='cinema'&&k=='㉻')return showMovies();
  if('㋀㋁'.includes(k))return say('로봇 피규어',['사람 키만 한 거대 로봇 피규어다. 🤖']);if('㋂㋃'.includes(k))return say('공룡 피규어',['입을 쩍 벌린 공룡 피규어다. 🦖']);if('㋄㋅'.includes(k))return say('우주인 피규어',['우주복을 입은 피규어다. 🚀']);
  if(map.cons&&map.cons[x+','+y]){const C0=map.cons[x+','+y];return say('공사 안내',[consMsg(C0[0],map.stKey,C0[1])])}
  if(map.bd&&map.bd[x+','+y]&&penBusy(map.bd[x+','+y][0]))return say('객실 문',['투숙 중인 방이에요. 🔒','다른 빈방이나 도미토리를 이용해 주세요.']);
  if(map.bd&&map.bd[x+','+y]){const D=map.bd[x+','+y];return warp(D[0],D[1],D[2],dir)}
  if(cur=='gym'&&k=='㉸'){exStart(x,y,'run');return}
  if(cur=='gym'&&k=='㉹'){exStart(x,y,'bench');return}
  if(k=='㉼'&&cur=='swim')return say('탈의실 문',[POOL.pick?'받은 수영복에 맞는 탈의실로 들어가세요.':'먼저 안내 데스크에서 수영복을 받아 주세요.']);
  if(FURN_T[k]&&!/^(cinema|cineH)/.test(cur)||(FURN_T[k]&&!'㉰㉱'.includes(k))){const A=FURN_T[k];return say(A[0],A[1])}
  if(map.panel&&map.panel[x+','+y]){const A=map.panel[x+','+y];return say(A[0],A[1])}
  if(k=='㌉')return showCine();
  if(k=='㉽')return say('상영 전광판',['상영작과 시간은 키오스크에서 볼 수 있어요.']);
  if(k=='㉲'){cineLoad();const L=CINE.now.concat(CINE.up).filter(m=>m.poster&&/^\/[A-Za-z0-9._-]+$/.test(m.poster));if(!L.length)return say('포스터',['포스터를 불러오고 있어요. 잠시 후 다시 봐 주세요.']);const m=L[(x*3)%L.length];return lbOpen('https://image.tmdb.org/t/p/w780'+m.poster,m.title||'포스터')}
  if(k=='㌖'){toast('💧 시원한 물을 마셨어요.');return}
  if(k=='㌗'){toast('🧼 손과 얼굴을 씻었어요. 개운하다!');return}
  if(k=='㌕')return say('야간 조명',[jejuNow().h>=18||jejuNow().h<6?'조명이 환하게 켜져 있다. 💡':'해가 지면 켜지는 조명이다.']);
  if(k=='㌘')return showCourt();
  if(k=='㌫')return say('커플 소파',['둘이 앉기 좋은 소파다.','무엇을 할까요?'],{'⚔ 리그 오브 레전드 한 판':()=>pcPlay('lol'),'🛰 스타크래프트 한 판':()=>pcPlay('sc'),'🍜 음식 시키기':()=>showCafe(),'🖥 컴퓨터 쓰기':()=>showPc()});
  if(k=='㌪')return say('유리벽',['안이 훤히 보이는 유리 룸이다.']);
  if(k=='㌬')return say('주방',['라면 끓이는 냄비와 볶음밥 철판이 돌아간다. 🍳']);if(k=='㌭')return say('컵라면 매대',['컵라면이 종류별로 쌓여 있다.','뜨거운 물은 옆에 있다. 🍜'],{'🍜 음식 시키기':()=>showCafe()});if(k=='㌮')return say('결제 키오스크',['음식값과 이용 요금을 결제하는 기계다. 놀이용이라 돈은 안 들어요. 💳']);if(k=='㌯')return say('시간 충전 키오스크',['⏰ 1시간, 3시간, 5시간 충전 메뉴가 떠 있다.','놀이용이라 실제 결제는 없어요.']);if(k=='㌰')return say('에어컨',['시원한 바람이 나온다. ❄']);if(k=='㌱')return say('게임 CD 책장',['예전 게임 CD와 공략집이 빼곡히 꽂혀 있다. 💿']);
  if(k=='㎉'&&map.stall&&map.stall[x+','+y])return showMall(map.stall[x+','+y].S);if(k=='㎄')return showYsBoard();if(k=='㎅')return showYoutube();if(k=='㎃')return warp('cc_yongsan',21,8,1);if(k=='㌳'&&cur=='yongsanSt')return say('교통카드 충전',['💳 교통카드를 충전했어요. 놀이용이라 돈은 들지 않아요.']);if(k=='㌳'&&cur=='yongsanSt2')return say('승차권 키오스크',['🚧 KTX와 무궁화호는 아직 개통 준비 중이에요.','노선을 눌러 안내를 볼 수 있어요.'],KTX_CH());
  if(k=='㌶'&&x>=12)return say('무궁화호 개찰구',['🚧 무궁화호는 아직 개통 준비 중이에요.']);if(k=='㌶')return say('KTX 개찰구',['🚧 KTX는 아직 개통 준비 중이에요.','노선을 눌러 안내를 볼 수 있어요.'],KTX_CH());
  if(k=='㌸')return say('매장',['옷, 신발, 전자제품 매장이 줄지어 있다. 🛍']);
  if(k=='㌹')return say('창밖',['유리창 너머로 한강이 흘러간다. 🌊']);
  if(k=='㌳')return say('셀프 체크인 키오스크',['짐이 없으면 여기서 바로 수속할 수 있어요. ✈','부칠 짐이 있으면 카운터로 가야 해요.'],{'✈ 키오스크로 수속하기':()=>showFlight()});
  if(k=='㌴'&&cur=='cityhall')return say('시외버스 정류장',['🚌 어디로 갈까요?'],BUS_J());
  if(k=='㌴'&&['gotF','route1','minsok','hamdeok'].includes(cur)){const o={'🏢 제주 시외버스터미널':()=>busGo('cityhall','시외버스')},B0=BUS_J();for(const q in B0){const c0={'🌊 서귀포':'gotF','🍊 표선':'route1','🏘 제주민속촌':'minsok','🏖 함덕서우봉해변':'hamdeok'}[q];if(c0!=cur)o[q]=B0[q]}return say('시외버스 정류장',['🚌 어디로 갈까요?'],o)}
  if(k=='㌴')return say('공항버스 정류장',['🚌 어디로 갈까요?'],{'여의도':()=>busGo('yeouido','공항버스'),'영등포':()=>busGo('yeongdeungpo','공항버스'),'노량진':()=>busGo('noryangjin','공항버스'),'용산':()=>busGo('yongsan','공항버스')});
  if(k=='㋍'&&/^swimLock/.test(cur))return poolChange();
  if(k=='㌻')return say('TV',['민원실 대기 TV에서 뉴스가 나온다. 📺']);if(k=='㌼')return say('번호 전광판',['지금 호출 번호가 빨갛게 떠 있다.']);
  if(k=='㌾')return say('해변 상점',['흰 천막 아래에서 튜브와 간식을 판다. 🏖']);if(k=='㌿')return say('해변 조형물',['초승달처럼 휜 흰 조형물이다. 사진 찍기 좋다. 📷']);if(k=='㍀')return say('야자수',['바닷바람에 잎이 흔들린다. 🌴']);if(k=='㍺')return say('용두암',['용의 머리를 닮은 현무암 바위다. 🐉','파도가 칠 때마다 바위가 꿈틀거리는 것 같다.']);if(k=='㍼'||k=='㍻')return say('닭장',['외가 앞마당 닭장이다. 꼬꼬꼬… 🐔','닭들이 모이를 쪼고 있다.']);if(k=='㍃')return say('시청 앞 조형물',['시청 앞 공원의 커다란 조형물이다.']);if(k=='㌌'&&cur=='cityhall')return say('주차장',['민원 보러 온 차들로 가득하다. 🚗']);
  if(k=='㌩')return say('재떨이',['환풍기가 돌아가는 흡연실이다. 🚬']);
  if(k=='㊃')return showMini();
  if(k=='㌎')return showMini((map.mach||{})[x+','+y]);
  if(k=='㌏'||k=='㌐')return showMini('gun');
  if(k=='㌓'||k=='㌒'||(k=='㌑'&&y>=8))return showMini('arrow');
  if(k=='㌑')return showMini('gun');
  if(k=='㍞')return showLck();if(k=='㍝'){sitDown(x,y,'bench','계단 객석에 앉았어요. 🎶');return}if(k=='㍛'||k=='㍜')return say('야외공연장',[jejuNow().h>=16&&jejuNow().h<22?'오늘 저녁 공연 중이다. 🎶':'오후 4시부터 밤 10시까지 공연이 열린다. 🎸']);if(k=='㍙')return say('애기업은돌',['아기를 업은 어머니를 닮았다는 바위다.','별도봉 산책로에서 만날 수 있다.']);if(k=='㍘')return showGame(map.ag[x+','+y]);if(k=='㌔')return showRankWall(x);
  if(k=='㊄')return say('우당 흉상과 비석',['도서관 앞에 흉상과 "홍익인간" 글씨를 새긴 비석이 서 있다.']);
  if(k=='㊅')return say('중앙 정원',['천장 유리로 빛이 들어오는 실내 정원이다. 🌿']);
  if(k=='㊇')return say('제주 모형',['제주 지형을 작게 만든 모형을 둘러싼 둥근 책상이다. 🌋']);
  if(k=='㊉'&&cur=='haenyeo')return showCatch();
  if(k=='㌙'){const L3=catchToday(),D0=L3[x-2];return say('오늘의 메뉴',D0?[D0[0]+' '+D0[2]+': '+D0[3],'주문은 주방 삼춘에게 하면 돼요.']:['오늘은 날이 궂어서 차림이 없수다. 전복죽, 미역국은 됩니다.'])}
  if(k=='㊉')return say('오늘의 메뉴',['콩나물국밥 · 황태국밥 · 제육덮밥 · 참치마요덮밥','비빔밥 · 비빔국수 · 잔치국수 · 라면']);
  if(k=='㊌')return say('간식 코너',['과자와 음료가 가득하다. 🍫']);
  if(cur=='woodang2'&&(k=='㊆'||k=='㈆'||k=='㊈'||k=='㉴')){const up=k=='㊆'||k=='㈆';return say('자리',['어떻게 앉을까요?'],{'📖 독서하기':()=>libSit(x,y,'read',up),'✏ 공부하기':()=>libSit(x,y,'study',up),'🪑 그냥 쉬기':()=>libSit(x,y,'rest',up)})}
  if(k=='㉴'&&cur=='jjimIce'){sitDown(x,y,'bench','시원해요… 🥶');return}
  if(k=='㌚'){cafeSit(x,y);dir=1;return}
  if(k=='㌜'){cafeSit(x,y);return}
  if(k=='㌛')return say('창가 바',['바다가 훤히 보이는 긴 자리다. 🌊']);
  if(k=='㉴'){if(cur=='woodang'||cur=='cafe'||cur=='hdDel'||/^yongsanSt/.test(cur)){cafeSit(x,y);return}sitDown(x,y,'bench','소파에 앉았어요. 😌');return}
  if(k=='㊀'||k=='㊁'||k=='㊂'){if(CAFE.at!=cur)CAFE.drink=null;return showCafe()}
  if(k=='㉧')return say('수조',[['광어가 바닥에 납작 붙어 있다.'],['우럭이 입을 뻐끔거린다.'],['대게 다리가 수조 가득이다. 🦀'],['물 흐르는 소리가 시원하다.']][Math.random()*4|0]);
  if(k=='㉨')return say('좌판',[['얼음 위에 생선이 가지런하다. 🧊'],['조개가 물을 쭉 뿜었다!'],['오징어 눈이 나를 보는 것 같다.']][Math.random()*3|0]);
  if(k=='k'||k=='ㅋ'||k=='㉰'||k=='㉱'||k=='㊋'){ // 카운터 너머 직원과 대화
    const bn=npcs.find(o=>o.x==x+dx&&o.y==y+dy)||npcs.filter(o=>o.y==y+dy&&Math.abs(o.x-x)<=3).sort((p,q)=>Math.abs(p.x-x)-Math.abs(q.x-x))[0];
    if(bn){npcMet(bn);return say(bn.n,typeof bn.s=='function'?bn.s():bn.s,typeof bn.ch=='function'?bn.ch():bn.ch)}
  }
  else if(k=='Z')openExam();
  else if(k=='l')showFlight();
  else if(k=='¤')showTetris();
  else if(k=='ㆋ')showClaw();
  else if(k=='π'||k=='㌨'){if(cur=='home'&&isOwner())say('컴퓨터',['무엇을 볼까요?'],{'🖥 컴퓨터 쓰기':()=>showPc(),'📋 접속 기록 보기':()=>showAccess()});else if(cur=='pcRoom'&&pcNeed(x,y)&&pcInRoom(x,y)<pcNeed(x,y))say('PC룸',[pcNeed(x,y)+'명이 모여야 시작할 수 있어요.','지금 이 방에 '+pcInRoom(x,y)+'명 있어요.']);else if(cur=='pcRoom'&&x==19&&y==13){eggGet('lol','주인장의 비밀 컴퓨터를 찾았다');showLolMe()}else if(cur=='pcRoom')say('PC방 자리',['무엇을 할까요?'],{'⚔ 리그 오브 레전드 한 판':()=>pcPlay('lol'),'🛰 스타크래프트 한 판':()=>pcPlay('sc'),'🍜 음식 시키기':()=>showCafe(),'🖥 컴퓨터 쓰기':()=>showPc()});else showPc()}
  else if(k=='ɡ')say('통기타',['주인장의 기타, Crafter Sure Plus다. 🎸','줄을 살짝 튕기니 맑은 소리가 난다.']);
  else if(k=='ʊ')say('우쿨렐레',['작고 귀여운 우쿨렐레다. 🎵','통통 튀는 소리가 난다.']);
  else if(k=='ɦ')say('하모니카',['은빛 하모니카가 놓여 있다.','후~ 하고 불어 보고 싶어진다.']);
  else if(k=='℧')showMail();
  else if(k=='ŋ')say('개집',isNight()&&!WET()?['쿨쿨… 💤','개가 웅크리고 잠들어 있다.']:WET()?['개집 안에서 두 눈만 반짝인다.','비가 그칠 때까지 나올 생각이 없나 보다.']:['개집이 비어 있다.','주인은 밖에서 신나게 뛰어다니는 중이다.']);
  else if(k=='¶')say('밥상',elderHome()?['따뜻한 귤차와 귤이 놓여 있다. 🍊']:['귤 옆에 쪽지가 있다.','"산책 나감. 귤 먹엉 가라."']);
  else if(k=='§')say('이불',['폭신한 이불이 잘 개어져 있다.']);
  else if(k=='†')say('창문',isNight()?['창밖으로 별이 보인다.']:['창밖으로 귤나무가 보인다.']);
  else if(k=='ψ')showKakao();
  else if(k=='X'&&cur=='vc')showRed();
  else if(k=='Ω')say('농구 골대',['그물이 살짝 흔들린다. 🏀','누가 방금까지 슛 연습을 한 모양이다.']);
  else if(k=='?')say('파라솔',['그늘이 시원한 파라솔이다. 🏖']);
  else if(k==';')say('돗자리',['누가 맡아 둔 자리인가 보다.']);
  else if(k=='ø')showYoutube();
  else if(k=='æ')say('소파',['부모님 자리다. 푹신해 보인다.']);
  else if(k=='ß'&&cur=='home')goSleep(1,2);
  else if(k=='ß'&&cur=='house')goSleep(1,3);
  else if(k=='ß'&&cur=='pension')goSleep(1,2);
  else if(k=='ß'&&cur=='nongmak')goSleep(1,3);
  else if(k=='㋸')say('셔터',[SHOP_H[shutterKey()].n+' 운영 시간에 셔터가 올라가요.',SHOP_H[shutterKey()].txt]);
  else if(k=='㋹'&&cur=='cityhallIn'){const T1={2:'등본·가족관계',3:'여권',19:'세무·복지',20:'건축·교통'}[x]||'일반 민원';PB_NO=(PB_NO%99)+1;say(T1+' 번호표 기계',['🎫 '+T1+' '+(100+PB_NO)+'번이 나왔다.','전광판에 번호가 뜨면 창구로 가자.'])}
  else if(k=='㋹'){PB_NO=(PB_NO%99)+1;say('번호표 기계',['🎫 '+PB_NO+'번 번호표가 나왔다.','접수대에서 순서를 기다리자.'])}
  else if(k=='㋺')say('나눔 물품',['기부받은 물품이 상자에 나뉘어 있다. 📦']);
  else if(k=='㋻')sitDown(at(x-1,y)=='㋻'?x-1:x,y,'bed','🩸 팔을 걷고 누웠다. 따끔! 한 번 더 누르면 일어나요.');
  else if(k=='㋽')showBooth('four');
  else if(k=='㋾')showBooth('id');
  else if(k=='C'&&cur=='vcHall')showCerts('vcHall');
  else if(k=='ß'&&/^(penR|hRoom)/.test(cur))goSleep(at(x-1,y)=='ß'?x-1:x,y);
  else if(k=='㋶')goSleep(at(x-1,y)=='㋶'?x-1:x,y);
  else if(k=='ß'&&cur=='anbang')say('부모님 침대',['부모님 침대다. 함부로 눕지는 말자. 😅']);
  else if(k=='ß')say('침대',['이불이 잘 개어져 있다. 아마도.']);
  else if(k=='þ')say('냉장고',['귤이 가득 들어 있다. 🍊']);
  else if(k=='ð')say('부엌',['맛있는 냄새가 남아 있다.']);
  else if(k=='{')sitDown(x,y,'bar','철봉에 매달렸다. A(Z)를 누를 때마다 턱걸이! B(X)로 내려오기');
  else if(k=='}')exStart(x,y,'push');
  else if(k=='㌅')exStart(at(x-1,y)=='㌅'?x-1:x,y,'situp');
  else if(k=='㌆')exStart(x,y,'rope');
  else if(k=='㌂'){sfx('s');banner(Math.random()<.55?'⚽ 슛! 골인~!':'⚽ 아깝게 빗나갔다!')}
  else if(k=='㌃'){sfx('s');banner(Math.random()<.5?'🏀 슛! 들어갔다!':'🏀 림을 맞고 나왔다!')}
  else if(k=='(')showProjects();
  else if(k=='ㅰ'){if(pfReady())showMetro(map.line);else toast(pfWait())}
  else if(k=='ㅯ'){if(map.stKey)showStnBoard();else showDay()}
  else if(k=='ㅲ')showDanggn();
  else if(k=='ㅭ')say('화장실',['깔끔하게 쓰는 중. 🚽']);
  else if(k=='ㅮ')say('세면대',['주인장은 양치를 꼭 하고 잔다고 한다. 🪥']);
  else if(k==')')showFrame((x-1)/2);
  else if(k=='ⓔ')showFrame(frameIdx(x,y));
  else if(k=='ⓜ')showTravel();
  else if(k=='*')caveChest();
  else if(k=='+'||k==',')say('낙하산 격납고',['낙하산 접는 긴 탁자가 보인다. 🪂','벽에 강하 기록표가 걸려 있다: 열기구 강하 5회, 그중 1회는 직접 포장한 낙하산.']);
  else if(k=='&')say('감귤 콘테나',['갓 딴 귤이 콘테나에 가득 담겨 있다. 🍊','새콤달콤한 향이 난다.']);
  else if(k=='%')say('돌담',['제주 현무암을 쌓은 돌담이다.','바람이 돌 틈으로 슝슝 지나간다.']);
  else if(k=='#')cur=='sports'?showRecBoard():/^tosan/.test(cur)?showKiwi():showBoard();
  else if(k=='z')plWall(x);
  else if(k=='p')say('책장',['음악 책과 오래된 앨범이 가지런히 꽂혀 있다. 📚']);
  else if(k=='e')say('BS 에어 여객기',['승객을 기다리는 여객기다. ✈','터미널 카운터에서 수속하면 탈 수 있다.']);
  else if(k=='r'||k=='y')say('활주로',['⚠ 활주로 출입 금지!','이착륙하는 비행기를 여기서 구경하자.']);
  else if(k=='ㆈ')say('필름 릴',['커다란 영화 필름 릴이다. 🎞','오래된 영사기 냄새가 나는 것 같다.']);
  else if(k=='ㆄ'||k=='ㆅ'||k=='ㆇ')say('영화관',['오늘도 주인장이 본 영화 별점을 받는 작은 영화관이다. 🎬']);
  else if(k=='ⓚ')showTj();
  else if(k=='ㆎ')cafeSit(x,y);
  else if(k=='ㆍ')say('탁자',cur=='haenyeo'?['오늘 잡은 해산물과 밥이 차려져 있다. 🍚🐚']:cur=='cafe'?['창밖으로 바다가 보이는 자리다. 🌊']:['깨끗하게 닦인 식탁이다. 의자에 앉아 보자. 🍽']);
  else if(k=='ⓦ')say('창문',[/^woodang/.test(cur)?'창밖으로 소나무 숲이 보인다. 🌲':['beach','hamdeok','udo','coast','haeundae','moseulpo','seongsan','shoreF'].includes(zone())?'창밖으로 바다가 보인다. 🌊':'창밖으로 바깥 풍경이 보인다.']);
  else if(k=='ⓡ')say('수하물 레일',['맡긴 캐리어들이 레일을 타고 안쪽으로 들어간다. 🧳','귤 상자도 같이 실려 간다. 🍊']);
  else if(k=='Ⓒ')cafeSit(x,y);
  else if(k=='Ⓜ')showCafe();
  else if(k=='Ⓣ')say('벽걸이 TV',['식당 TV에서 뉴스가 나오고 있다. 📺']);
  else if(k=='Ⓤ')say('제주 그림',['노란 유채꽃 너머로 산이 보이는 그림이다. 🌼']);
  else if(k=='Ⓛ')say('반찬 카트',['반찬이 정갈하게 담겨 있다. 🥢']);
  else if(k=='Ⓚ')say('냉장고',['큼직한 업소용 냉장고다.']);
  else if(k=='Ⓓ'||k=='Ⓨ')return;
  else if(k=='Ⓑ')say('샐러드바',['무제한 샐러드바다. 채소와 과일이 가득하다. 🥬','직접 담아 먹으면 된다.']);
  else if(k=='Ⓗ')say('그릇 선반',['접시와 그릇이 가지런히 쌓여 있다. 🍽']);
  else if(k=='Ⓢ')say('간판',['Shabu & Salad bar']);
  else if(k=='ㆀ')showMovies();
  else if(k=='ㆁ'){if(/^cineH/.test(cur)){cineSeat(x,y)}else{sitDown(x,y,'bench','🎤 앉았어요. 화면 앞에서 노래 번호를 찾을 수 있어요.');dir=1}}
  else if(k=='S')say('관제탑',['관제탑이 활주로를 지켜보고 있다.']);
  else if(k=='i')say('표지판',cur=='gimpo'?['✈ 김포공항','위쪽 왼쪽 입구: 국내선 / 오른쪽 입구: 국제선','오른쪽 아래: 지하철 5호선·9호선']:['✈ 제주 공항 터미널','남쪽 해변 길: 제주 바닷가']);
  else if(k=='P')showProfilePic();
  else if(cur=='gym'&&'MJN'.includes(k))showRecWall();
  else if(k=='㌇')showFit();
  else if(k=='N'&&CTS[cur])showCerts(cur);
  else if(map.sh&&'MJNU^BEI'.includes(k))say('전시대',map.sh);
  else if('CLA'.includes(k))showCerts(cur);
  else if(k=='O')showQA();
  else if(k=='q'){const mm=(map.memo||{})[x+','+y];if(mm)say('메모',mm.l)}
  else if('gh'.includes(k))sitDown(x,y,'bench','🍃 정자에 앉아 바람을 맞는다.');
  else if('ac'.includes(k))say('정자',['시원한 그늘이 드는 정자다. 아래쪽 마루에 앉을 수 있다.']);
  else if(k=='b'&&CAFE.drink)cafeSit(x,y);
  else if(k=='b')sitDown(x,y,'bench','🪑 벤치에 앉아 숨을 고른다.');
  else if(k==']')sitDown(x,y,'swing','그네를 탄다. 슝~');
  else if(k=='|')sitDown(x,y,'seesaw','시소를 탄다. 혼자서도 어떻게든 된다.');
  else if(k=='['){sitDown(x,y,'bar','철봉에 매달렸다. A(Z)를 누를 때마다 턱걸이! B(X)로 내려오기');}
  else if(k=='m'||k=='o')citrusAsk();
}

function cancel(){if(PCG){PCG.a=Math.min(PCG.a,PCG.l-PCG.dur+3100);return}if(SIT&&!modal&&!dlg)return sitUp();if(lbOn())lbClose();else if(modal)closeM();else if(dlg)endDlg()}

function openM(h){held=null;tetStop();sunoStop();$('#mc').innerHTML=h;$('#md').hidden=false;modal=true;document.body.classList.add('modal-on');$('.mb').scrollTop=0;kcSel(null);if(KC.on)kcMove(1);dockPos()}
function closeM(){if(GS.pending){GS.pending=false;closeMraw();startReal();return}closeMraw()}
function closeMraw(){tjOff();lckOff();pbStop();clawOff();tvOff();BUS.menu=false;tetFlush();tetStop();sunoStop();$('#md').hidden=true;modal=false;document.body.classList.remove('modal-on');kcSel(null);dockPos();bgmUi()}
/* 창 안 커서: 방향키·패드로 고르고 Z·Enter·A로 누름 */
const KC={on:false,el:null};
const kcItems=()=>[...$('#mc').querySelectorAll('a[href],button:not(:disabled),summary,input,textarea,select,audio,[onclick]')].filter(e=>e.getClientRects().length&&!e.hidden);
function kcPos(){const c=$('#kc'),e=KC.el;if(!c)return;if(!e||!e.isConnected){c.style.display='none';return}
  const r=e.getBoundingClientRect();c.style.display='block';c.style.left=Math.max(2,r.left-24)+'px';c.style.top=(r.top+Math.min(r.height,44)/2-10)+'px'}
function kcSel(e){if(KC.el)KC.el.classList.remove('kcur');KC.el=e;if(e){e.classList.add('kcur');e.scrollIntoView({block:'nearest'})}kcPos()}
function kcMove(d){KC.on=true;const a=kcItems();if(!a.length)return kcSel(null);const i=a.indexOf(KC.el);kcSel(a[i<0?(d>0?0:a.length-1):(i+d+a.length)%a.length]);if(document.activeElement&&document.activeElement!==document.body)document.activeElement.blur()}
function kcAct(){KC.on=true;const e=KC.el&&KC.el.isConnected?KC.el:null;if(!e)return kcMove(1);
  const n=e.tagName;if(n=='TEXTAREA'||n=='SELECT'||(n=='INPUT'&&e.type!='checkbox'))return e.focus();
  if(n=='AUDIO')return e.paused?e.play().catch(()=>{}):e.pause();
  e.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
  setTimeout(()=>{if(KC.el&&!KC.el.isConnected)kcSel(null);if(!KC.el&&modal)kcMove(1);else kcPos()},60)}
/* 광고지 크게 보기: 누르면 확대/축소, 끌어서 또는 방향키로 이동 */
const lbOn=()=>$('#lb').classList.contains('on');
function lbOpen(src,alt){const l=$('#lb'),i=$('#lbi');i.src=src;i.alt=alt||'';l.classList.add('on');l.classList.remove('big');document.body.classList.add('lb-on');l.scrollTop=l.scrollLeft=0;$('#kc').style.visibility='hidden'}
function lbClose(){$('#lb').classList.remove('on','big');document.body.classList.remove('lb-on');$('#kc').style.visibility=''}
function lbZoom(ev){const l=$('#lb');l.classList.toggle('big');l.scrollLeft=(l.scrollWidth-l.clientWidth)/2;l.scrollTop=0}
function lbScroll(d){$('#lb').scrollBy({left:d==2?-90:d==3?90:0,top:d==1?-90:d==0?90:0})}
function kcKey(e){
  if(TET.run&&tetKey(e))return;
  if(lbOn()){const k=e.key,d=KM[k];e.preventDefault();if(['x','X','Escape'].includes(k))lbClose();else if(d!=null)lbScroll(d);else if(['z','Z','Enter',' '].includes(k))lbZoom();return}
  const t=e.target,tag=t&&t.tagName,k=e.key,typing=tag=='TEXTAREA'||tag=='SELECT'||(tag=='INPUT'&&t.type!='checkbox');
  if(typing){
    if(k=='Escape'){e.preventDefault();t.blur();return}
    if(/date|month/.test(t.type||'')||tag=='SELECT')return;
    const up=k=='ArrowUp',dn=k=='ArrowDown';if(!up&&!dn)return;
    if(tag=='TEXTAREA'&&((up&&t.selectionStart>0)||(dn&&t.selectionEnd<t.value.length)))return;
    e.preventDefault();kcSel(t);kcMove(up?-1:1);return;
  }
  if(['x','X','Escape'].includes(k)){cancel();return}
  const d=KM[k];
  if(d!=null){e.preventDefault();kcMove(d==1||d==2?-1:1);return}
  if(['z','Z','Enter',' '].includes(k)){e.preventDefault();kcAct()}
}


const CTS={
 agency:{t:'📜 자격 · 수상 전시',it:[['💻','정보처리기사','',1],['💻','컴퓨터활용능력 1급','',1],['💻','워드프로세서','',1],['📊','사회조사분석사 2급','',1],['📜','한국사능력검정시험 2급','',1],['🥋','태권도 2단','1품 · 2품에서 성인이 되며 1단 · 2단으로 전환',1],['🔤','TOEIC 최고 775점','',1],['🏆','2016 지역기업 청년 희망이음 프로젝트 경진대회 대상','산업통상자원부 장관상',1],['🥇','2017 같은 대회 금상','산업통상자원부 장관상',1],['🤝','상상 Volunteer','활동 수료',1],['🎓','상상마케팅스쿨','수료',1]]},
 mensa:{t:'🧠 멘사 인증',it:[['🧠','멘사 (Mensa International)','IQ 156 · Percentile 99% · 입회 시험 합격 (준회원)',0,'certs/mensa-result.jpg']]},
 vcHall:{t:'🏆 명예의 전당',it:[['🩸','헌혈 167회','대한적십자사',0],['🥈','헌혈유공장 은장','30회 달성 · 2018.07.13',0,'certs/blood-silver-2018.jpg'],['🥇','헌혈유공장 금장','50회 달성',0],['🏅','헌혈유공장 명예장','100회 달성',0],['🤝','봉사활동','상상 Volunteer 활동',0]]},
 gym:{t:'🏃 운동 기록',it:[]}
};
function showCerts(kind){
  if(busy)return;const d=CTS[kind||cur];if(!d){toast('이 건물에서 볼 수 있는 전시물이 없어요.');return}
  const mk='<div class="mk">생년월일 <span class="bl">0000.00.00</span> · 문서번호 <span class="bl">XXXX-0000</span></div>';
  openM('<h3>'+d.t+'</h3>'+(d.it.some(c=>c[3])?'<p style="font-size:12px;opacity:.8">🔒 개인정보는 가림(마스킹) 처리됩니다.</p>':'')+d.it.map(c=>`<div class="cd"><b>${c[0]} ${c[1]}</b>${c[2]?`<small>${c[2]}</small>`:''}${c[3]?mk:''}${c[4]?`<div style="margin-top:6px"><button class="xb" onclick="certOpen('${c[4]}','${esc(c[1])}')">📄 증명서 보기</button></div>`:''}</div>`).join(''));
}

/* ===== 저장소: Supabase (설정은 supabase_setup.sql) ===== */
