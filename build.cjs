// 소스 폴더를 사이트에 올릴 index.html 하나로 합칩니다. 사용: node tools/build.cjs src index.html
const fs=require('fs'),path=require('path');const [dir,out]=process.argv.slice(2);
const page=fs.readFileSync(path.join(dir,'page.html'),'utf8'),css=fs.readFileSync(path.join(dir,'style.css'),'utf8');
const js=fs.readdirSync(path.join(dir,'js')).filter(f=>/\.js$/.test(f)).sort().map(f=>fs.readFileSync(path.join(dir,'js',f),'utf8')).join('');
const html=page.replace('/*@@CSS@@*/',()=>css).replace('/*@@JS@@*/',()=>js);fs.writeFileSync(out,html);
try{new Function(js)}catch(e){console.error('⚠ 문법 오류:',e.message);process.exit(1)}console.log('만들었어요:',out,Math.round(html.length/1024)+'KB');
