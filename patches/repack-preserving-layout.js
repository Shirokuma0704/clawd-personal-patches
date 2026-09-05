'use strict';
const fs=require('node:fs'),path=require('node:path'),asar=require('@electron/asar');
// Preserve each original packed/unpacked flag explicitly. Globs applied to
// absolute Windows paths can silently repack external native dependencies.
module.exports=async function repackPreservingLayout(original,extracted,destination){
 const streams=[];
 for(const entry of asar.listPackage(original)){
  const relative=entry.slice(1),meta=asar.statFile(original,relative,false);
  const filePath=path.resolve(extracted,relative);
  if(!filePath.startsWith(path.resolve(extracted)+path.sep))throw Error('Archive entry escapes extraction root');
  if(meta.link)throw Error('Symlink archive entries are not supported by this Windows patcher');
  if(meta.files){streams.push({type:'directory',path:relative,unpacked:!!meta.unpacked});continue;}
  const stat=fs.statSync(filePath);
  if(meta.executable)stat.mode=0o100755;
  streams.push({type:'file',path:relative,unpacked:!!meta.unpacked,stat,streamGenerator:()=>fs.createReadStream(filePath)});
 }
 await asar.createPackageFromStreams(destination,streams);
};
