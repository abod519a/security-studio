(()=>{
const $=s=>document.querySelector(s),el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const LBL={pending:'Pending',in_progress:'In Progress',completed:'Completed',cancelled:'Cancelled'};
let csrf=null,page=1,pages=1,cur=null,editing=null,confirmFn=null;
function toast(m,bad){const t=el('div','toast'+(bad?' bad':''),m);$('#toasts').append(t);setTimeout(()=>t.remove(),4000)}
async function api(path,method='GET',body){
 try{
  if(method!=='GET'&&!csrf)csrf=(await(await fetch('/api/csrf')).json()).csrf;
  const r=await fetch('/api'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json',...(csrf?{'x-csrf-token':csrf}:{})},body:body?JSON.stringify(body):undefined});
  const d=await r.json().catch(()=>({}));
  if(r.status===401&&path!=='/admin/login'){showLogin();throw Object.assign(new Error('You must be logged in.'),{status:401})}
  if(!r.ok)throw Object.assign(new Error(d.error||'Something went wrong. Please try again.'),{status:r.status});
  return d;
 }catch(e){if(!e.status)e.message='Network error. Check your connection and try again.';throw e}
}
const fmt=d=>new Date(d).toLocaleString();
function showLogin(){$('#app').hidden=true;$('#login').hidden=false;csrf=null}
async function boot(){try{const m=await api('/admin/me');csrf=m.csrf;$('#who').textContent=m.username;$('#login').hidden=true;$('#app').hidden=false;stats();}catch(e){showLogin()}}
$('#lform').addEventListener('submit',async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
 try{const d=await api('/admin/login','POST',f);csrf=d.csrf;e.target.reset();boot()}catch(err){toast(err.message,1)}});
$('#logout').onclick=async()=>{try{await api('/admin/logout','POST')}catch(e){}showLogin()};
document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-v]').forEach(x=>x.classList.toggle('on',x===b));['dash','reqs','projs','set'].forEach(v=>$('#v-'+v).hidden=v!==b.dataset.v);
 ({dash:stats,reqs:loadReqs,projs:loadProjs})[b.dataset.v]?.()});
async function stats(){try{const s=await api('/admin/stats'),b=$('#stats');b.replaceChildren();
 [['Total Requests',s.total],['Pending',s.pending],['In Progress',s.in_progress],['Completed',s.completed],['Cancelled',s.cancelled],['Projects',s.projects]].forEach(([l,n])=>{const c=el('div','stat');c.append(el('b','',n),el('span','',l));b.append(c)})}catch(e){toast(e.message,1)}}
async function loadReqs(){try{
 const p=new URLSearchParams({page,q:$('#q').value,status:$('#sf').value}),d=await api('/admin/requests?'+p);pages=d.pages;
 const tb=$('#rows');tb.replaceChildren();
 if(!d.items.length){const tr=el('tr'),td=el('td','muted','No requests found.');td.colSpan=6;tr.append(td);tb.append(tr)}
 d.items.forEach(r=>{const tr=el('tr');tr.append(el('td','',r.request_code),el('td','',r.name+' · '+r.email),el('td','',r.project_type));
  const st=el('td');st.append(el('span','badge '+r.status,LBL[r.status]));tr.append(st,el('td','',fmt(r.created_at)));
  const a=el('td'),v=el('button','btn','View'),x=el('button','btn danger','Delete');v.onclick=()=>openReq(r.id);x.onclick=()=>ask('Delete request '+r.request_code+'? This cannot be undone.',async()=>{await api('/admin/requests/'+r.id,'DELETE');toast('Request deleted.');loadReqs()});
  a.append(v,x);tr.append(a);tb.append(tr)});
 $('#pinfo').textContent='Page '+d.page+' of '+d.pages+' · '+d.total+' total';$('#prev').disabled=page<=1;$('#next').disabled=page>=pages;
}catch(e){toast(e.message,1)}}
let t;$('#q').oninput=()=>{clearTimeout(t);t=setTimeout(()=>{page=1;loadReqs()},300)};$('#sf').onchange=()=>{page=1;loadReqs()};
$('#prev').onclick=()=>{page--;loadReqs()};$('#next').onclick=()=>{page++;loadReqs()};
async function openReq(id){try{const r=await api('/admin/requests/'+id);cur=r;$('#rtitle').textContent=r.request_code;const dl=$('#rdetail');dl.replaceChildren();
 [['Name',r.name],['Email',r.email],['Discord',r.discord_username],['Instagram',r.instagram_username],['Type',r.project_type],['Description',r.description],['Budget',r.budget],['Deadline',r.deadline],['Additional',r.additional_information],['Created',fmt(r.created_at)],['Updated',fmt(r.updated_at)]].forEach(([k,v])=>{dl.append(el('dt','',k),el('dd','',v||'—'))});
 $('#rstatus').value=r.status;$('#rmodal').hidden=false}catch(e){toast(e.message,1)}}
$('#rstatus').onchange=async e=>{try{await api('/admin/requests/'+cur.id,'PATCH',{status:e.target.value});toast('Status updated.');loadReqs()}catch(err){toast(err.message,1)}};
$('#rclose').onclick=()=>$('#rmodal').hidden=true;
function ask(text,fn){$('#ctext').textContent=text;confirmFn=fn;$('#cmodal').hidden=false;$('#cno').focus()}
$('#cno').onclick=()=>$('#cmodal').hidden=true;
$('#cyes').onclick=async()=>{$('#cmodal').hidden=true;try{await confirmFn()}catch(e){toast(e.message,1)}};
document.addEventListener('keydown',e=>{if(e.key==='Escape')['rmodal','cmodal'].forEach(i=>$('#'+i).hidden=true)});
async function loadProjs(){try{const d=await api('/admin/projects'),tb=$('#prows');tb.replaceChildren();
 d.forEach(p=>{const tr=el('tr');tr.append(el('td','',p.name),el('td','',p.category),el('td','',(p.technologies||[]).join(', ')));
  const a=el('td'),ed=el('button','btn','Edit'),x=el('button','btn danger','Delete');
  ed.onclick=()=>{const f=$('#pform').elements;editing=p.id;f.name.value=p.name;f.description.value=p.description;f.category.value=p.category;f.technologies.value=(p.technologies||[]).join(', ');f.image_url.value=p.image_url||'';f.project_url.value=p.project_url||'';$('#psave').textContent='Save changes';$('#pcancel').hidden=false;f.name.focus()};
  x.onclick=()=>ask('Delete project "'+p.name+'"?',async()=>{await api('/admin/projects/'+p.id,'DELETE');toast('Project deleted.');loadProjs()});
  a.append(ed,x);tr.append(a);tb.append(tr)})}catch(e){toast(e.message,1)}}
function resetP(){editing=null;$('#pform').reset();$('#psave').textContent='Add project';$('#pcancel').hidden=true}
$('#pcancel').onclick=resetP;
$('#pform').addEventListener('submit',async e=>{e.preventDefault();const f=e.target.elements;
 if(!f.name.value.trim()||!f.description.value.trim()||!f.category.value.trim())return toast('Name, description and category are required.',1);
 const body={name:f.name.value,description:f.description.value,category:f.category.value,technologies:f.technologies.value.split(',').map(s=>s.trim()).filter(Boolean),image_url:f.image_url.value,project_url:f.project_url.value};
 try{editing?await api('/admin/projects/'+editing,'PATCH',body):await api('/admin/projects','POST',body);toast(editing?'Project updated.':'Project added.');resetP();loadProjs()}catch(err){toast(err.message,1)}});
boot();
})();
