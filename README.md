# BS World 소스 폴더

사이트에는 지금처럼 **index.html 한 파일**을 올려요. 이 압축 파일 안의 index.html이 그 파일이고, src 폴더는 고치기 쉽게 나눠 둔 원본이에요.

**GitHub에 올릴 것:** index.html, src 폴더 (build.cjs, split.cjs, README.md는 처음 한 번만)
나눈 파일을 그대로 올리면 순서 문제로 화면이 안 떠요.

## 파일 구성
| 파일 | 내용 |
|---|---|
| src/page.html | HTML 뼈대 |
| src/style.css | 화면 스타일 |
| src/js/01-maps.js | 구역 지도와 NPC |
| src/js/02-tiles.js | 타일 그림 |
| src/js/03-engine.js | 이동·대화·앉기 등 게임 기본 |
| src/js/04-db-social.js | Supabase, 친구·접속자, 게시판 |
| src/js/05-shops-ui.js | 가게·메뉴·화면 창 |
| src/js/06-transport.js | 비행기·버스·지하철·실시간 정보 |
| src/js/07-world-fixes.js | 구역 추가·수정 묶음 |
| src/js/08-loop.js | 화면 그리기와 시작 |

## 쓰는 법 (Node.js 필요)
- 합치기: `node build.cjs src index.html` → 만들어진 index.html을 GitHub에 올림
- 다시 나누기: `node split.cjs index.html src`

GitHub 저장소에는 src 폴더와 index.html을 같이 올려 두면 수정 기록이 파일별로 남아요.
src 안에는 비밀값을 넣지 마세요. 친구·가족 대사 SQL도 여기에 넣지 마세요.
