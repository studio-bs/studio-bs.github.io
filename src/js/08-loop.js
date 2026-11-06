function layerFor(t){const id=cur,bk=Math.floor(Date.now()/6e4)+WX.kind;if(LAYER&&LAYER.id===id&&LAYER.m===map.m&&LAYER.bk===bk)return LAYER;const c=(LAYER&&LAYER.c)||document.createElement('canvas');c.width=MW()*TS;c.height=MH()*TS;const X=c.getContext('2d'),dyn=[];for(let y=0;y<MH();y++){const r=map.m[y];for(let x=0;x<MW();x++){const k=r[x];tile(X,k,x,y,0);if(TILE_DYN.has(k))dyn.push([x,y,k])}}if(map.roads)drawRoads(X,map.roads);if(map.fac)for(const k in map.fac){const[a,b]=k.split(',').map(Number);drawFac(X,map.fac[k],a,b)}return LAYER={id,bk,m:map.m,c,dyn}}
function loop(t){
  requestAnimationFrame(loop);   // 먼저 예약해서, 이후 오류가 나도 루프가 죽지 않게 함
  if(!map)return;
  if(SIT&&held!=null&&!dlg&&!modal&&!SLEEP){const hd=held;sitUp(hd);dir=hd}
  if(held==null)pushN=null;
  if(!busy&&!dlg&&!modal&&!mv&&held!=null){
    dir=held;const[dx,dy]=DV[dir],nx=px+dx,ny=py+dy;
    if(nx<0||ny<0||nx>=MW()||ny>=MH()){const e=(map.ex&&map.ex[px+','+py])||(!(map.noe&&map.noe[px+','+py])&&map.e&&map.e[EK[dir]]);if(e&&edgeOK(e,dir))warp(e[0],e[3]==1?px:e[1],e[3]==2?py:e[2],dir);else if(e&&t-bumpT>300){bumpT=t;sfx('b')}}
    else if(free(nx,ny))mv={a:t,fx:px,fy:py,tx:nx,ty:ny};
    else{const b=npcs.find(n=>n.x==nx&&n.y==ny&&!n.sit&&!n.mv&&WALK.includes(at(nx,ny)));
      if(b){if(pushN!==b){pushN=b;pushT=t}else if(t-pushT>450){b.x=px;b.y=py;b.hx=px;b.hy=py;b.dir=dir^1;pushN=null;mv={a:t,fx:px,fy:py,tx:nx,ty:ny}}}else pushN=null;
      if('ㅱ㎮'.includes(at(nx,ny))&&!busy&&!mv)gateBump(nx,ny,t);if(at(nx,ny)=='㏈'&&!busy&&!mv&&t-bumpT>1200){bumpT=t;showLift()}if('㎷㎺'.includes(at(nx,ny))&&!busy&&!mv&&t-bumpT>1200){bumpT=t;ktxGate(at(nx,ny)=='㎷'?'K':'M')}if((at(nx,ny)=='㎸'||(at(nx,ny)=='ㅰ'&&map.ktxPf))&&!busy&&!mv&&t-bumpT>2500){bumpT=t;toast('🚄 열차를 보고 A(Z)를 누르면 타요.')}const BD=map.bd&&map.bd[nx+','+ny],CS=map.cons&&map.cons[nx+','+ny];if(CS&&!busy){if(t-bumpT>1500){bumpT=t;toast('🚧 '+consMsg(CS[0],map.stKey,CS[1]))}}else if(BD&&!busy&&penBusy(BD[0])){if(t-bumpT>1500){bumpT=t;toast('🔒 투숙 중인 방이에요.')}}else if(BD&&!busy){warp(BD[0],BD[1],BD[2],dir)}else if(!mv&&t-bumpT>300){bumpT=t;sfx('b')}}
  }
  if(mv&&t-mv.a>=(map.slow||160)){
    px=mv.tx;py=mv.ty;mv=null;if(GATE_NEXT){const G0=GATE_NEXT;GATE_NEXT=null;mv={a:t,fx:px,fy:py,tx:G0[0],ty:G0[1]}}steps++;lgunStep();updateHUD();if(steps>=167)eggGet('steps','167걸음! 주인장 헌혈 횟수만큼 걸었다 🩸');if(steps%10==0)saveGame();
    const d=map.d&&map.d[px+','+py];if(d)warp(d[0],d[1],d[2],map.o?1:0);
  }
  if(FLY)return drawFlight(t);
  runnersStep(t);gatersStep(t);
  draw(t);
  updateMiniDot();
}

setInterval(()=>{
  if(!map||dlg||modal||busy)return;
  npcs.forEach(n=>{
    if(!n.w||Math.random()<(n.pet?.05:.5))return;
    const d=Math.random()*4|0,nx=n.x+DV[d][0],ny=n.y+DV[d][1];
    n.dir=d;
    if(Math.abs(nx-n.hx)<3&&Math.abs(ny-n.hy)<3&&free(nx,ny)&&!nearKey(nx,ny)){n.x=nx;n.y=ny}
  });
},1100);

function startGame(){
  acUnlock();idRender();if(!isOwner()&&QS.get('nog')!='1'){$('#st').style.display='none';return guestEdit(true)}startReal()}
function startReal(){
  friendBoot();idRender();setTimeout(accessHit,1500);setTimeout(rtStart,2000);
  if(DB.tok)DB.rpc('is_admin').then(v=>{if(!v)DB.logout()}).catch(e=>{if(e&&e.status)DB.logout()});   // 만료되거나 잘못된 로그인 정리
  const sp=S.pos&&!(S.pos[0]=='anbang'&&!isOwner())&&M[S.pos[0]]&&M[S.pos[0]].m[S.pos[2]]&&WALK.includes(M[S.pos[0]].m[S.pos[2]][S.pos[1]])?S.pos:null;
  $('#st').style.display='none';busy=false;
  if(sp){warp(sp[0],sp[1],sp[2],0);toast('다시 오셨군요! 이어서 모험해요.')}
  else{warp('town',7,5,0);toast('BS World에 오신 것을 환영합니다!');setTimeout(guideIntro,900)}
}

saveLoad();visitInit();qAlert();
npUpdate();
mobLayout();mobMq.addEventListener('change',mobLayout);wideMq.addEventListener('change',mobLayout);
buildMiniMap();
updateHUD();
updateWxChip();loadWeather();
setInterval(updateWxChip,20000);setInterval(loadWeather,600000);
document.querySelector('.mb').addEventListener('scroll',()=>{kcPos();dockPos()});addEventListener('resize',()=>{kcPos();dockPos()});
requestAnimationFrame(loop);
