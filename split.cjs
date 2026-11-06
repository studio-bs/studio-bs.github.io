// 한 파일 index.html을 수정하기 쉬운 소스 폴더로 나눕니다. 사용: node tools/split.cjs index.html src
// 실제 사이트는 build.cjs로 다시 합친 index.html 하나를 올립니다. (나눈 채로 올리면 순서 문제로 동작하지 않음)
const fs=require('fs'),path=require('path');let acorn;try{acorn=require('acorn')}catch(e){acorn=null}
const [src,out]=process.argv.slice(2);const h=fs.readFileSync(src,'utf8');
const s0=h.indexOf('<style>')+7,s1=h.indexOf('</style>'),j0=h.indexOf('<script>')+8,j1=h.lastIndexOf('</script>');
const css=h.slice(s0,s1),js=h.slice(j0,j1);
const starts=acorn?acorn.parse(js,{ecmaVersion:'latest'}).body.map(n=>n.start):null;
const A=[['01-maps',null],['02-tiles','function tile('],['03-engine','const DV=[['],['04-db-social','const DBCFG='],['05-shops-ui','const CAFE_M='],['06-transport','function drawPlane('],['07-world-fixes','(function elderPlaces'],['08-loop','function layerFor(']];
const cut=A.map(([n,k])=>{if(!k)return 0;const i=js.indexOf(k);if(i<0)throw new Error('기준점 없음: '+k);return starts?starts.filter(s=>s<=i).pop():js.lastIndexOf('\n',i)+1});
fs.mkdirSync(path.join(out,'js'),{recursive:true});fs.writeFileSync(path.join(out,'style.css'),css);
A.forEach(([n],i)=>fs.writeFileSync(path.join(out,'js',n+'.js'),js.slice(cut[i],i+1<A.length?cut[i+1]:js.length)));
fs.writeFileSync(path.join(out,'page.html'),h.slice(0,s0)+'/*@@CSS@@*/'+h.slice(s1,j0)+'/*@@JS@@*/'+h.slice(j1));
console.log('나눔 완료:',A.map(a=>a[0]).join(', '));
