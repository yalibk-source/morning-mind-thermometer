const fs=require('fs'), vm=require('vm'), assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const {compile}=require('@vue/compiler-dom');
const template=html.slice(html.indexOf('<div id="app"'),html.lastIndexOf('<script>'));
const errors=[]; compile(template,{onError:e=>errors.push(e.message+' line '+e.loc.start.line)});assert.deepEqual(errors,[],'Vue template compiles');
const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
new vm.Script(script);
function boot(initial={}) {
  const storage=new Map(Object.entries(initial)), intervals=[], timers=[]; let app, fail=false;
  const ctx={ Vue:{ref:value=>({value}),computed:fn=>({get value(){return fn();}}),watch:()=>{},nextTick:()=>{},onMounted:fn=>fn(),createApp:options=>({mount:()=>{app=options.setup();}})},
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>{if(fail)throw Error('quota');storage.set(key,value);},removeItem:key=>storage.delete(key)},
    window:{confirm:()=>true},confirm:()=>true,prompt:()=>null,document:{addEventListener:()=>{}},console,Date,Set,Blob,URL,
    setInterval:(fn,delay)=>intervals.push({fn,delay}),setTimeout:(fn,delay)=>{timers.push({fn,delay});return timers.length;},clearTimeout:()=>{}
  };
  vm.runInNewContext(script,ctx); return {app,storage,timers,intervals,setFail:()=>{fail=true;}};
}
const env=boot(), a=env.app;
assert.equal(a.students.value.length,0); assert.equal(a.checkins.value.length,0);
a.newStudentName.value='검증학생'; a.addStudent(); assert.equal(a.students.value.length,1);
a.selectStudent(a.students.value[0]); a.nextStep(); assert.equal(a.wizardStep.value,1,'emotion is required');
a.selectMood('sad'); assert.equal(a.wizardStep.value,1,'selection remains visible'); a.nextStep();assert.equal(a.wizardStep.value,2);
a.nextStep(); a.wizardMessage.value='검증용 메모'; a.submitCheckin(); assert.equal(a.checkins.value.length,1);assert.ok(a.recentSubmittedCheckin.value);
a.submitCheckin();assert.equal(a.checkins.value.length,1,'duplicate prevented');
env.timers.find(t=>t.delay===5000).fn();assert.equal(a.selectedStudent.value,null);assert.equal(a.wizardMessage.value,'');assert.equal(a.recentSubmittedCheckin.value,null);
a.selectStudent(a.students.value[0]);assert.equal(a.selectedStudent.value,null,'cannot submit twice per day');
a.recordsScope.value='all';a.onlyAttention.value=true;assert.equal(a.filteredRecords.value.length,1);a.recordsFrom.value='2099-01-01';assert.equal(a.filteredRecords.value.length,0);
a.updateFollowUp(a.checkins.value[0],'대화 예정');assert.equal(JSON.parse(env.storage.get('school_thermometer_checkins'))[0].followUp,'대화 예정');
a.deleteStudent(a.students.value[0].id);assert.equal(a.students.value[0].archived,true);assert.equal(a.checkins.value.length,1);a.deleteStudent(a.students.value[0].id);assert.equal(a.students.value[0].archived,false);
const e=boot();e.app.newStudentName.value='저장실패검증';e.app.addStudent();e.app.selectStudent(e.app.students.value[0]);e.app.selectMood('happy');e.setFail();e.app.submitCheckin();assert.equal(e.app.checkins.value.length,0);assert.equal(e.app.recentSubmittedCheckin.value,null);assert.equal(e.app.syncStatus.value,'error');
async function testRestore() {
  const b=boot(), data={version:1,students:JSON.parse(env.storage.get('school_thermometer_students')),checkins:JSON.parse(env.storage.get('school_thermometer_checkins'))};
  const event={target:{files:[{size:100,text:async()=>JSON.stringify(data)}],value:'backup.json'}};
  await b.app.restoreData(event);assert.equal(b.app.checkins.value.length,1);assert.equal(b.app.students.value.length,1);assert.equal(event.target.value,'');
  const before=JSON.stringify(b.app.checkins.value);event.target.files=[{size:10,text:async()=>JSON.stringify({version:1,students:[],checkins:[{score:999}]})}];
  await b.app.restoreData(event);assert.equal(JSON.stringify(b.app.checkins.value),before,'invalid backup leaves existing data intact');
  console.log('PASS: valid JSON restore and invalid-backup rejection');
}
testRestore().catch(error=>{console.error(error);process.exitCode=1;});
console.log('PASS: blank setup, required emotion, step navigation, save, duplicate protection, auto return, filters, follow-up persistence, archive/restore, failed-save rollback');
