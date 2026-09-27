"use strict";
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'themes', 'edited-clawd');
const out = path.join(__dirname, '..', 'generated', 'motion-pack');
fs.mkdirSync(out, {recursive:true});
const rect = (x,y,w,h,c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const heart = `<path d="M-2 0h2v1h1V0h2v2H2v1H1v1H0V3h-1V2h-1Z" fill="#F47799"/>`;
const star = `<path d="M0-2h1v2h2v1H1v2H0V1h-2V0h2Z" fill="#FFD77A"/>`;
const note = c => `${rect(0,1,2,2,c)}${rect(1,-2,1,3,c)}${rect(2,-2,1,1,c)}`;
const normal = rect(4,8,1,2,'#211F29')+rect(10,8,1,2,'#211F29');
// Smiling eyes are drawn as >< squints.
const happy = `<path d="M4 8l2 1l-2 1M11 8l-2 1l2 1" fill="none" stroke="#211F29" stroke-width="0.7"/>`;
const closed = rect(4,9,2,0.6,'#211F29')+rect(9,9,2,0.6,'#211F29');
// Per-segment easing: a keyframe's curve applies from that keyframe to the next one.
const E = {io:'cubic-bezier(.45,0,.55,1)', out:'cubic-bezier(.22,1,.36,1)', in:'cubic-bezier(.64,0,.78,0)', back:'cubic-bezier(.34,1.56,.64,1)'};
// Every keyframe uses the same translate/rotate/scale list so browsers interpolate each part separately.
const T = ({x=0,y=0,r=0,s=1,sx=s,sy=s}={}) => `translate(${x}px,${y}px) rotate(${r}deg) scale(${sx},${sy})`;
// Track = [[percent, {x,y,r,s,sx,sy,o}, easing], ...]; missing 0% and 100% default to the rest pose.
function frames(track){
 const list=[...track];
 if(!list.some(f=>f[0]===0))list.unshift([0,{}]);
 if(!list.some(f=>f[0]===100))list.push([100,{}]);
 return list.map(([p,v,e])=>`${p}%{transform:${T(v)}${v.o===undefined?'':`;opacity:${v.o}`}${e?`;animation-timing-function:${E[e]}`:''}}`).join('');
}
const mirror = track => track.map(([p,v,e])=>[p,{...v,x:-(v.x||0),r:-(v.r||0)},e]);
const stretchArm = [[6,{r:-15}],[26,{r:118},'io'],[40,{r:110}],[52,{r:116},'in'],[64,{r:-12},'out'],[76,{r:5}],[88,{}]];
const sneezeArm = [[30,{r:25},'in'],[36,{r:60},'out'],[50,{r:10}],[62,{}]];
const cheerArm = [[8,{r:-20},'out'],[20,{r:125}],[32,{r:105},'out'],[44,{r:128}],[56,{r:108}],[70,{r:120}],[84,{r:115},'in']];
const shyArm = [[14,{x:4,y:-1},'io'],[26,{x:4,y:-1.3}],[38,{x:4,y:-1}],[50,{x:4,y:-1.3}],[62,{x:4,y:-1}],[74,{x:4,y:-1},'in'],[86,{},'out']];
const letterArm = [[12,{x:3,y:1}],[40,{x:3,y:.6}],[60,{x:3,y:1}],[84,{x:3,y:1},'in'],[94,{}]];
const specs = [
 {id:'stretch',title:'쭈욱 기지개',condition:'쉬는 동안 무작위',secs:6,eyes:closed,
  body:[[8,{sx:1.05,sy:.94},'out'],[26,{y:-1.5,sx:.92,sy:1.17}],[40,{y:-1.8,sx:.91,sy:1.18}],[52,{y:-1.4,sx:.93,sy:1.15},'in'],[64,{sx:1.08,sy:.92},'out'],[76,{sx:.98,sy:1.03}],[88,{}]],
  left:stretchArm,right:mirror(stretchArm)},
 {id:'sneeze',title:'에취! 별가루',condition:'쉬는 동안 무작위',secs:5,eyes:closed,
  body:[[12,{r:-3,y:-.3}],[20,{r:-1}],[30,{r:-7,y:-1,sx:.97,sy:1.04},'in'],[36,{r:5,sx:1.12,sy:.84},'out'],[46,{r:-2,y:-1.2,sx:.96,sy:1.05}],[58,{r:1.5}],[70,{}]],
  left:sneezeArm,right:mirror(sneezeArm),
  prop:`<g class="prop">${star}</g>`,
  propAnim:[[0,{x:13,y:8,s:.4,o:0}],[35,{x:13,y:8,s:.4,o:0},'out'],[42,{x:16,y:6,s:1.2,o:1}],[60,{x:19,y:3,r:90,s:.9,o:.8},'in'],[75,{x:21,y:1,r:160,s:.5,o:0}],[100,{x:21,y:1,s:.5,o:0}]]},
 {id:'snack',title:'쿠키 냠냠',condition:'쉬는 동안 무작위',secs:8,eyes:happy,
  body:[[24,{},'in'],[28,{r:2,sx:1.05,sy:.94},'out'],[34,{y:-.3},'in'],[40,{r:2,sx:1.05,sy:.94},'out'],[46,{y:-.3},'in'],[52,{r:2,sx:1.05,sy:.94},'out'],[58,{}],[72,{y:-1,sx:.97,sy:1.04}],[80,{sx:1.03,sy:.97}],[88,{}]],
  left:[[12,{r:30},'out'],[80,{r:30}],[88,{}]],
  right:[[12,{x:-5,y:-1},'out'],[28,{x:-5,y:-1.5}],[34,{x:-5,y:-1}],[40,{x:-5,y:-1.5}],[46,{x:-5,y:-1}],[52,{x:-5,y:-1.5}],[62,{x:-5,y:-1},'in'],[74,{},'out']],
  prop:`<g class="prop">${rect(7,10,4,3,'#EAC28D')}${rect(8,10,1,1,'#98623E')}${rect(9,12,1,1,'#98623E')}</g>`,
  propAnim:[[0,{s:.5,o:0}],[8,{s:.5,o:0},'back'],[14,{s:1,o:1}],[28,{s:.9}],[40,{s:.78}],[52,{s:.62},'in'],[58,{s:0,o:0}],[100,{s:0,o:0}]]},
 {id:'star',title:'반짝별 잡기',condition:'쉬는 동안 무작위',secs:7,
  body:[[16,{x:.5,r:1},'out'],[28,{x:-2,y:-.5,r:-5}],[38,{x:-1.5,r:-3}],[48,{sx:1.04,sy:.95},'out'],[58,{x:2,y:-2.5,r:5,sx:.96,sy:1.05},'in'],[66,{x:2,r:2,sx:1.06,sy:.94},'out'],[74,{x:1,y:-1,sx:.98,sy:1.02}],[82,{x:.5,sx:1.02,sy:.98}],[92,{}]],
  left:[[18,{r:-10},'out'],[28,{r:105}],[38,{r:90}],[48,{}]],
  right:[[48,{r:10},'out'],[58,{r:-105}],[66,{r:-95}],[74,{r:-120}],[86,{r:-20}],[94,{}]],
  prop:`<g class="prop">${star}</g>`,
  propAnim:[[0,{x:-2,s:.3,o:0}],[14,{x:-2,s:.3,o:0},'out'],[22,{x:-2,y:2,o:1}],[34,{x:4,y:-3,r:90}],[48,{x:11,y:-2,r:180}],[58,{x:16,y:4,r:270}],[64,{x:15.5,y:8,r:300,s:.6,o:1},'in'],[70,{x:15,y:9,r:300,s:.2,o:0}],[100,{x:15,y:9,s:.2,o:0}]]},
 {id:'ball',title:'공 데굴데굴',condition:'쉬는 동안 무작위',secs:8,
  body:[[4,{x:.5,r:2}],[10,{x:-1.5,r:-4},'out'],[20,{x:-.5,r:-1}],[38,{x:1,r:2}],[50,{x:1.5,r:3,sx:1.03,sy:.97}],[58,{x:2,r:4},'out'],[70,{x:.5}],[88,{x:-1,r:-2}],[96,{}]],
  left:[[4,{r:15}],[10,{r:-35},'out'],[22,{}]],
  right:[[50,{r:-15}],[58,{r:35},'out'],[70,{}]],
  prop:`<g class="prop">${rect(-1,12,3,3,'#97CFD5')}${rect(0,12,1,1,'#EAFBEE')}</g>`,
  propAnim:[[10,{},'out'],[46,{x:16,r:480}],[58,{x:16,r:480},'out'],[94,{}]]},
 {id:'ponder',title:'갸웃 물음표',condition:'생각 중 상태에서 무작위',secs:4,
  body:[[12,{r:1}],[30,{r:-8,y:-.3},'out'],[42,{r:-6.5}],[54,{r:-8.5}],[66,{r:-8},'in'],[80,{r:1.5},'out'],[92,{}]],
  left:[[14,{},'out'],[30,{x:2,y:-2,r:35}],[40,{x:2,y:-2.4,r:40}],[48,{x:2,y:-2,r:35}],[56,{x:2,y:-2.4,r:40}],[66,{x:2,y:-2,r:35},'in'],[80,{},'out']],
  prop:`<g class="prop"><path d="M14 3V1h3v2h-1v1h-1v1m0 1v1" fill="none" stroke="#B6BAF3" stroke-width="1"/></g>`,
  propAnim:[[0,{y:1,s:.6,o:0}],[24,{y:1,s:.6,o:0},'back'],[34,{o:1}],[50,{y:-.4,r:-6}],[66,{r:6}],[76,{y:-.3,o:1},'in'],[86,{y:-1.5,s:.8,o:0}],[100,{y:-1.5,s:.8,o:0}]]},
 {id:'idea',title:'번뜩 전구',condition:'생각 중 상태에서 무작위',secs:4,eyes:happy,
  body:[[20,{}],[32,{sx:1.06,sy:.93},'out'],[38,{y:-2.2,sx:.95,sy:1.06},'in'],[48,{sx:1.05,sy:.95},'out'],[56,{y:-.6}],[64,{}]],
  right:[[32,{r:10},'out'],[38,{r:-100}],[46,{r:-88}],[54,{r:-96}],[70,{r:-90},'in'],[82,{},'out']],
  prop:`<g class="prop">${rect(6,-1,3,3,'#FFE48D')}${rect(7,2,1,1,'#C9AE85')}${rect(4,0,1,1,'#FFE48D')}${rect(10,0,1,1,'#FFE48D')}</g>`,
  propAnim:[[0,{y:1,s:.3,o:0}],[34,{y:1,s:.3,o:0},'back'],[42,{y:-.5,s:1.1,o:1}],[50,{}],[62,{y:-.3,s:1.05}],[74,{}],[84,{o:1},'in'],[94,{y:-1,s:.9,o:0}],[100,{y:-1,s:.9,o:0}]]},
 {id:'cheer',title:'만세 꽃가루',condition:'완료·기쁨 상태에서 무작위',secs:4,eyes:happy,
  body:[[8,{sx:1.07,sy:.92},'out'],[20,{y:-3.2,sx:.94,sy:1.07},'in'],[32,{sx:1.09,sy:.9},'out'],[44,{y:-3,sx:.95,sy:1.06},'in'],[56,{sx:1.08,sy:.92},'out'],[64,{y:-.6,sx:.98,sy:1.02}],[74,{}],[80,{r:-3}],[88,{r:3}],[96,{}]],
  left:cheerArm,right:mirror(cheerArm),
  prop:`<g class="prop">${rect(0,1,1,2,'#F4A5C4')}${rect(14,2,1,2,'#AEDFD0')}${rect(4,-1,1,1,'#FFE48D')}${rect(11,0,1,1,'#B6BAF3')}</g>`,
  propAnim:[[0,{y:-2,o:0}],[18,{y:-3,o:0},'out'],[24,{y:-3.5,o:1}],[40,{x:.5,y:-1}],[56,{x:-.5,y:1.5}],[72,{x:.5,y:3.5},'in'],[88,{y:6,o:0}],[100,{y:6,o:0}]]},
 {id:'letter',title:'편지 왔어요',condition:'알림 상태에서 무작위',secs:5,eyes:happy,
  body:[[10,{y:-1,sx:.97,sy:1.03},'in'],[16,{sx:1.04,sy:.96},'out'],[28,{r:4}],[42,{r:-4}],[56,{r:3.5}],[70,{r:-3.5}],[80,{}],[88,{y:-.6}],[94,{}]],
  left:letterArm,right:mirror(letterArm),
  prop:`<g>${rect(4,11,7,4,'#FFF0D8')}<path d="M4 11l3.5 2L11 11" fill="none" stroke="#D59887" stroke-width=".5"/></g>`},
 {id:'kiss',title:'쪽! 하트 보내기',condition:'더블클릭 시 무작위',secs:3.2,eyes:happy,
  body:[[18,{r:2,sx:1.03,sy:.97},'out'],[32,{y:-1,r:-5}],[55,{y:-.6,r:-4}],[72,{r:1}],[86,{}]],
  right:[[18,{r:15},'out'],[30,{x:-2.5,y:-1.5,r:-40}],[42,{x:-2.5,y:-1.5,r:-40},'out'],[52,{r:-60}],[72,{r:-20}],[88,{}]],
  prop:`<g class="prop">${heart}</g>`,
  propAnim:[[0,{x:12,y:7,s:.4,o:0}],[46,{x:12,y:7,s:.4,o:0},'back'],[56,{x:15,y:5,s:1.15,o:1}],[68,{x:17,y:3,r:-8}],[82,{x:19,r:8,s:1.2,o:.9},'in'],[94,{x:20,y:-2,s:1.35,o:0}],[100,{x:20,y:-2,s:1.35,o:0}]]},
 {id:'tapdance',title:'발 동동 탭댄스',condition:'발에 커서 2.8초',secs:3.5,eyes:happy,
  body:[[12,{x:-.8,y:-1.2,r:-6},'in'],[18,{x:-.3,r:-2,sx:1.04,sy:.96},'out'],[30,{x:.8,y:-1.2,r:6},'in'],[36,{x:.3,r:2,sx:1.04,sy:.96},'out'],[48,{x:-.8,y:-1.2,r:-6},'in'],[54,{x:-.3,r:-2,sx:1.04,sy:.96},'out'],[66,{x:.8,y:-1.2,r:6},'in'],[72,{x:.3,r:2,sx:1.04,sy:.96},'out'],[84,{y:-.5}],[92,{}]],
  left:[[12,{r:45}],[30,{r:-10}],[48,{r:45}],[66,{r:-10}],[84,{r:20}],[94,{}]],
  right:[[12,{r:10}],[30,{r:-45}],[48,{r:10}],[66,{r:-45}],[84,{r:-20}],[94,{}]],
  feet:[[12,{y:-.8},'in'],[18,{}],[30,{y:-.8},'in'],[36,{}],[48,{y:-.8},'in'],[54,{}],[66,{y:-.8},'in'],[72,{}]]},
 {id:'shy',title:'볼 발그레 숨기',condition:'빠르게 4번 클릭 시 무작위',secs:3.5,eyes:closed,
  body:[[14,{r:-2,sx:1.04,sy:.93}],[26,{r:-3,sx:1.06,sy:.91}],[38,{r:2,sx:1.05,sy:.92}],[50,{r:-2,sx:1.06,sy:.91}],[62,{r:1,sx:1.05,sy:.92}],[72,{sx:1.04,sy:.93},'out'],[84,{y:-.6,sx:.98,sy:1.03}],[94,{}]],
  left:shyArm,right:mirror(shyArm)},
 {id:'typing-bounce',title:'콩콩 열일 타자',condition:'작업 세션 1개',secs:1.2,poses:{left:'translate(3px,3px)',right:'translate(-3px,4px)'},body:'25%,75%{transform:translateY(-.4px)}50%{transform:translate(0,0) rotate(0deg) scale(1)}',left:'25%,75%{transform:translate(3px,4px)}50%{transform:translate(3px,3px)}',right:'25%,75%{transform:translate(-3px,3px)}50%{transform:translate(-3px,4px)}',prop:`<g>${rect(2,14,11,2,'#C3BBCF')}${rect(3,14,9,.5,'#EEE8F4')}</g>`},
 // --- Second pack. slot = where the app picks it: 'idle' joins idleAnimations, anything else joins theme.states[slot].
 {id:'hum',title:'흥얼흥얼 콧노래',condition:'쉬는 동안 무작위',slot:'idle',secs:6,eyes:happy,
  body:[[10,{r:-4,y:-.4}],[25,{r:4}],[40,{r:-4,y:-.4}],[55,{r:4}],[70,{r:-4,y:-.4}],[85,{r:2}],[94,{}]],
  left:[[10,{r:25}],[25,{r:-5}],[40,{r:25}],[55,{r:-5}],[70,{r:25}],[85,{}]],
  right:[[10,{r:5}],[25,{r:-25}],[40,{r:5}],[55,{r:-25}],[70,{r:5}],[85,{}]],
  prop:`<g class="note1">${note('#B6BAF3')}</g><g class="note2">${note('#F4A5C4')}</g>`,
  tracks:[{cls:'note1',k:[[0,{x:14,y:6,s:.5,o:0}],[8,{x:14,y:6,s:.5,o:0},'out'],[16,{x:15,y:3,o:1}],[40,{x:18,y:-3,r:10,o:0}],[100,{x:18,y:-3,o:0}]]},
          {cls:'note2',k:[[0,{x:15,y:5,s:.5,o:0}],[38,{x:15,y:5,s:.5,o:0},'out'],[46,{x:16,y:2,o:1}],[70,{x:13,y:-4,r:-10,o:0}],[100,{x:13,y:-4,o:0}]]}]},
 {id:'butterfly',title:'나비 친구',condition:'쉬는 동안 무작위',slot:'idle',secs:8,
  eyes:`<g class="eyesN">${normal}</g><g class="eyesH">${happy}</g>`,
  body:[[15,{x:-.5,r:-3}],[30,{}],[42,{x:.5,r:3}],[55,{}],[60,{sx:1.03,sy:.97},'out'],[66,{y:-.2}],[80,{}],[88,{x:.5,y:-.5,r:3}],[96,{}]],
  right:[[80,{}],[88,{r:-40}],[96,{}]],
  prop:`<g class="bfly"><g class="flap">${rect(-2,-1,2,2,'#F4A5C4')}${rect(1,-1,2,2,'#F4A5C4')}${rect(0,-1,1,3,'#514454')}</g></g>`,
  tracks:[{cls:'bfly',k:[[0,{x:-6,y:-3,o:0}],[6,{x:-4,y:-2,o:1}],[18,{x:0,y:1}],[30,{x:6,y:-2}],[42,{x:14,y:0}],[52,{x:11,y:2}],[60,{x:7,y:4.5},'out'],[82,{x:7,y:4.5}],[92,{x:13,y:-3}],[100,{x:18,y:-7,o:0}]]},
          {cls:'flap',secs:.36,k:[[50,{sx:.3}]]},
          {cls:'eyesN',k:[[0,{o:1}],[60,{o:1}],[62,{o:0}],[82,{o:0}],[84,{o:1}],[100,{o:1}]]},
          {cls:'eyesH',k:[[0,{o:0}],[60,{o:0}],[62,{o:1}],[82,{o:1}],[84,{o:0}],[100,{o:0}]]}]},
 {id:'wink',title:'찡긋 윙크',condition:'쉬는 동안 무작위',slot:'idle',secs:4,
  eyes:`${rect(4,8,1,2,'#211F29')}<g class="eyeR">${rect(10,8,1,2,'#211F29')}</g>`,
  body:[[20,{r:3,sx:1.03,sy:.97},'out'],[34,{y:-1,r:-4}],[62,{y:-.6,r:-3}],[76,{}]],
  right:[[30,{r:10},'out'],[40,{r:-70}],[62,{r:-65}],[76,{}]],
  prop:`<g class="prop">${star}</g>`,
  propAnim:[[0,{x:13,y:6,s:.2,o:0}],[38,{x:13,y:6,s:.2,o:0},'back'],[46,{x:14,y:5,r:45,s:1.1,o:1}],[62,{x:14,y:5,r:90,s:.9,o:1},'in'],[72,{x:14,y:5,r:120,s:.2,o:0}],[100,{x:14,y:5,s:.2,o:0}]],
  tracks:[{cls:'eyeR',k:[[34,{},'in'],[40,{sy:.15}],[60,{sy:.15},'out'],[66,{}]]}]},
 {id:'spin',title:'빙글 한 바퀴',condition:'쉬는 동안 무작위',slot:'idle',secs:4,eyes:happy,
  body:[[10,{sx:1.07,sy:.92},'out'],[22,{y:-3,sx:.95,sy:1.06}],[27,{y:-3.2,sx:-.95,sy:1.06}],[35,{y:-3.2,sx:-.95,sy:1.06}],[40,{y:-3,sx:.95,sy:1.06}],[42,{y:-3,sx:.95,sy:1.06},'in'],[52,{sx:1.1,sy:.9},'out'],[62,{y:-.6,sx:.98,sy:1.02}],[70,{}]],
  left:[[52,{}],[60,{r:100}],[80,{r:100},'in'],[90,{}]],
  right:[[52,{}],[60,{r:-100}],[80,{r:-100},'in'],[90,{}]]},
 {id:'hiccup',title:'딸꾹! 딸꾹질',condition:'쉬는 동안 무작위',slot:'idle',secs:5,
  body:[[13,{},'out'],[16,{y:-1.5,sx:.94,sy:1.08},'in'],[21,{sx:1.05,sy:.95},'out'],[27,{}],[40,{},'out'],[43,{y:-1.5,sx:.94,sy:1.08},'in'],[48,{sx:1.05,sy:.95},'out'],[54,{}],[67,{},'out'],[70,{y:-2,sx:.93,sy:1.1},'in'],[75,{sx:1.06,sy:.94},'out'],[81,{}],[90,{r:-2}],[96,{}]],
  left:[[13,{}],[16,{r:40}],[24,{}],[40,{}],[43,{r:40}],[51,{}],[67,{}],[70,{r:50}],[78,{}]],
  right:[[13,{}],[16,{r:-40}],[24,{}],[40,{}],[43,{r:-40}],[51,{}],[67,{}],[70,{r:-50}],[78,{}]],
  prop:`<g class="prop">${rect(0,0,2,2,'#AEDFD0')}${rect(0,0,1,1,'#EAFBEE')}</g>`,
  propAnim:[[0,{x:10,y:4,s:.3,o:0}],[14,{x:10,y:4,s:.3,o:0},'back'],[18,{x:10,y:3,o:.9}],[30,{x:11,y:-1,o:0}],[41,{x:10,y:4,s:.3,o:0},'back'],[45,{x:10,y:3,o:.9}],[57,{x:11,y:-1,o:0}],[68,{x:10,y:4,s:.3,o:0},'back'],[72,{x:10,y:3,s:1.2,o:.9}],[84,{x:11,y:-2,s:1.2,o:0}],[100,{x:11,y:-2,o:0}]],
  tracks:[{cls:'blush',k:[[0,{o:.65}],[80,{o:.65}],[86,{o:1}],[94,{o:1}],[100,{o:.65}]]}]},
 {id:'flower',title:'킁킁 꽃 냄새',condition:'쉬는 동안 무작위',slot:'idle',secs:7,
  eyes:`<g class="eyesN">${normal}</g><g class="eyesH">${happy}</g>`,
  body:[[20,{}],[32,{x:1,y:-.2,r:7}],[40,{x:1.2,r:8,sx:1.03,sy:.97}],[46,{x:1,r:7}],[52,{x:1.2,r:8,sx:1.03,sy:.97}],[60,{x:.5,y:-1,r:-3,sx:.97,sy:1.04},'out'],[74,{y:-.6,r:-2}],[86,{}]],
  prop:`<g class="flower">${rect(16,11,1,4,'#8FBF7A')}${rect(17,12,1,1,'#8FBF7A')}${rect(15,9,3,1,'#F4A5C4')}${rect(16,8,1,3,'#F4A5C4')}${rect(16,9,1,1,'#FFE48D')}</g>`,
  tracks:[{cls:'flower',origin:'50% 100%',k:[[0,{sx:.6,sy:0}],[8,{sx:.6,sy:0},'back'],[20,{}],[34,{r:-6}],[48,{r:4}],[62,{r:-3}],[80,{},'in'],[92,{sx:.6,sy:0}],[100,{sx:.6,sy:0}]]},
          {cls:'eyesN',k:[[0,{o:1}],[32,{o:1}],[34,{o:0}],[78,{o:0}],[80,{o:1}],[100,{o:1}]]},
          {cls:'eyesH',k:[[0,{o:0}],[32,{o:0}],[34,{o:1}],[78,{o:1}],[80,{o:0}],[100,{o:0}]]},
          {cls:'blush',k:[[0,{o:.65}],[56,{o:.65}],[62,{o:1}],[76,{o:1}],[84,{o:.65}],[100,{o:.65}]]}]},
 {id:'happy-dance',title:'신나는 스텝',condition:'완료·기쁨 상태에서 무작위',slot:'attention',secs:4,eyes:happy,
  body:[[12,{x:-1.5,y:-1,r:-5}],[24,{x:-1.5,sx:1.04,sy:.96}],[36,{x:1.5,y:-1,r:5}],[48,{x:1.5,sx:1.04,sy:.96}],[60,{x:-1.5,y:-1,r:-5}],[72,{x:-1.5,sx:1.04,sy:.96}],[84,{y:-2,sx:.96,sy:1.05},'in'],[92,{sx:1.05,sy:.95},'out']],
  left:[[12,{r:90}],[36,{r:-10}],[60,{r:90}],[84,{r:120}],[96,{}]],
  right:[[12,{r:10}],[36,{r:-90}],[60,{r:10}],[84,{r:-120}],[96,{}]],
  prop:`<g class="sparkL">${star}</g><g class="sparkR">${star}</g>`,
  tracks:[{cls:'sparkL',k:[[0,{x:-3,y:4,s:0}],[10,{x:-3,y:4,s:0},'back'],[18,{x:-3,y:4,r:45,s:1.1}],[30,{x:-3,y:4,r:90,s:0}],[58,{x:-3,y:2,s:0},'back'],[66,{x:-3,y:2,r:45,s:1.1}],[78,{x:-3,y:2,r:90,s:0}],[100,{x:-3,y:2,s:0}]]},
          {cls:'sparkR',k:[[0,{x:18,y:3,s:0}],[34,{x:18,y:3,s:0},'back'],[42,{x:18,y:3,r:45,s:1.1}],[54,{x:18,y:3,r:90,s:0}],[82,{x:18,y:1,s:0},'back'],[90,{x:18,y:1,r:45,s:1.1}],[100,{x:18,y:1,r:90,s:0}]]}]},
 {id:'wave',title:'여기요! 손 흔들기',condition:'알림 상태에서 무작위',slot:'notification',secs:4,
  body:[[10,{sx:1.04,sy:.96},'out'],[20,{y:-1.2,r:-3}],[30,{y:-.6,r:-1}],[40,{y:-1,r:-3}],[50,{y:-.6,r:-1}],[60,{y:-1,r:-3}],[70,{y:-.5}],[84,{}]],
  right:[[10,{r:10},'out'],[20,{r:-115}],[30,{r:-75}],[40,{r:-115}],[50,{r:-75}],[60,{r:-115}],[70,{r:-75}],[80,{r:-100},'in'],[92,{}]],
  prop:`<g class="prop">${rect(0,-3,1,3,'#F47799')}${rect(0,1,1,1,'#F47799')}</g>`,
  propAnim:[[0,{x:7,y:3,s:.3,o:0}],[14,{x:7,y:3,s:.3,o:0},'back'],[22,{x:7,y:1,s:1.1,o:1}],[30,{x:7,y:1.4}],[40,{x:7,y:1,s:1.05}],[50,{x:7,y:1.4}],[74,{x:7,y:1.2,o:1},'in'],[86,{x:7,s:.8,o:0}],[100,{x:7,s:.8,o:0}]]},
 {id:'oops',title:'앗! 땀 삐질',condition:'오류 상태에서 무작위',slot:'error',secs:4.5,
  eyes:`<path d="M4 8l2 1l-2 1M11 8l-2 1l2 1" fill="none" stroke="#211F29" stroke-width=".7"/>`,
  body:[[8,{x:-.6}],[14,{x:.6}],[20,{x:-.6}],[26,{x:.6}],[32,{}],[60,{sx:1.04,sy:.95}],[72,{}]],
  left:[[8,{r:70}],[14,{r:50}],[20,{r:70}],[26,{r:50}],[40,{r:60}],[60,{r:10}],[72,{}]],
  right:[[8,{r:-70}],[14,{r:-50}],[20,{r:-70}],[26,{r:-50}],[40,{r:-60}],[60,{r:-10}],[72,{}]],
  prop:`<g class="prop">${rect(0,0,1,1,'#97CFD5')}${rect(-.5,1,2,1.5,'#97CFD5')}</g>`,
  propAnim:[[0,{x:12.5,y:4,s:.3,o:0}],[10,{x:12.5,y:4,s:.3,o:0},'back'],[18,{x:12.5,y:4.5,o:1}],[56,{x:13,y:8,o:1},'in'],[66,{x:13,y:10,s:.6,o:0}],[100,{x:13,y:10,s:.6,o:0}]]},
 // --- Double-click pack. slot 'double-click' joins the shared pool picked on every 2-click, together with kiss.
 // All of them run 3.2s so the single reaction duration never cuts one short or replays its start.
 {id:'tickle',title:'간지러워 꺄르르',condition:'더블클릭 시 무작위',slot:'double-click',secs:3.2,eyes:happy,
  body:[[6,{x:1.2,r:4,sx:.96,sy:1.04},'out'],[16,{x:.8,r:-3,sx:1.05,sy:.95}],[26,{x:1.2,r:4,sx:.96,sy:1.04}],[36,{x:.8,r:-3,sx:1.05,sy:.95}],[46,{x:1.2,r:4,sx:.96,sy:1.04}],[56,{x:.8,r:-3,sx:1.05,sy:.95}],[68,{x:.4,y:-.5,r:1}],[82,{}]],
  left:[[8,{x:2.5,y:-.5},'out'],[64,{x:2.5,y:-.5}],[80,{},'out']],
  right:[[6,{r:-40}],[16,{r:10}],[26,{r:-40}],[36,{r:10}],[46,{r:-40}],[56,{r:10}],[70,{}]],
  prop:`<g class="giggle1">${rect(0,0,1,1,'#F4A5C4')}</g><g class="giggle2">${rect(0,0,1,1,'#FFE48D')}</g><g class="giggle3">${rect(0,0,1,1,'#B6BAF3')}</g>`,
  tracks:[{cls:'giggle1',k:[[0,{x:-1,y:9,s:.3,o:0}],[6,{x:-1,y:9,s:.3,o:0},'out'],[12,{x:-2,y:7,s:1.2,o:1}],[30,{x:-3,y:4,o:0}],[100,{x:-3,y:4,o:0}]]},
          {cls:'giggle2',k:[[0,{x:15,y:8,s:.3,o:0}],[20,{x:15,y:8,s:.3,o:0},'out'],[26,{x:16,y:6,s:1.2,o:1}],[44,{x:17,y:3,o:0}],[100,{x:17,y:3,o:0}]]},
          {cls:'giggle3',k:[[0,{x:-1,y:8,s:.3,o:0}],[40,{x:-1,y:8,s:.3,o:0},'out'],[46,{x:-2,y:6,s:1.2,o:1}],[64,{x:-2.5,y:3,o:0}],[100,{x:-2.5,y:3,o:0}]]},
          {cls:'blush',k:[[0,{o:.65}],[8,{o:1}],[70,{o:1}],[86,{o:.65}],[100,{o:.65}]]}]},
 {id:'hug-heart',title:'하트 받기 꼬옥',condition:'더블클릭 시 무작위',slot:'double-click',secs:3.2,
  eyes:`<g class="eyesN">${normal}</g><g class="eyesH">${happy}</g>`,
  body:[[18,{}],[30,{x:-.4,y:-.4,r:-4},'in'],[38,{sx:1.06,sy:.94},'out'],[46,{y:-.8,sx:.97,sy:1.03}],[56,{r:-3}],[66,{r:3}],[76,{r:-2}],[88,{}]],
  left:[[16,{},'out'],[30,{r:70}],[38,{x:3,y:-.5},'out'],[80,{x:3,y:-.5}],[92,{}]],
  right:mirror([[16,{},'out'],[30,{r:70}],[38,{x:3,y:-.5},'out'],[80,{x:3,y:-.5}],[92,{}]]),
  prop:`<g class="prop">${heart}</g>`,
  propAnim:[[0,{x:-5,y:-2,s:.5,o:0}],[8,{x:-5,y:-2,s:.5,o:0},'out'],[16,{x:-2,y:-1,s:1,o:1}],[28,{x:3,y:1,r:-10}],[36,{x:7,y:9,s:.8},'out'],[48,{x:7,y:9,s:.95}],[58,{x:7,y:9,s:.8}],[68,{x:7,y:9,s:.95}],[80,{x:7,y:9,s:.8,o:1},'in'],[90,{x:7,y:7.5,s:.5,o:0}],[100,{x:7,y:7.5,s:.5,o:0}]],
  tracks:[{cls:'eyesN',k:[[0,{o:1}],[36,{o:1}],[38,{o:0}],[86,{o:0}],[88,{o:1}],[100,{o:1}]]},
          {cls:'eyesH',k:[[0,{o:0}],[36,{o:0}],[38,{o:1}],[86,{o:1}],[88,{o:0}],[100,{o:0}]]},
          {cls:'blush',k:[[0,{o:.65}],[40,{o:.65}],[48,{o:1}],[80,{o:1}],[90,{o:.65}],[100,{o:.65}]]}]},
 {id:'surprise',title:'깜짝! 느낌표',condition:'더블클릭 시 무작위',slot:'double-click',secs:3.2,
  eyes:`<g class="eyesW">${rect(3.5,7.5,2,2,'#211F29')}${rect(9.5,7.5,2,2,'#211F29')}</g><g class="eyesH">${happy}</g>`,
  body:[[4,{sx:1.08,sy:.9},'out'],[12,{y:-3.5,sx:.9,sy:1.12},'in'],[22,{sx:1.1,sy:.88},'out'],[30,{y:-.4}],[36,{}],[42,{x:.4}],[46,{x:-.4}],[50,{x:.4}],[54,{}],[66,{y:-.4,r:-3}],[78,{r:2}],[90,{}]],
  left:[[4,{},'out'],[12,{r:130}],[26,{r:110}],[40,{r:40}],[56,{}]],
  right:mirror([[4,{},'out'],[12,{r:130}],[26,{r:110}],[40,{r:40}],[56,{}]]),
  prop:`<g class="prop">${rect(0,-3,1,3,'#FFD77A')}${rect(0,1,1,1,'#FFD77A')}</g>`,
  propAnim:[[0,{x:7,y:3,s:.3,o:0}],[8,{x:7,y:3,s:.3,o:0},'back'],[16,{x:7,y:-1.5,s:1.3,o:1}],[24,{x:7,y:-.4,s:1}],[46,{x:7,y:-.7,o:1},'in'],[56,{x:7,y:-2,s:.7,o:0}],[100,{x:7,y:-2,s:.7,o:0}]],
  tracks:[{cls:'eyesW',k:[[0,{o:1}],[54,{o:1}],[56,{o:0}],[100,{o:0}]]},
          {cls:'eyesH',k:[[0,{o:0}],[54,{o:0}],[56,{o:1}],[100,{o:1}]]},
          {cls:'blush',k:[[0,{o:.65}],[58,{o:.65}],[66,{o:1}],[84,{o:1}],[94,{o:.65}],[100,{o:.65}]]}]}
];
function svg(s){
 // The body pivots on the floor at the crab's centre. fill-box would follow the body's bounding box,
 // which grows and shrinks while the arms rotate and makes the whole body drift.
 const origin=name=>name==='body'?'transform-box:view-box;transform-origin:7.5px 15px':`transform-box:fill-box;transform-origin:${name==='left'?'100% 50%':name==='right'?'0% 50%':'50% 100%'}`;
 const anim=(name,k)=>Array.isArray(k)
  ?`.${name}{${origin(name)};transform:${T()};animation:${name} ${s.secs}s infinite ${E.io}}@keyframes ${name}{${frames(k)}}`
  :`.${name}{${origin(name)};transform:${s.poses?.[name]||'translate(0,0) rotate(0deg) scale(1)'};animation:${name} ${s.secs}s infinite ease-in-out}@keyframes ${name}{0%,100%{transform:${s.poses?.[name]||'translate(0,0) rotate(0deg) scale(1)'}}${k||''}}`;
 const propKeys=Array.isArray(s.propAnim)?frames(s.propAnim):(s.propAnim||'0%,100%{opacity:1}');
 // Extra animated parts (second prop, eye swaps, blush, wing flaps), each with its own class and keyframes.
 const extra=(s.tracks||[]).map(t=>`.${t.cls}{transform-box:fill-box;transform-origin:${t.origin||'50% 50%'};transform:${T()};animation:${t.cls} ${t.secs||s.secs}s infinite ${E.io}}@keyframes ${t.cls}{${frames(t.k)}}`).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-15 -25 45 45" width="500" height="500"><title>${s.title}</title><style>${anim('body',s.body)}${anim('left',s.left)}${anim('right',s.right)}${anim('feet',s.feet)}.prop{transform-box:fill-box;transform-origin:50% 50%;animation:prop ${s.secs}s infinite ${E.io}}@keyframes prop{${propKeys}}${extra}</style>${rect(3,15,9,1,'#514454')}<g id="accessory-anchor" class="body"><g fill="#DE886D"><g class="feet"><rect x="3" y="13" width="1" height="2"/><rect x="5" y="13" width="1" height="2"/><rect x="9" y="13" width="1" height="2"/><rect x="11" y="13" width="1" height="2"/></g><rect x="2" y="6" width="11" height="7"/><g class="left"><rect x="0" y="9" width="2" height="2"/></g><g class="right"><rect x="13" y="9" width="2" height="2"/></g></g>${s.eyes||normal}<g class="blush" opacity=".65">${rect(3,11,1,1,'#F28E9F')}${rect(11,11,1,1,'#F28E9F')}</g></g>${s.prop||''}</svg>`;
}
const theme=JSON.parse(fs.readFileSync(path.join(root,'theme.json'),'utf8'));
for(const s of specs){s.file=`clawd-cute-${s.id}.svg`;fs.writeFileSync(path.join(out,s.file),svg(s));}
fs.writeFileSync(path.join(out,'catalog.json'),JSON.stringify(specs,null,2));
const frame={cx:7.5,baseY:6.5,width:16};
for(const s of specs){theme.customization.accessories.files[s.file]={staticFrame:frame,followTarget:{id:'accessory-anchor',frame}};}
for(const s of specs.slice(0,5)){if(!theme.idleAnimations.some(e=>e.file===s.file))theme.idleAnimations.push({file:s.file,duration:s.secs*1000});theme.displayHintMap[s.file]=s.file;}
for(const [state,ids] of Object.entries({thinking:['ponder','idea'],attention:['cheer'],notification:['letter']})){for(const id of ids){const file=specs.find(s=>s.id===id).file;if(!theme.states[state].includes(file))theme.states[state].push(file);}}
for(const s of specs.filter(s=>s.slot==='idle')){if(!theme.idleAnimations.some(e=>e.file===s.file))theme.idleAnimations.push({file:s.file,duration:s.secs*1000});theme.displayHintMap[s.file]=s.file;}
for(const s of specs.filter(s=>s.slot&&s.slot!=='idle'&&s.slot!=='double-click')){if(!theme.states[s.slot].includes(s.file))theme.states[s.slot].push(s.file);}
// Both sides share one pool; the hit-renderer patch picks from `files`. `file` stays as the unpatched fallback.
const doubleClickPool=['clawd-cute-kiss.svg',...specs.filter(s=>s.slot==='double-click').map(s=>s.file)];
theme.reactions.clickLeft={file:'clawd-cute-tickle.svg',files:doubleClickPool,duration:3200};
theme.reactions.clickRight={file:'clawd-cute-kiss.svg',files:doubleClickPool,duration:3200};
theme.reactions.hoverFeet={file:'clawd-cute-tapdance.svg',duration:3500};
if(!theme.reactions.double.files.includes('clawd-cute-shy.svg'))theme.reactions.double.files.push('clawd-cute-shy.svg');
// One working session keeps the official typing motion; typing-bounce stays in the pack but is not wired in.
theme.workingTiers.find(t=>t.minSessions===1).file='clawd-working-typing.svg';
theme.version='1.4.0';
theme.description=`기존 쓰다듬기와 함께 쉬기, 생각, 작업, 알림, 클릭에 반응하는 귀여운 모션 ${specs.length}종 추가`;
fs.writeFileSync(path.join(out,'theme.json'),JSON.stringify(theme,null,2)+'\n');
fs.writeFileSync(path.join(out,'preview.html'),`<!doctype html><html lang="ko"><meta charset="utf-8"><title>Clawd 귀염뽀짝 모션 ${specs.length}종</title><style>body{background:#24212c;color:#f8e5dc;font:16px system-ui;margin:32px}h1{font-size:26px}main{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}article{background:#37313f;border:1px solid #685365;border-radius:18px;text-align:center;padding:12px}svg{width:100%;height:160px}h2{font-size:16px;margin:0}p{font-size:12px;color:#cdbbcf}button{padding:8px;background:#f4bdbe;border:0;border-radius:8px}</style><h1>Clawd의 작은 하루 · 새로운 모션 ${specs.length}종</h1><p>각 카드에서 실제 애니메이션이 반복돼요. 앱에서는 아래 조건에 따라 보여요.</p><main>${specs.map(s=>`<article>${svg(s).replace('viewBox="-15 -25 45 45"','viewBox="-6 -5 28 24"')}<h2>${s.title}</h2><p>${s.condition}</p></article>`).join('')}</main></html>`);
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
