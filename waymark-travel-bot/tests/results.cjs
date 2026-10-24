const fs=require('fs'),vm=require('vm'),assert=require('assert');
class El{constructor(){this.innerHTML='';this.dataset={};this.value='';this.style={};this.hidden=false;this.scrollHeight=1000;this.scrollTop=0;this.clientHeight=900;this.classList={add(){},remove(){},toggle(){}};}querySelectorAll(){return []}querySelector(){return null}addEventListener(){}setAttribute(){}click(){}focus(){}removeAttribute(){}scrollIntoView(){}closest(){return null}}
const ids={},document={getElementById:id=>ids[id]||(ids[id]=new El()),addEventListener(){},querySelectorAll(){return []},createElement:()=>new El(),activeElement:new El()};
let calendarBlob=null;class CalendarURL extends URL{static createObjectURL(b){calendarBlob=b;return 'blob:calendar'}static revokeObjectURL(){}};
const ctx=vm.createContext({document,localStorage:{getItem:()=>null,setItem(){}},console,Date,Promise,URL:CalendarURL,Blob,setTimeout:fn=>{fn();return 1},clearTimeout(){},queueMicrotask:fn=>fn()});
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../.generated/app.js'),'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
(async()=>{
 await run("activate('all')");assert.equal(run('state.messages.filter(m=>m.type===\"organized\").length'),1);assert(ids.timeline.innerHTML.includes('查看整理成果'));
 assert.equal(JSON.stringify(run('resultCounts()')),JSON.stringify({places:6,merged:1,pending:1}));run('openResults()');assert(run('resultsOpen'));assert(ids.resultsroot.innerHTML.includes('大家的想法'));assert(ids.resultsroot.innerHTML.includes('還有一點不確定'));assert(ids.resultsroot.innerHTML.includes('行程草稿')||ids.resultsroot.innerHTML.includes('草稿'));
 run("resultKind='咖啡'");let list=run('resultPlacesHTML()');assert(list.includes('中崎町'));assert(!list.includes('黑門市場'));
 run("resultKind='全部';resultQuery='環球'");list=run('resultPlacesHTML()');assert(list.includes('環球影城'));assert(!list.includes('黑門市場'));
 run("resultQuery='不存在的地點'");assert(run('resultPlacesHTML()').includes('沒有符合'));run("resultQuery=''");
 run("sourceModal('kuromon')");assert(ids.modalroot.innerHTML.includes('Mia'));assert(ids.modalroot.innerHTML.includes('Ben'));run('closeModal()');
 run("saveResolution('riverside','京都・鴨川咖啡廳','exclude')");assert.equal(run('resultCounts().pending'),0);assert.equal(run('state.available.length'),6);assert(ids.resultsroot.innerHTML.includes('京都・鴨川咖啡廳'));assert(ids.resultsroot.innerHTML.includes('本次不排'));
 run("state.results.unresolved.push({id:'another',name:'另一支影片',source:'Yuki',quote:'想去這裡',note:'待補',status:'pending'})");run("saveResolution('another','新咖啡廳','include')");assert.equal(run('state.available.length'),7);assert.equal(run("scheduledDay('resolved-another')"),-1);run("resultPlanPlace('resolved-another')");assert(ids.modalroot.innerHTML.includes('第 1 天'));assert(ids.modalroot.innerHTML.includes('第 3 天'));run('closeModal()');
 run("const next=clone(state.plan);next.days[2].items.push({place:'resolved-another',time:'14:00'});commitPlan(next,'已加入')");assert.equal(run("scheduledDay('resolved-another')"),2);assert(ids.resultsroot.innerHTML.includes('新咖啡廳'));
 run('closeResults()');assert(!run('resultsOpen'));assert(run('state.active'));run('openResults();stop()');assert.equal(run('state.active'),false);assert(ids.resultsroot.innerHTML.includes('本次整理已結束'));
 run('closeResults();job++;state=initial();drawer=null;dirty=false;renderMessages();renderHeader()');await run("activate('now')");assert.equal(JSON.stringify(run('resultCounts()')),JSON.stringify({places:3,merged:0,pending:0}));run('openResults()');assert(!ids.resultsroot.innerHTML.includes('河邊咖啡廳'));assert(!ids.resultsroot.innerHTML.includes('大阪城公園'));
 run('state=initial();drawer=null;dirty=false;bootResults()');assert(run('resultsOpen'));assert.equal(run('state.plan.days.flatMap(d=>d.items).length'),6);assert(ids.resultsroot.innerHTML.includes('黑門市場'));
 console.log('PASS: automatic results card; 6/1/1 and 3/0/0 scope boundaries; result entry; filters/search; merged sources; uncertainty include/exclude; plan linkage; stopped viewing; direct results boot.');
})().catch(e=>{console.error(e);process.exitCode=1});
