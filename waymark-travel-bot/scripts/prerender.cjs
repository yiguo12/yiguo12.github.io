const fs=require('fs'),vm=require('vm');
class El{constructor(){this.innerHTML='';this.dataset={};this.value='';this.style={};this.hidden=false;this.scrollHeight=1000;this.scrollTop=0;this.clientHeight=900;this.classList={add(){},remove(){},toggle(){}};}querySelectorAll(){return []}querySelector(){return null}addEventListener(){}focus(){}removeAttribute(){}setAttribute(){}}
const p=require('path').resolve(__dirname,'..')+'/';
for(const [script,file] of [['.generated/app.js','index.html'],['.generated/results.js','results.html']]){
 const els={},doc={getElementById:id=>els[id]||(els[id]=new El()),querySelectorAll(){return []},addEventListener(){},activeElement:new El()};
 const c=vm.createContext({document:doc,localStorage:{getItem:()=>null,setItem(){}},Date,Promise,URL,Blob,setTimeout,clearTimeout,queueMicrotask:fn=>fn()});vm.runInContext(fs.readFileSync(p+script,'utf8'),c);
 let h=fs.readFileSync(p+file,'utf8');
 h=h.replace(/(<section class="timeline" id="timeline"[^>]*>)[\s\S]*?(<\/section>)/,(_,a,b)=>a+els.timeline.innerHTML+b);
 for(const id of ['pin','resultsroot'])h=h.replace('<div id="'+id+'"></div>','<div id="'+id+'">'+(els[id]?.innerHTML||'')+'</div>');
 const cut=h.indexOf('<script>');let shell=h.slice(0,cut);shell=shell.replace(/<(div|button|span)([^>]*data-icon="([^"]+)"[^>]*)><\/\1>/g,(_,tag,attrs,name)=>'<'+tag+attrs+'>'+vm.runInContext('icon('+JSON.stringify(name)+')',c)+'</'+tag+'>');h=shell+h.slice(cut);
 fs.writeFileSync(p+file,h);console.log('Prerendered '+file+' for immediate viewing.');
}
