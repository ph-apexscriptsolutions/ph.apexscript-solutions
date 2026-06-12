const fs=require('fs');
const s=fs.readFileSync('d:/Website Project/landing-page-heading/app/dashboard/page.tsx','utf8');
const lines=s.split('\n');
for(let i=0;i<lines.length;i++){
  const ln=lines[i];
  const dq=(ln.match(/\"/g)||[]).length;
  const sq=(ln.match(/\'/g)||[]).length;
  const bt=(ln.match(/`/g)||[]).length;
  if(dq%2||sq%2||bt%2) console.log((i+1)+': dq='+dq+' sq='+sq+' bt='+bt+'  '+ln);
}
