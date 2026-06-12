const fs=require('fs');const s=fs.readFileSync('d:/Website Project/landing-page-heading/app/dashboard/page.tsx','utf8');
const lines=s.split('\n');
let i=0;const len=s.length;let line=1;const state={inSingle:false,inDouble:false,inBack:false,inLineComment:false,inBlockComment:false};
while(i<len){const ch=s[i];const next=s[i+1];
  if(ch==='\n'){line++;}
  if(state.inLineComment){ if(ch==='\n'){state.inLineComment=false;} i++; continue}
  if(state.inBlockComment){ if(ch==='*' && next==='/' ){ state.inBlockComment=false; i+=2; continue } i++; continue }
  if(!state.inSingle && !state.inDouble && !state.inBack){
    if(ch==='/' && next==='/' ){ state.inLineComment=true; i+=2; continue }
    if(ch==='/' && next==='*'){ state.inBlockComment=true; i+=2; continue }
  }
  if(!state.inLineComment && !state.inBlockComment){
    if(!state.inSingle && !state.inBack && ch==='"'){ state.inDouble=!state.inDouble; i++; continue }
    if(!state.inDouble && !state.inBack && ch==="'"){ state.inSingle=!state.inSingle; i++; continue }
    if(!state.inSingle && !state.inDouble && ch==='`'){ state.inBack=!state.inBack; i++; continue }
  }
  if(!state.inSingle && !state.inDouble && !state.inBack && !state.inLineComment && !state.inBlockComment){
    if(ch === '/'){
      console.log('line',line,'context:', lines[line-1].trim());
    }
  }
  i++;
}
