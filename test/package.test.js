'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),themeDir=path.join(root,'themes','edited-clawd');
test('all theme SVG references exist, with no embedded active or remote content',()=>{
 const theme=JSON.parse(fs.readFileSync(path.join(themeDir,'theme.json'),'utf8'));
 const files=new Set(JSON.stringify(theme).match(/[\w-]+\.svg/g));
 assert.equal(files.size,64);
 for(const file of files){const svg=fs.readFileSync(path.join(themeDir,'assets',file),'utf8');assert.match(svg,/<svg\b/);assert.doesNotMatch(svg,/<script\b|\bon\w+\s*=|(?:href|src)=["'](?:https?:|file:)/i);}
});
test('typing hands remain over the keyboard at both loop boundaries',()=>{
 const svg=fs.readFileSync(path.join(themeDir,'assets','clawd-cute-typing-bounce.svg'),'utf8');
 assert.match(svg,/@keyframes left\{0%,100%\{transform:translate\(3px,3px\)\}/);
 assert.match(svg,/@keyframes right\{0%,100%\{transform:translate\(-3px,4px\)\}/);
});
test('hover patch applies to baseline, parses, is idempotent and fails closed',()=>{
 const {patchHitRenderer}=require('../patches/apply-patch');
 const src=fs.readFileSync(path.join(__dirname,'fixtures','hit-renderer.js'),'utf8');
 const patched=patchHitRenderer(src);assert.equal(patched.alreadyPatched,false);new vm.Script(patched.source);
 assert.equal(patchHitRenderer(patched.source).alreadyPatched,true);
 assert.throws(()=>patchHitRenderer('incompatible app version'));
});
