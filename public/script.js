(()=>{
const IG='https://instagram.com/mylezix/',WA='https://wa.me/962790931373',$=s=>document.querySelector(s);
const SERV=[['💻','Full-Stack Development','Modern websites, dashboards, APIs, systems and custom applications.'],['🤖','Discord Bots','Custom Discord bots, automation, moderation, tickets, integrations and management systems.'],['🌐','Websites','Modern responsive websites, landing pages, dashboards and custom platforms.'],['⚙️','Systems','Custom systems, APIs, automation, authentication and management panels.'],['🛡️','Cybersecurity','Security-focused development and secure web architecture.'],['🎮','Minecraft Servers','Minecraft server development, plugins, configurations, systems and infrastructure.']];
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
function toast(m,bad){const t=el('div','toast'+(bad?' bad':''),m);$('#toasts').append(t);setTimeout(()=>t.remove(),4000)}
let csrf=null;
async function api(path,opt={}){
 try{
  if(opt.method&&opt.method!=='GET'&&!csrf)csrf=(await(await fetch('/api/csrf')).json()).csrf;
  const r=await fetch('/api'+path,{...opt,headers:{'Content-Type':'application/json',...(csrf?{'x-csrf-token':csrf}:{})},body:opt.body?JSON.stringify(opt.body):undefined});
  const d=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(d.error||'Something went wrong. Please try again.');e.status=r.status;throw e}
  return d;
 }catch(e){if(!e.status)e.message='Network error. Check your connection and try again.';throw e}
}
function contactBtns(box,ig,wa){
 [['Instagram',IG,'<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.500" cy="6.500" r="1.200" fill="currentColor"/>',ig],['WhatsApp',WA,'<path fill="none" stroke="currentColor" stroke-width="2" d="M12 3a9 9 0 0 0-7.700 13.600L3 21l4.500-1.200A9 9 0 1 0 12 3z"/>',wa]].forEach(([n,h,p,l])=>{
  const a=el('a','btn '+(n==='Instagram'?'primary':'ghost'));a.href=h;a.target='_blank';a.rel='noopener noreferrer';
  a.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">'+p+'</svg>';a.append(l);box.append(a)});
}
SERV.forEach(([i,t,d])=>{const c=el('article','card');c.tabIndex=0;c.append(el('div','ic',i),el('h3','',t),el('p','',d));$('#cards').append(c)});
contactBtns($('#contactbtns'),'Instagram','WhatsApp');
const burger=$('#burger'),menu=$('#menu');
burger.onclick=()=>{const o=menu.classList.toggle('open');burger.setAttribute('aria-expanded',o)};
menu.addEventListener('click',e=>{if(e.target.tagName==='A'){menu.classList.remove('open');burger.setAttribute('aria-expanded',false)}});
let all=[],cat='All';
function render(){
 const g=$('#pgrid');g.replaceChildren();
 const list=all.filter(p=>cat==='All'||p.category===cat);
 if(!list.length){g.append(el('p','muted',all.length?'No projects in this category.':'Projects will appear here soon.'));return}
 list.forEach(p=>{const c=el('article','proj');
  if(p.image_url){const i=el('img');i.src=p.image_url;i.alt=p.name+' preview';i.loading='lazy';c.append(i)}
  const b=el('div','b');b.append(el('h3','',p.name),el('p','',p.description));
  const t=el('div','tech');(p.technologies||[]).forEach(x=>t.append(el('span','',x)));b.append(t);
  if(p.project_url){const a=el('a','btn ghost','View project');a.href=p.project_url;a.target='_blank';a.rel='noopener noreferrer';b.append(a)}
  c.append(b);g.append(c)});
}
function chips(){
 const f=$('#filters');f.replaceChildren();
 ['All',...new Set(all.map(p=>p.category))].forEach(n=>{const b=el('button','chip',n);b.type='button';b.setAttribute('aria-pressed',n===cat);b.onclick=()=>{cat=n;chips();render()};f.append(b)});
}
api('/projects').then(d=>{all=d;chips();render()}).catch(e=>{$('#pgrid').replaceChildren(el('p','muted','Projects could not be loaded right now.'));toast(e.message,1)});
const modal=$('#modal'),form=$('#rform');let last=null;
function openM(){$('#mform').hidden=false;$('#mdone').hidden=true;modal.hidden=false;last=document.activeElement;form.elements.name.focus()}
function closeM(){modal.hidden=true;last&&last.focus()}
document.querySelectorAll('[data-open-request]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();menu.classList.remove('open');openM()}));
$('#mclose').onclick=closeM;modal.addEventListener('click',e=>{if(e.target===modal)closeM()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeM()});
form.addEventListener('submit',async e=>{
 e.preventDefault();let ok=true;
 [...form.elements].forEach(f=>{if(!f.name)return;const v=f.value.trim();const bad=(f.required&&!v)||(f.name==='email'&&v&&!/^\S+@\S+\.\S+$/.test(v))||(f.name==='description'&&v.length<10);f.classList.toggle('err',bad);if(bad)ok=false});
 if(!ok)return toast('Please complete the required fields.',1);
 const btn=$('#rsubmit');btn.disabled=true;
 try{
  const body=Object.fromEntries(new FormData(form));
  const d=await api('/requests',{method:'POST',body});
  $('#mform').hidden=true;$('#mdone').hidden=false;$('#rcode').textContent=d.request_code;
  const box=$('#donebtns');box.replaceChildren();contactBtns(box,'Continue on Instagram','Continue on WhatsApp');
  form.reset();toast('Request submitted successfully.');
 }catch(err){toast(err.message,1)}finally{btn.disabled=false}
});
})();
