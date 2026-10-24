const fs=require('fs');
fs.mkdirSync('assets',{recursive:true});
const backgrounds=['#d1fae5','#e0e7ff','#fef3c7','#fce7f3','#e0f2fe','#ffe4e6','#ccfbf1','#f3e8ff'];
const shirts=['#0f766e','#6366f1','#e09c24','#db6795','#3699bd','#d27561','#329c8c','#9c6bbb'];
const hair=['#382c2c','#262a35','#4a3026','#29262a','#352826','#48352e','#302b35','#392a22'];
const skin=['#f3c5a2','#efd0b4','#e5ad86','#f3ccb1','#e9b68f','#f0c5a5','#f2d1b8','#dfad8b'];
for(let i=0;i<8;i++) {
  const longHair=i%3===0?`<path d="M40 82Q32 22 80 24Q128 22 122 93L128 130H35Z" fill="${hair[i]}"/>`:'';
  const fringe=i%2?`<path d="M43 68Q39 25 81 26Q120 25 119 68L103 48L86 57L66 45Z" fill="${hair[i]}"/>`:`<path d="M42 70Q35 25 80 24Q126 24 119 74L102 52Q77 65 55 49Z" fill="${hair[i]}"/>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><title>가상 학생 얼굴 그림 ${i+1}</title><rect width="160" height="160" rx="28" fill="${backgrounds[i]}"/>${longHair}<path d="M22 160Q24 119 80 119Q136 119 138 160" fill="${shirts[i]}"/><path d="M69 107H91V128Q80 139 69 128Z" fill="${skin[i]}"/><ellipse cx="44" cy="78" rx="7" ry="10" fill="${skin[i]}"/><ellipse cx="116" cy="78" rx="7" ry="10" fill="${skin[i]}"/><ellipse cx="80" cy="76" rx="37" ry="43" fill="${skin[i]}"/>${fringe}<path d="M58 74Q63 70 67 74M93 74Q98 70 102 74" fill="none" stroke="${hair[i]}" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="63" cy="81" rx="3" ry="3.6" fill="#332f34"/><ellipse cx="98" cy="81" rx="3" ry="3.6" fill="#332f34"/><path d="M79 82L76 92H82" fill="none" stroke="#bf8f76" stroke-width="2" stroke-linecap="round"/><path d="M68 100Q80 111 93 99" fill="#fff" stroke="#ad665a" stroke-width="2" stroke-linejoin="round"/><ellipse cx="56" cy="94" rx="7" ry="4" fill="#ec9b94" opacity=".5"/><ellipse cx="105" cy="94" rx="7" ry="4" fill="#ec9b94" opacity=".5"/>${i===2||i===6?'<g fill="none" stroke="#5d5263" stroke-width="2.5"><rect x="50" y="74" width="24" height="17" rx="6"/><rect x="86" y="74" width="24" height="17" rx="6"/><path d="M74 80H86"/></g>':''}</svg>`;
  fs.writeFileSync('assets/demo-0'+(i+1)+'.svg',svg);
}
console.log('Generated 8 fictional face illustrations');
