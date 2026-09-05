const L=h=>{const v=h.replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(c=>c<=0.03928?c/12.92:((c+0.055)/1.055)**2.4);return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2]}
const R=(a,b)=>{const x=L(a),y=L(b);return ((Math.max(x,y)+0.05)/(Math.min(x,y)+0.05))}
const mix=(fg,bg,a)=>{const p=s=>s.replace('#','').match(/../g).map(x=>parseInt(x,16));const f=p(fg),b=p(bg);return '#'+f.map((c,i)=>Math.round(c*a+b[i]*(1-a)).toString(16).padStart(2,'0')).join('')}
const W='#FFFFFF', BG='#F8FAFC';
const cur={primary:'#2563EB',secondary:'#0EA5E9',success:'#16A34A',warning:'#F59E0B',danger:'#DC2626',muted:'#6B7280'};
console.log('--- current tokens as TEXT on white / on #F8FAFC ---');
for(const[k,v]of Object.entries(cur))console.log(k.padEnd(10),v,R(v,W).toFixed(2).padStart(6),R(v,BG).toFixed(2).padStart(6), R(v,W)>=4.5?'PASS':'FAIL');
console.log('\n--- primary on 10% primary tint ---');
const tint=mix(cur.primary,W,0.1);console.log('tint',tint,R(cur.primary,tint).toFixed(2),R(cur.primary,tint)>=4.5?'PASS':'FAIL');
console.log('\n--- candidate text-safe replacements on white ---');
const cand={'sky-700':'#0369A1','sky-800':'#075985','green-700':'#15803D','green-800':'#166534','amber-700':'#B45309','red-600':'#DC2626','red-700':'#B91C1C','blue-600':'#2563EB','blue-700':'#1D4ED8'};
for(const[k,v]of Object.entries(cand))console.log(k.padEnd(10),v,R(v,W).toFixed(2).padStart(6),R(v,BG).toFixed(2).padStart(6),R(v,W)>=4.5?'PASS':'FAIL');
