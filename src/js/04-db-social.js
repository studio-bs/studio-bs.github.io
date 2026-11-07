const DBCFG={url:'https://lruuztbarxihtflizlef.supabase.co',key:'sb_publishable_Mm9sf1l-qmcyxNMs5SM0XA_SPaBWy_B'};
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DB={
  tok:null,
  admin(){return !!DB.tok},
  async req(path,o={},retried){
    const headers={apikey:DBCFG.key,'Content-Type':'application/json',...(o.h||{})};
    if(DB.tok)headers.Authorization='Bearer '+DB.tok;   // 로그인 전에는 apikey만 보냄
    const r=await fetch(DBCFG.url+'/rest/v1/'+path,{method:o.method||'GET',body:o.body,headers});
    if(r.status==401&&DB.tok&&!retried){DB.logout();return DB.req(path,o,true)}   // 로그인 만료 시 방문자로 재시도
    if(!r.ok){const e=new Error(await r.text());e.status=r.status;throw e}
    const t=await r.text();return t?JSON.parse(t):null;
  },
  rpc(fn,args){return DB.req('rpc/'+fn,{method:'POST',body:JSON.stringify(args||{})})},
  async login(email,pw){
    const r=await fetch(DBCFG.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:DBCFG.key,'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})});
    const j=await r.json();if(!r.ok||!j.access_token)throw new Error('이메일 또는 비밀번호를 확인해 주세요');
    DB.tok=j.access_token;
    if(!await DB.rpc('is_admin')){DB.logout();throw new Error('운영자 권한이 없는 계정이에요')}
    visitMarkAdmin();
    try{sessionStorage.setItem('bsw_tok',DB.tok)}catch(e){}
    idRender();talkLoad();
  },
  logout(){DB.tok=null;try{sessionStorage.removeItem('bsw_tok')}catch(e){}idRender();talkLoad()},
  async regList(){const o={};(await DB.req('exam_reg?select=*')).forEach(r=>o[r.key]=r);return o},
  regSet(key,exam,part,date){
    const rec={key,exam,part,exam_date:date,receipt:'BS-'+String(Date.now()).slice(-6),created_at:new Date().toISOString()};
    return DB.req('exam_reg?on_conflict=key',{method:'POST',body:JSON.stringify(rec),h:{Prefer:'resolution=merge-duplicates,return=minimal'}});
  },
  plList(){return DB.req('playlist?select=*&order=ym.desc')},
  plAdd(rec){return DB.req('playlist',{method:'POST',body:JSON.stringify(rec),h:{Prefer:'return=minimal'}})},
  plSet(id,rec){return DB.req('playlist?id=eq.'+id,{method:'PATCH',body:JSON.stringify(rec),h:{Prefer:'return=minimal'}})},
  plDel(id){return DB.req('playlist?id=eq.'+id,{method:'DELETE',h:{Prefer:'return=minimal'}})},
  regDel(key){return DB.req('exam_reg?key=eq.'+encodeURIComponent(key),{method:'DELETE',h:{Prefer:'return=minimal'}})}
};
try{DB.tok=sessionStorage.getItem('bsw_tok')}catch(e){}
const dbErr=e=>e&&e.status==404||/PGRST20|42P01|42883/.test(e&&e.message||'')?'DB 설정이 아직 안 끝났어요. (supabase_setup.sql 실행 필요)':e&&e.status?'요청을 처리하지 못했어요. 로그인이 만료됐을 수 있어요.':'DB 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.';

const fmtT=t=>{try{return new Date(t).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false})}catch(e){return t||''}};
const fmtD=d=>{try{return new Date(d+'T00:00:00').toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short'})}catch(e){return d}};
const BACKS={start:()=>{closeM();idRender()},me:()=>{closeM();idRender()},rec:()=>showRec(),mail:()=>showMail(),ex:()=>exHome(),qa:()=>showQA(),pl:()=>plHome()};
function adm(k){
  return DB.tok?`<div class="adm">🔑 운영자 모드 <button class="xb" onclick="DB.logout();BACKS.${k}()">로그아웃</button></div>`
               :`<div class="adm">👀 보기 전용 <button class="xb" onclick="showLogin('${k}')">🔑 운영자 로그인</button></div>`;
}
function showLogin(k){
  openM(`<h3>🔑 운영자 로그인</h3><p style="font-size:12px;opacity:.8;margin-bottom:8px">운영자 계정으로 로그인하면 접수 기록과 방명록을 관리할 수 있어요.</p>
  <input id="lgE" class="xin" type="email" placeholder="이메일" autocomplete="username">
  <input id="lgP" class="xin" type="password" placeholder="비밀번호" autocomplete="current-password" style="margin-top:6px" onkeydown="if(event.key=='Enter')doLogin('${k}')">
  <div style="margin-top:10px"><button class="xb" onclick="doLogin('${k}')">로그인</button> <button class="xb r" onclick="BACKS.${k}()">취소</button></div>`);
}
async function doLogin(k){try{await DB.login($('#lgE').value.trim(),$('#lgP').value);toast('운영자 모드로 전환했어요.');BACKS[k]()}catch(e){toast(e instanceof TypeError?'DB 서버에 연결하지 못했어요. 배포된 사이트에서 다시 시도해 주세요.':'로그인 실패: '+(e.message&&e.message.length<40?e.message:'확인해 주세요'))}}

/* ===== 시험 접수 시스템 (컴퓨터) ===== */
const EXI={ele:{n:'전기기사',g:'q',p:['w','p']},fire:{n:'소방설비기사',g:'q',p:['w','p']},sec:{n:'정보보안기사',g:'c',p:['w','p']},toeic:{n:'TOEIC',g:'t',p:['t']},hist:{n:'한국사능력검정시험',g:'k',p:['t']}};
const PL={w:'필기',p:'실기',t:'응시'};
const EXL={q:['🏛 Q-Net 국가기술자격','https://www.q-net.or.kr/man001.do?gSite=Q&gIntro=Y','Q-Net 접수 페이지 열기'],
  c:['🛰 한국통신전파진흥원 국가기술자격검정','https://www.cq.or.kr/main.do','CQ(한국통신전파진흥원) 접수 페이지 열기'],
  t:['🔤 TOEIC','https://exam.toeic.co.kr/receipt/receiptStep1.php','TOEIC 접수 페이지 열기'],
  k:['📜 한국사능력검정시험','https://www.historyexam.go.kr/','한능검 접수 페이지 열기']};
let REG={};
const exNote='<p style="font-size:11px;opacity:.7;margin-top:10px">※ 여기 기록은 이 게임의 접수내역이에요. 실제 접수는 공식 사이트에서 진행하세요.</p>';
const exBack=(fn,l)=>`<div style="margin-top:10px"><button class="xb" onclick="${fn}">◀ ${l||'뒤로'}</button></div>`;
async function openExam(){try{REG=await DB.regList()}catch(e){REG={};toast(dbErr(e))}exHome()}
/* 다음 시험 일정. 공개된 일정을 적어 둔 표라서, 새 일정이 나오면 여기에 한 줄씩 더하면 됩니다. (2026-11-05 기준 확인) */
const EX_SCHED={
  hist:{off:'https://www.historyexam.go.kr/',list:[
    {no:'제81회 (심화)',d:'2026-11-28',steps:[['정기 접수','2026-11-03','2026-11-10'],['취소좌석 접수','2026-11-11','2026-11-13']],res:'2026-12-11'}]},
  toeic:{off:'https://exam.toeic.co.kr/',list:[
    {no:'제582회',d:'2026-11-08',steps:[['추가 접수','2026-10-28','2026-11-05']],res:'2026-11-17'},
    {no:'제583회',d:'2026-11-15',steps:[['추가 접수','2026-11-04','2026-11-12']],res:'2026-11-24'},
    {no:'제584회',d:'2026-11-29',steps:[['정기 접수','2026-10-12','2026-11-16'],['추가 접수','2026-11-18','2026-11-26']],res:'2026-12-08'},
    {no:'제585회',d:'2026-12-13',steps:[['정기 접수','2026-10-26','2026-11-30'],['추가 접수','2026-12-02','2026-12-10']],res:'2026-12-22'},
    {no:'제586회',d:'2026-12-27',steps:[['정기 접수','2026-11-09','2026-12-14'],['추가 접수','2026-12-16','2026-12-23']],res:'2027-01-06'},
    {no:'2027년 첫 시험',d:'2027-01-16',steps:[['접수','2026-11-30','']],res:'2027-01-26'}]}};
const exToday=()=>new Date(Date.now()+9*36e5).toISOString().slice(0,10);
const exDays=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/864e5);
const exMD=d=>{const D=new Date(d+'T00:00:00Z');return (D.getUTCMonth()+1)+'월 '+D.getUTCDate()+'일('+'일월화수목금토'[D.getUTCDay()]+')'};
function exNextHtml(id){
  const X=EX_SCHED[id];if(!X)return'';const t=exToday(),L=X.list.filter(e=>e.d>=t),link=`<a href="${X.off}" target="_blank" rel="noopener">공식 사이트</a>`;
  if(!L.length)return `<div class="cd" style="margin:8px 0"><b>📅 다음 시험</b><br>아직 다음 일정이 등록되지 않았어요. ${link}에서 확인해 주세요.</div>`;
  const e=L[0],n=exDays(t,e.d),now=e.steps.find(s=>t>=s[1]&&(!s[2]||t<=s[2])),nx=e.steps.find(s=>t<s[1]);
  const reg=now?(now[2]?`${now[0]} 중 · ${exMD(now[2])}까지`:`${now[0]} 중 · 마감일은 공식 사이트 확인`):nx?`${nx[0]} ${exMD(nx[1])}부터`:'접수 기간이 끝났어요';
  return `<div class="cd" style="margin:8px 0"><b>📅 다음 시험은 ${exMD(e.d)}입니다.</b> <b style="color:#dc2626">${n?n+'일 남았습니다':'오늘이에요!'}</b><br><small>${esc(e.no)} · ${reg} · 결과 발표 ${exMD(e.res)}</small>${L.length>1?`<br><small style="opacity:.8">그다음: ${L.slice(1,3).map(q=>exMD(q.d)).join(', ')}</small>`:''}<br><small style="opacity:.7">시행처 사정으로 바뀔 수 있어요. 접수 전 ${link}에서 확인해 주세요.</small></div>`;
}
function exHome(){
  const n=Object.keys(REG).length;
  openM(`<h3>🖥 자격 시험 접수 시스템</h3>${adm('ex')}<div class="xcol">`+
    [['q','1. Q-Net 국가기술자격'],['c','2. 한국통신전파진흥원 국가기술자격검정'],['t','3. TOEIC'],['k','4. 한국사능력검정시험']].map(([g,l])=>`<button class="xb big" onclick="exGroup('${g}')">${l}</button>`).join('')+
    `<button class="xb big" onclick="exHist()">5. 접수내역 (${n}건)</button></div>`);
}
function exGroup(g){
  const L=EXL[g];
  openM(`<h3>${L[0]}</h3>${adm('ex')}<div style="margin:8px 0"><a class="xb" href="${L[1].replace(/&/g,'&amp;')}" target="_blank" rel="noopener">🔗 ${L[2]}</a></div>`+
    Object.entries(EXI).filter(([id,e])=>e.g==g).map(([id,e])=>`<div class="xrow pick" onclick="exExam('${id}')"><div><b>${e.n}</b><small style="display:block;opacity:.75">${e.p.map(p=>PL[p]+(REG[id+':'+p]?' ✅':' —')).join(' · ')}</small></div><span>▶</span></div>`).join('')+
    exBack('exHome()','처음으로')+exNote);
}
function exExam(id){
  const e=EXI[id],ad=DB.admin();
  openM(`<h3>${e.n}</h3>${adm('ex')}${exNextHtml(id)}`+e.p.map(p=>{const r=REG[id+':'+p];return `<div class="xrow"><div><b>${e.p.length>1?PL[p]+' 시험':'시험 접수'}</b><small style="display:block;opacity:.75">${r?'✅ '+fmtD(r.exam_date)+' 접수':'미접수'}</small></div><div><button class="xb" ${r||!ad?'disabled':''} onclick="exDate('${id}','${p}')">접수</button> <button class="xb r" ${r&&ad?'':'disabled'} onclick="exCancel('${id}','${p}')">접수취소</button></div></div>`}).join('')+
    (ad?'':'<p style="font-size:11px;opacity:.75">접수와 취소는 운영자만 할 수 있어요.</p>')+exBack(`exGroup('${e.g}')`,'목록으로')+exNote);
}
function exDate(id,p){
  const e=EXI[id],today=new Date().toISOString().slice(0,10);
  openM(`<h3>📅 ${e.n} ${e.p.length>1?PL[p]:''} 접수</h3><p style="font-size:12px;opacity:.85;margin:6px 0">시험 날짜를 선택하세요.</p><input id="exd" class="xin" type="date" min="${today}"><div style="margin-top:10px"><button class="xb" onclick="exSave('${id}','${p}')">접수 확정</button> <button class="xb r" onclick="exExam('${id}')">취소</button></div>`);
}
async function exSave(id,p){
  const d=$('#exd').value;if(!d)return toast('시험 날짜를 선택해 주세요.');
  if(!DB.admin())return toast('운영자만 접수할 수 있어요.');
  try{const e=EXI[id];await DB.regSet(id+':'+p,e.n,PL[p],d);REG=await DB.regList();toast('접수가 완료되었습니다!');exExam(id)}catch(err){toast(dbErr(err))}
}
async function exCancel(id,p){
  if(!DB.admin())return toast('운영자만 취소할 수 있어요.');
  try{await DB.regDel(id+':'+p);REG=await DB.regList();toast('접수가 취소되었습니다.');exExam(id)}catch(err){toast(dbErr(err))}
}
function exHist(){
  const ks=Object.values(REG).sort((a,b)=>String(a.exam_date).localeCompare(String(b.exam_date)));
  openM('<h3>📋 접수내역</h3>'+adm('ex')+(ks.length?ks.map(r=>`<div class="cd"><b>${esc(r.exam)}${r.part&&r.part!='응시'?' · '+esc(r.part):''}</b><small>시험일 ${fmtD(r.exam_date)} · 접수번호 ${esc(r.receipt)}<br>접수일시 ${fmtT(r.created_at)}</small></div>`).join(''):'<div class="cd">접수 내역이 없습니다.</div>')+exBack('exHome()','처음으로')+exNote);
}

/* ===== Q&A (집 가운데 테이블) ===== */
const QA={list:[],open:{},exp:new Set(),err:''};   // open: 비밀번호로 연 글 {id:{item,pw}} (창을 닫기 전 화면용, 저장 안 함)
const QERR={bad_pw:'비밀번호가 맞지 않아요.',locked:'비밀번호를 5번 틀려 10분 동안 잠겼어요.',not_found:'이미 삭제된 글이에요.',bad_q:'내용은 1~300자로 입력해 주세요.',bad_new_pw:'비밀번호는 4~32자로 입력해 주세요.',rate:'지금 질문이 너무 많아요. 잠시 후 다시 남겨 주세요.',forbidden:'운영자만 할 수 있어요.'};
const qItem=it=>(QA.open[it.id]&&QA.open[it.id].item)||it;
async function qaHide(id,on){try{const r=await DB.rpc('qa_hide',{p_id:id,p_hide:on});if(!r.ok)return toast('처리하지 못했어요.');toast(on?'숨겼어요. 글쓴이와 운영자만 볼 수 있어요.':'숨김을 풀었어요.');QA.list=await DB.rpc('qa_list');qaRender()}catch(e){toast('서버 설정이 필요해요. supabase_qa_hide.sql을 실행해 주세요.')}}
async function showQA(){
  openM('<h3>📖 방명록</h3><p style="font-size:12px;opacity:.8">불러오는 중…</p>');
  QA.err='';
  try{QA.list=await DB.rpc('qa_list')}catch(e){QA.list=[];QA.err=dbErr(e)}
  qaRender();
}
function qaForm(){
  return `<details class="qform"${QA.list.length?'':' open'}><summary>✏ 방명록 남기기</summary>
  <input id="qn" class="xin" maxlength="20" placeholder="이름 (선택)" style="margin-top:8px">
  <textarea id="qq" class="xin" rows="3" maxlength="300" placeholder="궁금한 점을 남겨 주세요 (300자 이내)" style="margin-top:6px"></textarea>
  <input id="qp" class="xin" type="password" maxlength="32" placeholder="비밀번호 (4자 이상, 수정·삭제할 때 필요)" autocomplete="new-password" style="margin-top:6px">
  <label class="qchk"><input id="qs" type="checkbox"> 🔒 비밀글 (글쓴이와 운영자만 볼 수 있어요)</label>
  <button class="xb" onclick="qaAsk()">남기기</button></details>`;
}
function qaBody(it,ad){
  if(it.locked)return `<p style="font-size:12px;opacity:.85">${it.is_hidden?'🙈 운영자가 숨긴 글이에요.':'🔒 비밀글이에요.'} 글쓴이는 비밀번호를 입력하면 볼 수 있어요.</p>
    <input id="qop${it.id}" class="xin" type="password" maxlength="32" placeholder="비밀번호" autocomplete="off" onkeydown="if(event.key=='Enter')qaUnlock(${it.id})">
    <div class="qbtn"><button class="xb" onclick="qaUnlock(${it.id})">열기</button></div>`;
  return `<div class="qq">${esc(it.q)}</div><small class="qm">${it.is_hidden?'🙈 숨김 · ':''}${it.is_secret?'🔒 비밀글 · ':''}${esc(it.name||'익명')} · ${fmtT(it.created_at)}${it.updated_at?' (수정됨)':''}</small>`+
    (it.a?`<div class="a"><b>주인장:</b> ${esc(it.a)}</div>`:'')+
    (ad?`<textarea id="qaa${it.id}" class="xin" rows="2" maxlength="2000" placeholder="주인장 답글" style="margin-top:8px">${esc(it.a||'')}</textarea>`:'')+
    `<div class="qbtn">${ad?`<button class="xb" onclick="qaSave(${it.id})">${it.a?'답글 수정':'답글 달기'}</button>`:`<button class="xb" onclick="qaEdit(${it.id})">수정</button>`}${ad?`<button class="xb" onclick="qaHide(${it.id},${!it.is_hidden})">${it.is_hidden?'숨김 해제':'숨김'}</button>`:''}<button class="xb r" onclick="qaDel(${it.id})">삭제</button></div>`;
}
function qaRender(){
  const ad=DB.admin();
  openM(`<h3>📖 방명록</h3>${adm('qa')}${qaForm()}`+
    (QA.err?`<div class="cd">${esc(QA.err)}</div>`:QA.list.length?QA.list.map((raw,i)=>{const it=qItem(raw);
      return `<details class="qb"${QA.exp.has(it.id)?' open':''} ontoggle="qaTog(${it.id},this.open)"><summary><span class="qn">${i+1}</span><span class="qt">${it.locked?(it.is_hidden?'🙈 숨겨진 글입니다':'🔒 비밀글입니다'):(it.is_hidden?'🙈 ':'')+(it.is_secret?'🔒 ':'')+esc(it.q)}</span><span class="qs${it.has_a?' done':''}">${it.has_a?'답글 있음':''}</span></summary><div class="qbd">${qaBody(it,ad)}</div></details>`}).join('')
    :'<div class="cd">아직 글이 없어요. 첫 방문 인사를 남겨 보세요!</div>'));
}
function qaTog(id,o){o?QA.exp.add(id):QA.exp.delete(id)}
async function qaAsk(){
  const q=$('#qq').value.trim(),name=$('#qn').value.trim(),pw=$('#qp').value,sec=$('#qs').checked;
  if(!q)return toast('내용을 입력해 주세요.');
  if(pw.length<4)return toast('비밀번호를 4자 이상 입력해 주세요.');
  try{const r=await DB.rpc('qa_ask',{p_name:name,p_q:q,p_secret:sec,p_pw:pw});
    if(!r.ok)return toast(QERR[r.err]||'글을 남기지 못했어요.');
    QA.exp.add(r.id);if(sec)QA.open[r.id]={pw,item:null};
    toast('방명록을 남겼어요! 고마워요. 📖');
    if(sec){const o=await DB.rpc('qa_open',{p_id:r.id,p_pw:pw});if(o.ok)QA.open[r.id].item=o.item;else delete QA.open[r.id]}
    showQA();
  }catch(e){toast(dbErr(e))}
}
async function qaUnlock(id){
  const pw=$('#qop'+id).value;if(!pw)return toast('비밀번호를 입력해 주세요.');
  try{const r=await DB.rpc('qa_open',{p_id:id,p_pw:pw});
    if(!r.ok)return toast(QERR[r.err]||'열지 못했어요.');
    QA.open[id]={item:r.item,pw};QA.exp.add(id);qaRender();
  }catch(e){toast(dbErr(e))}
}
function qaEdit(id){
  const raw=QA.list.find(x=>x.id==id);if(!raw)return;const it=qItem(raw),pw=(QA.open[id]||{}).pw||'';
  openM(`<h3>✏ 방명록 수정</h3><input id="qen" class="xin" maxlength="20" placeholder="이름 (선택)" value="${esc(it.name)}">
  <textarea id="qeq" class="xin" rows="4" maxlength="300" style="margin-top:6px">${esc(it.q)}</textarea>
  <input id="qep" class="xin" type="password" maxlength="32" placeholder="글 남길 때 정한 비밀번호" autocomplete="off" value="${esc(pw)}" style="margin-top:6px">
  <label class="qchk"><input id="qes" type="checkbox"${it.is_secret?' checked':''}> 🔒 비밀글</label>
  <div class="qbtn"><button class="xb" onclick="qaEditSave(${id})">저장</button><button class="xb r" onclick="qaRender()">취소</button></div>`);
}
async function qaEditSave(id){
  const pw=$('#qep').value;if(!pw)return toast('비밀번호를 입력해 주세요.');
  const q=$('#qeq').value.trim();if(!q)return toast('내용을 입력해 주세요.');
  try{const r=await DB.rpc('qa_edit',{p_id:id,p_pw:pw,p_name:$('#qen').value.trim(),p_q:q,p_secret:$('#qes').checked});
    if(!r.ok)return toast(QERR[r.err]||'수정하지 못했어요.');
    QA.open[id]={item:r.item,pw};QA.exp.add(id);toast('수정했어요.');showQA();
  }catch(e){toast(dbErr(e))}
}
function qaDel(id){
  const ad=DB.admin(),pw=(QA.open[id]||{}).pw||'';
  openM(`<h3>🗑 글 삭제</h3><p style="font-size:13px;margin-bottom:8px">이 글과 답글을 삭제할까요? 되돌릴 수 없어요.</p>`+
    (ad?'':`<input id="qdp" class="xin" type="password" maxlength="32" placeholder="글 남길 때 정한 비밀번호" autocomplete="off" value="${esc(pw)}">`)+
    `<div class="qbtn"><button class="xb r" onclick="qaDelGo(${id})">삭제</button><button class="xb" onclick="qaRender()">취소</button></div>`);
}
async function qaDelGo(id){
  const el=$('#qdp'),pw=el?el.value:null;if(el&&!pw)return toast('비밀번호를 입력해 주세요.');
  try{const r=await DB.rpc('qa_delete',{p_id:id,p_pw:pw});
    if(!r.ok)return toast(QERR[r.err]||'삭제하지 못했어요.');
    delete QA.open[id];QA.exp.delete(id);toast('삭제했어요.');showQA();qAlert();
  }catch(e){toast(dbErr(e))}
}
async function qaSave(id){
  if(!DB.admin())return toast('운영자만 답글을 달 수 있어요.');
  const t=$('#qaa'+id).value.trim();if(!t)return toast('답글을 입력해 주세요.');
  try{const r=await DB.rpc('qa_answer',{p_id:id,p_a:t});
    if(!r.ok){if(r.err=='forbidden')DB.logout();return toast(QERR[r.err]||'저장하지 못했어요.')}
    toast('답글을 저장했어요.');showQA();qAlert();
  }catch(e){toast(dbErr(e))}
}

/* ===== 방문자 수: 브라우저당 하루 1회, 운영자 기기는 제외 ===== */
function visitMarkAdmin(){try{localStorage.setItem('bsw_admin_device','1')}catch(e){}setTimeout(qAlert,50)}
async function visitInit(){
  const day=new Date(Date.now()+9*36e5).toISOString().slice(0,10);
  let seen=false,admin=!!DB.tok;
  try{seen=localStorage.getItem('bsw_visit')==day;admin=admin||localStorage.getItem('bsw_admin_device')=='1'}catch(e){}
  try{
    const s=await DB.rpc(seen||admin?'visit_stats':'visit_hit');
    if(!seen&&!admin)try{localStorage.setItem('bsw_visit',day)}catch(e){}
    $('#vcT').textContent=Number(s.today).toLocaleString('ko-KR');$('#vcA').textContent=Number(s.total).toLocaleString('ko-KR');$('#vc').hidden=false;
  }catch(e){}   // 설정 전이거나 연결이 안 되면 숨겨 둠
}

/* ===== 음악 서재: 플레이리스트 ===== */
const PL_SLOT=[2,4,6,8,10,12],PL_MAX=30;
let PLS=[],PLERR='';
async function plLoad(){try{PLS=await DB.plList();PLERR='';PLS.forEach(p=>plSync(p).catch(()=>{}))}catch(e){PLERR=dbErr(e)}}
const plUrl=u=>/^https:\/\/[^\s"'<>]+$/.test(u||'')?u:'';
const plSongUrl=s=>plUrl(s.u)||'https://music.youtube.com/search?q='+encodeURIComponent([s.a,s.t].filter(Boolean).join(' '));
const plYm=ym=>ym.slice(0,4)+'년 '+(+ym.slice(5))+'월';
const plSoon=p=>p.ym>jejuYm();
const plWall_=()=>PLS.slice(0,PL_SLOT.length).reverse();   // 최근 6개를 왼쪽부터 오래된 달 순서로
function plWall(x){
  const p=plWall_()[PL_SLOT.indexOf(x)];
  if(p)return plShow(p.id);
  if(DB.admin())return plEdit(0);
  say('액자',['아직 비어 있는 액자다. 다음 달 노래가 걸릴 자리 같다.']);
}
async function plHome(){
  openM('<h3>🎵 플레이리스트</h3><p style="font-size:12px;opacity:.8">불러오는 중…</p>');
  await plLoad();
  openM(`<h3>🎵 주인장 추천 플레이리스트</h3>${adm('pl')}`+
    (PLERR?`<div class="cd">${esc(PLERR)}</div>`:PLS.length?PLS.map(p=>`<div class="xrow pick" onclick="plShow(${p.id})"><div><b>${esc(p.title)}</b><small style="display:block;opacity:.75">${plYm(p.ym)} · ${plSoon(p)?'🚧 준비중':`<span class="plcnt${p.id}">${plList(p).length}곡</span>`}</small></div><span>▶</span></div>`).join(''):'<div class="cd">아직 걸린 플레이리스트가 없어요.</div>')+
    (DB.admin()?'<div class="qbtn"><button class="xb" onclick="plEdit(0)">＋ 새 플레이리스트</button></div>':''));
}
const ytId=u=>((u||'').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#\s]*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/)||[])[1]||'';
const PV={p:null,i:-1,all:false,rep:0,yt:null,bg:false};
/* 재생목록 자동 매칭: 등록한 재생목록의 곡을 읽어 직접 넣은 곡 아래에 붙임 (API 키 불필요, 공개·일부 공개 목록만) */
const PLA={};   // 목록ID → {at,songs,err}
const plListId=p=>((p.url||'').match(/[?&]list=([\w-]+)/)||[])[1]||'';
const plNorm=s=>String(s||'').toLowerCase().replace(/[\s\W_]+/g,'');
function plList(p){
  const a=PLA[plListId(p)],out=p.songs.slice(),ids=new Set(p.songs.map(s=>ytId(s.u)).filter(Boolean)),tt=new Set(p.songs.map(s=>plNorm(s.t)));
  if(a)a.songs.forEach(s=>{if(!ids.has(ytId(s.u))&&!tt.has(plNorm(s.t))){ids.add(ytId(s.u));out.push(s)}});
  return out.slice(0,PL_MAX);
}
function plReadIds(list){
  return new Promise((ok,no)=>{
    const host=document.createElement('div');host.style='position:fixed;left:-9999px;top:0;width:200px;height:120px';host.innerHTML='<div></div>';document.body.append(host);
    let done=false,pl=null;const fin=(v,e)=>{if(done)return;done=true;try{pl&&pl.destroy()}catch(_){}host.remove();e?no(e):ok(v)};
    setTimeout(()=>fin(null,new Error('timeout')),9000);
    pl=new YT.Player(host.firstChild,{width:200,height:120,playerVars:{listType:'playlist',list},events:{
      onReady:e=>{const t0=Date.now(),tm=setInterval(()=>{const a=e.target.getPlaylist&&e.target.getPlaylist();if(a&&a.length){clearInterval(tm);fin(a)}else if(Date.now()-t0>7000){clearInterval(tm);fin(null,new Error('empty'))}},200)},
      onError:()=>fin(null,new Error('list'))}});
  });
}
async function plSongInfo(id){
  const r=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+id));
  if(!r.ok)throw new Error('oembed');const j=await r.json();
  return{a:String(j.author_name||'').replace(/\s*-\s*Topic$/i,''),t:String(j.title||id),u:'https://youtu.be/'+id,auto:1};
}
async function plSync(p,force){
  const list=plListId(p);if(!list)return;
  const c=PLA[list];if(c&&c.busy)return c.busy;if(c&&!force&&!c.err&&Date.now()-c.at<6e5)return;
  const work=(async()=>{
    try{await ytLoad();const ids=await plReadIds(list);
      const got=await Promise.allSettled(ids.slice(0,PL_MAX).map(plSongInfo));
      PLA[list]={at:Date.now(),songs:got.filter(x=>x.status=='fulfilled').map(x=>x.value)};
    }catch(e){PLA[list]={at:Date.now(),songs:[],err:1}}
    plRowsUpd(p);
  })();
  PLA[list]={...(c||{songs:[]}),busy:work};return work;
}
function plRowsHtml(p){
  const L=plList(p);
  return L.length?L.map((s,i)=>`<a class="xrow pick plsong" data-i="${i}" href="${esc(plSongUrl(s))}" target="_blank" rel="noopener" onclick="return plClick(${p.id},${i},this.href)"><span class="qn">${i+1}</span><span class="qt" style="font-weight:normal"><b>${esc(s.t)}</b>${s.a?' · '+esc(s.a):''}</span><span>${ytId(s.u)?'🎬':'▶'}</span></a>`).join(''):'<div class="cd">주인장이 곡을 고르는 중이에요. 🎧</div>';
}
function plBtnHtml(p){
  const u=plUrl(p.url),nV=plList(p).filter(s=>ytId(s.u)).length;
  return (nV?`<button class="xb" onclick="plAll(${p.id})">▶ 전체 듣기 (${nV}곡)</button><button class="xb" id="plRepB" onclick="plRepTog()"></button><button class="xb" onclick="plBg(${p.id})">🎧 BGM으로 계속 듣기</button>`:'')+(u?`<a class="xb" href="${esc(u)}" target="_blank" rel="noopener" onclick="return plOut(this.href)">YouTube Music에서 열기</a>`:'');
}
function plInfoHtml(p){
  const a=PLA[plListId(p)],st=!plListId(p)?'':a&&a.busy?' · 재생목록 불러오는 중…':a&&a.err?' · 재생목록을 읽지 못했어요(공개·일부 공개만 가능)':'';
  return `${plYm(p.ym)} · ${plList(p).length}곡${st} · 🎬 곡은 여기서 영상으로 재생돼요.`;
}
function plRowsUpd(p){
  const b=$('#plRows');if(b&&+b.dataset.id==p.id){b.innerHTML=plRowsHtml(p);$('#plBtns').innerHTML=plBtnHtml(p);$('#plInfo').textContent=plInfoHtml(p);plRepLbl();plMarkRow();kcPos()}
  document.querySelectorAll('.plcnt'+p.id).forEach(e=>e.textContent=plList(p).length+'곡');
}
function plMarkRow(){const on=PV.p&&PV.p.id==plShownId();document.querySelectorAll('.plsong').forEach(e=>e.style.borderColor=on&&+e.dataset.i==PV.i?'#fbbf24':'')}
function plShow(id){
  const p=PLS.find(x=>x.id==id);if(!p)return plHome();
  if(plSoon(p)&&!DB.admin())return openM(`<h3>🚧 준비중!</h3><div class="cd">${plYm(p.ym)} 플레이리스트는 주인장이 고르는 중이에요. ${+p.ym.slice(5)}월에 공개돼요. 🎧</div><div class="qbtn"><button class="xb" onclick="plHome()">◀ 목록으로</button></div>`);
  openM(`<h3>🎵 ${esc(p.title)}</h3><p id="plInfo" style="font-size:12px;opacity:.8;margin-bottom:6px"></p>
    <div id="ytBox" hidden><div id="plNow" style="font-weight:bold;font-size:13px"></div><div class="ytw" id="ytSlot"></div></div>
    <div class="qbtn" id="plBtns" style="margin-bottom:6px"></div>
    <div class="qbtn" id="plCtl" hidden style="margin-bottom:6px"><button class="xb" onclick="plToggle()">⏯ 재생/일시정지</button><button class="xb" onclick="plNext(true)">⏭ 다음 곡</button></div>
    <div id="plRows" data-id="${p.id}"></div>
    <div class="qbtn"><button class="xb" onclick="plHome()">◀ 목록으로</button>${DB.admin()?`<button class="xb" onclick="plEdit(${p.id})">수정</button><button class="xb r" onclick="plDelAsk(${p.id})">삭제</button>`:''}</div>`);
  plSync(p).then(()=>{}).catch(()=>{});
  plRowsUpd(p);plUi();
}
const plShownId=()=>{const b=$('#plRows');return b?+b.dataset.id:0};
function plUi(){
  const on=PV.p&&PV.p.id==plShownId(),L=PV.p?plList(PV.p):[],s=L[PV.i];
  const B=$('#ytBox'),C=$('#plCtl'),N=$('#plNow');
  if(B)B.hidden=!on;if(C)C.hidden=!on;if(N&&on&&s)N.textContent='♪ '+s.t+(s.a?' · '+s.a:'');
  if(on)plMarkRow();dockPos();bgmUi();
}
function dockPos(){
  const d=$('#ytDock');if(!d)return;
  if(!PV.p){d.style.display='none';d.className='';return}
  const slot=$('#ytSlot'),box=$('#ytBox');
  if(modal&&!lbOn()&&slot&&box&&!box.hidden){
    const r=slot.getBoundingClientRect(),m=$('.mb').getBoundingClientRect();
    d.className='';d.style.cssText=`display:block;z-index:10;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;clip-path:inset(${Math.max(0,m.top-r.top)}px 0 ${Math.max(0,r.bottom-m.bottom)}px 0)`;
    return;
  }
  d.style.cssText='';
  if(PV.bg){d.className='mini';d.style.display='block';bgmPlace()}
  else{d.className='';d.style.cssText='display:block;left:-9999px;top:0;width:200px;height:200px'}
}
/* BGM으로 계속 듣기: 창을 닫아도 작은 플레이어로 이어서 재생 */
function plBg(id){
  const p=PLS.find(x=>x.id==id);if(!p)return;
  if(!PV.p||PV.p.id!=id)plAll(id);
  if(!PV.p)return toast('영상이 있는 곡이 없어요.');
  PV.bg=true;PV.all=true;if(!PV.rep)PV.rep=1;
  closeM();toast('BGM으로 계속 재생해요. 🎧');bgmUi();
}
function sunoBgm(){
  if(!SUNO_TRACKS.length)return;
  sunoAll=true;if(!sunoRep)sunoRep=1;
  if(!sunoOpen()&&!sunoFileOn())sunoPlay(0);else sunoArm();
  if(!sunoOpen()&&!sunoFileOn())return;   // 창이 막혔거나 휴대폰 안내가 나온 경우
  SB.on=true;closeM();try{window.focus()}catch(e){}toast('BGM으로 계속 재생해요. 🎧');bgmUi();
}
const SB={on:false};
let bgmSmall=null;
function bgmUi(){
  const bar=$('#bgmBar');if(!bar)return;
  const yt=PV.p&&PV.bg,fl=SB.on&&sunoFileOn(),su=(SB.on&&sunoOpen())||fl,on=yt||su;
  bar.hidden=!on;document.body.classList.toggle('bgm-on',!!on);
  if(bgmSmall===null)bgmSmall=mobOn();
  const sm=on&&yt&&bgmSmall;document.body.classList.toggle('bgm-small',!!sm);
  if(on){$('#bgmName').textContent='♪ '+(npExt||'');$('#bgmP').hidden=!(yt||fl);$('#bgmMin').hidden=!yt;$('#bgmMin').textContent=bgmSmall?'⬆':'⬇'}
  bgmPlace();
}
function bgmMinTog(){bgmSmall=!bgmSmall;bgmUi();dockPos()}
function bgmPlace(){
  const bar=$('#bgmBar'),d=$('#ytDock'),c=$('#ctl');if(!bar||!c)return;
  if(mobOn()&&!modal){const b=Math.max(4,innerHeight-c.getBoundingClientRect().top+4)+'px';bar.style.bottom=b;if(d.classList.contains('mini'))d.style.bottom=b}
  else{bar.style.bottom='';if(d.classList.contains('mini'))d.style.bottom=''}
}
function bgmToggle(){if(PV.p)return plToggle();if(sunoFileOn())FA.paused?FA.play().catch(()=>{}):FA.pause()}
function bgmNext(){if(PV.p)plNext(true);else if(sunoOpen())sunoSkip();bgmUi()}
function bgmList(){if(PV.p&&PV.bg)plShow(PV.p.id);else showSuno()}
function bgmOff(){if(PV.p){PV.bg=false;plStop()}if(sunoOpen()||SB.on)sunoClose();SB.on=false;bgmUi();dockPos()}

function plRepLbl(){const r=$('#plRepB');if(r)r.textContent='🔁 반복: '+REP_L[PV.rep]}
function plRepTog(){PV.rep=(PV.rep+1)%3;plRepLbl()}
/* YouTube Music은 다른 사이트 안에 넣을 수 없어서 작은 창으로 엶. 막히면 새 탭 링크가 그대로 동작 */
function plOut(url){const w=window.open(url,'bsw_ytm','popup,width=1000,height=720');if(w){try{w.focus()}catch(e){}return false}return true}
function plClick(id,i,href){
  const p=PLS.find(x=>x.id==id),s=p&&plList(p)[i];
  if(s&&ytId(s.u)){PV.all=false;plPlay(p,i);return false}
  return plOut(href);
}
function plAll(id){const p=PLS.find(x=>x.id==id);if(!p)return;const i=plList(p).findIndex(s=>ytId(s.u));if(i<0)return;PV.all=true;plPlay(p,i)}
let ytReady=null;
function ytLoad(){return ytReady||(ytReady=new Promise((ok,no)=>{if(window.YT&&YT.Player)return ok();window.onYouTubeIframeAPIReady=ok;const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.onerror=()=>{ytReady=null;no(new Error('yt'))};document.head.append(s)}))}
async function plPlay(p,i){
  const s=plList(p)[i],id=ytId(s.u);if(!id)return;
  if(sunoOpen())sunoClose();SB.on=false;
  PV.p=p;PV.i=i;
  extOn(s.t+(s.a?' · '+s.a:''));plUi();
  if(PV.yt&&PV.yt.loadVideoById){PV.yt.loadVideoById(id);return}
  $('#ytDock').innerHTML='<div id="ytP"></div>';
  try{await ytLoad()}catch(e){toast('YouTube 플레이어를 불러오지 못했어요.');PV.bg=false;return plStop()}
  if(!$('#ytP')||!PV.p)return;
  const cur=ytId(plList(PV.p)[PV.i].u);
  const vars={playsinline:1,rel:0,autoplay:1};if(/^https?:/.test(location.origin))vars.origin=location.origin;
  PV.yt=new YT.Player('ytP',{videoId:cur,playerVars:vars,events:{
    onReady:e=>e.target.playVideo(),
    onStateChange:e=>{if(e.data===0)plNext(false)},
    onError:()=>{const c=PV.p&&plList(PV.p)[PV.i];toast((c?c.t+': ':'')+'사이트에서 재생할 수 없는 영상이에요.');plNext(false,true)}
  }});
  dockPos();
}
function plNext(manual,failed){
  const p=PV.p;if(!p)return;const L=plList(p),n=L.length,has=k=>ytId(L[k].u);
  if(!manual&&!failed&&PV.rep==2)return plPlay(p,PV.i);
  if(!manual&&!PV.all&&!PV.rep)return;
  for(let k=1;k<=n;k++){const j=PV.i+k;
    if(j>=n&&!manual&&PV.rep!=1)break;
    if(has(j%n)&&(j%n!=PV.i||!failed))return plPlay(p,j%n);}
  PV.all=false;
}
function plToggle(){const y=PV.yt;if(!y||!y.getPlayerState)return;y.getPlayerState()==1?y.pauseVideo():y.playVideo()}
function plStop(){if(!PV.yt&&!PV.p)return;try{PV.yt&&PV.yt.destroy&&PV.yt.destroy()}catch(e){}PV.yt=null;PV.p=null;PV.i=-1;PV.all=false;PV.bg=false;$('#ytDock').innerHTML='';dockPos();if(sunoOn&&!sunoOpen()&&!sunoFileOn())extOff();bgmUi()}
function plEdit(id){
  if(!DB.admin())return toast('운영자만 할 수 있어요.');
  const p=PLS.find(x=>x.id==id),now=jejuYm();
  const lines=p?p.songs.map(s=>(s.a?s.a+' - ':'')+s.t+(s.u?' | '+s.u:'')).join('\n'):'';
  openM(`<h3>🎵 ${p?'플레이리스트 수정':'새 플레이리스트'}</h3>
  <input id="ply" class="xin" type="month" value="${esc(p?p.ym:now)}">
  <input id="plt" class="xin" maxlength="60" placeholder="제목" value="${esc(p?p.title:plYm(now)+' 주인장 추천 플레이리스트')}" style="margin-top:6px">
  <input id="plu" class="xin" type="url" placeholder="YouTube Music 재생목록 공유 링크 (곡 자동 추가, 공개·일부 공개)" value="${esc(p&&p.url||'')}" style="margin-top:6px">
  <textarea id="pls" class="xin" rows="10" placeholder="한 줄에 한 곡, 최대 30곡&#10;가수 - 곡명&#10;가수 - 곡명 | YouTube 영상 링크(선택)" style="margin-top:6px">${esc(lines)}</textarea>
  <div class="qbtn"><button class="xb" onclick="plSave(${p?p.id:0})">저장</button><button class="xb r" onclick="${p?`plShow(${p.id})`:'plHome()'}">취소</button></div>`);
}
function jejuYm(){return new Date(Date.now()+9*36e5).toISOString().slice(0,7)}
function plParse(txt){
  return txt.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{
    let u='';const b=l.lastIndexOf('|');if(b>=0){u=l.slice(b+1).trim();l=l.slice(0,b).trim()}
    const d=l.indexOf(' - ');
    return{a:d>=0?l.slice(0,d).trim():'',t:(d>=0?l.slice(d+3):l).trim(),u:plUrl(u)};
  }).filter(s=>s.t);
}
async function plSave(id){
  const ym=$('#ply').value,title=$('#plt').value.trim(),url=$('#plu').value.trim(),songs=plParse($('#pls').value);
  if(!ym)return toast('연도와 월을 골라 주세요.');
  if(!title)return toast('제목을 입력해 주세요.');
  if(url&&!plUrl(url))return toast('링크는 https:// 로 시작해야 해요.');
  if(songs.length>PL_MAX)return toast('한 플레이리스트는 '+PL_MAX+'곡까지예요. 지금 '+songs.length+'곡이에요.');
  const rec={ym,title,url:url||null,songs};
  try{
    if(id)await DB.plSet(id,rec);else await DB.plAdd(rec);
    await plLoad();toast('저장했어요.');
    const p=PLS.find(x=>x.ym==ym);p?plShow(p.id):plHome();
  }catch(e){toast(/duplicate|23505/.test(e.message)?'그 달의 플레이리스트가 이미 있어요.':dbErr(e))}
}
function plDelAsk(id){
  openM(`<h3>🗑 플레이리스트 삭제</h3><p style="font-size:13px">이 플레이리스트를 벽에서 내릴까요? 되돌릴 수 없어요.</p><div class="qbtn"><button class="xb r" onclick="plDelGo(${id})">삭제</button><button class="xb" onclick="plShow(${id})">취소</button></div>`);
}
async function plDelGo(id){try{await DB.plDel(id);toast('삭제했어요.');plHome()}catch(e){toast(dbErr(e))}}

/* ===== Suno 노래 플레이어 =====
   곡마다 한 줄씩 적습니다. sec(곡 길이, 초)를 적어야 전체 듣기·반복 때 다음 곡으로 넘어갑니다.
   Suno 링크) {title:'곡 제목',suno:'https://suno.com/song/곡ID',sec:180,note:'한 줄 소개'},
   음원 파일) {title:'곡 제목',file:'music/song1.mp3',note:'한 줄 소개'}, */
const SUNO_ARTIST='studio_bs';
const SUNO_TRACKS=[
  {title:'Level Up!',suno:'https://suno.com/song/c14dc537-f927-4f18-b736-ac127fa1c848',sec:165},
  {title:'fingerstyle bgm',suno:'https://suno.com/song/98bfc938-2ff5-4911-8ebb-29e3119442e8',sec:82},
  {title:'warm',suno:'https://suno.com/song/498a9b29-fa5f-43a5-bd4b-ab34eb000fb7',sec:207},
];
const REP_L=['끔','전체','한 곡'];
let sunoI=-1,sunoWin=null,sunoTm=null,sunoEnd=null,sunoAll=false,sunoRep=0,sunoAt=0;
const sunoId=u=>((u||'').match(/suno\.com\/(?:song|embed)\/([0-9a-fA-F-]{36})/)||[])[1]||'';
const sunoFileOn=()=>{const t=SUNO_TRACKS[sunoI];return !!(t&&t.file)};
const FA=new Audio();FA.preload='none';
FA.addEventListener('play',()=>{extOn(sunoTitle());bgmUi()});
FA.addEventListener('pause',()=>{if(sunoFileOn()&&!FA.ended)extOff()});
FA.addEventListener('ended',()=>{sunoAdvance();if(FA.paused)extOff()});
FA.addEventListener('error',()=>{if(FA.getAttribute('src'))sunoErr()});
FA.addEventListener('timeupdate',()=>{const s=$('#sunoSeek');if(s&&FA.duration)s.value=FA.currentTime/FA.duration*1000});
const sunoOpen=()=>!!(sunoWin&&!sunoWin.closed);
function extOn(title){sunoOn=true;npExt=title;clearInterval(mt);npUpdate()}
function extOff(){sunoOn=false;npExt='';music()}
function sunoStop(){
  if(!SB.on&&sunoFileOn())FA.pause();
  if(!PV.bg)plStop();else dockPos();
  if(PV.p||sunoOpen()||(SB.on&&sunoFileOn()))return;   // Suno 창이 열려 있으면 노래가 계속되므로 게임 음악은 계속 쉼
  if(sunoOn)extOff();
}
function sunoWatch(){clearInterval(sunoTm);sunoTm=setInterval(()=>{if(sunoOpen())return;clearInterval(sunoTm);clearTimeout(sunoEnd);sunoWin=null;sunoAll=false;sunoI=-1;SB.on=false;extOff();sunoMark();bgmUi()},1000)}
function sunoArm(){
  clearTimeout(sunoEnd);const t=SUNO_TRACKS[sunoI];
  if(!t||!t.sec||!sunoOpen()||(!sunoAll&&!sunoRep))return;
  sunoEnd=setTimeout(sunoAdvance,(Math.max(1,t.sec-(Date.now()-sunoAt)/1000)+2)*1000);
}
function sunoNextI(){
  const n=SUNO_TRACKS.length;
  if(sunoRep==2)return sunoI;
  if(sunoI+1<n&&(sunoAll||sunoRep==1))return sunoI+1;
  return sunoRep==1?0:-1;
}
function sunoAdvance(){const n=sunoNextI();if(n<0){sunoAll=false;sunoMark();return}sunoPlay(n)}
function sunoMark(){
  document.querySelectorAll('.sunot').forEach((e,k)=>e.style.borderColor=k==sunoI?'#fbbf24':'');
  const t=SUNO_TRACKS[sunoI],n=$('#sunoNow'),r=$('#sunoRepB'),x=$('#sunoCtl');
  if(n)n.textContent=t?'♪ '+t.title:'곡을 골라 주세요';
  if(r)r.textContent='🔁 반복: '+REP_L[sunoRep];
  if(x)x.hidden=!t;
  const sk=$('#sunoSeek'),pp=$('#sunoPP');if(sk)sk.hidden=!(t&&t.file);if(pp)pp.hidden=!(t&&t.file);
}
function showSuno(){
  if(!sunoOpen())sunoI=-1;
  openM('<h3>🎧 보성의 노래</h3><p style="font-size:12px;opacity:.8;margin-bottom:8px">주인장이 Suno AI로 만든 노래예요. 노래는 작은 창에서 나와요.</p>'+
    (SUNO_TRACKS.length?`<div id="sunoNow" style="font-weight:bold;font-size:13px;margin-bottom:6px"></div>
    <input id="sunoSeek" type="range" min="0" max="1000" value="0" hidden style="width:100%" oninput="if(FA.duration)FA.currentTime=this.value/1000*FA.duration">
    <div class="qbtn" style="margin-bottom:6px"><button class="xb" onclick="sunoPlayAll()">▶ 전체 듣기</button><button class="xb" id="sunoRepB" onclick="sunoRepTog()"></button><button class="xb" onclick="sunoBgm()">🎧 BGM으로 계속 듣기</button></div>
    <div class="qbtn" id="sunoCtl" style="margin-bottom:6px" hidden><button class="xb" id="sunoPP" hidden onclick="bgmToggle()">⏯ 재생/일시정지</button><button class="xb" onclick="sunoSkip()">⏭ 다음 곡</button><button class="xb r" onclick="sunoClose()">⏹ 끄기</button></div>
    <div id="sunoL" style="margin:6px 0"></div><div id="sunoE" class="qerr" hidden></div>`+
    SUNO_TRACKS.map((t,i)=>`<div class="xrow pick sunot" onclick="sunoPick(${i})"><span class="qn">${i+1}</span><span class="qt" style="font-weight:normal"><b>${esc(t.title)}</b>${t.note?' · '+esc(t.note):''}</span><span>▶</span></div>`).join('')
    :'<div class="cd">주인장이 노래를 준비하고 있어요. 🎶</div>'));
  sunoMark();
}
const sunoTitle=()=>{const t=SUNO_TRACKS[sunoI];return t?t.title+' · '+SUNO_ARTIST:''};
function sunoPick(i){sunoAll=false;sunoPlay(i)}
function sunoPlayAll(){if(!SUNO_TRACKS.length)return;sunoAll=true;sunoPlay(0)}
function sunoSkip(){if(!SUNO_TRACKS.length)return;sunoPlay((sunoI+1)%SUNO_TRACKS.length)}
function sunoRepTog(){sunoRep=(sunoRep+1)%3;sunoMark();sunoArm()}
function sunoClose(){clearTimeout(sunoEnd);const wasF=sunoFileOn();sunoAll=false;if(wasF)FA.pause();sunoI=-1;if(sunoOpen())try{sunoWin.close()}catch(e){}sunoWin=null;SB.on=false;clearInterval(sunoTm);if(!PV.p)extOff();sunoMark();bgmUi()}
const inApp=/KAKAOTALK|NAVER\(|FBAN|FBAV|Instagram|Line\//i.test(navigator.userAgent);
const isPhone=()=>matchMedia('(pointer:coarse)').matches;
function sunoPlay(i){
  const t=SUNO_TRACKS[i];if(!t)return;
  sunoI=i;const E=$('#sunoE'),L=$('#sunoL');if(E)E.hidden=true;if(L)L.innerHTML='';sunoMark();
  if(t.suno){
    if(PV.p){PV.bg=false;plStop()}
    FA.pause();
    const id=sunoId(t.suno),link=/^https:\/\/[^\s"'<>]+$/.test(t.suno)?t.suno:'';
    if(!id){if(E){E.textContent='이 링크로는 바로 재생할 수 없어요. suno.com/song/… 주소가 필요해요.';E.hidden=false}if(L&&link)L.innerHTML=`<a class="xb" href="${esc(link)}" target="_blank" rel="noopener">Suno에서 열기</a>`;return}
    // Suno 플레이어는 다른 사이트 안에 띄우면 빈 화면이 되므로 별도 창으로 엶
    const url='https://suno.com/embed/'+id+'?autoplay=1';
    if(isPhone()&&!sunoOpen()&&L&&!L.dataset.ok){
      // 휴대폰에서는 작은 창이 화면 전체를 덮으므로 먼저 안내
      L.innerHTML=`<p style="font-size:12px;margin-bottom:6px">${inApp?'이 앱 안에서는 Suno 창이 화면을 덮고, 닫으면 음악도 꺼져요. 크롬이나 삼성 인터넷으로 사이트를 열면 탭을 옮겨 들을 수 있어요.':'Suno 창이 새 탭으로 열려요. 게임 탭으로 돌아와도 음악은 그 탭에서 계속 나와요.'}</p><a class="xb" href="${esc(url)}" target="bsw_suno" rel="opener" onclick="return sunoTab(this.href)">🎧 Suno로 듣기</a>`;
      return;
    }
    if(sunoOpen())sunoWin.location.href=url;
    else sunoWin=window.open(url,'bsw_suno','popup,width=560,height=340');
    sunoAfter(url);
    return;
  }
  if(sunoOpen())try{sunoWin.close()}catch(e){}
  FA.src=t.file;FA.play().catch(()=>{});bgmUi();
}
function sunoTab(url){sunoWin=window.open(url,'bsw_suno');if(sunoWin){SB.on=true;sunoAfter(url);return false}return true}
function sunoAfter(url){
  const E=$('#sunoE'),L=$('#sunoL');
  if(sunoOpen()){
    sunoAt=Date.now();extOn(sunoTitle());sunoWatch();sunoArm();bgmUi();
    if(L)L.innerHTML='<p style="font-size:11px;opacity:.75;margin-bottom:6px">소리가 안 나면 Suno 창의 재생 버튼을 눌러 주세요. 창을 닫으면 게임 음악이 다시 나와요.</p>';
  }else if(E){
    E.textContent='브라우저가 창을 막았어요. 아래 버튼으로 열어 주세요.';E.hidden=false;
    L.innerHTML=`<a class="xb" href="${esc(url)}" target="_blank" rel="noopener">🎧 플레이어 열기</a>`;
  }
}
function sunoErr(){const t=SUNO_TRACKS[sunoI];if(!t||!t.file)return;extOff();const e=$('#sunoE');e.textContent='음원을 찾지 못했어요: '+t.file;e.hidden=false}

/* ===== 멘사 연구소: IQ 테스트 (외부 사이트를 작은 창으로) ===== */
const IQ_URL='https://kor.wwiqtest.com/iq-test/';
function showIq(){
  openM(`<h3>🧠 IQ 테스트</h3><div class="cd">외부 사이트(WW IQ TEST)의 온라인 테스트가 작은 창으로 열려요. 30문항, 제한 시간은 약 20분이에요.</div>
  <p style="font-size:12px;opacity:.8;margin:8px 0">이 사이트에서 운영하는 테스트가 아니에요. 결과 확인에 비용이 드는지는 그 사이트에서 먼저 확인해 주세요.</p>
  <div class="adbtn"><a class="xb" href="${IQ_URL}" target="_blank" rel="noopener" onclick="return iqOpen(this.href)">🧠 테스트 시작하기</a></div>`);
}
function iqOpen(url){
  const w=window.open(url,'bsw_iq','popup,width=1000,height=760');
  if(w){try{w.focus()}catch(e){}return false}
  return true;   // 작은 창이 막히면 새 탭으로 열림
}

/* ===== 체육관 게시판과 벽: 날짜 기준 5년이 지나면 게시판에서 벽으로 자동 이동 ===== */
const RECORDS=[
  {d:'2019-11-10',i:'🍊',t:'2019 제주감귤국제마라톤',s:'10km · 01:22:38.32',img:'certs/marathon-2019.jpg'},
  {d:'2016-10-15',i:'🏃',t:'제9회 아름다운제주국제마라톤대회',s:'하프 · 2:27:11.23',img:'certs/marathon-2016-10.jpg'},
  {d:'2016-05-29',i:'🏃',t:'제21회 제주국제관광마라톤축제',s:'하프 · 02:54:26.14',img:'certs/marathon-2016-05.jpg'},
  {d:'2013-06-22',i:'🏃',t:'제2회 국민대통합 마라톤 대회',s:'하프 · 01:58:21.05',img:'certs/marathon-2013.jpg'},
  {d:'2011-12-10',i:'🎳',t:'제30회 제주특별자치도볼링협회장기 전도볼링대회',s:'대학부 남자 2인조전 3위',img:'certs/bowling-2011.jpg'}
];
const recNew=r=>{const n=new Date(Date.now()+9*36e5),e=new Date(r.d+'T00:00:00Z');e.setUTCFullYear(e.getUTCFullYear()+5);return n<e};
const recCard=r=>`<div class="cd"><b>${r.i} ${esc(r.t)}</b><small>${esc(r.s)} · ${r.d.replace(/-/g,'.')}</small>${r.img?`<div style="margin-top:6px"><button class="xb" onclick="certOpen('${esc(r.img)}','${esc(r.t)}')">📄 증명서 보기</button></div>`:''}</div>`;
function certOpen(src,alt){const i=new Image();i.onload=()=>lbOpen(src,alt);i.onerror=()=>toast('증명서 이미지를 준비하고 있어요.');i.src=src}
/* ===== 오락실 새 게임 ===== */
const AG_G={hoop:{n:'농구 슈팅',ic:'🏀',c:'#ea580c',s:'농구',d:'게이지가 초록 칸에 올 때 누르면 들어가요. 45초 승부, 연속으로 넣을수록 점수가 커져요.'},bat:{n:'야구 배팅',ic:'⚾',c:'#16a34a',s:'야구',d:'공이 타석에 올 때 누르세요. 12구의 비거리를 모두 더해요. 100m를 넘기면 홈런!'},tank:{n:'귤 대포 포격전',ic:'💣',c:'#b45309',s:'포격전',pad:1,d:'←→ 각도, ↑↓ 힘, 스페이스나 A로 발사. 바람을 보고 쏘세요. 이길수록 상대가 강해져요.'},whack:{n:'귤 잡기',ic:'🔨',c:'#65a30d',s:'귤 잡기',d:'올라온 귤을 누르세요. 황금귤은 점수가 크고, 돌하르방을 때리면 감점! 30초 동안 해요.'},rhythm:{n:'리듬 탭',ic:'🥁',c:'#db2777',s:'리듬',d:'떨어지는 노트가 선에 닿을 때 해당 칸을 누르세요. 키보드는 D F J K예요.'},race:{n:'해안도로 레이싱',ic:'🏎',c:'#0284c7',s:'레이싱',pad:1,d:'←→로 차를 피하고 귤을 모으세요. 세 번 부딪히면 끝나요. 갈수록 빨라져요.'},snake:{n:'스네이크',ic:'🐍',c:'#15803d',s:'스네이크',pad:1,d:'방향키나 버튼으로 움직여 귤을 먹으세요. 벽이나 몸에 부딪히면 끝나요.'},brick:{n:'벽돌깨기',ic:'🧱',c:'#7c3aed',s:'벽돌깨기',pad:1,d:'←→나 화면을 끌어 받침을 움직이세요. 누르면 공이 출발해요. 공 3개로 해요.'},punch:{n:'펀치 기계',ic:'🥊',c:'#dc2626',s:'펀치',d:'3초 동안 연타한 뒤, 바늘이 가운데 올 때 한 번 더! 세 번 친 힘을 더해요.'}};
const AG={g:null,raf:0,S:null,keys:{},press:{},tap:null,pt:null,last:0,val:null};
const agBest=g=>{try{const v=localStorage.getItem('bsw_mg_'+g);return v==null?null:+v}catch(e){return null}};
function agStop(){cancelAnimationFrame(AG.raf);AG.raf=0;AG.S=null;AG.keys={};AG.press={};AG.tap=null;AG.pt=null}
function agKey(e){if(!AG.S||!$('#agC')||e.key=='Escape'||/^(INPUT|TEXTAREA)$/.test((e.target||{}).tagName||''))return;if(e.type=='keydown'){AG.keys[e.key]=1;if(!e.repeat)AG.press[e.key]=1}else delete AG.keys[e.key];e.preventDefault();e.stopImmediatePropagation()}
window.addEventListener('keydown',agKey,true);window.addEventListener('keyup',agKey,true);
function showGameList(){agStop();openM('<h3>🕹 오락실 게임</h3><div class="qbtn" style="justify-content:center;flex-wrap:wrap">'+Object.keys(AG_G).map(k=>`<button class="xb" onclick="showGame('${k}')">${AG_G[k].ic} ${esc(AG_G[k].n)}</button>`).join('')+'</div>')}
function showGame(g){agStop();AG.g=g;AG.val=null;const G=AG_G[g],b=agBest(g),P=(k,l)=>`<button class="xb" style="flex:1;min-height:42px;touch-action:none;user-select:none" onpointerdown="event.preventDefault();AG.keys['${k}']=1;AG.press['${k}']=1" onpointerup="delete AG.keys['${k}']" onpointerleave="delete AG.keys['${k}']">${l}</button>`;
 openM(`<h3>${G.ic} ${esc(G.n)}</h3><p style="font-size:12px;opacity:.85;margin:4px 0 6px">${esc(G.d)}</p><canvas id="agC" width="360" height="420" style="display:block;margin:0 auto;width:100%;max-width:340px;border-radius:8px;touch-action:none;background:#111"></canvas>${G.pad?`<div class="xrow" style="margin:6px auto;max-width:340px;gap:4px;background:none;padding:0">${P('ArrowLeft','◀')}${P('ArrowUp','▲')}${P('ArrowDown','▼')}${P('ArrowRight','▶')}${P(' ','A')}</div>`:''}<div id="agRes" style="text-align:center;margin:8px 0;font-size:13px">${b!=null?'내 최고 기록: '+b.toLocaleString('ko-KR')+'점':'첫 기록을 남겨 보세요!'}</div><div id="agSave" hidden style="text-align:center"><input id="agName" class="xin" maxlength="12" placeholder="순위에 남길 이름" onkeydown="event.stopPropagation();if(event.key=='Enter')agSend()"><button class="xb" style="margin-left:4px" onclick="agSend()">등록</button></div><div class="qform" style="margin-top:8px"><b>🏆 ${esc(G.n)} TOP 10</b><div id="agRank" style="margin-top:4px"><small>불러오는 중…</small></div></div>`);
 const C=$('#agC'),pos=e=>{const r=C.getBoundingClientRect();return{x:(e.clientX-r.left)*360/r.width,y:(e.clientY-r.top)*420/r.height}};C.onpointerdown=e=>{e.preventDefault();const q=pos(e);AG.tap=q;AG.pt=q};C.onpointermove=e=>{if(AG.pt||e.pointerType=='mouse')AG.pt=pos(e)};C.onpointerup=()=>{if(C&&AG.S&&!/brick|race/.test(AG.g))AG.pt=null};
 AG.S={st:'idle'};AG.last=performance.now();agRank();AG.raf=requestAnimationFrame(agLoop)}
function agLoop(t){const C=$('#agC');if(!AG.S||!C){agStop();return}const dt=Math.min(.05,(t-AG.last)/1000);AG.last=t;const X=C.getContext('2d'),S=AG.S,go=AG.tap||AG.press[' ']||AG.press.Enter;X.save();
 if(S.st=='play'){try{AG_STEP[AG.g](S,dt,X)}catch(e){console.error(e);agEnd(S.score||0)}}
 else{if(S.last)S.last(X);else{X.fillStyle=AG_G[AG.g].c;X.fillRect(0,0,360,420);X.fillStyle='#0003';for(let i=0;i<9;i++)X.fillRect(0,i*48,360,24)}X.fillStyle='#000a';X.fillRect(0,130,360,150);X.fillStyle='#fff';X.textAlign='center';X.font='bold 26px sans-serif';X.fillText(S.st=='over'?S.score.toLocaleString('ko-KR')+'점':AG_G[AG.g].ic+' '+AG_G[AG.g].n,180,190);X.font='15px sans-serif';X.fillText(S.st=='over'?(S.msg||'게임 끝!'):'눌러서 시작',180,222);if(S.st=='over')X.fillText('누르면 다시 시작',180,250);if(go&&(S.st=='idle'||performance.now()-S.at>700)){const N=AG_INIT[AG.g]();N.st='play';N.score=0;AG.S=N;AG.tap=null;AG.press={};X.restore();AG.raf=requestAnimationFrame(agLoop);return}}
 X.restore();AG.tap=null;AG.press={};AG.raf=requestAnimationFrame(agLoop)}
function agEnd(score,msg){const S=AG.S,C=$('#agC');if(!S||S.st!='play')return;score=Math.max(0,Math.round(score));const img=document.createElement('canvas');img.width=360;img.height=420;if(C)img.getContext('2d').drawImage(C,0,0);AG.S={st:'over',score,msg,at:performance.now(),last:X=>X.drawImage(img,0,0)};const b=agBest(AG.g);let nw=false;if(score>0&&(b==null||score>b)){nw=true;try{localStorage.setItem('bsw_mg_'+AG.g,score)}catch(e){}}const R=$('#agRes');if(R)R.textContent=(nw?'🎉 새 기록! ':'')+score.toLocaleString('ko-KR')+'점';if(score>0){AG.val=score;const s=$('#agSave');if(s)s.hidden=false;const i=$('#agName');if(i&&!i.value){try{i.value=localStorage.getItem('bsw_mg_name')||''}catch(e){}}}sfx('s')}
async function agRank(){const g=AG.g;try{const L=await DB.rpc('arcade_top',{p_game:g});if(AG.g!=g||!$('#agRank'))return;$('#agRank').innerHTML=L.length?L.map((r,i)=>`<div class="xrow" style="margin:2px 0;padding:3px 8px"><span>${i+1}. ${esc(r.name)}</span><b>${Number(r.val).toLocaleString('ko-KR')}점</b></div>`).join(''):'<small style="opacity:.7">아직 기록이 없어요. 1등 해 보세요!</small>'}catch(e){const E=$('#agRank');if(E)E.innerHTML='<small style="opacity:.7">순위 서버 준비 중이에요. 내 최고 기록은 이 기기에 저장돼요.</small>'}}
async function agSend(){if(AG.val==null)return;const i=$('#agName'),n=(i&&i.value||'').trim();if(!n)return toast('이름을 적어 주세요.');try{localStorage.setItem('bsw_mg_name',n)}catch(e){}try{const r=await DB.rpc('arcade_add',{p_game:AG.g,p_name:n,p_val:AG.val});if(!r||!r.ok)return toast(r&&r.err=='busy'?'잠시 뒤에 다시 등록해 주세요.':'기록을 등록하지 못했어요.');AG.val=null;const s=$('#agSave');if(s)s.hidden=true;toast('순위에 등록했어요! 🏆');agRank()}catch(e){toast('순위 서버 준비 중이에요.')}}
const agR=(X,c,x,y,w,h)=>{X.fillStyle=c;X.fillRect(x,y,w,h)},agO=(X,c,x,y,r)=>{X.fillStyle=c;X.beginPath();X.arc(x,y,r,0,7);X.fill()},agT=(X,c,s,x,y,z=14,al='left')=>{X.fillStyle=c;X.font='bold '+z+'px sans-serif';X.textAlign=al;X.fillText(s,x,y)},agOr=(X,x,y,r)=>{agO(X,'#f97316',x,y,r);agO(X,'#fdba74',x-r*.3,y-r*.3,r*.3);agR(X,'#15803d',x-1,y-r-2,3,4)};
const AG_INIT={
 hoop:()=>({t:45,combo:0,ph:0,ball:null,flash:0}),
 bat:()=>({n:12,z:-1,wait:1,msg:'',fly:0,sw:0,dur:.9,brk:0,hits:0,dist:0}),
 tank:()=>{const S={lvl:1,hp:100,turn:'p',a:45,p:60,shot:null,boom:null,msg:'내 차례'};agTankNew(S);return S},
 whack:()=>({t:30,cells:Array(9).fill(null),sp:0,fx:[]}),
 rhythm:()=>{const N=[];let t=1.5,i=0;const B=60/112/2;while(t<41){if(Math.random()<.62||i%4==0)N.push({t,l:Math.random()*4|0,n:[0,2,4,7,9,12][Math.random()*6|0],hit:0});t+=B;i++}return{t:0,N,combo:0,msg:'',mt:0,fl:[0,0,0,0]}},
 race:()=>({x:180,d:0,v:170,O:[],sp:.6,life:3,inv:0,sc:0,bonus:0}),
 snake:()=>({B:[[8,10],[7,10],[6,10]],dir:[1,0],nx:[1,0],tk:0,step:.17,food:[13,10]}),
 brick:()=>{const S={x:180,bx:180,by:370,vx:0,vy:0,on:false,life:3,lvl:1,K:[]};agBrickNew(S);return S},
 punch:()=>({rnd:0,ph:'mash',t:3,n:0,nd:0,dirn:1,last:[],anim:0,sum:0})
};
function agTankNew(S){const a=30+Math.random()*30,b=.012+Math.random()*.012,c=Math.random()*6;S.G=[];for(let x=0;x<360;x++)S.G[x]=300+Math.sin(x*b+c)*a+Math.sin(x*.05+c)*7;S.cx=300+Math.random()*30|0;S.px=30+Math.random()*30|0;S.chp=80+S.lvl*20;S.wind=Math.round((Math.random()-.5)*16)/2;S.turn='p';S.shot=null}
function agBrickNew(S){S.K=[];const C=['#ef4444','#f97316','#eab308','#22c55e','#0ea5e9','#a855f7'];for(let r=0;r<Math.min(6,3+S.lvl);r++)for(let i=0;i<8;i++)S.K.push({x:8+i*43.5,y:44+r*20,c:C[r],on:1});S.on=false}
const AG_STEP={
 hoop(S,dt,X){S.t-=dt;if(S.t<=0)return agEnd(S.score,'최종 점수');S.ph+=dt*(2.5+S.score/70);const g=.5+.5*Math.sin(S.ph),w=Math.max(.045,.13-S.combo*.008),c=.72,mv=S.score>=20,hx=mv?180+Math.sin(S.t*1.3)*90:180;if((AG.tap||AG.press[' '])&&!S.ball){S.ball={k:0,ok:Math.abs(g-c)<w,hx,tx:hx+(g-c)*260};sfx('t')}if(S.ball){const q=S.ball;q.k+=dt/.62;if(q.k>=1){if(q.ok){S.combo++;S.score+=2+Math.min(S.combo-1,4)+(mv?1:0);S.flash=.3;tone(12,.12,'square',.05)}else{S.combo=0;tone(-5,.12,'sawtooth',.04)}S.ball=null}}S.flash=Math.max(0,S.flash-dt);
  agR(X,'#7c2d12',0,0,360,420);agR(X,'#c2763a',0,200,360,220);for(let i=0;i<8;i++)agR(X,'#b56a31',0,200+i*28,360,2);X.strokeStyle='#fff';X.lineWidth=3;X.beginPath();X.arc(180,420,120,Math.PI,0);X.stroke();agR(X,'#f8fafc',hx-44,50,88,56);X.strokeStyle='#ef4444';X.strokeRect(hx-18,70,36,28);agR(X,'#ef4444',hx-22,104,44,5);X.strokeStyle=S.flash?'#fde047':'#e2e8f0';X.lineWidth=1;for(let i=0;i<5;i++){X.beginPath();X.moveTo(hx-20+i*10,109);X.lineTo(hx-14+i*7,135);X.stroke()}
  let bx=180,by=375,br=20;if(S.ball){const q=S.ball;bx=180+(q.tx-180)*q.k;by=375+(108-375)*q.k-140*Math.sin(Math.PI*q.k);br=20-8*q.k}agO(X,'#ea580c',bx,by,br);X.strokeStyle='#7c2d12';X.lineWidth=2;X.beginPath();X.moveTo(bx-br,by);X.lineTo(bx+br,by);X.moveTo(bx,by-br);X.lineTo(bx,by+br);X.stroke();
  agR(X,'#111827',326,150,22,240);agR(X,'#22c55e',326,150+240*(1-c-w),22,240*2*w);agR(X,'#fff',322,150+240*(1-g)-2,30,4);agT(X,'#fff','⏱ '+Math.ceil(S.t),12,28,20);agT(X,'#fde047',S.score+'점',180,28,20,'center');if(S.combo>1)agT(X,'#fff',S.combo+' 연속!',12,56)},
 bat(S,dt,X){agR(X,'#166534',0,0,360,420);agR(X,'#15803d',0,0,360,70);agR(X,'#a16207',110,70,140,350);agO(X,'#b45309',180,120,28);agO(X,'#92400e',180,120,8);agR(X,'#f8fafc',160,370,40,8);
  if(S.fly>0){S.fly-=dt}if(S.z<0&&S.fly<=0){S.wait-=dt;if(S.wait<=0){if(S.n<=0)return agEnd(S.score,'총 비거리');S.n--;S.z=0;S.dur=.55+Math.random()*.55;S.brk=(Math.random()-.5)*50;S.sw=0;S.swung=0;S.msg=S.dur<.7?'직구!':S.dur>.95?'느린 공…':''}}
  S.sw=Math.max(0,S.sw-dt*5);if((AG.tap||AG.press[' '])&&!S.swung&&S.fly<=0){S.sw=1;if(S.z>=0){S.swung=1;const D=Math.abs(S.z-.93);if(D<.15){const q=1-D/.15,dist=Math.round(35+q*105+Math.random()*8);S.score+=dist;S.dist=dist;S.hits++;S.msg=dist>=100?'🎉 홈런! '+dist+'m':dist+'m 안타';S.z=-1;S.fly=1;S.wait=.5;S.hitT=1;tone(dist>=100?16:9,.18,'square',.06)}else{S.msg='헛스윙!';tone(-7,.1,'sawtooth',.04)}}}
  if(S.z>=0){S.z+=dt/S.dur;const y=125+S.z*245,x=180+Math.sin(S.z*Math.PI)*S.brk;agO(X,'#00000040',x+3,y+4,4+S.z*7);agO(X,'#fff',x,y,4+S.z*7);if(S.z>1.15){if(!S.swung)S.msg='스트라이크';S.z=-1;S.wait=.7}}
  if(S.fly>0){const k=1-S.fly;agO(X,'#fff',180+(S.dist%2?1:-1)*k*90,350-k*340,8-k*6)}
  agR(X,'#334155',178,104,10,20);agO(X,'#fcd34d',183,98,7);agR(X,'#2563eb',226,340,18,38);agO(X,'#fcd34d',235,330,10);agR(X,'#1e3a8a',225,322,20,6);X.save();X.translate(226,352);X.rotate(S.sw>0?(-.5-(1-S.sw)*2.6):.9);agR(X,'#92400e',-3,-46,6,46);X.restore();
  agT(X,'#fff','남은 공 '+S.n,12,28,16);agT(X,'#fde047',S.score+'m',348,28,20,'right');if(S.msg)agT(X,'#fff',S.msg,180,60,20,'center')},
 tank(S,dt,X){const gy=x=>S.G[Math.max(0,Math.min(359,x|0))],py=gy(S.px),cy=gy(S.cx);if(S.turn=='p'&&!S.shot&&!S.boom){const K=AG.keys;if(K.ArrowLeft)S.a=Math.min(88,S.a+dt*35);if(K.ArrowRight)S.a=Math.max(5,S.a-dt*35);if(K.ArrowUp)S.p=Math.min(100,S.p+dt*35);if(K.ArrowDown)S.p=Math.max(15,S.p-dt*35);if(AG.press[' ']||AG.press.Enter||AG.tap){const q=S.a*Math.PI/180,v=S.p*5;S.shot={x:S.px,y:py-16,vx:Math.cos(q)*v,vy:-Math.sin(q)*v,by:'p'};sfx('s')}}
  if(S.turn=='c'&&!S.shot&&!S.boom){S.think=(S.think||0)+dt;if(S.think>.9){S.think=0;let best=null;for(let p=20;p<=100;p+=2){const q=125*Math.PI/180;let x=S.cx,y=cy-16,vx=Math.cos(q)*p*5,vy=-Math.sin(q)*p*5;for(let i=0;i<500;i++){vy+=320*.016;vx+=S.wind*6*.016;x+=vx*.016;y+=vy*.016;if(x<0||x>359||y>gy(x))break}const e=Math.abs(x-S.px);if(!best||e<best.e)best={e,p}}const er=Math.max(2,14-S.lvl*2),p=best.p+(Math.random()-.5)*er,q=125*Math.PI/180;S.shot={x:S.cx,y:cy-16,vx:Math.cos(q)*p*5,vy:-Math.sin(q)*p*5,by:'c'};sfx('s')}}
  if(S.shot){const s=S.shot;for(let n=0;n<2;n++){s.vy+=320*dt/2;s.vx+=S.wind*6*dt/2;s.x+=s.vx*dt/2;s.y+=s.vy*dt/2;const out=s.x<-20||s.x>380||s.y>440;const hit=!out&&s.x>=0&&s.x<360&&s.y>=gy(s.x);const tk=Math.hypot(s.x-S.cx,s.y-(cy-8))<13&&s.by=='p'||Math.hypot(s.x-S.px,s.y-(py-8))<13&&s.by=='c';if(out||hit||tk){if(!out){const R0=26;for(let x=Math.max(0,s.x-R0|0);x<Math.min(360,s.x+R0);x++){const d=Math.sqrt(Math.max(0,R0*R0-(x-s.x)**2));S.G[x]=Math.max(S.G[x],Math.min(405,s.y+d))}const dm=(a,b)=>Math.max(0,Math.round(55*(1-Math.hypot(s.x-a,s.y-b)/38)));const dc=dm(S.cx,cy-8),dp=dm(S.px,py-8);S.chp-=dc;S.hp-=dp;S.score+=dc;S.boom={x:s.x,y:s.y,t:.4};tone(-12,.25,'sawtooth',.07);S.msg=dc||dp?(dc?'상대 -'+dc:'내 탱크 -'+dp):'빗나갔어요'}S.after=s.by;S.shot=null;if(out){S.boom={x:-99,y:0,t:.15};S.msg='화면 밖으로!'}break}}}
  if(S.boom){S.boom.t-=dt;if(S.boom.t<=0){S.boom=null;if(S.hp<=0)return agEnd(S.score,S.lvl-1+'명을 이겼어요');if(S.chp<=0){S.score+=500+S.hp*5;S.lvl++;S.hp=Math.min(100,S.hp+30);S.msg='승리! 다음 상대 등장';agTankNew(S);return}S.turn=S.after=='p'?'c':'p';S.wind=Math.round((Math.random()-.5)*16)/2}}
  agR(X,'#7dd3fc',0,0,360,420);agO(X,'#fde047',320,44,16);X.fillStyle='#94a3b8';X.beginPath();X.moveTo(40,300);X.lineTo(180,120);X.lineTo(320,300);X.fill();agR(X,'#0284c7',0,400,360,20);for(let x=0;x<360;x+=2){agR(X,'#4ade80',x,S.G[x],2,6);agR(X,'#854d0e',x,S.G[x]+6,2,420-S.G[x])}
  const tankD=(x,y,c,an)=>{X.save();X.translate(x,y-16);X.rotate(-an);agR(X,'#334155',0,-2,18,4);X.restore();agR(X,c,x-12,y-14,24,10);agO(X,c,x,y-15,7);agR(X,'#1f2937',x-14,y-6,28,6)};tankD(S.px,py,'#f97316',S.a*Math.PI/180);tankD(S.cx,cy,'#57534e',125*Math.PI/180);
  if(S.shot)agOr(X,S.shot.x,S.shot.y,5);if(S.boom&&S.boom.x>0)agO(X,'#fb923c',S.boom.x,S.boom.y,28*(1-S.boom.t/.5)+6);
  agR(X,'#0007',0,0,360,52);agT(X,'#fff','나 ',8,20,13);agR(X,'#334155',28,10,110,10);agR(X,'#22c55e',28,10,1.1*Math.max(0,S.hp),10);const mx=80+S.lvl*20;agT(X,'#fff','상대',222,20,13);agR(X,'#334155',254,10,98,10);agR(X,'#ef4444',254,10,98*Math.max(0,S.chp)/mx,10);agT(X,'#fde047',`각도 ${S.a|0}°  힘 ${S.p|0}`,8,42,13);agT(X,'#fff',`바람 ${S.wind>0?'→':S.wind<0?'←':''} ${Math.abs(S.wind)}`,180,42,13,'center');agT(X,'#fde047',S.score+'점',352,42,14,'right');if(S.msg)agT(X,'#1f2937',S.msg,180,76,15,'center');if(S.turn=='c'&&!S.shot)agT(X,'#1f2937','상대가 조준 중…',180,96,13,'center')},
 whack(S,dt,X){S.t-=dt;if(S.t<=0)return agEnd(Math.max(1,S.score),'최종 점수');S.sp-=dt;if(S.sp<=0){S.sp=Math.max(.28,.75-(30-S.t)*.012);const free=S.cells.map((c,i)=>c?-1:i).filter(i=>i>=0);if(free.length){const r=Math.random();S.cells[free[Math.random()*free.length|0]]={k:r<.14?'gold':r<.34?'stone':'or',life:Math.max(.55,1.2-(30-S.t)*.015),up:0}}}
  const hitAt=i=>{const c=S.cells[i];if(!c)return;const v=c.k=='or'?10:c.k=='gold'?30:-20;S.score=Math.max(0,S.score+v);S.fx.push({i,v,t:.5});S.cells[i]=null;tone(v>0?(v>10?16:9):-8,.1,v>0?'square':'sawtooth',.05)};
  if(AG.tap){const{x,y}=AG.tap,c=Math.floor(x/120),r=Math.floor((y-60)/120);if(c>=0&&c<3&&r>=0&&r<3)hitAt(r*3+c)}for(let i=0;i<9;i++)if(AG.press[String(i+1)])hitAt(i);
  agR(X,'#65a30d',0,0,360,420);agR(X,'#0007',0,0,360,44);agT(X,'#fff','⏱ '+Math.ceil(S.t),12,30,20);agT(X,'#fde047',S.score+'점',348,30,20,'right');for(let i=0;i<9;i++){const x=60+(i%3)*120,y=120+(i/3|0)*120;X.fillStyle='#3f2a14';X.beginPath();X.ellipse(x,y+30,44,16,0,0,7);X.fill();const c=S.cells[i];if(c){c.up=Math.min(1,c.up+dt*7);c.life-=dt;if(c.life<=0){S.cells[i]=null;continue}const b=y+18-c.up*30;X.save();X.beginPath();X.rect(x-50,y-60,100,88);X.clip();if(c.k=='stone'){agR(X,'#44403c',x-17,b-22,34,50);agR(X,'#292524',x-20,b-30,40,10);agR(X,'#111',x-10,b-14,7,7);agR(X,'#111',x+3,b-14,7,7);agR(X,'#292524',x-3,b-8,6,10)}else if(c.k=='gold'){agO(X,'#fde047',x,b,23);agO(X,'#fff',x-7,b-8,5);agR(X,'#15803d',x-2,b-28,5,8)}else agOr(X,x,b,23);X.restore()}}S.fx=S.fx.filter(q=>(q.t-=dt)>0);S.fx.forEach(q=>agT(X,q.v>0?'#fff':'#fecaca',(q.v>0?'+':'')+q.v,60+(q.i%3)*120,90+(q.i/3|0)*120-(1-q.t*2)*20,20,'center'))},
 rhythm(S,dt,X){S.t+=dt;const HY=360,LK=['d','f','j','k'],AK=['ArrowLeft','ArrowDown','ArrowUp','ArrowRight'],press=[0,0,0,0];LK.forEach((k,i)=>{if(AG.press[k]||AG.press[k.toUpperCase()]||AG.press[AK[i]])press[i]=1});if(AG.tap)press[Math.min(3,Math.floor(AG.tap.x/90))]=1;press.forEach((p,l)=>{if(!p)return;S.fl[l]=.15;let b=null;for(const n of S.N)if(!n.hit&&n.l==l&&Math.abs(n.t-S.t)<.17&&(!b||Math.abs(n.t-S.t)<Math.abs(b.t-S.t)))b=n;if(b){const e=Math.abs(b.t-S.t);b.hit=1;S.combo++;S.score+=(e<.075?100:50)+Math.min(S.combo,50)*2;S.msg=e<.075?'PERFECT':'GOOD';S.mt=.4;tone(b.n,.15,'triangle',.07)}});S.N.forEach(n=>{if(!n.hit&&S.t-n.t>.17){n.hit=2;S.combo=0;S.msg='MISS';S.mt=.4}});if(S.t>42)return agEnd(S.score,'곡이 끝났어요');
  agR(X,'#1e1b4b',0,0,360,420);const CL=['#f472b6','#38bdf8','#4ade80','#fbbf24'];for(let l=0;l<4;l++){S.fl[l]=Math.max(0,S.fl[l]-dt);agR(X,S.fl[l]?CL[l]+'55':'#ffffff0a',l*90+2,0,86,420);agR(X,CL[l],l*90+6,HY-4,78,8);agT(X,'#fff',LK[l].toUpperCase(),l*90+45,402,16,'center')}S.N.forEach(n=>{if(n.hit)return;const y=HY-(n.t-S.t)*240;if(y>-20&&y<430)agR(X,CL[n.l],n.l*90+8,y-8,74,16)});agT(X,'#fff',S.score.toLocaleString('ko-KR'),348,28,18,'right');agT(X,'#fde047',S.combo>1?S.combo+' 콤보':'',12,28,16);S.mt-=dt;if(S.mt>0)agT(X,'#fff',S.msg,180,200,28,'center')},
 race(S,dt,X){S.v=Math.min(520,S.v+dt*9);S.d+=S.v*dt;S.score=Math.round(S.d/10)+S.bonus;if(AG.keys.ArrowLeft)S.x-=270*dt;if(AG.keys.ArrowRight)S.x+=270*dt;if(AG.pt)S.x+=(AG.pt.x-S.x)*Math.min(1,dt*10);S.x=Math.max(84,Math.min(276,S.x));S.sp-=dt*(S.v/170);if(S.sp<=0){S.sp=.55+Math.random()*.4;const r=Math.random();S.O.push({x:84+Math.random()*192,y:-40,k:r<.28?'or':r<.6?'rock':'car',c:['#ef4444','#2563eb','#a855f7','#f8fafc'][Math.random()*4|0]})}S.inv=Math.max(0,S.inv-dt);for(const o of S.O){o.y+=(o.k=='car'?S.v*.65:S.v)*dt;if(!o.gone&&Math.abs(o.x-S.x)<(o.k=='or'?24:27)&&Math.abs(o.y-350)<(o.k=='car'?38:26)){if(o.k=='or'){o.gone=1;S.bonus+=50;tone(14,.1,'square',.05)}else if(!S.inv){S.life--;S.inv=1.4;o.gone=1;tone(-10,.25,'sawtooth',.07);if(S.life<=0)return agEnd(S.score,'완주 거리 '+Math.round(S.d/10)+'m')}}}S.O=S.O.filter(o=>o.y<460&&!o.gone);
  agR(X,'#0ea5e9',0,0,48,420);agR(X,'#fde68a',48,0,12,420);agR(X,'#374151',60,0,240,420);agR(X,'#65a30d',300,0,60,420);const off=S.d%60;for(let y=-60;y<440;y+=60){agR(X,'#f8fafc',178,y+off,4,30);agR(X,'#a8a29e',60,y+off,4,20);agR(X,'#a8a29e',296,y+off,4,20);agO(X,'#15803d',330,y+off,14);agR(X,'#ffffff80',12,(y*1.7+off)%420,20,2)}for(const o of S.O){if(o.k=='or')agOr(X,o.x,o.y,13);else if(o.k=='rock'){agO(X,'#44403c',o.x,o.y,20);agO(X,'#57534e',o.x-5,o.y-6,7)}else{agR(X,o.c,o.x-16,o.y-30,32,60);agR(X,'#0f172a',o.x-12,o.y+6,24,14);agR(X,'#0f172a',o.x-12,o.y-22,24,10)}}if(!S.inv||(performance.now()/90|0)%2){agR(X,'#f97316',S.x-16,320,32,60);agR(X,'#0f172a',S.x-12,334,24,12);agR(X,'#0f172a',S.x-12,362,24,8);agR(X,'#fde047',S.x-13,320,6,3);agR(X,'#fde047',S.x+7,320,6,3)}agR(X,'#0007',0,0,360,36);agT(X,'#fff',S.score.toLocaleString('ko-KR')+'점',10,24,17);agT(X,'#fff',Math.round(S.v/2)+'km/h',180,24,14,'center');agT(X,'#fff','❤'.repeat(S.life),350,24,15,'right')},
 snake(S,dt,X){const K=AG.press,SET=(a,b)=>{if(S.dir[0]!=-a||S.dir[1]!=-b)S.nx=[a,b]};if(K.ArrowLeft)SET(-1,0);if(K.ArrowRight)SET(1,0);if(K.ArrowUp)SET(0,-1);if(K.ArrowDown)SET(0,1);if(AG.tap){const h=S.B[0],dx=AG.tap.x-(h[0]*20+10),dy=AG.tap.y-(h[1]*20+30);if(Math.abs(dx)>Math.abs(dy))SET(Math.sign(dx),0);else SET(0,Math.sign(dy))}S.tk+=dt;if(S.tk>=S.step){S.tk=0;S.dir=S.nx;const h=[S.B[0][0]+S.dir[0],S.B[0][1]+S.dir[1]];if(h[0]<0||h[1]<0||h[0]>=18||h[1]>=19||S.B.some(b=>b[0]==h[0]&&b[1]==h[1]))return agEnd(S.score,'길이 '+S.B.length);S.B.unshift(h);if(h[0]==S.food[0]&&h[1]==S.food[1]){S.score+=10;S.step=Math.max(.07,S.step-.004);tone(12,.08,'square',.05);do{S.food=[Math.random()*18|0,Math.random()*19|0]}while(S.B.some(b=>b[0]==S.food[0]&&b[1]==S.food[1]))}else S.B.pop()}
  agR(X,'#14532d',0,0,360,420);for(let y=0;y<19;y++)for(let x=0;x<18;x++)if((x+y)%2)agR(X,'#166534',x*20,y*20+20,20,20);agR(X,'#0f172a',0,0,360,20);agT(X,'#fff',S.score+'점',8,15,13);agOr(X,S.food[0]*20+10,S.food[1]*20+30,8);S.B.forEach((b,i)=>agR(X,i?'#fde047':'#fb923c',b[0]*20+1,b[1]*20+21,18,18));const h=S.B[0];agR(X,'#111',h[0]*20+5,h[1]*20+26,3,3);agR(X,'#111',h[0]*20+12,h[1]*20+26,3,3)},
 brick(S,dt,X){if(AG.keys.ArrowLeft)S.x-=330*dt;if(AG.keys.ArrowRight)S.x+=330*dt;if(AG.pt)S.x=AG.pt.x;S.x=Math.max(38,Math.min(322,S.x));if(!S.on){S.bx=S.x;S.by=376;if(AG.tap||AG.press[' ']){S.on=true;const v=250+S.lvl*25;S.vx=(Math.random()-.5)*v*.8;S.vy=-v}}else{S.bx+=S.vx*dt;S.by+=S.vy*dt;if(S.bx<7||S.bx>353){S.vx*=-1;S.bx=Math.max(7,Math.min(353,S.bx))}if(S.by<32){S.vy=Math.abs(S.vy)}if(S.vy>0&&S.by>380&&S.by<396&&Math.abs(S.bx-S.x)<40){S.vy=-Math.abs(S.vy);S.vx=(S.bx-S.x)*8;tone(4,.05,'square',.04)}for(const k of S.K){if(k.on&&S.bx>k.x-5&&S.bx<k.x+45&&S.by>k.y-5&&S.by<k.y+23){k.on=0;S.vy*=-1;S.score+=10*S.lvl;tone(9,.05,'square',.04);break}}if(S.by>430){S.life--;S.on=false;tone(-8,.2,'sawtooth',.06);if(S.life<=0)return agEnd(S.score,'레벨 '+S.lvl)}if(!S.K.some(k=>k.on)){S.lvl++;agBrickNew(S)}}
  agR(X,'#0f172a',0,0,360,420);agT(X,'#fff',S.score+'점',8,22,15);agT(X,'#fde047','레벨 '+S.lvl,180,22,13,'center');agT(X,'#fff','🟠'.repeat(S.life),352,22,12,'right');S.K.forEach(k=>{if(k.on){agR(X,k.c,k.x,k.y,40,18);agR(X,'#ffffff40',k.x,k.y,40,3)}});agR(X,'#f97316',S.x-38,386,76,10);agR(X,'#fdba74',S.x-38,386,76,3);agO(X,'#f8fafc',S.bx,S.by,7);if(!S.on)agT(X,'#fff','눌러서 발사',180,300,15,'center')},
 punch(S,dt,X){S.anim=Math.max(0,S.anim-dt*3);const hit=AG.tap||AG.press[' '];if(S.ph=='mash'){S.t-=dt;if(hit){S.n++;S.anim=.5;sfx('t')}if(S.t<=0){S.ph='aim';S.nd=0;S.dirn=1}}else if(S.ph=='aim'){S.nd+=S.dirn*dt*(2+S.rnd*.5);if(S.nd>1){S.nd=1;S.dirn=-1}if(S.nd<0){S.nd=0;S.dirn=1}if(hit){const q=1-Math.abs(S.nd-.5)*2,pw=Math.round((70+S.n*20)*(.35+.65*q*q));S.last.push(pw);S.score+=pw;S.pw=pw;S.ph='show';S.t=1.2;S.anim=1;tone(-14,.25,'sawtooth',.09)}}else{S.t-=dt;if(S.t<=0){S.rnd++;if(S.rnd>=3)return agEnd(S.score,'세 번의 합계');S.ph='mash';S.t=3;S.n=0}}
  agR(X,'#450a0a',0,0,360,420);agR(X,'#7f1d1d',0,330,360,90);agR(X,'#94a3b8',176,0,8,70);const sw=Math.sin(performance.now()/90)*S.anim*22;X.save();X.translate(180,70);X.rotate(sw/90);agR(X,'#b91c1c',-38,0,76,160);agR(X,'#7f1d1d',-38,0,76,12);agR(X,'#7f1d1d',-38,148,76,12);X.restore();agO(X,'#ef4444',180+(S.anim>.3?-20:-110),250-(S.anim>.3?30:0),28);agO(X,'#fecaca',180+(S.anim>.3?-28:-118),240-(S.anim>.3?30:0),7);
  agT(X,'#fff',`${S.rnd+1}/3 라운드`,12,28,16);agT(X,'#fde047',S.score+'점',348,28,20,'right');if(S.ph=='mash'){agT(X,'#fff','연타! '+S.n+'회',180,340,28,'center');agR(X,'#0007',40,356,280,12);agR(X,'#fde047',40,356,280*Math.max(0,S.t)/3,12)}else if(S.ph=='aim'){agT(X,'#fff','가운데서 눌러!',180,340,24,'center');agR(X,'#ef4444',40,356,280,18);agR(X,'#eab308',120,356,120,18);agR(X,'#22c55e',160,356,40,18);agR(X,'#fff',40+S.nd*280-2,350,4,30)}else agT(X,'#fde047',S.pw+' POWER!',180,350,34,'center')}
};
/* 제주 달리기 일정: 끝난 대회는 자동으로 내려감 */
const RACE_EV=[{n:'제주 러닝위크 시즌2',d:'2026-11-05',e:'2026-12-15',w:'제주 전역 25개 코스',x:'빙고런 · 가파도(11/16) · 우도(12/4~5)',c:['#0f766e','#2dd4bf'],i:'🗺',u:'https://www.visitjeju.net/kr/festival/view?contentsid=CNTS_300000000014295'},{n:'제주감귤국제마라톤',d:'2026-11-15',e:'2026-11-15',w:'제주',x:'풀 · 하프 · 10km · 5km',c:['#ea580c','#fdba74'],i:'🍊',u:'https://marathon.ihalla.com/'},{n:'제주 웨이브 런 2026 with 제주 해녀',d:'2026-12-12',e:'2026-12-12',w:'서귀포시 하모해수욕장',x:'해변 달리기',c:['#0369a1','#7dd3fc'],i:'🌊',u:'https://search.naver.com/search.naver?query=%EC%A0%9C%EC%A3%BC%20%EC%9B%A8%EC%9D%B4%EB%B8%8C%20%EB%9F%B0%202026'},{n:'제31회 제주국제관광마라톤축제',d:'2027-06-01',e:'2027-06-30',lab:'2027년 6월 (날짜 미정)',w:'구좌·성산',x:'풀 · 하프 · 10km · 5km · 걷기',c:['#15803d','#86efac'],i:'🏃',u:'https://run.roundr.co.kr/races/jeju-international-tourism-marathon-2027'}];
function raceCards(){const ts=new Date(Date.now()+9*36e5).toISOString().slice(0,10),L=RACE_EV.filter(r=>r.e>=ts),dd=r=>{const n=Math.round((Date.parse(r.d)-Date.parse(ts))/864e5);return r.lab?'예정':n>0?'D-'+n:r.e>=ts&&n<=0?(r.d==r.e?'D-DAY':'진행 중'):''};return L.length?'<div class="qform"><b>🏃 다가오는 제주 달리기</b><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:6px">'+L.map(r=>`<a href="${r.u}" target="_blank" rel="noopener" style="display:block;text-decoration:none;color:#fff;border-radius:8px;overflow:hidden;background:linear-gradient(160deg,${r.c[0]},${r.c[1]});padding:10px;min-height:150px;box-shadow:0 2px 6px #0004"><div style="display:flex;justify-content:space-between;font-size:12px"><b style="background:#0005;padding:1px 6px;border-radius:9px">${dd(r)}</b><span style="font-size:24px">${r.i}</span></div><div style="font-weight:bold;font-size:15px;margin-top:8px;line-height:1.25;text-shadow:0 1px 2px #0006">${esc(r.n)}</div><div style="font-size:11px;margin-top:6px;text-shadow:0 1px 2px #0006">📅 ${esc(r.lab||(r.d==r.e?r.d.replace(/-/g,'.'):r.d.slice(5).replace('-','.')+'~'+r.e.slice(5).replace('-','.')))}<br>📍 ${esc(r.w)}<br>${esc(r.x)}</div></a>`).join('')+'</div><p style="font-size:11px;opacity:.75;margin-top:6px">누르면 안내 페이지가 열려요. 일정은 바뀔 수 있으니 참가 전에 꼭 확인하세요.</p></div>':''}
/* 건물 외관: 건물마다 하는 일이 보이게 */
function drawFac(X,k,a,b){const ox=(a-1)*32,oy=(b-1)*32,R=(c,x,y,w,h)=>{X.fillStyle=c;X.fillRect(ox+x,oy+y,w,h)},O=(c,x,y,r)=>{X.fillStyle=c;X.beginPath();X.arc(ox+x,oy+y,r,0,7);X.fill()},W=(x,y,w=18,h=14,c='#7dd3fc')=>{R('#334155',x-1,y-1,w+2,h+2);R(c,x,y,w,h);R('#ffffff70',x,y,w,4)},D=(c='#78350f',d='#b45309')=>{R(c,36,38,24,26);R(d,38,40,20,22);R('#fde68a',42,44,8,7);R('#0002',36,62,24,2)},B=(c)=>{R('#0003',0,62,96,3);R(c,0,30,96,32)};
 const F={
 maeul(){R('#0f766e',-2,4,100,26);R('#115e59',-2,4,100,4);for(let i=0;i<5;i++)R('#0d9488',0,10+i*4,96,1);B('#f8fafc');for(let i=0;i<8;i++)for(let j=0;j<2;j++)R(j%2==i%2?'#57534e':'#44403c',i*12,50+j*7,12,7);W(9,34);W(69,34);D()},
 cafe(){B('#f8fafc');R('#0d9488',-2,12,100,8);for(let i=0;i<9;i+=2)R('#f8fafc',i*11,12,11,8);R('#14b8a6',0,2,96,10);R('#fff',36,-4,20,14);R('#fff',54,0,5,7);R('#78350f',38,-2,16,4);W(6,34,24,22);W(66,34,24,22);D('#0f766e','#14b8a6')},
 pension(){B('#f8fafc');R('#1d4ed8',-4,-14,104,12);R('#2563eb',-2,-2,100,4);R('#f8fafc',0,2,96,28);[6,39,72].forEach(x=>{W(x,4,18,12);W(x,-0,0,0)});R('#94a3b8',0,20,96,2);for(let i=0;i<96;i+=8)R('#cbd5e1',i,16,2,6);W(8,34);W(70,34);D('#0369a1','#0ea5e9')},
 vol(){R('#fecaca',0,4,96,26);R('#b91c1c',-2,0,100,6);W(8,12);W(70,12);O('#dc2626',48,16,7);X.fillStyle='#dc2626';X.beginPath();X.moveTo(ox+48,oy+3);X.lineTo(ox+42,oy+13);X.lineTo(ox+54,oy+13);X.fill();B('#dcfce7');R('#16a34a',0,30,96,4);O('#ec4899',16,44,4);O('#ec4899',22,44,4);X.fillStyle='#ec4899';X.beginPath();X.moveTo(ox+12,oy+46);X.lineTo(ox+26,oy+46);X.lineTo(ox+19,oy+55);X.fill();W(70,38);D('#15803d','#22c55e')},
 mensa(){R('#6cc04a',0,0,96,30);B('#e7e5e4');X.fillStyle='#a8a29e';X.beginPath();X.moveTo(ox-2,oy+30);X.lineTo(ox+48,oy+4);X.lineTo(ox+98,oy+30);X.fill();O('#1d4ed8',48,8,11);R('#a8a29e',36,8,24,8);R('#fde047',46,-6,4,4);[4,16,28,62,74,86].forEach(x=>R('#f5f5f4',x,30,6,32));[4,16,28,62,74,86].forEach(x=>R('#d6d3d1',x+4,30,2,32));D('#1e3a8a','#2563eb')},
 busTerm(){R('#1d4ed8',0,4,96,26);R('#1e40af',-2,24,100,6);R('#f8fafc',16,8,64,14);R('#0ea5e9',16,14,64,4);[20,32,44,56,68].forEach(x=>R('#334155',x,9,9,5));O('#111',28,22,3);O('#111',68,22,3);B('#f8fafc');W(8,36,22,16);W(66,36,22,16);D('#334155','#64748b')},
 memo(){const oy2=oy+46;X.fillStyle='#0003';X.fillRect(ox+13,oy2+2,12,8);X.fillStyle='#fef9c3';X.fillRect(ox+12,oy2,12,8);X.fillStyle='#94a3b8';X.fillRect(ox+14,oy2+2,8,1);X.fillRect(ox+14,oy2+5,6,1)},
 ydam(){X.save();X.translate(0,12);X.fillStyle='#ffffff90';X.fillRect(ox-4,oy+30,104,3);X.fillStyle='#1c1917';X.beginPath();X.moveTo(ox+0,oy+32);X.lineTo(ox+14,oy+20);X.lineTo(ox+36,oy+16);X.lineTo(ox+54,oy+6);X.lineTo(ox+64,oy-8);X.lineTo(ox+78,oy-12);X.lineTo(ox+94,oy-6);X.lineTo(ox+84,oy+0);X.lineTo(ox+74,oy+2);X.lineTo(ox+90,oy+8);X.lineTo(ox+74,oy+14);X.lineTo(ox+72,oy+32);X.closePath();X.fill();X.fillStyle='#44403c';[[20,24,8],[38,20,6],[56,14,5],[66,0,5]].forEach(a=>X.fillRect(ox+a[0],oy+a[1],a[2],3));X.fillStyle='#f8fafc';X.fillRect(ox+76,oy-7,3,3);X.restore()},
 hdDel(){B('#ffffff');for(let y=6;y<30;y+=6)R(y%12?'#fff':'#0ea5e9',0,y,96,6);R('#0284c7',-2,0,100,6);O('#7dd3fc',16,44,10);O('#334155',16,44,10);O('#7dd3fc',16,44,8);O('#7dd3fc',80,44,0);W(68,36,20,18);R('#fb923c',90,10,5,50);D('#0369a1','#38bdf8')},
 gym(){R('#6cc04a',0,0,96,30);X.fillStyle='#64748b';X.beginPath();X.ellipse(ox+48,oy+30,50,26,0,Math.PI,0);X.fill();R('#475569',0,28,96,3);R('#dc2626',0,30,96,6);R('#f8fafc',30,14,36,4);R('#111827',28,8,6,16);R('#111827',62,8,6,16);R('#374151',22,11,6,10);R('#374151',68,11,6,10);R('#cbd5e1',0,36,96,26);W(8,40,20,14);W(68,40,20,14);D('#991b1b','#dc2626')},
 photo(){R('#292524',0,4,96,26);R('#44403c',-2,2,100,4);for(let i=0;i<12;i++){R('#f8fafc',i*8+1,6,4,3);R('#f8fafc',i*8+1,24,4,3)}R('#111827',34,10,28,14);O('#94a3b8',48,17,6);O('#0ea5e9',48,17,4);R('#fde047',54,8,6,3);B('#fef3c7');[6,20].forEach(x=>{R('#78350f',x,36,12,16);R('#bae6fd',x+2,38,8,12)});[66,80].forEach(x=>{R('#78350f',x,36,12,16);R('#fbcfe8',x+2,38,8,12)});D()},
 agency(){R('#1e3a8a',0,2,96,60);for(let x=4;x<96;x+=12)for(let y=6;y<34;y+=9)R((x+y)%5?'#93c5fd':'#fde68a',x,y,8,6);R('#fbbf24',0,32,96,4);R('#1e3a8a',-2,0,100,3);R('#1e40af',0,36,96,26);W(8,40,22,14);W(66,40,22,14);D('#172554','#3b82f6')},
 atelier(){['#ef4444','#f97316','#eab308','#22c55e','#0ea5e9','#a855f7'].forEach((c,i)=>R(c,i*16,4,16,26));R('#0002',0,26,96,4);O('#fde68a',48,14,11);['#ef4444','#2563eb','#16a34a','#a855f7'].forEach((c,i)=>O(c,42+(i%2)*10,9+(i>>1)*9,2.5));B('#fff');[[6,32,'#ef4444'],[12,32,'#2563eb'],[80,32,'#16a34a'],[88,32,'#eab308']].forEach(([x,y,c])=>{R(c,x,y,4,10+(x%7));O(c,x+2,y+10+(x%7),2.4)});W(18,38,14,14);W(66,38,14,14);D('#7c3aed','#a855f7')},
 bowl(){R('#1f1147',0,0,96,30);R('#ec4899',-2,0,100,3);R('#22d3ee',-2,27,100,3);R('#f8fafc',14,4,10,20);R('#ef4444',14,10,10,3);O('#f8fafc',19,5,4);O('#1e293b',72,14,10);O('#475569',69,11,2);O('#475569',73,9,2);O('#475569',76,12,2);B('#312e81');W(8,38,18,14,'#c4b5fd');W(70,38,18,14,'#c4b5fd');D('#be185d','#ec4899')},
 jjim(){R('#292524',-4,10,104,18);R('#44403c',-4,10,104,4);for(let i=0;i<13;i++)R('#1c1917',i*8,14,2,14);R('#57534e',70,-4,10,16);X.strokeStyle='#ffffff90';X.lineWidth=2;[73,78].forEach((x,i)=>{X.beginPath();X.moveTo(ox+x,oy-6);X.quadraticCurveTo(ox+x+5,oy-12,ox+x,oy-18+i);X.stroke()});B('#c08a4f');for(let i=0;i<7;i++)R('#a97739',(i*17)%90,33+(i*7)%24,8,2);W(8,36,18,14,'#fde68a');W(70,36,18,14,'#fde68a');D('#7c2d12','#a16207')},
 woodang(){R('#1c1917',-4,6,104,10);R('#292524',-2,16,100,6);R('#991b1b',0,22,96,8);B('#b91c1c');for(let i=0;i<4;i++)R('#7f1d1d',0,33+i*7,96,1);for(let i=0;i<8;i++)R(i%2?'#57534e':'#44403c',i*12,54,12,8);R('#fef3c7',12,36,16,14);R('#78350f',19,36,2,14);R('#fef3c7',68,36,16,14);R('#78350f',75,36,2,14);D()},
 tap(){R('#6cc04a',-2,-16,100,80);R('#0003',0,62,96,3);X.fillStyle='#c8bfa8';X.beginPath();X.moveTo(ox+28,oy+14);X.lineTo(ox+34,oy-4);X.lineTo(ox+62,oy-4);X.lineTo(ox+68,oy+14);X.fill();R('#111',45,-14,6,10);R('#111',48,-16,6,4);X.fillStyle='#e7e2d3';X.beginPath();X.ellipse(ox+48,oy+24,34,14,0,Math.PI,0);X.fill();[34,46,58].forEach(x=>R('#0f766e',x,14,5,7));R('#c8bfa8',8,24,80,40);for(let i=0;i<5;i++)R('#b5ac95',8,28+i*6,80,1);R('#57534e',8,50,80,14);R('#44403c',8,46,80,2);[20,32,44,56,68].forEach(x=>{W(x,32,7,12,'#0f766e')});R('#a8a29e',12,44,8,20);R('#d6d3d1',14,46,4,18)},
ttJ(){X.save();X.translate(ox+16,oy+67);X.rotate(Math.PI/2);X.fillStyle='#f8fafc';X.font='bold 21px sans-serif';X.textAlign='center';X.fillText('JEJU',0,8);X.restore();X.textAlign='start'},
ttP(){X.save();X.translate(ox,oy+27);X.fillStyle='#f8fafcf0';X.font='bold 28px sans-serif';X.textAlign='center';X.fillText('GIMHAE',48,0);X.restore();X.textAlign='start'}, ttG(){X.save();X.translate(ox,oy+27);X.fillStyle='#f8fafcf0';X.font='bold 28px sans-serif';X.textAlign='center';X.fillText('GIMPO',48,0);X.restore();X.textAlign='start'},
ysSt(){R('#cbd5e1',-4,0,360,96);X.fillStyle='#475569';X.beginPath();X.moveTo(ox-6,oy+24);X.quadraticCurveTo(ox+176,oy-30,ox+358,oy+24);X.lineTo(ox+358,oy+30);X.lineTo(ox-6,oy+30);X.fill();R('#334155',-6,26,364,5);for(let x=2;x<348;x+=16)for(let y=32;y<66;y+=11)R((x+y)%7?'#7dd3fc':'#bae6fd',x,y,14,9);R('#1e3a8a',0,66,352,4);R('#e2e8f0',0,70,352,26);[64,160,256].forEach(x=>{R('#0f172a',x-4,70,40,26);R('#38bdf8',x,73,14,23);R('#38bdf8',x+18,73,14,23);R('#fef08a',x+13,70,6,3)});O('#f8fafc',176,14,10);O('#0f172a',176,14,8);R('#f8fafc',175,8,2,7);R('#f8fafc',175,13,6,2)},
swim(){R('#6cc04a',0,0,96,30);X.fillStyle='#0284c7';X.beginPath();X.ellipse(ox+48,oy+30,52,28,0,Math.PI,0);X.fill();X.strokeStyle='#bae6fd';X.lineWidth=2;for(let j=0;j<2;j++){X.beginPath();for(let i=0;i<=8;i++)X[i?'lineTo':'moveTo'](ox+10+i*9.5,oy+18+j*6+(i%2)*3);X.stroke()}B('#e0f2fe');R('#0ea5e9',0,30,96,4);W(6,38,24,16,'#38bdf8');W(66,38,24,16,'#38bdf8');D('#0369a1','#38bdf8')}
 };(F[k]||(()=>{}))()}

async function showRecBoard(){
  const L=RECORDS.filter(recNew);
  openM('<h3>📌 체육관 게시판</h3>'+raceCards()+'<p style="font-size:12px;opacity:.8;margin:8px 0 6px">최근 5년 안의 기록을 걸어 둡니다.</p>'+(L.length?L.map(recCard).join(''):'<div class="cd">최근 5년 안의 새 대회 기록은 아직 없어요. 다음 기록을 준비 중입니다! 🏃</div>')+
    '<div class="qform"><b>💪 요즘 운동 기록</b><div id="rbFit" style="font-size:12px;margin-top:4px">불러오는 중…</div></div><p style="font-size:11px;opacity:.75;margin-top:8px">5년이 지난 기록은 체육관 안 벽에서 볼 수 있어요.</p>');
  try{const R=await DB.req('workout?select=kind,cnt&limit=500'),b=k=>R.filter(r=>r.kind==k).reduce((m,r)=>Math.max(m,r.cnt),0),e=$('#rbFit');if(e)e.textContent=R.length?`팔굽혀펴기 최고 ${b('pushup')}회 · 철봉 최고 ${b('pullup')}회`:'아직 기록이 없어요.'}catch(e){const x=$('#rbFit');if(x)x.textContent='기록을 불러오지 못했어요.'}
}
function showRecWall(){
  const L=RECORDS.filter(r=>!recNew(r));
  openM('<h3>🏅 체육관 명예의 벽</h3><p style="font-size:12px;opacity:.8;margin-bottom:6px">5년이 지난 기록을 옮겨 걸어 둔 곳입니다.</p>'+(L.length?L.map(recCard).join(''):'<div class="cd">아직 벽으로 옮겨진 기록이 없어요.</div>'));
}

/* ===== 우체통: 쪽지와 약속 ===== */
const NERR={bad_name:'이름을 입력해 주세요.',bad_msg:'내용을 입력해 주세요. (500자 이내)',bad_contact:'연락처가 너무 길어요.',bad_pw_new:'비밀번호는 4~32자로 입력해 주세요.',bad_slots:'약속 날짜를 확인해 주세요.',rate:'지금 쪽지가 너무 많아요. 잠시 후 다시 보내 주세요.',bad_pw:'번호나 비밀번호가 맞지 않아요.',locked:'비밀번호를 5번 틀려 10분 동안 잠겼어요.',forbidden:'운영자만 할 수 있어요.',bad:'처리하지 못했어요.'};
const noteFields=()=>`<input id="nfN" class="xin" maxlength="20" placeholder="이름 또는 별명" style="margin-top:8px"><input id="nfC" class="xin" maxlength="60" placeholder="연락처 (선택 · 운영자만 봐요 · 처리 90일 뒤 삭제)" style="margin-top:6px">`;
const notePw=()=>`<input id="nfP" class="xin" type="password" maxlength="32" autocomplete="new-password" placeholder="비밀번호 (4자 이상, 답장 확인용)" style="margin-top:6px">`;
function showMail(){
  openM(`<h3>📮 보성의 집 우체통</h3>${adm('mail')}<div class="xcol">
    <button class="xb big" onclick="noteForm()">✉ 쪽지 보내기</button>
    <button class="xb big" onclick="meetForm()">📅 약속 잡기</button>
    <button class="xb big" onclick="noteCheckForm()">🔎 답장 확인하기</button>
    ${DB.admin()?'<button class="xb big" onclick="noteAdmin()">📬 관리자 쪽지함</button>':''}</div>`);
}
const mailBack='<button class="xb" onclick="showMail()">◀ 뒤로</button>';
function noteForm(){openM(`<h3>✉ 쪽지 보내기</h3><p style="font-size:12px;opacity:.8">요청이나 하고 싶은 말을 남겨 주세요. 주인장만 읽어요.</p>${noteFields()}<textarea id="nfM" class="xin" rows="4" maxlength="500" placeholder="내용 (500자 이내)" style="margin-top:6px"></textarea>${notePw()}<div class="qbtn"><button class="xb" onclick="noteSend('note')">보내기</button>${mailBack}</div>`)}
function meetForm(){
  const min=new Date(Date.now()+9*36e5).toISOString().slice(0,16);
  const slot=(i,l)=>`<div class="nslot"><b>${l}</b><input id="nfS${i}" class="xin" type="datetime-local" min="${min}"></div>`;
  openM(`<h3>📅 약속 잡기</h3><p style="font-size:12px;opacity:.8">희망 날짜와 시간을 고르고, 안 될 때를 위한 예비 일정도 넣을 수 있어요.</p>${noteFields()}${slot(0,'희망')}${slot(1,'예비 1')}${slot(2,'예비 2')}<textarea id="nfM" class="xin" rows="3" maxlength="500" placeholder="어떤 약속인가요?" style="margin-top:6px"></textarea>${notePw()}<div class="qbtn"><button class="xb" onclick="noteSend('meet')">약속 요청 보내기</button>${mailBack}</div>`);
}
async function noteSend(kind){
  const slots=kind=='meet'?[0,1,2].map(i=>$('#nfS'+i).value).filter(Boolean).map(v=>v+'+09:00'):[];
  const name=$('#nfN').value.trim(),msg=$('#nfM').value.trim(),pw=$('#nfP').value;
  if(!name)return toast(NERR.bad_name);if(kind=='meet'&&!slots.length)return toast('희망 날짜와 시간을 골라 주세요.');if(!msg)return toast(NERR.bad_msg);if(pw.length<4)return toast(NERR.bad_pw_new);
  try{const r=await DB.rpc('note_send',{p_kind:kind,p_name:name,p_contact:$('#nfC').value.trim(),p_msg:msg,p_slots:slots,p_pw:pw});
    if(!r.ok)return toast(NERR[r.err]||NERR.bad);
    try{localStorage.setItem('bsw_note_id',r.id)}catch(e){}
    openM(`<h3>📮 보냈어요!</h3><div class="cd">쪽지 번호는 <b>${r.id}번</b>이에요. 이 번호와 정한 비밀번호로 답장을 확인할 수 있어요.</div><div class="qbtn">${mailBack}</div>`);
  }catch(e){toast(dbErr(e))}
}
function noteCheckForm(){let id='';try{id=localStorage.getItem('bsw_note_id')||''}catch(e){}
  openM(`<h3>🔎 답장 확인하기</h3><input id="ncI" class="xin" type="number" inputmode="numeric" placeholder="쪽지 번호" value="${esc(id)}" style="margin-top:8px"><input id="ncP" class="xin" type="password" maxlength="32" placeholder="비밀번호" style="margin-top:6px"><div id="ncR"></div><div class="qbtn"><button class="xb" onclick="noteCheck()">확인</button>${mailBack}</div>`)}
const slotT=s=>{try{return new Date(s).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false})}catch(e){return s}};
async function noteCheck(){
  const id=parseInt($('#ncI').value,10),pw=$('#ncP').value;if(!id||!pw)return toast('번호와 비밀번호를 입력해 주세요.');
  try{const r=await DB.rpc('note_check',{p_id:id,p_pw:pw});if(!r.ok)return toast(NERR[r.err]||NERR.bad);
    const st=r.status=='accepted'?`✅ 수락: ${esc(slotT(r.slots[r.chosen]))}`:r.status=='declined'?'❌ 이번엔 어렵대요':r.status=='read'?'👀 주인장이 읽었어요':'📨 아직 읽기 전이에요';
    $('#ncR').innerHTML=`<div class="cd" style="margin-top:8px"><b>${st}</b>${r.reply?`<small>답장: ${esc(r.reply)}</small>`:''}</div>`;
  }catch(e){toast(dbErr(e))}
}
const NSTAT={new:'🔴 새 글',read:'👀 읽음',accepted:'✅ 수락',declined:'❌ 불가능'};
async function noteAdmin(){
  if(!DB.admin())return showLogin('mail');
  openM('<h3>📬 관리자 쪽지함</h3><p style="font-size:12px;opacity:.8">불러오는 중…</p>');
  let L=[],err='';try{L=await DB.rpc('note_list')}catch(e){err=dbErr(e)}
  const now=Date.now(),up=L.filter(n=>n.status=='accepted'&&n.chosen!=null&&new Date(n.slots[n.chosen])>=now).sort((a,b)=>new Date(a.slots[a.chosen])-new Date(b.slots[b.chosen]));
  openM(`<h3>📬 관리자 쪽지함</h3>${adm('mail')}`+(err?`<div class="cd">${esc(err)}</div>`:'')+
    `<div class="qform"><b>🗓 잡힌 일정</b>${up.length?up.map(n=>`<div class="xrow" style="margin:4px 0;padding:4px 8px"><b>${esc(slotT(n.slots[n.chosen]))}</b><span>${esc(n.name)}</span></div>`).join(''):'<p style="font-size:12px;opacity:.7;margin-top:4px">앞으로 잡힌 약속이 없어요.</p>'}</div>`+
    (L.length?L.map(n=>`<div class="qform"><b>${n.kind=='meet'?'📅 약속':'✉ 쪽지'} #${n.id} · ${esc(n.name)}</b> <small>${NSTAT[n.status]||''}</small>
      <p style="font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;margin:6px 0">${esc(n.msg)}</p>${n.contact?`<small style="display:block">연락처: ${esc(n.contact)}</small>`:''}<small style="display:block;opacity:.7">${fmtT(n.created_at)}</small>
      ${n.kind=='meet'?n.slots.map((s,i)=>`<div class="xrow" style="margin:4px 0;padding:4px 8px"><span>${i?'예비 '+i:'희망'} · ${esc(slotT(s))}${n.chosen===i?' ✅':''}</span><button class="xb" style="padding:2px 8px" onclick="noteAns(${n.id},'accepted',${i})">수락</button></div>`).join(''):''}
      <input id="nrp${n.id}" class="xin" maxlength="300" placeholder="답장 (선택)" value="${esc(n.reply||'')}" style="margin-top:6px">
      <div class="qbtn">${n.kind=='meet'?`<button class="xb r" onclick="noteAns(${n.id},'declined',null)">불가능</button>`:`<button class="xb" onclick="noteAns(${n.id},'read',null)">읽음·답장 저장</button>`}<button class="xb r" onclick="noteDel(${n.id})">삭제</button></div></div>`).join(''):'<div class="cd">아직 쪽지가 없어요.</div>'));
}
async function noteAns(id,st,ch){try{const e=$('#nrp'+id),r=await DB.rpc('note_answer',{p_id:id,p_status:st,p_chosen:ch,p_reply:e?e.value:''});if(!r.ok)return toast(NERR[r.err]||NERR.bad);toast('처리했어요.');noteAdmin();noteBell()}catch(e){toast(dbErr(e))}}
async function noteDel(id){try{const r=await DB.rpc('note_delete',{p_id:id});if(!r.ok)return toast(NERR[r.err]||NERR.bad);noteAdmin();noteBell()}catch(e){toast(dbErr(e))}}
async function noteBell(){const b=$('#nBell');if(!b)return;if(!DB.tok){b.hidden=true;return}let n=0,g=0;try{n=await DB.rpc('note_count')||0}catch(e){}try{g=await DB.rpc('gp_pending_count')||0}catch(e){}b.hidden=!n&&!g;b.textContent=(n?'📬 '+n:'')+(n&&g?' · ':'')+(g?'🖼 '+g:'');b.onclick=g&&!n?()=>gpAll():()=>noteAdmin()}

/* ===== 주인장의 롤 전적 (이스터 에그) ===== */
const LOL_ME=['징크스','Citrus','Galaxy','감귤','밀감'];
function showLolMe(){
  const u=n=>encodeURIComponent(n+'-Jeju');
  openM(`<h3>🤫 주인장의 컴퓨터</h3><p style="font-size:12px;opacity:.85;margin-bottom:6px">켜져 있는 컴퓨터를 몰래 봤더니 롤 계정이 줄줄이…</p>`+LOL_ME.map(n=>`<div class="xrow"><b>${esc(n)}#Jeju</b><span class="qbtn" style="margin:0"><a class="xb" style="padding:3px 7px" href="https://op.gg/lol/summoners/kr/${u(n)}" target="_blank" rel="noopener">OP.GG</a><a class="xb" style="padding:3px 7px" href="https://www.deeplol.gg/summoner/kr/${u(n)}" target="_blank" rel="noopener">DEEPLOL</a></span></div>`).join(''));
}

/* ===== 노래방 번호 찾기 (TJ) ===== */
const TJ={L:[],pl:null,on:false,fa:false,yt:false};
function tjOff(){if(!TJ.on)return;TJ.on=false;try{TJ.pl&&TJ.pl.destroy&&TJ.pl.destroy()}catch(e){}TJ.pl=null;try{if(TJ.fa)FA.play().catch(()=>{});else if(TJ.yt&&PV.yt)PV.yt.playVideo();else music()}catch(e){}}
async function tjPlay(i){const s=TJ.L[i];if(!s)return;const N=$('#tjNow');if(N)N.textContent='영상 찾는 중…';let w=null;try{w=window.open('about:blank','bsw_ytm','popup,width=1000,height=720')}catch(e){}let j=null,dg='연결 실패';try{const r=await fetch(`${DBCFG.url}/functions/v1/ytmatch?no=${encodeURIComponent(s.no)}&t=${encodeURIComponent(s.title)}&a=${encodeURIComponent(s.singer||'')}`,{headers:{apikey:DBCFG.key}});j=await r.json().catch(()=>null);dg=r.status+' '+((j&&(j.err||j.message||j.code||j.msg))||'')}catch(e){}if(!j||!j.ok||!j.vid){try{w&&w.close()}catch(e){}if(N)N.textContent='';return toast(j&&j.ok?'TJ 영상을 찾지 못한 곡이에요. 🎬 버튼으로 찾아보세요.':j&&j.err=='quota'?'오늘 찾을 수 있는 횟수를 다 썼어요. 내일 다시 해 주세요.':'지금은 영상을 찾을 수 없어요. ['+String(dg).trim().slice(0,40)+']')}
 const u='https://www.youtube.com/watch?v='+encodeURIComponent(j.vid);if(N)N.innerHTML='🎤 '+esc(s.title)+(s.singer?' · '+esc(s.singer):'')+' <a class="xb" style="padding:2px 7px" href="'+u+'" target="_blank" rel="noopener">다시 열기</a>';if(!TJ.on){clearInterval(mt);TJ.fa=typeof FA!='undefined'&&!FA.paused;TJ.yt=false;try{if(TJ.fa)FA.pause();if(PV.yt&&PV.yt.getPlayerState&&PV.yt.getPlayerState()==1){TJ.yt=true;PV.yt.pauseVideo()}}catch(e){}TJ.on=true}if(w&&!w.closed){try{w.location.href=u;w.focus()}catch(e){}}else toast('팝업이 막혔어요. 다시 열기를 눌러 주세요.')}
function showTj(){
  openM(`<h3>🎤 TJ 노래방 번호 찾기</h3><div id="tjNow" style="font-weight:bold;font-size:13px;margin-top:4px"></div><input id="tjq" class="xin" maxlength="40" placeholder="곡 제목이나 가수" style="margin-top:6px" onkeydown="if(event.key=='Enter')tjFind()"><div class="qbtn"><button class="xb" onclick="tjFind()">🔍 찾기</button></div><div id="tjr" style="margin-top:6px"></div><p style="font-size:10px;opacity:.7;margin-top:8px">번호 정보는 외부 공개 데이터라 최신곡은 없을 수 있어요.</p>`);
}
const ytSearch=q=>'https://www.youtube.com/results?search_query='+encodeURIComponent(q);
async function tjFind(){
  const q=$('#tjq').value.trim();if(!q)return toast('곡 제목이나 가수를 입력해 주세요.');
  const R=$('#tjr');R.innerHTML='<small>찾는 중…</small>';
  const get=k=>fetch('https://api.manana.kr/karaoke/'+k+'/'+encodeURIComponent(q)+'/tj.json').then(r=>r.ok?r.json():[]).catch(()=>null);
  const[a,b]=await Promise.all([get('song'),get('singer')]);
  if(!$('#tjr'))return;
  if(a===null&&b===null){R.innerHTML=`<div class="cd">번호 서버에 연결하지 못했어요. <a href="https://www.tjmedia.com/" target="_blank" rel="noopener">TJ미디어 사이트 열기</a></div>`;return}
  const seen=new Set(),L=[...(a||[]),...(b||[])].filter(s=>s&&s.no&&!seen.has(s.no)&&seen.add(s.no)).slice(0,30);
  if(!L.length){R.innerHTML=`<div class="cd">찾지 못했어요. 띄어쓰기를 바꾸거나 가수 이름으로 찾아보세요.<div class="qbtn"><a class="xb" href="${ytSearch(q+' TJ노래방')}" target="_blank" rel="noopener" onclick="return plOut(this.href)">🎬 유튜브에서 찾기</a><a class="xb" href="https://www.tjmedia.com/" target="_blank" rel="noopener">TJ미디어 사이트</a></div></div>`;return}
  TJ.L=L;R.innerHTML=L.map((s,i)=>`<div class="xrow" style="margin:4px 0"><span class="qn">${esc(s.no)}</span><span class="qt" style="font-weight:normal;cursor:pointer" onclick="tjPlay(${i})"><b>${esc(s.title)}</b> · ${esc(s.singer||'')}</span><button class="xb" style="padding:3px 7px" aria-label="바로 재생" onclick="tjPlay(${i})">▶</button><a class="xb" style="padding:3px 7px" href="${ytSearch(s.title+' '+(s.singer||'')+' TJ노래방')}" target="_blank" rel="noopener" onclick="return plOut(this.href)">🎬</a></div>`).join('');
  if(typeof kcPos=='function')kcPos();
}

/* ===== 방문자 노래 추천 ===== */
const RECERR={bad_title:'곡 제목을 입력해 주세요.',bad_artist:'가수 이름이 너무 길어요.',bad_link:'링크는 https:// 로 시작해야 해요.',rate:'지금 추천이 너무 많아요. 잠시 후 다시 해 주세요.'};
async function showRec(){
  openM('<h3>🎶 노래 추천</h3><p style="font-size:12px;opacity:.8">불러오는 중…</p>');
  let L=[],err='';try{L=await DB.rpc('song_list')}catch(e){err=dbErr(e)}
  const ad=DB.admin();
  openM(`<h3>🎶 노래 추천해 주세요!</h3>${adm('rec')}<div class="qform"><input id="srT" class="xin" maxlength="60" placeholder="곡 제목"><input id="srA" class="xin" maxlength="40" placeholder="가수" style="margin-top:6px"><input id="srN" class="xin" maxlength="20" placeholder="내 이름 (선택)" style="margin-top:6px"><input id="srL" class="xin" type="url" maxlength="200" placeholder="듣기 링크 (선택, https://)" style="margin-top:6px"><div class="qbtn"><button class="xb" onclick="recAdd()">추천하기</button></div></div>`+
   (err?`<div class="cd">${esc(err)}</div>`:L.length?L.map(s=>`<div class="xrow"><span class="qt" style="font-weight:normal"><b>${esc(s.title)}</b>${s.artist?' · '+esc(s.artist):''}<small style="display:block;opacity:.7">${esc(s.name)} 님 추천</small></span><span class="qbtn" style="margin:0"><a class="xb" style="padding:3px 7px" href="${esc(plUrl(s.link)||ytSearch(s.title+' '+(s.artist||'')))}" target="_blank" rel="noopener" onclick="return plOut(this.href)">▶</a>${ad?`<button class="xb r" style="padding:3px 7px" onclick="recDel(${s.id})">✕</button>`:''}</span></div>`).join(''):'<div class="cd">첫 번째 추천곡을 남겨 주세요!</div>'));
}
async function recAdd(){
  const t=$('#srT').value.trim();if(!t)return toast(RECERR.bad_title);
  try{const r=await DB.rpc('song_add',{p_name:$('#srN').value.trim(),p_title:t,p_artist:$('#srA').value.trim(),p_link:$('#srL').value.trim()});if(!r.ok)return toast(RECERR[r.err]||'추천하지 못했어요.');toast('추천 고마워요! 🎶');showRec()}catch(e){toast(dbErr(e))}
}
async function recDel(id){try{const r=await DB.rpc('song_del',{p_id:id});if(!r.ok)return toast('운영자만 지울 수 있어요.');showRec()}catch(e){toast(dbErr(e))}}

/* ===== 프로젝트 전시관 ===== */
const CONTACT_MAIL='b0s0n9.k@gmail.com';
const PROJECTS=[
  {t:'🎮 BS World',d:'걷고 말 걸고 길을 잃어도 괜찮은, 강보성의 16비트 세계. 지금 당신이 서 있는 바로 이곳입니다.',u:'https://studio-bs.github.io/',b:'지금 여기예요'},
  {t:'🍊 보성이네 감귤농원',d:'바람과 햇살이 키운 제주 서귀포 귤을 농장에서 바로 보내는 주문 사이트.',u:'https://jeju-citrus.vercel.app/',b:'사이트 열기'}
];
const KAKAO_URL='https://open.kakao.com/o/sYJawzVi';
function showKakao(){
  openM(`<h3>💬 보성에게 연락하기</h3><div class="cd">연락처를 모르시면 카카오톡 오픈채팅으로 말을 걸어 주세요.</div><div class="adbtn" style="margin-top:10px"><a class="xb kko" href="${KAKAO_URL}" target="_blank" rel="noopener">💬 카카오톡 오픈채팅 열기</a></div>`);
}
const RED={play:'https://play.google.com/store/apps/details?id=com.sk.redconnect',ios:'https://apps.apple.com/kr/app/id1481548384',web:'https://redconnect.co.kr/'};
function showRed(){
  const ua=navigator.userAgent,ad=/Android/i.test(ua),ios=/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);
  const btn=(u,t)=>`<a class="xb" href="${u}" target="_blank" rel="noopener">${t}</a>`;
  openM(`<h3>🩸 헌혈 예약 하시겠어요?</h3><div class="cd">헌혈 예약은 대한적십자사 공식 헌혈 앱 <b>레드커넥트</b>에서 할 수 있어요. 앱이 없으면 설치 화면이 열려요.</div><div class="qbtn" style="justify-content:center">${ad?btn('intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.sk.redconnect;S.browser_fallback_url='+encodeURIComponent(RED.play)+';end','📱 앱 바로 열기')+btn(RED.play,'▶ 구글 플레이'):ios?btn(RED.ios,'🍎 App Store에서 열기'):btn(RED.play,'▶ 구글 플레이')+btn(RED.ios,'🍎 App Store')}${btn(RED.web,'🌐 공식 사이트')}</div>`);
}
/* ===== PC 코너: 게임 실행과 롤 전적 ===== */
const PC_LOL=[['📊 DEEPLOL','https://www.deeplol.gg/'],['📊 OP.GG','https://www.op.gg/'],['📊 LOL.PS','https://lol.ps/']];
const PC_APPS=[
 {t:'🎮 스팀 실행',u:'steam://open/main',d:'https://store.steampowered.com/about/',n:'Steam'},
 {t:'🚀 Battle.net 실행 (스타크래프트)',u:'battlenet://',d:'https://download.battle.net/',n:'Battle.net'}];
function showPc(){
  const ph=isPhone();
  openM(`<h3>🖥 PC 코너</h3>
  <div class="qform"><b>📊 롤 전적 검색</b><div class="qbtn">${PC_LOL.map(([t,u])=>`<a class="xb" href="${u}" target="_blank" rel="noopener">${t}</a>`).join('')}</div></div>
  <div class="qform"><b>🎮 내 컴퓨터의 게임 켜기</b>${ph?'<p style="font-size:12px;margin-top:6px">게임 실행은 PC에서만 할 수 있어요.</p>':`<p style="font-size:11px;opacity:.8;margin:4px 0">브라우저가 "앱을 열까요?" 하고 물으면 허용해 주세요.</p><div class="qbtn">${PC_APPS.map((a,i)=>`<button class="xb" onclick="pcRun(${i})">${a.t}</button>`).join('')}</div>`}
  <div id="pcR" class="qerr" hidden></div>
  <p style="font-size:12px;margin-top:8px"><b>⚔ 리그 오브 레전드</b> · 공식 사이트에서 다운로드하거나 설치된 라이엇 클라이언트를 직접 켜 주세요.</p><div class="qbtn"><a class="xb" href="https://www.leagueoflegends.com/ko-kr/" target="_blank" rel="noopener">공식 사이트 열기</a></div></div>`);
}
function pcRun(i){
  const a=PC_APPS[i],R=$('#pcR');let left=false;const on=()=>{left=true};window.addEventListener('blur',on,{once:true});
  R.hidden=true;location.href=a.u;
  setTimeout(()=>{window.removeEventListener('blur',on);const r=$('#pcR');if(left||!r)return;r.hidden=false;r.innerHTML=`${a.n}이(가) 켜지지 않았다면 설치되어 있지 않을 수 있어요. <a href="${a.d}" target="_blank" rel="noopener">설치 페이지 열기</a>`},2000);
}
function showProjects(){
  openM('<h3>🗂 프로젝트 전시관</h3>'+PROJECTS.map(p=>`<div class="qform"><b>${esc(p.t)}</b><p style="font-size:12px;line-height:1.6;margin:6px 0 8px">${esc(p.d)}</p><a class="xb" href="${esc(p.u)}" target="_blank" rel="noopener">${esc(p.b)}</a></div>`).join('')+
  `<div class="qform"><b>✉ 연락처</b><p style="font-size:13px;margin:6px 0 8px">${esc(CONTACT_MAIL)}</p><a class="xb" href="mailto:${esc(CONTACT_MAIL)}">메일 보내기</a> <a class="xb kko" href="${KAKAO_URL}" target="_blank" rel="noopener">💬 카카오톡 오픈채팅</a></div>`);
}

/* ===== 보성 사진관: 사진을 photos 폴더에 올리고 아래에 한 줄씩 적으면 됩니다 =====
   예) {file:'photos/jeju1.jpg',title:'사진 제목',date:'2026.11'}, */
const PHOTOS=[
];
/* 벽 액자 11개와 세워 둔 그림 6개. 이 수까지만 걸리고 나머지는 데스크에서 볼 수 있음 */
const FRAME_MAX=17,EASELS=[[9,5],[13,5],[17,5],[4,7],[8,7],[18,7]],frameIdx=(x,y)=>11+EASELS.findIndex(e=>e[0]==x&&e[1]==y);
const PHOTO_IMGS=PHOTOS.slice(0,FRAME_MAX).map(p=>{const i=new Image();i.src=p.file;return i});
BACKS.ph=()=>showPhotos();
let WALL=null;
const FRM={};   // 액자별로 직접 올린 사진 { 자리번호: 행 }
async function wallLoad(){if(WALL)return WALL;let rows=[];try{rows=await DB.req('travel_photo?select=*&or=(place.eq.wall,place.like.frame:*)&order=id.desc&limit=300')}catch(e){rows=[]}
  WALL=rows.filter(r=>r.place=='wall');Object.keys(FRM).forEach(k=>delete FRM[k]);rows.forEach(r=>{const m=/^frame:(\d+)$/.exec(r.place||'');if(m&&!FRM[m[1]])FRM[m[1]]=r});frameBuild();return WALL}
let FRAME_L=[];
function frameBuild(){const pool=PHOTOS.map(p=>({src:p.file,cap:p.title||''})).concat(WALL.map(p=>({src:trvUrl(p.path),cap:p.caption||'',id:p.id})));let k=0;FRAME_L=[];for(let i=0;i<FRAME_MAX;i++){const r=FRM[i];FRAME_L.push(r?{src:trvUrl(r.path),cap:r.caption||'',id:r.id,own:r}:(k<pool.length?pool[k++]:null))}PHOTO_IMGS.length=0;FRAME_L.forEach((it,i)=>{if(!it)return;const im=new Image();im.src=it.src;PHOTO_IMGS[i]=im})}
function frameItems(){return FRAME_L}
async function showFrame(i){await wallLoad();const L=frameItems(),p=L[i],ad=DB.admin();if(!p){if(ad)return frameUp(i);toast('아직 빈 자리예요. 사진이 더 걸리면 채워져요. 🖼');return}const has=L.map((x,k)=>x?k:-1).filter(k=>k>=0),at0=has.indexOf(i),n=has.length,pv=has[(at0-1+n)%n],nx=has[(at0+1)%n];
  openM(`<h3>🖼 ${esc(p.cap||'보성의 사진')}</h3><img src="${esc(p.src)}" alt="${esc(p.cap||'사진')}" style="width:100%;max-height:60vh;object-fit:contain;background:#111827;border-radius:8px;cursor:zoom-in" onclick="lbOpen(this.src,this.alt)"><div class="xrow" style="margin-top:8px;gap:6px;justify-content:center;flex-wrap:wrap"><button class="xb" onclick="showFrame(${pv})">◀ 이전</button><small>${at0+1} / ${n}</small><button class="xb" onclick="showFrame(${nx})">다음 ▶</button>${ad&&p.id?`<button class="xb" onclick="capEdit(${Number(p.id)},'wall',${i})">✏ 설명</button>`:''}${ad?`<button class="xb" onclick="frameUp(${i})">📷 사진 바꾸기</button>`:''}${ad&&p.own?`<button class="xb r" onclick="frameDel(${i})">지우기</button>`:''}</div>`)}
function frameUp(i){if(!DB.admin())return toast('운영자 로그인이 필요해요.');openM(`<h3>📷 ${i+1}번 액자에 사진 올리기</h3><input id="frF" type="file" accept="image/*" class="xin"><input id="frC" class="xin" maxlength="80" placeholder="설명 (선택)" value="${esc((FRAME_L[i]&&FRAME_L[i].cap)||'')}" style="margin-top:6px" onkeydown="event.stopPropagation()"><div id="frM" style="font-size:12px;margin:6px 0;opacity:.8">이 자리의 사진만 바뀌어요.</div><div class="xcol"><button class="xb big" onclick="frameSend(${i})">올리기</button></div>`)}
async function frameSend(i){if(!DB.admin())return toast('운영자 로그인이 필요해요.');const F=$('#frF').files[0],cap=$('#frC').value.trim(),m=$('#frM');if(!F)return toast('사진을 골라 주세요.');try{m.textContent='확인하는 중…';let tag='';try{const dg=await crypto.subtle.digest('SHA-256',await F.arrayBuffer());tag=[...new Uint8Array(dg)].slice(0,8).map(b=>b.toString(16).padStart(2,'0')).join('')}catch(_){}if(tag){const others=Object.entries(FRM).filter(([k])=>+k!=i).map(([,r])=>r.path).concat((WALL||[]).map(r=>r.path));if(others.some(s=>String(s).includes(tag))){m.textContent='이 사진은 이미 다른 액자에 걸려 있어요. 같은 사진은 한 곳에만 걸 수 있어요.';return}}m.textContent='올리는 중…';const blob=await trvShrink(F),path='frame/'+i+'-'+(tag||'x')+'-'+Date.now()+'.jpg',r=await trvStore('POST',path,blob);if(!r.ok){const e=new Error(await r.text());e.status=r.status;throw e}await DB.req('travel_photo',{method:'POST',body:JSON.stringify({place:'frame:'+i,path,caption:cap||null})});const old=FRM[i];if(old){try{await DB.req('travel_photo?id=eq.'+Number(old.id),{method:'DELETE'});await trvStore('DELETE',old.path)}catch(e){}}WALL=null;await wallLoad();toast('액자에 걸었어요! 🖼');showFrame(i)}catch(e){m.textContent='문제가 생겼어요: '+(e.status==401||e.status==403?'로그인이 만료됐거나 권한이 없어요.':/bucket/i.test(e.message||'')?'supabase_travel.sql 실행이 필요해요.':(e.message||'연결 실패'))}}
async function frameDel(i){const r=FRM[i];if(!r||!confirm('이 액자의 사진을 지울까요?'))return;try{await DB.req('travel_photo?id=eq.'+Number(r.id),{method:'DELETE'});await trvStore('DELETE',r.path);WALL=null;await wallLoad();toast('지웠어요.');if(FRAME_L[i])showFrame(i);else closeM()}catch(e){toast(dbErr(e))}}
async function capEdit(id,place,fr){let cur_='';try{const r=await DB.req('travel_photo?select=caption&id=eq.'+Number(id));cur_=r&&r[0]&&r[0].caption||''}catch(e){}
  openM(`<h3>✏ 사진 설명 고치기</h3><input id="capI" class="xin" maxlength="80" value="${esc(cur_)}" placeholder="사진 설명" onkeydown="if(event.key=='Enter')capSave(${Number(id)},'${esc(place)}',${fr==null?'null':Number(fr)})"><div class="qbtn" style="margin-top:8px"><button class="xb" onclick="capSave(${Number(id)},'${esc(place)}',${fr==null?'null':Number(fr)})">저장</button></div><small style="opacity:.7">비우고 저장하면 설명이 지워져요.</small>`)}
async function capSave(id,place,fr){const v=($('#capI').value||'').trim().slice(0,80);try{await DB.req('travel_photo?id=eq.'+Number(id),{method:'PATCH',body:JSON.stringify({caption:v||null})});toast('설명을 고쳤어요.');WALL=null;TRV.cntOk=0;if(fr!=null){await wallLoad();showFrame(fr)}else if(place=='wall')showPhotos();else trvPlace(place)}catch(e){toast(dbErr(e))}}
async function showPhotos(){
  openM('<h3>🖼 보성 사진관</h3><p style="font-size:12px;opacity:.8">불러오는 중…</p>');
  WALL=null;const up=await wallLoad();if(!modal)return;const ad=DB.admin();
  const fr=Object.keys(FRM).sort((a,b)=>a-b).map(k=>FRM[k]).filter((r,i,a)=>a.findIndex(q=>q.id==r.id)==i&&!up.some(q=>q.id==r.id));const fig=fr.concat(up).map(p=>trvFig(p,ad,"showPhotos")).join('')+PHOTOS.map(p=>`<figure><img src="${esc(p.file)}" alt="${esc(p.title||'사진')}" loading="lazy" onclick="lbOpen(this.src,this.alt)" onerror="this.closest('figure').remove()"><figcaption>${esc(p.title||'')}${p.date?` <small>${esc(p.date)}</small>`:''}</figcaption></figure>`).join('');
  openM('<h3>🖼 보성 사진관</h3><div class="qbtn"><button class="xb" onclick="showTravel()">🗺 여행 지도</button></div>'+(fig?'<div class="pgrid">'+fig+'</div>':'<div class="cd">주인장이 걸 사진을 고르고 있어요. 📷</div>')+(up.length+PHOTOS.length>FRAME_MAX?`<p style="font-size:12px;opacity:.75">벽과 그림 자리에는 최신 ${FRAME_MAX}장만 걸려요. 나머지는 여기서 볼 수 있어요.</p>`:'')+trvUp('wall','ph'));
}

/* ===== 여행 지도 ===== */
const TRV_URL={w:'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json',d:'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json'};
const TRV_C=['392','410','344','446','250','724','276','756','203','792','380','336','040'];   // 다녀온 나라 (ISO 번호)
const TRV_V={
  world:{n:'🌏 세계',b:[-180,180,-58,80],src:'w'},
  kr:{n:'🇰🇷 대한민국',b:[125.3,130.3,33,38.8],src:'d',c:['410'],hub:[36.2,127.9]},
  jp:{n:'🇯🇵 일본',b:[128.3,141,32.4,37.2],src:'d',c:['392'],hub:[36,138.5]},
  eu:{n:'🇪🇺 유럽·튀르키예',b:[-5.5,31,35.5,52.2],src:'d',c:['250','724','276','756','203','792','380','336','040'],hub:[47,9]},
  hk:{n:'🇭🇰 홍콩·마카오',b:[113.3,114.6,21.9,22.7],src:'d',c:['344','446'],hub:[22.3,114.2]}
};
/* 장소를 늘리려면 [키, 이름, 지도, 나라 묶음, 위도, 경도, 글자 방향(l이면 왼쪽)] 한 줄만 더하면 됩니다 */
const TRV_P=[
 ['seoul','서울','kr','대한민국',37.57,126.98],['incheon','인천','kr','대한민국',37.46,126.71,'l'],['suwon','수원','kr','대한민국',37.26,127.03],['sokcho','속초','kr','대한민국',38.21,128.59],['gangneung','강릉','kr','대한민국',37.75,128.88],['donghae','동해','kr','대한민국',37.52,129.11],['cheongju','청주','kr','대한민국',36.64,127.49],['cheonan','천안','kr','대한민국',36.81,127.11,'l'],['daejeon','대전','kr','대한민국',36.35,127.38],['gyeryong','계룡','kr','대한민국',36.27,127.25,'l u'],['nonsan','논산','kr','대한민국',36.19,127.10,'l d'],['gunsan','군산','kr','대한민국',35.97,126.74,'l'],['iksan','익산','kr','대한민국',35.95,126.96,'u'],['jeonju','전주','kr','대한민국',35.82,127.15],['gwangju','광주','kr','대한민국',35.16,126.85],['daegu','대구','kr','대한민국',35.87,128.60],['gyeongju','경주','kr','대한민국',35.86,129.22],['ulsan','울산','kr','대한민국',35.54,129.31],['busan','부산','kr','대한민국',35.18,129.08],['jeju','제주','kr','대한민국',33.50,126.53],
 ['tsushima','대마도','jp','일본',34.41,129.33],['fukuoka','후쿠오카','jp','일본',33.59,130.40],['osaka','오사카','jp','일본',34.69,135.50],['kobe','고베','jp','일본',34.69,135.18,'l'],['nara','나라','jp','일본',34.46,135.83],['nagoya','나고야','jp','일본',35.18,136.91],['tokyo','도쿄','jp','일본',35.68,139.69],
 ['hongkong','홍콩','hk','홍콩',22.30,114.17],['macau','마카오','hk','마카오',22.19,113.55],
 ['paris','파리','eu','프랑스',48.86,2.35],['lyon','리옹','eu','프랑스',45.76,4.84,'l'],['aix','엑상프로방스','eu','프랑스',43.53,5.45,'u'],['marseille','마르세유','eu','프랑스',43.30,5.37,'l d'],['barcelona','바르셀로나','eu','스페인',41.39,2.17],['madrid','마드리드','eu','스페인',40.42,-3.70],['munich','뮌헨','eu','독일',48.14,11.58,'l'],['interlaken','인터라켄','eu','스위스',46.69,7.86],['prague','프라하','eu','체코',50.08,14.44],['salzburg','잘츠부르크','eu','오스트리아',47.81,13.05],['florence','피렌체','eu','이탈리아',43.77,11.25],['rome','로마','eu','이탈리아',41.90,12.50,'l'],['vatican','바티칸','eu','바티칸',41.90,12.45],['naples','나폴리','eu','이탈리아',40.85,14.27],['istanbul','이스탄불','eu','튀르키예',41.01,28.98,'l']
];
const trvName=k=>k=='wall'?'사진관 벽':(TRV_P.find(p=>p[0]==k)||[])[1]||k;
const trvUrl=p=>DBCFG.url+'/storage/v1/object/public/travel/'+String(p).split('/').map(encodeURIComponent).join('/');
const TRV={cache:{},cnt:{},view:'world',shapes:null,proj:null};
async function trvGeo(src){
  if(TRV.cache[src])return TRV.cache[src];
  const r=await fetch(TRV_URL[src]);if(!r.ok)throw new Error('map');const t=await r.json();
  const {scale:[sx,sy],translate:[tx,ty]}=t.transform;
  const arcs=t.arcs.map(a=>{let x=0,y=0;return a.map(([dx,dy])=>{x+=dx;y+=dy;return[x*sx+tx,y*sy+ty]})});
  const ring=R=>{const o=[];R.forEach(i=>{const A=i<0?arcs[~i].slice().reverse():arcs[i];o.push(...(o.length?A.slice(1):A))});return o};
  return TRV.cache[src]=t.objects.countries.geometries.flatMap(g=>{const P=g.type=='Polygon'?[g.arcs]:g.type=='MultiPolygon'?g.arcs:[];return P.map(pl=>({id:String(g.id),rings:pl.map(ring)}))});
}
function trvHit(rings,x,y){let inn=false;for(const r of rings)for(let i=0,j=r.length-1;i<r.length;j=i++){const[a,b]=r[i],[c,d]=r[j];if((b>y)!=(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inn=!inn}return inn}
function trvDraw(shapes,v,w,h,on){
  const [x0,x1,y0,y1]=v.b,cell=2,W2=Math.round(w/cell),H2=Math.round(h/cell),o=document.createElement('canvas');o.width=W2;o.height=H2;const g=o.getContext('2d',{willReadFrequently:true});
  g.fillStyle='#17324f';g.fillRect(0,0,W2,H2);const X=a=>(a-x0)/(x1-x0)*W2,Y=a=>(y1-a)/(y1-y0)*H2;
  const trace=s=>{g.beginPath();s.rings.forEach(r=>{const wrap=r.some(([a],i)=>i&&Math.abs(a-r[i-1][0])>180);r.forEach(([a,b],i)=>{if(wrap&&a<0)a+=360;i?g.lineTo(X(a),Y(b)):g.moveTo(X(a),Y(b))});g.closePath()})};
  shapes.forEach(s=>{trace(s);g.fillStyle=on.includes(s.id)?'#fb923c':'#64748b';g.fill('evenodd')});
  const PAL=[[23,50,79],[251,146,60],[100,116,139]],im=g.getImageData(0,0,W2,H2),D=im.data;
  for(let i=0;i<D.length;i+=4){let m=0,bd=1e9;PAL.forEach((p,k)=>{const q=(p[0]-D[i])**2+(p[1]-D[i+1])**2+(p[2]-D[i+2])**2;if(q<bd){bd=q;m=k}});[D[i],D[i+1],D[i+2]]=PAL[m];D[i+3]=255}
  g.putImageData(im,0,0);return o;
}
async function trvCounts(){try{const L=await DB.req('travel_photo?select=place&limit=5000');TRV.cnt={};L.forEach(r=>TRV.cnt[r.place]=(TRV.cnt[r.place]||0)+1)}catch(e){}}
async function showTravel(view){
  view=view||TRV.view||'world';TRV.view=view;const v=TRV_V[view],P=TRV_P.filter(p=>p[2]==view);
  const tabs=Object.entries(TRV_V).map(([k,o])=>`<button class="xb ${k==view?'on':''}" onclick="showTravel('${k}')">${o.n}</button>`).join('');
  const grp=[...new Set(P.map(p=>p[3]))].map(n=>`<b style="font-size:12px">${esc(n)}</b><div class="tchips">${P.filter(p=>p[3]==n).map(p=>`<button class="xb" onclick="trvPlace('${p[0]}')">${esc(p[1])}${TRV.cnt[p[0]]?` 📷${TRV.cnt[p[0]]}`:''}</button>`).join('')}</div>`).join('');
  openM(`<h3>🗺 보성의 여행 지도</h3><p style="font-size:12px;opacity:.8">주황색이 다녀온 곳이에요. ${view=='world'?'색칠된 나라나 핀을 누르면 가까이 볼 수 있어요.':'도시를 누르면 사진을 볼 수 있어요.'}</p>
  <div class="tchips">${tabs}</div><div class="tmap" id="tmap"><canvas id="tcv"></canvas></div>
  <div id="tmsg" style="font-size:12px;opacity:.8"></div>${view=='world'?`<p style="font-size:12px">나라 ${TRV_C.length}곳 · 도시 ${TRV_P.length}곳을 다녀왔어요.</p>`:grp}`);
  KC.on=false;kcSel(null);
  const wrap=$('#tmap'),cv=$('#tcv'),w=wrap.clientWidth||480,[x0,x1,y0,y1]=v.b,mid=(y0+y1)/2*Math.PI/180,h=Math.min(Math.round(w*(y1-y0)/((x1-x0)*Math.cos(view=='world'?0:mid))),Math.max(320,Math.round(innerHeight*.62)));
  cv.width=Math.round(w/2);cv.height=Math.round(h/2);cv.style.aspectRatio=cv.width+'/'+cv.height;
  const ctx=cv.getContext('2d');ctx.fillStyle='#17324f';ctx.fillRect(0,0,cv.width,cv.height);
  const pct=(lat,lon)=>`left:${(lon-x0)/(x1-x0)*100}%;top:${(y1-lat)/(y1-y0)*100}%`;
  wrap.insertAdjacentHTML('beforeend',view=='world'
    ?Object.entries(TRV_V).filter(([k])=>k!='world').map(([k,o])=>`<button class="tpin hub ${k=='kr'?'l':''}" style="${pct(o.hub[0],o.hub[1])}" onclick="showTravel('${k}')"><i></i>${esc(o.n.split(' ')[1])}</button>`).join('')
    :P.map(p=>`<button class="tpin ${p[6]||''} ${TRV.cnt[p[0]]?'has':''}" style="${pct(p[4],p[5])}" onclick="trvPlace('${p[0]}')"><i></i><span>${esc(p[1])}</span></button>`).join(''));
  trvCounts().then(()=>{if(modal&&$('#tmap')&&TRV.view==view&&!TRV.cntOk){TRV.cntOk=1;showTravel(view)}});
  let shapes;try{shapes=await trvGeo(v.src)}catch(e){const m=$('#tmsg');if(m)m.textContent='지도 그림을 불러오지 못했어요. 아래 도시 목록으로 볼 수 있어요.';return}
  if(!$('#tcv')||TRV.view!=view)return;
  $('#tcv').getContext('2d').drawImage(trvDraw(shapes,v,cv.width*2,cv.height*2,TRV_C),0,0,cv.width,cv.height);
  $('#tcv').onclick=e=>{if(view!='world')return;const r=e.target.getBoundingClientRect(),lon=x0+(e.clientX-r.left)/r.width*(x1-x0),lat=y1-(e.clientY-r.top)/r.height*(y1-y0),s=shapes.find(q=>TRV_C.includes(q.id)&&trvHit(q.rings,lon,lat));if(!s)return;const k=Object.keys(TRV_V).find(k=>(TRV_V[k].c||[]).includes(s.id));if(k)showTravel(k)};
}
const trvFig=(p,ad,back)=>`<figure><img src="${esc(trvUrl(p.path))}" alt="${esc(p.caption||trvName(p.place))}" loading="lazy" onclick="lbOpen(this.src,this.alt)"><figcaption>${esc(p.caption||'')}${ad?` <button class="xb" style="padding:2px 6px" onclick="capEdit(${Number(p.id)},'${esc(p.place)}')">✏ 설명</button> <button class="xb r" style="padding:2px 6px" onclick="trvDel(${Number(p.id)},'${esc(p.path)}','${esc(p.place)}')">✕ 삭제</button>`:''}</figcaption></figure>`;
const trvUp=(place,k)=>DB.admin()?`<div class="qform" style="margin-top:10px"><b>📤 사진 올리기</b><input id="tCap" class="xin" maxlength="80" placeholder="사진 설명 (선택)" style="margin:6px 0"><input id="tFile" type="file" accept="image/*" multiple style="font-size:12px;width:100%"><div class="qbtn"><button class="xb" onclick="trvSend('${place}')">올리기</button></div><small id="tUpMsg" style="opacity:.8">긴 쪽 1600px로 줄이고, 촬영 위치 같은 파일 정보는 지운 뒤 올려요.</small></div>${adm(k)}`:adm(k);
BACKS.tr=()=>trvPlace(TRV.place||'seoul');
async function trvPlace(k){
  TRV.place=k;const P=TRV_P.find(p=>p[0]==k);
  openM(`<h3>📍 ${esc(trvName(k))}</h3><p style="font-size:12px;opacity:.8">불러오는 중…</p>`);
  let L=[],err='';try{L=await DB.req('travel_photo?select=*&place=eq.'+encodeURIComponent(k)+'&order=id.desc&limit=200')}catch(e){err=e.status==404||/PGRST|42P01/.test(e.message||'')?'사진 저장소 설정이 아직 안 끝났어요. (supabase_travel.sql 실행 필요)':dbErr(e)}
  if(!modal||TRV.place!=k)return;const ad=DB.admin();
  openM(`<h3>📍 ${esc(trvName(k))}</h3><p style="font-size:12px;opacity:.8">${esc(P?P[3]:'')}</p><div class="qbtn"><button class="xb" onclick="showTravel('${P?P[2]:'world'}')">← 지도로</button></div>`+
    (err?`<div class="cd">${esc(err)}</div>`:L.length?'<div class="pgrid">'+L.map(p=>trvFig(p,ad)).join('')+'</div>':'<div class="cd">아직 올린 사진이 없어요. 📷</div>')+trvUp(k,'tr'));
}
async function trvShrink(file){
  let src;try{src=await createImageBitmap(file,{imageOrientation:'from-image'})}catch(e){throw new Error('이 형식은 열 수 없어요. JPG나 PNG로 바꿔 주세요: '+file.name)}
  const m=Math.min(1,1600/Math.max(src.width,src.height)),c=document.createElement('canvas');c.width=Math.round(src.width*m);c.height=Math.round(src.height*m);c.getContext('2d').drawImage(src,0,0,c.width,c.height);src.close&&src.close();
  return new Promise((ok,no)=>c.toBlob(b=>b?ok(b):no(new Error('변환 실패')),'image/jpeg',.85));
}
function trvStore(method,path,body){return fetch(DBCFG.url+'/storage/v1/object/travel/'+path.split('/').map(encodeURIComponent).join('/'),{method,body,headers:{apikey:DBCFG.key,Authorization:'Bearer '+DB.tok,...(body?{'Content-Type':'image/jpeg'}:{})}})}
async function trvSend(place){
  if(!DB.admin())return toast('운영자 로그인이 필요해요.');
  const F=[...$('#tFile').files],cap=$('#tCap').value.trim(),m=$('#tUpMsg');if(!F.length)return toast('사진을 골라 주세요.');
  let n=0;
  try{for(const f of F){m.textContent=`올리는 중… ${n+1} / ${F.length}`;
      const blob=await trvShrink(f),path=`${place}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.jpg`,r=await trvStore('POST',path,blob);
      if(!r.ok){const e=new Error(await r.text());e.status=r.status;throw e}
      await DB.req('travel_photo',{method:'POST',body:JSON.stringify({place,path,caption:cap||null})});n++}
    toast(n+'장 올렸어요! 📷');TRV.cntOk=0;WALL=null;place=='wall'?showPhotos():trvPlace(place);
  }catch(e){m.textContent=(n?n+'장은 올렸고, 나머지에서 ':'')+'문제가 생겼어요: '+(e.status?(e.status==401||e.status==403?'로그인이 만료됐거나 권한이 없어요.':/bucket/i.test(e.message)?'supabase_travel.sql 실행이 필요해요.':'저장소 오류('+e.status+')'):e.message||'연결 실패');toast('사진을 다 올리지 못했어요.')}
}
async function trvDel(id,path,place){
  if(!confirm('이 사진을 지울까요?'))return;
  try{await DB.req('travel_photo?id=eq.'+id,{method:'DELETE'});await trvStore('DELETE',path);toast('지웠어요.');TRV.cntOk=0;WALL=null;place=='wall'?showPhotos():trvPlace(place)}catch(e){toast(dbErr(e))}
}

/* ===== 맨몸 운동 기록 ===== */
const FIT_K={pushup:'💪 팔굽혀펴기',pullup:'🏋 철봉',situp:'🔥 윗몸일으키기',rope:'🪢 줄넘기',bench:'🏋 벤치프레스',run:'🏃 러닝머신'};
BACKS.fit=()=>showFit();
async function showFit(){
  openM('<h3>📈 운동 기록</h3><p style="font-size:12px;opacity:.8">불러오는 중…</p>');
  let rows=[],err='';
  try{rows=await DB.req('workout?select=*&order=day.desc,id.desc&limit=200')}catch(e){err=dbErr(e)}
  const ad=DB.admin(),today=new Date(Date.now()+9*36e5).toISOString().slice(0,10);
  const card=k=>{const L=rows.filter(r=>r.kind==k),best=L.reduce((m,r)=>Math.max(m,r.cnt),0),sum=L.reduce((m,r)=>m+r.cnt,0);
    return `<div class="qform"><b>${FIT_K[k]}</b><p style="font-size:12px;margin:4px 0">최고 <b>${best}</b>회 · 누적 <b>${sum.toLocaleString('ko-KR')}</b>회</p>`+
    (L.slice(0,5).map(r=>`<div class="xrow" style="margin:3px 0;padding:4px 8px"><span>${esc(r.day)}</span><b>${r.cnt}회</b>${r.note?`<small>${esc(r.note)}</small>`:''}${ad?`<button class="xb r" style="padding:2px 6px" onclick="fitDel(${r.id})">✕</button>`:''}</div>`).join('')||'<small style="opacity:.7">아직 기록이 없어요.</small>')+'</div>'};
  openM(`<h3>📈 운동 기록</h3>${adm('fit')}`+exCard()+(err?`<div class="cd">${esc(err)}</div>`:Object.keys(FIT_K).map(card).join(''))+
    (ad?`<div class="qform"><b>기록 남기기</b><input id="ftd" class="xin" type="date" value="${today}" style="margin-top:6px"><select id="ftk" class="xin" style="margin-top:6px"><option value="pushup">팔굽혀펴기</option><option value="pullup">철봉</option><option value="situp">윗몸일으키기</option><option value="rope">줄넘기</option><option value="bench">벤치프레스</option><option value="run">러닝머신</option></select><input id="ftc" class="xin" type="number" min="1" inputmode="numeric" placeholder="횟수" style="margin-top:6px"><input id="ftn" class="xin" maxlength="60" placeholder="메모 (선택)" style="margin-top:6px"><div class="qbtn"><button class="xb" onclick="fitAdd()">저장</button></div></div>`:''));
}
async function fitAdd(){
  const day=$('#ftd').value,kind=$('#ftk').value,cnt=parseInt($('#ftc').value,10),note=$('#ftn').value.trim();
  if(!day)return toast('날짜를 골라 주세요.');if(!(cnt>=1&&cnt<=100000))return toast('횟수를 입력해 주세요.');
  try{await DB.req('workout',{method:'POST',body:JSON.stringify({day,kind,cnt,note:note||null}),h:{Prefer:'return=minimal'}});toast('기록했어요! 💪');showFit()}catch(e){toast(dbErr(e))}
}
async function fitDel(id){try{await DB.req('workout?id=eq.'+id,{method:'DELETE',h:{Prefer:'return=minimal'}});showFit()}catch(e){toast(dbErr(e))}}

/* ===== 저장, 퀘스트, 이스터 에그 ===== */
const FAMILY=['보성 할머니','보성 외할머니','보성 할아버지','보성 외할아버지','보성 아버지','보성 어머니','보성 여동생'];
const EGGS=[['lol','주인장의 비밀 컴퓨터','PC 코너 구석 자리…'],['cave','비밀 동굴을 찾았다','숲의 흔들리는 나무…'],['konami','전설의 커맨드','↑↑↓↓…'],['cat','고양이 친구','누군가에게 열 번 말을 걸면?'],['steps','167걸음','주인장에게 의미 있는 숫자만큼 걷기'],['star','별지기를 만났다','자정 무렵의 마을']];
const EGG_N=EGGS.length;
const QUESTS=[
  {t:'🌱 첫 발걸음',d:'제주시에 도착하기',ok:()=>visited.has('town')},
  {t:'🧠 지식의 도시',d:'자격 검정원이나 멘사 연구소 들어가기',ok:()=>visited.has('agency')||visited.has('mensa')},
  {t:'💪 사라봉',d:'체육관 둘러보기',ok:()=>visited.has('gym')},
  {t:'🩸 서귀포 헌혈의 집',d:'서귀포 헌혈의 집 들어가기',ok:()=>visited.has('vc')||visited.has('vol')},
  {t:'🍊 귤밭 일손',d:'감귤 과수원에 가기',ok:()=>visited.has('orchard')},
  {t:'✈ 하늘 길',d:'공항 터미널과 활주로 둘러보기',ok:()=>visited.has('terminal')&&visited.has('airport')},
  {t:'🎧 쉼표 하나',d:'공원 음악 서재 들어가기',ok:()=>visited.has('library')},
  {t:'🏖 백사장',d:'하얀 백사장에 가기',ok:()=>visited.has('beach')},
  {t:'🎮 게임 센터',d:'테트리스 한 판 하기',ok:()=>S.met.tetris},
  {t:'🎨 작품 구경',d:'삼화지구 프로젝트 전시관과 공원 사진관 둘러보기',ok:()=>visited.has('agency')&&visited.has('photo')},
  {t:'👨‍👩‍👧 우리 가족',d:'가족 7명에게 모두 인사하기',ok:()=>FAMILY.every(n=>S.met[n])},
  {t:'🏙 서울 나들이',d:'국내선으로 날아가 김포공항에 내려 용산·여의도·대방·노량진·노들 다니기',ok:()=>['gimpo','yongsan','yeouido','daebang','noryangjin','nodeul'].every(k=>visited.has(k))},
  {t:'🥚 숨은 이야기',d:'이스터 에그 '+EGG_N+'개 모두 찾기',ok:()=>Object.keys(S.eggs).length>=EGG_N}
];
const S={eggs:{},met:{},catN:0,end:false,pos:null};
function saveLoad(){try{const d=JSON.parse(localStorage.getItem('bsw_save')||'null');if(!d)return;(d.v||[]).forEach(k=>visited.add(k));steps=d.steps||0;S.eggs=d.eggs||{};S.met=d.met||{};S.catN=d.catN||0;S.end=!!d.end;S.pos=d.pos||null}catch(e){}}
function saveGame(){try{localStorage.setItem('bsw_save',JSON.stringify({v:[...visited],steps,eggs:S.eggs,met:S.met,catN:S.catN,end:S.end,pos:cur&&M[cur]?[cur,px,py]:S.pos}))}catch(e){}}
function saveReset(){openM('<h3>진행 기록 지우기</h3><p style="font-size:13px">이 브라우저의 퀘스트와 이스터 에그 기록을 지울까요?</p><div class="qbtn"><button class="xb r" onclick="saveWipe()">지우기</button><button class="xb" onclick="showQuestLog()">취소</button></div>')}
function saveWipe(){try{localStorage.removeItem('bsw_save')}catch(e){}location.reload()}
let questKey='',lvNow=0;
/* 퀘스트를 다 깨면 92년생의 올해 나이(연 나이)가 최종 레벨 */
const BIRTH_YEAR=1992,lvMax=()=>Math.max(2,new Date(Date.now()+9*36e5).getUTCFullYear()-BIRTH_YEAR);
function lvCalc(){const d=QUESTS.filter(q=>q.ok()).length;return 1+Math.round(Math.max(0,d-1)/(QUESTS.length-1)*(lvMax()-1))}   // 시작하자마자 깨지는 첫 퀘스트는 Lv.1
function lvUpdate(){
  const L=lvCalc(),el=$('#lvText');if(!el)return;el.textContent='Lv. '+String(L).padStart(2,'0');
  if(lvNow&&L>lvNow){const c=el.closest('.avatar-card');c.classList.remove('lvup');c.querySelector('.lvpop')?.remove();void c.offsetWidth;c.classList.add('lvup');const p=document.createElement('div');p.className='lvpop';p.textContent='LEVEL UP!';c.append(p);setTimeout(()=>{p.remove();c.classList.remove('lvup')},1900)}
  lvNow=L;
}
function questRender(){
  const el=document.getElementById('questList');if(!el)return;
  const key=QUESTS.map(q=>q.ok()?1:0).join('')+Object.keys(S.eggs).length;if(key===questKey)return;questKey=key;
  lvUpdate();
  el.innerHTML=QUESTS.map(q=>`<div class="quest"><b>${q.t}</b><small>${q.d}</small><div class="qtag">${q.ok()?'완료':'미완료'}</div></div>`).join('');
  questEnd();
}
function questEnd(){
  if(S.end||!QUESTS.every(q=>q.ok()))return;S.end=true;saveGame();
  setTimeout(()=>{if(modal||dlg)return;openM(`<h3>🏅 BS World 명예 주민</h3><div class="cd">모든 퀘스트와 이스터 에그를 찾았어요! 여기까지 와 준 사람은 많지 않을 거예요.<br><br>이제부터 당신의 옷은 감귤색입니다. 🍊</div>`)},900);
}
function eggGet(id,msg){if(S.eggs[id])return;S.eggs[id]=1;sfx('w');toast('🥚 이스터 에그 발견! '+msg);saveGame();updateHUD()}
function npcMet(n){
  if(FAMILY.includes(n.n)&&!S.met[n.n]){S.met[n.n]=1;saveGame();updateHUD()}
  if(n.eg)eggGet(n.eg,'별지기를 만났다');
  if(n.n=='고양이'&&++S.catN>=10&&!S.eggs.cat){eggGet('cat','고양이가 친구를 불렀다. 뒷마당을 다시 보자! 🐶');if(cur=='route1')buildNpcs()}
}
function caveChest(){
  eggGet('cave','비밀 동굴을 찾았다');
  say('낡은 상자',['상자 안에 쪽지가 들어 있다.','"여기까지 찾아왔다니 대단하네요. 이 세계는 계속 넓어질 거예요. 또 놀러 오세요. - 보성"']);
}
const KONAMI='u u d d l r l r b a'.split(' ');let kcBuf=[],orangeT=0;
function kcode(tok){kcBuf.push(tok);if(kcBuf.length>10)kcBuf.shift();if(kcBuf.join()==KONAMI.join()){kcBuf=[];orangeT=performance.now()+6000;eggGet('konami','하늘에서 귤이 내린다! 🍊')}}
function orangeFX(t){if(t>orangeT)return;g.font='18px sans-serif';for(let i=0;i<26;i++){const x=(i*37+t/9*(1+i%3)/2)%cv.width,y=((t/4+i*53)*(1+i%2)/2)%cv.height;g.fillText('🍊',x,y)}}

/* ===== 운영자: 답변을 기다리는 질문 표시 ===== */
let qAlertN=-1;
async function qAlert(){
  noteBell();
  let isAd=!!DB.tok;try{isAd=isAd||localStorage.getItem('bsw_admin_device')=='1'}catch(e){}
  if(!isAd)return;
  try{const L=await DB.rpc('qa_list'),n=L.filter(q=>!q.has_a&&!q.is_hidden).length,b=$('#qBell');
    b.hidden=!n;b.textContent='🔔 '+n;
    if(qAlertN>=0&&n>qAlertN)toast('🔔 새 방명록이 왔어요!');qAlertN=n;
  }catch(e){}
}
setInterval(qAlert,120000);

/* ===== 마을 NPC 대사 ===== */
const TALK={
 '마을 소년':[['어서 와! 여기가 BS World의 제주시이야.','북쪽엔 시청, 동쪽엔 과수원, 서쪽엔 원도심 거리, 남쪽엔 표선이 있어.'],['like station 동네사람들!! 새 손님 왔어요!!'],['어른들이 그러는데 숲에 이상한 나무가 있대.','나는 무서워서 못 가봤어. 진짜야.']],
 '꽃밭 이웃':[['꽃향기 맡고 가렴. 🌸','달리기 전엔 스트레칭 필수야!'],['어머, 오늘 럭키비키잖아? 꽃이 활짝 폈어.'],['제주 꽃은 바람을 이겨서 더 예쁜 거야.']],
 '등산객':[['자격증 공부는 마라톤이래. 페이스 조절이 전부지!'],['한라산 백록담 봤냐고요? 올라갔는데 구름만 봤습니다.','그것도 추억이죠, 뭐.'],['무릎이 먼저 포기하는 나이가 왔습니다.']],
 '꼬마 트레이너':[['나는 표선의 달리기 선수!','눈이 마주쳤으니 달리기 승부다!'],['어쩔티비~ 나 방금 신기록 세웠거든!'],['엄마가 해 지기 전에 들어오랬어. 그래서 지금 뛰는 거야.']],
 '여행자':[['감귤 향 나는 섬에 왔어요. 🍊'],['제주 와서 흑돼지 안 먹으면 불법 아닌가요?'],['렌터카 반납까지 3시간 남았는데, 저 지금 어디 있는 거죠?']],
 '시티 안내원':[['여기는 용담이에요.','보라색 지붕은 창작 공방이고, 김이 나는 건물은 찜질방이에요.'],['시험 전날 벼락치기요? 그건 기도의 영역입니다.'],['합격하면 저도 같이 울어 드립니다.']],
 '트랙 러너':[['하나, 둘! 하나, 둘!'],['숨차서 말 못 해요… 뛰는 중…'],['기록은 배신 안 해요. 무릎은 해도.']],
 '마라토너':[['헉헉… 하프코스는 21km래!'],['중꺾마! 중요한 건 꺾이지 않는 마라톤!'],['30km 지나면 인생이 보인다던데, 저는 편의점이 보였어요.']],
 '조깅 크루':[['트랙 한 바퀴 더!','감귤마라톤 10km도 같이 뛸래? 🍊'],['우리 크루 규칙: 뛰고 나서 치킨은 무효가 아니다.'],['가보자고~!']],
 '해변 산책러':[['파도 소리를 들으면 마음이 차분해져. 🌊'],['이 바다 사진은 필터가 필요 없어요. 진짜로요.'],['윤슬 보며 멍때리기 대회 있으면 제가 1등 해요.']],
 '감귤 농부 삼춘':[['제주 감귤이 맛좋수다게~ 🍊','혼저 옵서예. 한 입 먹어봅서게!'],['귤 하나 까봅서. 안 달믄 내가 책임지쿠다.'],['뭐랭하맨? 혼저 와서 귤 땁서!'],['무사 영 늦었수과? 귤은 안 기다려 줍니다게.'],['육지 사람들은 귤을 사 먹는댄 허난 신기허여게.']],
 '귤 따는 할망':[['오늘 귤은 당도가 막 좋쿠다게~'],['아이고 허리야. 그래도 귤 보민 웃음 나주게.'],['밥 먹언? 안 먹었걸랑 귤이라도 먹엉 갑서.'],['국은 맨도롱 또똣할 때 먹어사 맛 나는 거여.']],
 '농부 청년':[['귤 따는 철이 되민 눈코 뜰 새 없쥬.'],['퇴근이요? 귤나무한테 물어보세요.'],['저 T라서요, 귤 맛은 당도계로 말합니다.']],
 '메인 러닝 코치':null,
 '서브 러너':[['후… 후… 아 안녕!','기록은 숫자지만 완주는 이야기야. 파이팅!'],['오늘 운동 안 한 사람? 저요. 그래서 지금 합니다.']],
 '접수 도우미':[['컴퓨터에서 시험 접수를 하실 수 있어요.'],['응시료 환불 기간은 꼭 확인하세요. 제가 당해 봐서 압니다.']],
 '시험 준비생':[['으아… 정처기 실기 공부 중이에요.'],['이번엔 진짜 된다. 진짜로. 이번에는.'],['카페에서 공부하면 공부한 것 같은 기분은 확실히 듭니다.']],
 '봉사원':[['오늘도 봉사 활동 중! 😊'],['헌혈하고 받은 초코파이는 왜 더 맛있을까요?']],
 '고양이':[['야옹~ 🐱'],['(할아버지댁 뒷마당이 자기 구역이라는 표정이다.)'],['…(못 들은 척한다.)'],['(츄르를 가져왔냐는 눈빛이다.)']],
 '항공 정비사':[['기체 점검 이상 없음! ✈'],['비행기를 타고 싶으면 터미널 안 카운터로 가 봐.'],['동쪽으로 가면 활주로가 쭉 이어져요.']],
 '여행객':[['제주에 내리자마자 귤 냄새가 나는 것 같아요. 🍊'],['캐리어 바퀴가 돌담길에서 사망했습니다.']],
 '출장 가는 직장인':[['비행기 타기 전 감귤 주스 한 잔이 국룰이죠.'],['출장인데 왜 제주에 눈물이 나죠? 일 때문이에요.']],
 '마중 나온 삼춘':[['보성이 오는 날인가 해서 기다렴수다게.'],['게난 오늘이 아닌가?']],
 '음악 듣는 손님':[['이 서재에 오면 시간이 천천히 가는 것 같아요.'],['이 노래 뭐예요? 아, 벽에 적혀 있네요.']],
 '산책하는 사람':[['아무것도 안 해도 되는 시간이 제일 좋네요.'],['연못 앞 벤치 명당이에요. 제가 맡아 뒀어요.']],
 '원도심 산책객':[['돌담 옆으로 바다 보멍 걷는 원도심 거리라마씸. 🌊','서쪽으로 가민 해변, 동쪽으로 가민 제주시이우다.'],['남쪽 샛길로 가민 서귀포가 나와마씸.'],['올레는 집으로 가는 좁은 길이란 뜻이우다.'],['무신거 헴수과? 그냥 걸어봅서.']],
 '사진 찍는 여행자':[['돌담이랑 귤나무가 같이 나오게 찍고 있어요. 📷'],['인생샷 건지기 전엔 못 갑니다.']],
 '기록실 트레이너':null,
 '철봉 매달린 회원':[['하나만 더… 하나만 더…'],['내려오는 법을 잊어버렸습니다.']],
 '유도 요원':[['오라이~ 오라이~ ✈'],['봉 흔들다가 팔 근육이 생겼어요.']],
 '스케치하는 학생':[['돌담을 그리고 있어요.'],['돌 하나하나가 달라서 킹받아요.']]
};
const pickTalk=p=>{let last=-1;return()=>{let i=Math.random()*p.length|0;if(p.length>1&&i==last)i=(i+1)%p.length;last=i;return p[i]}};
Object.values(M).forEach(z=>(z.p||[]).forEach(n=>{if(TALK[n.n])n.s=pickTalk(TALK[n.n])}));
/* 김포-제주는 늘 붐비는 노선: 공항마다 여행객을 더 둠 */
(()=>{const TALK2=[['제주 가는 비행기는 늘 만석이에요. ✈'],['김포-제주가 세계에서 제일 붐비는 노선이래요.'],['탑승구가 어디더라…'],['캐리어가 터질 것 같아요. 귤 때문에요. 🍊'],['비행기 시간 빠듯해요! 잠깐만요!'],['가족 여행 왔어요. 애들이 벌써 지쳤네요.'],['출장인데 당일치기예요. 🧳'],['커피 한 잔 사서 타려고요. ☕'],['한 시간 비행인데 줄이 더 길어요.'],['수하물 찾는 데서 또 만나겠네요.']],COL=['#f97316','#22c55e','#3b82f6','#ec4899','#a855f7','#14b8a6','#eab308','#64748b','#ef4444','#0ea5e9'],HA=['#222','#3f2a1c','#111827','#6b3e26','#d1d5db'];
[['airport',9],['terminal',12],['gimpo',9],['gimpoT',12]].forEach(([id,cnt])=>{const z=M[id],R=z.m.map(r=>[...r]),H=R.length,c=[],desk=R.findIndex(r=>r.includes('k'));R.forEach((r,y)=>{if(y>=H-1||y<=desk)return;r.forEach((t,x)=>{if('.f'.includes(t)&&!(z.d&&(z.d[x+','+y]||z.d[x+','+(y+1)]))&&!(z.p||[]).some(n=>n.x==x&&n.y==y)&&(x+y*2)%3==0)c.push([x,y])})});for(let i=0;i<cnt&&c.length;i++){const[x,y]=c.splice((i*7+3)%c.length,1)[0];z.p.push({x,y,c:COL[i%COL.length],h:HA[i%HA.length],w:1,cup:i%4==0,n:i%3?'여행객':'탑승객',s:TALK2[(i*3)%TALK2.length]})}})})();
/* 가로등·표지판이 길을 막아 갇힌 칸이 생기면 그 소품을 치움 */
Object.values(M).forEach(z=>{if(!z.o)return;const R=z.m.map(r=>[...r]),H=R.length,W=R[0].length,wk=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&WALK.includes(R[y][x]),comps=()=>{const seen=new Set(),o=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!wk(x,y)||seen.has(x+','+y))continue;const c=new Set([x+','+y]),q=[[x,y]];seen.add(x+','+y);while(q.length){const[a,b]=q.pop();[[1,0],[-1,0],[0,1],[0,-1]].forEach(([d,e])=>{const n=a+d,m=b+e,k=n+','+m;if(wk(n,m)&&!seen.has(k)){seen.add(k);c.add(k);q.push([n,m])}})}o.push(c)}return o.sort((a,b)=>b.size-a.size)};
  for(let t=0;t<6;t++){const C=comps();if(C.length<2)break;let done=false;for(const pk of C.slice(1)){if(pk.size<3)continue;for(let y=0;y<H&&!done;y++)for(let x=0;x<W&&!done;x++){if(!'ㅜㅞ'.includes(R[y][x]))continue;const nb=[[1,0],[-1,0],[0,1],[0,-1]].map(([d,e])=>(x+d)+','+(y+e));if(nb.some(k=>pk.has(k))&&nb.some(k=>C[0].has(k))){R[y][x]='ㅣ';done=true}}if(done)break}if(!done)break}
  z.m=R.map(r=>r.join(''))});
/* 지도를 고치며 벽에 묻힌 사람은 가까운 빈자리로 */
[['yeongdeungpo','영등포 쇼핑객'],['daebang','대방역 앞 학생'],['noryangjin','수산시장 상인']].forEach(([id,nm])=>{const z=M[id],n=z.p.find(o=>o.n==nm);if(!n)return;const R=z.m.map(r=>[...r]);let b=null,bd=1e9;R.forEach((r,y)=>r.forEach((t,x)=>{if(t!='.'||z.p.some(o=>o.x==x&&o.y==y))return;const q=Math.abs(x-n.x)+Math.abs(y-n.y);if(q<bd){bd=q;b=[x,y]}}));if(b){n.x=b[0];n.y=b[1]}});
/* 지도에 있는 볼거리 앞 사람들 */
[['yeouido',22,7,'#ec4899','더현대서울 구경객',['실내 정원이 있는 백화점이에요. 🌿','주말엔 사람이 정말 많아요.']],['yeouido',23,12,'#6366f1','IFC몰 직장인',['점심은 IFC몰 지하에서 해결해요. 🍱','퇴근하고 영화 한 편 보고 가요.']],['yeouido',29,7,'#f59e0b','63빌딩 관광객',['금빛 유리가 멀리서도 반짝여요. ✨']],['yeongdeungpo',2,3,'#a855f7','타임스퀘어 쇼핑객',['쇼핑몰이 커서 길을 잃을 뻔했어요. 🛍']],['yeongdeungpo',11,3,'#b45309','영등포시장 상인',['시장 구경하고 가요! 싸게 드릴게.']],['yeongdeungpo',11,7,'#22c55e','공원 산책객',['역 근처에 이런 공원이 있어서 좋아요. 🌳']],['assembly',5,6,'#64748b','국회박물관 관람객',['국회가 어떻게 돌아가는지 볼 수 있어요.']],['assembly',9,6,'#0ea5e9','방송국 직원',['오늘 생방송 끝나고 커피 한 잔 하려고요. 🎥']],['yeouinaru',11,2,'#0891b2','유람선 안내원',['한강 유람선 타 보세요. 저녁 풍경이 좋아요. 🛳']],['daebang',11,8,'#65a30d','대방공원 주민',['아침마다 여기 공원을 걸어요. 🌳']],['singil',11,2,'#16a34a','샛강 자전거족',['샛강 따라 자전거 타기 좋아요. 🚲']],['nodeul',3,28,'#78716c','공원 어르신',['용양봉저정은 정조 임금 때 이야기가 있는 곳이에요.','올라가면 한강이 잘 보여요.']]].forEach(([id,tx,ty,c,nm,lines])=>{const z=M[id],R=z.m.map(r=>[...r]);let best=null,bd=1e9;R.forEach((r,y)=>r.forEach((t,x)=>{if(!'.F'.includes(t)||(z.d&&z.d[x+','+y])||(z.p||[]).some(n=>n.x==x&&n.y==y))return;const q=Math.abs(x-tx)+Math.abs(y-ty);if(q<bd){bd=q;best=[x,y]}}));if(best)z.p.push({x:best[0],y:best[1],c,h:'#222',stay:1,n:nm,s:pickTalk(lines.map(l=>[l]))})});
/* 동네마다 가게 사람 한 명씩. 근처 빈자리에 세움 */
[['singil',11,7,'#b45309','순대국집 아주머니',['국물 한 그릇 하고 가세요. 환승하다 들르는 손님이 많아요.','1호선이랑 5호선이 여기서 만나니까 늘 북적여요.']],['daebang',5,7,'#dc2626','떡볶이 포차 사장',['매운맛 보통맛 다 돼요. 학생은 어묵 하나 더. 😄','오늘은 국물이 제일 잘됐어요.']],['jangseung',11,7,'#ca8a04','시장 과일가게 사장',['오늘 귤 들어왔어요! 제주 거라 달아요. 🍊','장 보러 나왔으면 한 바퀴 돌고 가요.']],['soongsil',11,7,'#7c3aed','학교 앞 카페 사장',['시험 기간엔 자리가 없어요. ☕','아메리카노 하나요? 샷은 공부량 보고 추가하세요.']],['sangdo',11,7,'#ea580c','붕어빵 아저씨',['팥이랑 슈크림, 뭐로 드릴까요? 🐟','추워지면 이 줄이 저기까지 가요.']],['heukseok',11,7,'#0891b2','대학가 서점 주인',['요즘은 전공책보다 소설이 더 나가요. 📚','한강 쪽으로 걸어 나가면 바람이 좋아요.']],['nodeul',4,11,'#16a34a','노들섬 매점 직원',['시원한 음료 있어요. 잔디밭에서 드세요.','해 질 때가 제일 바빠요. 🌇']],['yongsan',5,5,'#475569','전자상가 사장',['충전기부터 부품까지 웬만한 건 다 있어요. 🔌','고장 났어요? 일단 껐다 켜 봤어요?']],['yeouido',16,8,'#0ea5e9','편의점 직원',['점심시간엔 도시락이 금방 나가요. 🍱','야근하는 분들은 커피를 두 개씩 사 가세요.']],['gimpo',3,6,'#92400e','공항 커피 직원',['비행기 타기 전 커피 한 잔 어때요? ☕','제주 가시면 귤 많이 드세요. 🍊']]].forEach(([id,tx,ty,c,nm,lines])=>{const z=M[id];let best=null,bd=1e9;for(let y=0;y<z.m.length;y++){if(z.bus!=null&&Math.abs(y-z.bus)<1)continue;const row=[...z.m[y]];for(let x=0;x<row.length;x++){if(!'.F'.includes(row[x])||(z.d&&z.d[x+','+y])||(z.p||[]).some(n=>n.x==x&&n.y==y))continue;const dd=Math.abs(x-tx)+Math.abs(y-ty);if(dd<bd){bd=dd;best=[x,y]}}}if(best)z.p.push({x:best[0],y:best[1],c,h:'#222',stay:1,n:nm,s:pickTalk(lines.map(l=>[l]))})});
Object.values(M).forEach(z=>(z.p||[]).forEach(n=>{const T=OWNER_TALK[n.n];if(T){const g0=n.s;n.s=()=>isOwner()?T:((FRIEND&&FRIEND_TALK[n.n]&&FRIEND_TALK[n.n](friendCall(),FRIEND))||(typeof g0=='function'?g0():g0))}}));
/* 밤에는 부모님은 안방 침대, 어르신들은 각자 이부자리에서 주무심 */
{const zz=['쿨쿨… 💤','(곤히 주무시고 계신다.)'],place=(mp,src,name,x,y,pxx,pyy,col,vert)=>{const o=M[src].p.find(n=>n.n==name);if(!o)return;M[mp].p.push({x,y,sit:1,stay:1,c:o.c,h:o.h,p:o.p,gl:o.gl,lk:o.lk,when:sleepHours,n:name+' (주무시는 중)',s:zz,sl:[pxx,pyy,col,vert]})};
 place('anbang','house','보성 아버지',4,3,4*32,3*32+3,'#d97706');place('anbang','house','보성 어머니',4,4,4*32,4*32+1,'#d97706');
 place('gpHome','gpHome','보성 할아버지',2,3,2*32,3*32+2,'#b45309',1);place('gpHome','gpHome','보성 할머니',11,3,11*32,3*32+2,'#b45309',1);
 place('gmHome','gmHome','보성 외할아버지',2,3,2*32,3*32+2,'#0f766e',1);place('gmHome','gmHome','보성 외할머니',11,3,11*32,3*32+2,'#0f766e',1);
 for(const[mp,names]of[['house',['보성 아버지','보성 어머니']],['gpHome',['보성 할아버지','보성 할머니']],['gmHome',['보성 외할아버지','보성 외할머니']]])M[mp].p.forEach(n=>{if(names.includes(n.n)){const w0=n.when;n.when=()=>!sleepHours()&&(!w0||w0())}})}
{const ck=M.town.p.find(n=>n.n.startsWith('창끼'));if(ck){M.town.p.splice(M.town.p.indexOf(ck),1);const g0=ck.s;ck.s=()=>{if(ckMe()&&FRIEND&&FRIEND.self){const L=FRIEND.self;return[L[Math.random()*L.length|0]]}if(!isOwner()&&FRIEND&&FRIEND.ckTalk){const L=FRIEND.ckTalk;return[L[Math.random()*L.length|0]]}return typeof g0=='function'?g0():g0};CK_MAPS.forEach(id=>{const z=M[id];let best=null,bd=1e9;for(let y=0;y<z.m.length;y++)for(let x=0;x<z.m[0].length;x++){if(!'.F'.includes(z.m[y][x])||(z.d&&z.d[x+','+y])||(z.p||[]).some(n=>n.x==x&&n.y==y))continue;const dd=Math.abs(x-9)+Math.abs(y-7);if(dd<bd){bd=dd;best=[x,y]}}if(best){z.p.push({...ck,x:best[0],y:best[1],when:()=>CK.at==id&&!ckMe()});z.p.push({x:best[0],y:best[1],c:'#2b3140',h:'#17151c',p:'#17151c',stay:1,n:'강보성',s:bsTalk,when:()=>CK.at==id&&ckMe()})}})}}
[...BS_HOME,...BS_MAPS].forEach(id=>{const z=M[id];if(!z)return;let best=null,bd=1e9;const R0=z.m.map(r=>[...r]),T=z.o?'.F':'f',cx=z.o?10:9,cy=z.o?7:6;R0.forEach((r,y)=>r.forEach((t,x)=>{if(!T.includes(t)||(z.d&&(z.d[x+','+y]||z.d[x+','+(y-1)]))||(z.p||[]).some(n=>n.x==x&&n.y==y))return;const dd=Math.abs(x-cx)+Math.abs(y-cy);if(dd<bd){bd=dd;best=[x,y]}}));if(best)(z.p=z.p||[]).push({x:best[0],y:best[1],c:'#2b3140',h:'#17151c',p:'#17151c',stay:1,fd:0,n:'강보성',s:bsTalk,ch:BS_CH,when:()=>BS.at==id&&!isOwner()})});

function showPool(){openM(`<h3>🏊 수영장 이용 안내</h3><div class="cd" style="margin-bottom:8px"><b>${esc(poolMsg())}</b></div><div class="xrow" style="padding:5px 8px;margin:3px 0"><span>수영 1회 (2시간)</span><b>2,000원</b></div><div class="xrow" style="padding:5px 8px;margin:3px 0"><span>할인 대상</span><b>1,000원</b></div><div class="xrow" style="padding:5px 8px;margin:3px 0"><span>평일</span><span>06:00~12:00, 14:00~21:00</span></div><div class="xrow" style="padding:5px 8px;margin:3px 0"><span>토·일·공휴일</span><span>06:00~12:00, 14:00~18:00</span></div><p style="font-size:12px;opacity:.8">매일 12~14시 물 교환과 청소. 매주 화요일, 1월 1일, 설·추석 연휴 휴관.</p><small style="opacity:.7">제주국민체육센터 이용안내 기준이에요. 가격과 시간은 바뀔 수 있으니 방문 전 확인해 주세요.</small>`)}
/* ===== 바당 카페: 진짜 결제는 없고 고르고 앉아서 마시는 놀이 ===== */
