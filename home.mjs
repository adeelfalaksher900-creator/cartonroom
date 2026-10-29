import { blankState, plan } from './engine.mjs';
const stock=document.getElementById('example-stock'), a=document.getElementById('example-a'), b=document.getElementById('example-b');
function updateExample() {
  const quantities=[stock,a,b].map(el=>Number(el.value));
  if(quantities.some(n=>!Number.isInteger(n)||n<0||n>24)){
    document.getElementById('pack-a').textContent='—';
    document.getElementById('pack-b').textContent='—';
    document.getElementById('example-total').textContent='Check quantities';
    document.getElementById('example-progress').value=0;
    document.getElementById('example-shortfall').textContent='Use whole quantities from 0 to 24.';
    return;
  }
  const state=blankState();state.items=[{id:'example',name:'Requested item',qty:quantities[0],unit:'units',category:'Pantry',date:''}];
  state.requests=[['a',quantities[1]],['b',quantities[2]]].map(([id,n])=>({id,label:id,lines:n?{example:n}:{}}));
  const p=plan(state);
  document.getElementById('stock-value').textContent=`${quantities[0]} units`;
  document.getElementById('pack-a').textContent=p.rows[0].allocated;
  document.getElementById('pack-b').textContent=p.rows[1].allocated;
  document.getElementById('example-total').textContent=`${p.totalAllocated} of ${p.totalRequested} units`;
  const progress=document.getElementById('example-progress');progress.max=Math.max(1,p.totalRequested);progress.value=p.totalAllocated;
  const missing=p.totalRequested-p.totalAllocated;
  document.getElementById('example-shortfall').textContent=missing?`${missing} requested units remain unfilled.`:'All requested quantities can be packed.';
}
[stock,a,b].forEach(el=>el.addEventListener('input',updateExample));updateExample();
if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.15});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
}
