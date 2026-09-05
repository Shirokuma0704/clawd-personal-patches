"use strict";
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'themes', 'edited-clawd');
const out = path.join(__dirname, '..', 'generated', 'motion-pack');
fs.mkdirSync(out, {recursive:true});
const rect = (x,y,w,h,c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const heart = `<path d="M-2 0h2v1h1V0h2v2H2v1H1v1H0V3h-1V2h-1Z" fill="#F47799"/>`;
const star = `<path d="M0-2h1v2h2v1H1v2H0V1h-2V0h2Z" fill="#FFD77A"/>`;
const normal = rect(4,8,1,2,'#211F29')+rect(10,8,1,2,'#211F29');
const happy = `<path d="M4 9v-1h2v1M9 9v-1h2v1" fill="none" stroke="#211F29" stroke-width="0.7"/>`;
const closed = rect(4,9,2,0.6,'#211F29')+rect(9,9,2,0.6,'#211F29');
const specs = [
 {id:'stretch',title:'쭈욱 기지개',condition:'쉬는 동안 무작위',secs:6,body:'25%,55%{transform:translateY(-2px) scale(.93,1.15)}75%{transform:scale(1.06,.94)}',left:'25%,55%{transform:rotate(110deg)}',right:'25%,55%{transform:rotate(-110deg)}',eyes:closed},
 {id:'sneeze',title:'에취! 별가루',condition:'쉬는 동안 무작위',secs:5,body:'25%{transform:rotate(-7deg) translateY(-1px)}40%{transform:translateY(2px) scale(1.12,.8)}48%{transform:translateY(-2px)}',left:'40%,50%{transform:rotate(50deg)}',right:'40%,50%{transform:rotate(-50deg)}',eyes:closed,prop:`<g class="prop" transform="translate(16 7)">${star}</g>`,propAnim:'0%,30%,70%,100%{opacity:0}40%{opacity:1;transform:translate(14px,7px)}65%{opacity:0;transform:translate(19px,4px)}'},
 {id:'snack',title:'쿠키 냠냠',condition:'쉬는 동안 무작위',secs:8,body:'30%,50%,70%{transform:translateY(1px) scale(1.03,.97)}',left:'20%,80%{transform:rotate(30deg)}',right:'20%,80%{transform:translate(-5px,-1px)}',eyes:happy,prop:`<g class="prop">${rect(7,10,4,3,'#EAC28D')}${rect(8,10,1,1,'#98623E')}${rect(9,12,1,1,'#98623E')}</g>`,propAnim:'0%,100%{opacity:0}10%,75%{opacity:1}80%,95%{opacity:0}'},
 {id:'star',title:'반짝별 잡기',condition:'쉬는 동안 무작위',secs:7,body:'30%{transform:translateX(-2px) rotate(-4deg)}60%{transform:translate(2px,-2px) rotate(4deg)}',left:'25%,40%{transform:rotate(100deg)}',right:'55%,70%{transform:rotate(-100deg)}',prop:`<g class="prop">${star}</g>`,propAnim:'0%,100%{transform:translate(7px,3px);opacity:0}20%{transform:translate(-1px,3px);opacity:1}55%{transform:translate(15px,1px);opacity:1}85%{transform:translate(7px,-1px);opacity:0}'},
 {id:'ball',title:'공 데굴데굴',condition:'쉬는 동안 무작위',secs:8,body:'25%{transform:translateX(-2px) rotate(-3deg)}65%{transform:translateX(2px) rotate(3deg)}',left:'20%,30%{transform:rotate(-30deg)}',right:'60%,70%{transform:rotate(30deg)}',prop:`<g class="prop">${rect(-1,12,3,3,'#97CFD5')}${rect(0,12,1,1,'#EAFBEE')}</g>`,propAnim:'0%,100%{transform:translateX(0)}50%{transform:translateX(16px) rotate(0deg)}'},
 {id:'ponder',title:'갸웃 물음표',condition:'생각 중 상태에서 무작위',secs:4,body:'30%,65%{transform:rotate(-8deg)}',left:'30%,65%{transform:translate(2px,-2px) rotate(35deg)}',prop:`<g class="prop"><path d="M14 3V1h3v2h-1v1h-1v1m0 1v1" fill="none" stroke="#B6BAF3" stroke-width="1"/></g>`,propAnim:'0%,100%{opacity:0}25%,80%{opacity:1}'},
 {id:'idea',title:'번뜩 전구',condition:'생각 중 상태에서 무작위',secs:4,body:'45%{transform:translateY(-2px)}',right:'40%,65%{transform:rotate(-90deg)}',eyes:happy,prop:`<g class="prop">${rect(6,-1,3,3,'#FFE48D')}${rect(7,2,1,1,'#C9AE85')}${rect(4,0,1,1,'#FFE48D')}${rect(10,0,1,1,'#FFE48D')}</g>`,propAnim:'0%,30%,100%{opacity:0}40%,85%{opacity:1}'},
 {id:'cheer',title:'만세 꽃가루',condition:'완료·기쁨 상태에서 무작위',secs:4,body:'25%,55%{transform:translateY(-3px)}40%,70%{transform:scale(1.08,.92)}',left:'20%,75%{transform:rotate(120deg)}',right:'20%,75%{transform:rotate(-120deg)}',eyes:happy,prop:`<g class="prop">${rect(0,1,1,2,'#F4A5C4')}${rect(14,2,1,2,'#AEDFD0')}${rect(4,-1,1,1,'#FFE48D')}${rect(11,0,1,1,'#B6BAF3')}</g>`,propAnim:'0%,100%{opacity:0}15%{opacity:1;transform:translateY(-2px)}90%{opacity:0;transform:translateY(6px)}'},
 {id:'letter',title:'편지 왔어요',condition:'알림 상태에서 무작위',secs:5,body:'20%,60%{transform:rotate(4deg)}40%,80%{transform:rotate(-4deg)}',left:'15%,85%{transform:translate(3px,1px)}',right:'15%,85%{transform:translate(-3px,1px)}',eyes:happy,prop:`<g>${rect(4,11,7,4,'#FFF0D8')}<path d="M4 11l3.5 2L11 11" fill="none" stroke="#D59887" stroke-width=".5"/></g>`},
 {id:'kiss',title:'쪽! 하트 보내기',condition:'몸의 오른쪽 더블클릭',secs:3.2,body:'30%,55%{transform:translateY(-1px) rotate(-4deg)}',right:'25%,65%{transform:translate(-2px,-1px) rotate(-35deg)}',eyes:happy,prop:`<g class="prop">${heart}</g>`,propAnim:'0%,20%,100%{opacity:0;transform:translate(12px,7px) scale(.5)}40%{opacity:1;transform:translate(15px,5px) scale(1)}85%{opacity:0;transform:translate(18px,1px) scale(1.3)}'},
 {id:'tapdance',title:'발 동동 탭댄스',condition:'발에 커서 2.8초',secs:3.5,body:'20%,40%,60%{transform:translate(-1px,-1px) rotate(-5deg)}30%,50%,70%{transform:translate(1px,-1px) rotate(5deg)}',left:'20%,40%,60%{transform:rotate(40deg)}',right:'30%,50%,70%{transform:rotate(-40deg)}',eyes:happy,feet:'20%,40%,60%{transform:translateY(-1px)}30%,50%,70%{transform:translateX(1px)}'},
 {id:'shy',title:'볼 발그레 숨기',condition:'빠르게 4번 클릭 시 무작위',secs:3.5,body:'25%,70%{transform:scale(1.05,.92) translateY(1px)}',left:'25%,70%{transform:translate(4px,-1px)}',right:'25%,70%{transform:translate(-4px,-1px)}',eyes:closed},
 {id:'typing-bounce',title:'콩콩 열일 타자',condition:'작업 세션 1개',secs:1.2,poses:{left:'translate(3px,3px)',right:'translate(-3px,4px)'},body:'25%,75%{transform:translateY(-.4px)}50%{transform:translate(0,0) rotate(0deg) scale(1)}',left:'25%,75%{transform:translate(3px,4px)}50%{transform:translate(3px,3px)}',right:'25%,75%{transform:translate(-3px,3px)}50%{transform:translate(-3px,4px)}',prop:`<g>${rect(2,14,11,2,'#C3BBCF')}${rect(3,14,9,.5,'#EEE8F4')}</g>`}
];
function svg(s){
 const anim=(name,k)=>`.${name}{transform-box:fill-box;transform-origin:${name==='left'?'100% 50%':name==='right'?'0% 50%':'50% 100%'};transform:${s.poses?.[name]||'translate(0,0) rotate(0deg) scale(1)'};animation:${name} ${s.secs}s infinite ease-in-out}@keyframes ${name}{0%,100%{transform:${s.poses?.[name]||'translate(0,0) rotate(0deg) scale(1)'}}${k||''}}`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-15 -25 45 45" width="500" height="500"><title>${s.title}</title><style>${anim('body',s.body)}${anim('left',s.left)}${anim('right',s.right)}${anim('feet',s.feet)}.prop{animation:prop ${s.secs}s infinite ease-in-out}@keyframes prop{${s.propAnim||'0%,100%{opacity:1}'}}</style>${rect(3,15,9,1,'#514454')}<g id="accessory-anchor" class="body"><g fill="#DE886D"><g class="feet"><rect x="3" y="13" width="1" height="2"/><rect x="5" y="13" width="1" height="2"/><rect x="9" y="13" width="1" height="2"/><rect x="11" y="13" width="1" height="2"/></g><rect x="2" y="6" width="11" height="7"/><g class="left"><rect x="0" y="9" width="2" height="2"/></g><g class="right"><rect x="13" y="9" width="2" height="2"/></g></g>${s.eyes||normal}<g opacity=".65">${rect(3,11,1,1,'#F28E9F')}${rect(11,11,1,1,'#F28E9F')}</g></g>${s.prop||''}</svg>`;
}
const theme=JSON.parse(fs.readFileSync(path.join(root,'theme.json'),'utf8'));
for(const s of specs){s.file=`clawd-cute-${s.id}.svg`;fs.writeFileSync(path.join(out,s.file),svg(s));}
fs.writeFileSync(path.join(out,'catalog.json'),JSON.stringify(specs,null,2));
const frame={cx:7.5,baseY:6.5,width:16};
for(const s of specs){theme.customization.accessories.files[s.file]={staticFrame:frame,followTarget:{id:'accessory-anchor',frame}};}
for(const s of specs.slice(0,5)){if(!theme.idleAnimations.some(e=>e.file===s.file))theme.idleAnimations.push({file:s.file,duration:s.secs*1000});theme.displayHintMap[s.file]=s.file;}
for(const [state,ids] of Object.entries({thinking:['ponder','idea'],attention:['cheer'],notification:['letter']})){for(const id of ids){const file=specs.find(s=>s.id===id).file;if(!theme.states[state].includes(file))theme.states[state].push(file);}}
theme.reactions.clickRight={file:'clawd-cute-kiss.svg',duration:3200};
theme.reactions.hoverFeet={file:'clawd-cute-tapdance.svg',duration:3500};
if(!theme.reactions.double.files.includes('clawd-cute-shy.svg'))theme.reactions.double.files.push('clawd-cute-shy.svg');
theme.workingTiers.find(t=>t.minSessions===1).file='clawd-cute-typing-bounce.svg';
theme.version='1.3.0';
theme.description='기존 쓰다듬기와 함께 쉬기, 생각, 작업, 알림, 클릭에 반응하는 귀여운 모션 13종 추가';
fs.writeFileSync(path.join(out,'theme.json'),JSON.stringify(theme,null,2)+'\n');
fs.writeFileSync(path.join(out,'preview.html'),`<!doctype html><html lang="ko"><meta charset="utf-8"><title>Clawd 귀염뽀짝 모션 13종</title><style>body{background:#24212c;color:#f8e5dc;font:16px system-ui;margin:32px}h1{font-size:26px}main{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}article{background:#37313f;border:1px solid #685365;border-radius:18px;text-align:center;padding:12px}svg{width:100%;height:160px}h2{font-size:16px;margin:0}p{font-size:12px;color:#cdbbcf}button{padding:8px;background:#f4bdbe;border:0;border-radius:8px}</style><h1>Clawd의 작은 하루 · 새로운 모션 13종</h1><p>각 카드에서 실제 애니메이션이 반복돼요. 앱에서는 아래 조건에 따라 보여요.</p><main>${specs.map(s=>`<article>${svg(s).replace('viewBox="-15 -25 45 45"','viewBox="-6 -5 28 24"')}<h2>${s.title}</h2><p>${s.condition}</p></article>`).join('')}</main></html>`);
console.log(`Prepared ${specs.length} motions: ${out}`);
// Keep SVG style scopes isolated in the gallery.
let gallery=fs.readFileSync(path.join(out,'preview.html'),'utf8');
fs.mkdirSync(path.join(out,'preview-assets'),{recursive:true});
for(const s of specs){
 const visual=svg(s).replace('viewBox="-15 -25 45 45"','viewBox="-6 -5 28 24"');
 fs.writeFileSync(path.join(out,'preview-assets',s.file),visual);
 gallery=gallery.replace(visual,`<object data="preview-assets/${s.file}" type="image/svg+xml" style="width:100%;height:160px"></object>`);
}
fs.writeFileSync(path.join(out,'preview.html'),gallery);
