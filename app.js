import {plan, validate} from './packing.js';

const $=s=>document.querySelector(s);
const initial=()=>({version:1,unit:'metric',padding:0,items:[],boxes:[]});
let state=initial(), result=null, editKind='item', editIndex=-1, toastTimer;
const KEY='cartonroom-workspace-v1';
const dummyItem={id:'dummy',name:'Item',l:1,w:1,h:1,weight:1,qty:1,upright:false};
const dummyBox={id:'dummy',name:'Box',l:1,w:1,h:1,maxWeight:1};
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const toDisplay=n=>Number((state.unit==='imperial'?n/2.54:n).toPrecision(5));
const toInputDim=n=>Number((state.unit==='imperial'?n/2.54:n).toPrecision(12));
const toMetric=n=>state.unit==='imperial'?n*2.54:n;
const weightDisplay=n=>Number((state.unit==='imperial'?n*2.2046226218:n).toPrecision(5));
const weightInput=n=>Number((state.unit==='imperial'?n*2.2046226218:n).toPrecision(12));
const weightMetric=n=>state.unit==='imperial'?n/2.2046226218:n;
const dimUnit=()=>state.unit==='imperial'?'in':'cm';
const massUnit=()=>state.unit==='imperial'?'lb':'kg';
const dims=o=>`${toDisplay(o.l)} × ${toDisplay(o.w)} × ${toDisplay(o.h)} ${dimUnit()}`;
function tell(message){const t=$('#toast');t.textContent=message;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),3500)}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch{tell('Could not save on this device. Export a backup.');return false}}
function cleanRecord(x,kind){
 if(!x||typeof x!=='object'||Array.isArray(x))throw new Error('Invalid record.');
 const basic={id:uid(),name:x.name,l:x.l,w:x.w,h:x.h};
 if(kind==='item')return {...basic,weight:x.weight,qty:x.qty,upright:x.upright};
 return {...basic,maxWeight:x.maxWeight};
}
function parseWorkspace(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1||!Array.isArray(value.items)||!Array.isArray(value.boxes))throw new Error('This is not a Cartonroom backup.');
 if(value.items.length>30||value.boxes.length>12)throw new Error('This backup exceeds the workspace limits.');
 const items=value.items.map(x=>cleanRecord(x,'item')),boxes=value.boxes.map(x=>cleanRecord(x,'box'));
 if(value.unit!=='metric'&&value.unit!=='imperial')throw new Error('Unknown measurement units.');
 if(typeof value.padding!=='number'||!Number.isFinite(value.padding)||value.padding<0||value.padding>25)throw new Error('Invalid padding.');
 for(const i of items)validate([i],[dummyBox],value.padding);
 for(const b of boxes)validate([dummyItem],[b],value.padding);
 if(items.reduce((a,b)=>a+b.qty,0)>30)throw new Error('A plan supports up to 30 individual items.');
 return {version:1,unit:value.unit,padding:value.padding,items,boxes};
}
try{const stored=localStorage.getItem(KEY);if(stored)state=parseWorkspace(JSON.parse(stored))}catch{state=initial();tell('Saved workspace could not be read. You can import a backup.')}
function invalidate(){result=null;renderResult()}
function setState(next){state=next;save();render();invalidate()}
function change(fn){fn();save();render();invalidate()}
function recordRow(record,kind,index){
 const row=el('div','record'),main=el('div','record-main'),actions=el('div','record-actions');
 main.append(el('div','record-name',record.name));
 let meta=kind==='item'?`${dims(record)} · ${weightDisplay(record.weight)} ${massUnit()} each · Qty ${record.qty}${record.upright?' · upright':''}`:`${dims(record)} inside · ${weightDisplay(record.maxWeight)} ${massUnit()} max contents`;
 main.append(el('div','record-meta',meta));
 const edit=el('button','text-button','Edit');edit.type='button';edit.setAttribute('aria-label',`Edit ${record.name}`);edit.addEventListener('click',()=>openEditor(kind,index));
 const del=el('button','text-button danger','Remove');del.type='button';del.setAttribute('aria-label',`Remove ${record.name}`);del.addEventListener('click',()=>change(()=>{(kind==='item'?state.items:state.boxes).splice(index,1)}));
 actions.append(edit,del);row.append(main,actions);return row;
}
function render(){
 $('#unit').value=state.unit;$('#padding').value=toInputDim(state.padding);$('#padding-unit').textContent=`(${dimUnit()})`;
 for(const [selector,records,kind,empty] of [['#items-list',state.items,'item','No products yet. Add the first item in your order.'],['#boxes-list',state.boxes,'box','No boxes yet. Add a box you have available.']]){
  const node=$(selector);node.replaceChildren();if(!records.length)node.append(el('div','empty-record',empty));else records.forEach((r,i)=>node.append(recordRow(r,kind,i)));
 }
}
function openEditor(kind,index=-1){
 editKind=kind;editIndex=index;const form=$('#editor-form');form.reset();$('#form-error').textContent='';
 const box=kind==='box',record=index<0?null:(box?state.boxes:state.items)[index];
 $('#dialog-eyebrow').textContent=box?'BOX DETAILS':'PRODUCT DETAILS';$('#dialog-title').textContent=`${record?'Edit':'Add'} a ${box?'box':'product'}`;
 $('#dialog-intro').textContent=box?'Enter the inside dimensions of a box you have available.':'Measure the product with its usual packaging.';
 $('#weight-label').firstChild.textContent=box?'Max content weight ':'Weight ';$('#qty-label').hidden=box;$('#upright-label').hidden=box;
 for(const s of document.querySelectorAll('.dim-unit'))s.textContent=`(${dimUnit()})`;
 for(const s of document.querySelectorAll('.mass-unit'))s.textContent=`(${massUnit()})`;
 if(record){for(const k of ['name','l','w','h'])form.elements[k].value=k==='name'?record[k]:toInputDim(record[k]);form.elements.weight.value=weightInput(box?record.maxWeight:record.weight);if(!box){form.elements.qty.value=record.qty;form.elements.upright.checked=record.upright}}
 else form.elements.qty.value=1;
 $('#editor').showModal();form.elements.name.focus();
}
$('#add-item').addEventListener('click',()=>openEditor('item'));
$('#add-box').addEventListener('click',()=>openEditor('box'));
$('#close-dialog').addEventListener('click',()=>$('#editor').close());
$('#cancel-dialog').addEventListener('click',()=>$('#editor').close());
$('#editor-form').addEventListener('submit',event=>{
 event.preventDefault();const f=event.currentTarget,base={id:editIndex<0?uid():(editKind==='item'?state.items:state.boxes)[editIndex].id,name:f.elements.name.value.trim(),l:toMetric(Number(f.elements.l.value)),w:toMetric(Number(f.elements.w.value)),h:toMetric(Number(f.elements.h.value))};
 const record=editKind==='item'?{...base,qty:Number(f.elements.qty.value),weight:weightMetric(Number(f.elements.weight.value)),upright:f.elements.upright.checked}:{...base,maxWeight:weightMetric(Number(f.elements.weight.value))};
 try{
  if(editKind==='item'){
    const next=[...state.items];if(editIndex<0)next.push(record);else next[editIndex]=record;validate(next,[dummyBox],state.padding);
    change(()=>{state.items=next});
  }else{
    const next=[...state.boxes];if(editIndex<0)next.push(record);else next[editIndex]=record;validate([dummyItem],next,state.padding);
    change(()=>{state.boxes=next});
  }
  $('#editor').close();tell(`${editKind==='item'?'Product':'Box'} saved.`);
 }catch(error){$('#form-error').textContent=error.message}
});
$('#unit').addEventListener('change',event=>change(()=>{state.unit=event.target.value}));
$('#padding').addEventListener('change',event=>{
 const n=Number(event.target.value),cm=toMetric(n);
 if(event.target.value===''||!Number.isFinite(cm)||cm<0||cm>25){event.target.setCustomValidity('Use padding between 0 and 25 cm per side.');event.target.reportValidity();return}
 event.target.setCustomValidity('');change(()=>{state.padding=cm});
});
$('#calculate').addEventListener('click',()=>{
 const raw=$('#padding').value, pad=toMetric(Number(raw));
 try{if(raw==='')throw new Error('Enter padding per side, including 0 if none.');result=plan(state.items,state.boxes,pad);state.padding=pad;save();renderResult();$('#results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});}
 catch(error){tell(error.message)}
});
$('#example').addEventListener('click',()=>{
 if((state.items.length||state.boxes.length)&&!confirm('Replace the current workspace with an example? Export a backup first if you need it.'))return;
 setState({version:1,unit:'metric',padding:.3,items:[{id:uid(),name:'Notebook',l:21,w:15,h:2,qty:2,weight:.4,upright:false},{id:uid(),name:'Coffee cup',l:9,w:9,h:11,qty:1,weight:.35,upright:true},{id:uid(),name:'Thank-you cards',l:12,w:8,h:1,qty:1,weight:.1,upright:false}],boxes:[{id:uid(),name:'Small mailer',l:24,w:18,h:8,maxWeight:2},{id:uid(),name:'Medium carton',l:32,w:24,h:16,maxWeight:5},{id:uid(),name:'Large carton',l:40,w:30,h:20,maxWeight:8}]});tell('Example added. Find a packing plan to see the result.');
});
$('#clear').addEventListener('click',()=>{if(!state.items.length&&!state.boxes.length){tell('Your workspace is already empty.');return}if(confirm('Clear this workspace on this device? Export a backup first if you need it.')){setState(initial());tell('Workspace cleared.')}});
$('#export').addEventListener('click',()=>{const data=JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2);const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=el('a');a.href=url;a.download='cartonroom-workspace.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);tell('Workspace exported.')});
$('#import').addEventListener('change',async event=>{const input=event.target,file=input.files?.[0];if(!file)return;try{if(file.size>100000)throw new Error('Backup is too large.');const data=parseWorkspace(JSON.parse(await file.text()));if((state.items.length||state.boxes.length)&&!confirm('Replace your current workspace with this backup?'))return;setState(data);tell('Workspace imported.')}catch(error){tell(error.message||'Could not import this file.')}finally{input.value=''}});
function poly(svg,points,fill,stroke='#8c8c7e',width='1'){
 const p=document.createElementNS('http://www.w3.org/2000/svg','polygon');p.setAttribute('points',points.map(v=>v.map(n=>round(n)).join(',')).join(' '));p.setAttribute('fill',fill);p.setAttribute('stroke',stroke);p.setAttribute('stroke-width',width);p.setAttribute('stroke-linejoin','round');svg.append(p);
}
function figure(parcel){
 const {box,placements}=parcel,svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 440 280');svg.setAttribute('role','img');svg.setAttribute('aria-label',`Packing arrangement for ${box.name}, with ${placements.length} item envelopes. The detailed placement list follows.`);
 const s=Math.min(310/(box.l+box.w),180/(box.h+(box.l+box.w)*.5));const ox=220+(box.w-box.l)*s*.5,oy=32+box.h*s;
 const pr=(x,y,z)=>[ox+(x-y)*s,oy+(x+y)*s*.5-z*s];
 const A=pr(0,0,0),B=pr(box.l,0,0),C=pr(box.l,box.w,0),D=pr(0,box.w,0);
 poly(svg,[A,B,C,D],'#e4dfd2','#c2c8bc');
 const order=[...placements].sort((a,b)=>(a.x+a.y+a.z)-(b.x+b.y+b.z));
 const palette=[['#8fa498','#708c7d','#627e6f'],['#dbc6a4','#c5ac86','#b79b74'],['#d8b4a3','#c79b88','#b98672'],['#b8c6ba','#9aafa0','#8c9f92']];
 for(const p of order){
  const [x,y,z,l,w,h]=[p.x,p.y,p.z,p.l,p.w,p.h],colors=palette[p.order%palette.length];
  const p000=pr(x,y,z),p100=pr(x+l,y,z),p110=pr(x+l,y+w,z),p010=pr(x,y+w,z),p001=pr(x,y,z+h),p101=pr(x+l,y,z+h),p111=pr(x+l,y+w,z+h),p011=pr(x,y+w,z+h);
  poly(svg,[p010,p110,p111,p011],colors[2],'#728074',.7);poly(svg,[p100,p110,p111,p101],colors[1],'#728074',.7);poly(svg,[p001,p101,p111,p011],colors[0],'#728074',.7);
  const label=document.createElementNS('http://www.w3.org/2000/svg','text'),center=pr(x+l/2,y+w/2,z+h);label.setAttribute('x',String(center[0]));label.setAttribute('y',String(center[1]+3));label.setAttribute('text-anchor','middle');label.setAttribute('font-size','10');label.setAttribute('font-weight','700');label.setAttribute('fill','#26392f');label.textContent=String(placements.indexOf(p)+1);svg.append(label);
 }
 const p=document.createElementNS('http://www.w3.org/2000/svg','polyline');p.setAttribute('points',[pr(0,0,box.h),pr(box.l,0,box.h),pr(box.l,box.w,box.h),pr(0,box.w,box.h),pr(0,0,box.h)].map(v=>v.map(n=>round(n)).join(',')).join(' '));p.setAttribute('fill','none');p.setAttribute('stroke','#9b9e91');p.setAttribute('stroke-width','1.2');svg.append(p);return svg;
}
function renderResult(){
 const area=$('#result-content'),status=$('#result-status');area.replaceChildren();
 if(!result){status.textContent='Ready when you are';const wrap=el('div','result-empty'),art=el('div','empty-art');const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 120 110');s.setAttribute('aria-hidden','true');poly(s,[[16,43],[60,19],[104,43],[60,68]],'#ece6d7');poly(s,[[16,43],[60,68],[60,92],[16,67]],'#d6cbb7');poly(s,[[60,68],[104,43],[104,67],[60,92]],'#c2b49f');art.append(s);wrap.append(art,el('h3','', 'Your plan will appear here.'),el('p','', 'Add at least one product and one box, then find a packing plan.'));area.append(wrap);return}
 const packed=result.totalItems-result.unpacked.length;status.textContent='Plan ready';const summary=el('div','result-summary'),lead=el('div');lead.append(el('h3','',`${result.parcels.length} ${result.parcels.length===1?'box':'boxes'} in this plan`),el('p','',`${packed} of ${result.totalItems} item${result.totalItems===1?'':'s'} placed`));summary.append(lead,el('strong','',`${packed}/${result.totalItems} placed`));area.append(summary);
 if(result.unpacked.length){const warning=el('div','unpacked');warning.append(el('strong','','Could not place'),el('span','',result.unpacked.map(x=>x.name).join(', ')));area.append(warning)}
 result.parcels.forEach((p,index)=>{
  const card=el('section','parcel-card'),head=el('div','parcel-head');head.append(el('h4','',`Box ${index+1} · ${p.box.name}`),el('span','',`${p.placements.length} items`));card.append(head,el('p','parcel-desc',`${dims(p.box)} inside · ${weightDisplay(p.weight)} ${massUnit()} contents`));const visual=el('div','parcel-visual');visual.append(figure(p));card.append(visual);
  const m=el('div','parcel-meta'),used=Math.min(100,round(100*p.packedVolume/(p.box.l*p.box.w*p.box.h)));m.append(el('span','metric',`${used}% envelope volume`),el('span','metric',`${weightDisplay(p.weight)} / ${weightDisplay(p.box.maxWeight)} ${massUnit()}`));card.append(m);
  const list=el('ol','placement-list');for(const x of p.placements)list.append(el('li','',`${x.name} · ${dims(x)} envelope · at ${toDisplay(x.x)}, ${toDisplay(x.y)}, ${toDisplay(x.z)} ${dimUnit()}`));card.append(list);area.append(card);
 });
 area.append(el('p','limitations','Numbers in the drawing match the list. The layout shows padded envelopes. Support is checked for those envelopes, not the items inside. Positions are measured from a box corner (length, width, height). The search is heuristic and does not model fragile stacking, package weight, or shipping rates.'));
 const print=el('button','button secondary print-btn','Print packing plan');print.type='button';print.addEventListener('click',()=>window.print());area.append(print);
}
render();renderResult();
