const fs=require('fs'), vm=require('vm'), assert=require('node:assert/strict');
require('./make-demo-avatars.cjs');
const html=fs.readFileSync('index.html','utf8');
const {compile}=require('@vue/compiler-dom');
const template=html.slice(html.indexOf('<div id="app"'),html.lastIndexOf('<script>'));
const errors=[]; compile(template,{onError:e=>errors.push(e.message+' line '+e.loc.start.line)});assert.deepEqual(errors,[],'Vue template compiles');
const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
new vm.Script(script);
function boot(initial={}, realMode=true, speechClass=null) {
  const storage=new Map(Object.entries({...realMode ? {school_thermometer_mode:'real'} : {},...initial})), intervals=[], timers=[]; let app, fail=false;
  const ctx={ Vue:{ref:value=>({value}),computed:fn=>({get value(){return fn();}}),watch:()=>{},nextTick:()=>{},onMounted:fn=>fn(),createApp:options=>({mount:()=>{app=options.setup();}})},
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>{if(fail)throw Error('quota');storage.set(key,value);},removeItem:key=>storage.delete(key)},
    window:{confirm:()=>true,SpeechRecognition:speechClass},confirm:()=>true,prompt:()=>null,document:{addEventListener:()=>{}},console,Date,Set,Blob,URL,
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
const demo=boot({},false), d=demo.app;
assert.equal(d.isDemo.value,true);assert.equal(d.students.value.length,8);assert.equal(d.checkins.value.length,164);assert.equal(d.getTodayCheckinsCount(),4);
for(const st of d.students.value) assert.ok(fs.existsSync(st.photo),'fictional face exists');
assert.equal(demo.storage.has('school_thermometer_students'),false);assert.equal(demo.storage.has('school_thermometer_checkins'),false);
d.selectStudent(d.students.value[4]);d.selectMood('excited');d.nextStep();d.nextStep();d.submitCheckin();assert.equal(d.getTodayCheckinsCount(),5);assert.equal(demo.storage.has('school_thermometer_checkins'),false,'demo submits never persist into classroom data');
d.openDemoTeacher();assert.equal(d.currentMode.value,'teacher');d.startDemo();assert.equal(d.getTodayCheckinsCount(),4);assert.equal(d.currentMode.value,'student');
d.exitDemo();assert.equal(d.isDemo.value,false);assert.equal(d.students.value.length,0);assert.equal(d.checkins.value.length,0);
const realStudents=env.storage.get('school_thermometer_students'), realLogs=env.storage.get('school_thermometer_checkins');
const mixed=boot({school_thermometer_students:realStudents,school_thermometer_checkins:realLogs,school_thermometer_password:'private-test'},false);
assert.equal(mixed.app.isDemo.value,false,'existing real classroom is not replaced on first update');
mixed.app.startDemo();mixed.app.tempNewPassword.value='demo-change';mixed.app.changeTeacherPassword();mixed.app.updateFollowUp(mixed.app.checkins.value[0],'지원 완료');mixed.app.newStudentName.value='가상추가';mixed.app.addStudent();
assert.equal(mixed.storage.get('school_thermometer_students'),realStudents);assert.equal(mixed.storage.get('school_thermometer_checkins'),realLogs);assert.equal(mixed.storage.get('school_thermometer_password'),'private-test');
mixed.app.exitDemo();assert.equal(mixed.app.students.value.length,1);assert.equal(mixed.app.teacherPassword.value,'private-test');assert.equal(JSON.stringify(mixed.app.checkins.value),realLogs);
console.log('PASS: first-visit demo, 8 faces, 164 sample logs, interactive check-in, reset, direct teacher access, classroom/password isolation and safe exit');
const trash=boot();trash.app.newStudentName.value='삭제검증';trash.app.addStudent();const deleted=trash.app.students.value[0];trash.app.currentMode.value='teacher';trash.app.requestDeleteStudent(deleted);assert.equal(trash.app.pendingDeleteStudent.value.id,deleted.id);trash.app.confirmDeleteStudent();assert.ok(deleted.deletedAt);assert.ok(JSON.parse(trash.storage.get('school_thermometer_students'))[0].deletedAt);trash.app.restoreStudent(deleted);assert.equal(deleted.deletedAt,undefined);
trash.app.requestDeleteStudent(deleted);trash.setFail();trash.app.confirmDeleteStudent();assert.equal(deleted.deletedAt,undefined,'failed deletion save rolls back');
const demoDelete=boot({},false);demoDelete.app.openDemoTeacher();const countBefore=demoDelete.app.checkins.value.length;demoDelete.app.requestDeleteStudent(demoDelete.app.students.value[0]);demoDelete.app.confirmDeleteStudent();assert.equal(demoDelete.app.checkins.value.length,countBefore,'historical records retained');assert.equal(demoDelete.app.getTodayCheckinsCount(),3,'deleted student excluded from participation');demoDelete.app.restoreStudent(demoDelete.app.students.value[0]);assert.equal(demoDelete.app.getTodayCheckinsCount(),4);
const recognizers=[];
class FakeSpeech { constructor(){recognizers.push(this);} start(){this.onstart?.();} abort(){this.aborted=true;} emit(text){this.onresult?.({results:[[{transcript:text}]]});} }
const voice=boot({},false,FakeSpeech).app;voice.selectStudent(voice.students.value[4]);voice.openCustomMoodForm();voice.toggleSpeechRecognition('mood');const first=recognizers.at(-1),late=first.onresult;first.emit('오늘 기분은 아주 좋아요');assert.equal(voice.customMoodLabel.value,'오늘 기분은');assert.equal(voice.wizardMessage.value,'');voice.closeCustomMoodForm();assert.equal(voice.isRecording.value,false);assert.equal(first.aborted,true);late({results:[[{transcript:'늦은 결과'}]]});assert.equal(voice.customMoodLabel.value,'오늘 기분은');
voice.openCustomMoodForm();voice.toggleSpeechRecognition('mood');recognizers.at(-1).emit('설레요');voice.submitCustomMood();assert.equal(voice.wizardStep.value,2);assert.equal(voice.isRecording.value,false);voice.nextStep();voice.toggleSpeechRecognition('message');recognizers.at(-1).emit('선생님 안녕하세요');assert.equal(voice.wizardMessage.value,'선생님 안녕하세요');assert.equal(voice.customMoodLabel.value,'설레요');voice.goHome();assert.equal(voice.isRecording.value,false);
const unsupported=boot({},false).app;unsupported.selectStudent(unsupported.students.value[4]);unsupported.openCustomMoodForm();unsupported.toggleSpeechRecognition('mood');assert.equal(unsupported.isRecording.value,false);assert.ok(unsupported.toastMessage.value.includes('지원하지 않는'));
console.log('PASS: recoverable student deletion, restore, storage failure rollback, record retention, voice targets, six-character limit, stale-result rejection and unsupported-browser handling');
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
