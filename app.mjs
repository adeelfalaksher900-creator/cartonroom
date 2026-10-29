import { blankState, plan, customizePlan, applyPlan, quantity, serializeBackup, MAX_BACKUP_BYTES } from './engine.mjs';
import { readState, updateState } from './storage.mjs';
import { CATEGORIES, putItem, removeItem, putRequest, filterStock, stockCSV, historyCSV, readBackup } from './domain.mjs';
import { icon } from './icons.mjs';

const $ = s => document.querySelector(s);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => Number(n).toLocaleString();
const batchText = item => `${item.name} · ${item.unit} · ${item.date ? `best before ${item.date}` : 'date not set'}`;
const routes = [
  ['overview','Overview','dashboard'], ['stock','Stock','box'], ['requests','Requests','requests'],
  ['packing','Packing','packing'], ['history','History','history'], ['settings','Settings & backup','settings']
];
const href = view => `workspace.html?view=${view}`;
const routeLink = (view, text, cls = '') => `<a href="${href(view)}" data-route="${view}" class="${cls}">${text}</a>`;
const button = (label, action, glyph = '', cls = 'btn-primary', data = '') => `<button class="btn ${cls}" type="button" data-action="${action}" ${data}>${glyph ? icon(glyph) : ''}<span>${label}</span></button>`;
const rowButton = (label, action, id, glyph) => `<button class="icon-button" type="button" data-action="${action}" data-id="${esc(id)}" aria-label="${esc(label)}" title="${esc(label)}">${icon(glyph)}</button>`;
const empty = (title, text, cta = '', glyph = 'box') => `<div class="empty-state">${icon(glyph,'empty-glyph')}<h2>${title}</h2><p>${text}</p>${cta}</div>`;
const heading = (title, description, actions = '') => `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div><div class="button-row">${actions}</div></div>`;
let currentView = new URLSearchParams(location.search).get('view') || 'overview';
if (!routes.some(r => r[0] === currentView)) currentView = 'overview';
let state, preview = null, adjusted = false, toastTimer, lastFocused;
let stockFilters = {query:'', category:'', status:'all', sort:'name'};
let channel;
try { channel = new BroadcastChannel('gathershelf-updates'); } catch { /* Tab refresh still works without BroadcastChannel. */ }
if (channel) channel.onmessage = async () => {
  try {
    state = await readState(); preview = null; adjusted = false; render(true);
    toast('Workspace updated in another tab. Review the latest stock before saving.');
  } catch (error) { toast(error.message); }
};

function renderNavigation() {
  const navItem = ([view,label,glyph]) => `<a href="${href(view)}" data-route="${view}" class="nav-link ${view === currentView ? 'active' : ''}" ${view === currentView ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${label}</span>${view === 'requests' && state?.requests.length ? `<span class="nav-count">${state.requests.length}</span>` : ''}</a>`;
  $('#side-nav').innerHTML = routes.map(navItem).join('');
  $('#mobile-nav').innerHTML = routes.slice(0,4).map(navItem).join('') + `<button class="nav-link ${['history','settings'].includes(currentView)?'active':''}" type="button" data-action="more-nav" aria-label="More navigation" aria-haspopup="dialog">${icon('more')}<span>More</span></button>`;
  const label = routes.find(r => r[0] === currentView)[1];
  $('#crumb').textContent = label; document.title = `${label} · GatherShelf`;
}
function overview() {
  const p = plan(state);
  const complete = [state.items.length > 0, state.requests.length > 0, state.history.length > 0];
  const stats = [
    ['Stock items',state.items.length,`${fmt(state.items.reduce((n,i)=>n+i.qty,0))} units on the shelf`],
    ['Open requests',state.requests.length,`${fmt(p.totalRequested)} units requested`],
    ['Ready to pack',p.totalAllocated,p.shortages.length ? `${p.shortages.length} stock ${p.shortages.length===1?'shortage':'shortages'} to review` : 'From current stock and requests']
  ];
  return heading('Pantry overview','Stock, household choices and your next distribution.',routeLink('packing',`Open packing ${icon('arrow')}`,'btn btn-primary')) +
    `<section class="stats-strip" aria-label="Pantry summary">${stats.map(([label,value,detail])=>`<div><span>${label}</span><strong>${fmt(value)}</strong><small>${detail}</small></div>`).join('')}</section>
    <div class="dashboard-grid"><section class="panel"><div class="panel-heading"><h2>Next on your shelf</h2>${routeLink('stock',`View stock ${icon('arrow')}`,'text-link')}</div>
    ${state.items.length ? `<div class="compact-list">${filterStock(state.items,{sort:'date'}).slice(0,5).map(i=>`<div class="compact-row"><div><strong>${esc(i.name)}</strong><small>${esc(i.category)}${i.date?` · Best before ${esc(i.date)}`:''}</small></div><span class="quantity">${fmt(i.qty)} <small>${esc(i.unit)}</small></span></div>`).join('')}</div>` : empty('Add what is on hand','Start with the items and whole quantities on your shelves.',button('Add stock item','add-item','plus'),'box')}</section>
    <section class="panel"><div class="panel-heading"><h2>${p.shortages.length?'Stock to follow up':'Your next steps'}</h2>${routeLink('requests','Requests','text-link')}</div>
    ${p.shortages.length?`<div class="compact-list">${p.shortages.slice(0,5).map(s=>`<div class="compact-row"><div><strong>${esc(s.name)}</strong><small>${fmt(s.available)} available · ${fmt(s.requested)} requested</small></div><span class="status warning">${fmt(s.missing)} short</span></div>`).join('')}</div>`:
      `<div class="checklist">${[['Add shelf stock','stock'],['Record household choices','requests'],['Review and record a distribution','packing']].map(([text,view],i)=>`<a href="${href(view)}" data-route="${view}" class="checklist-row"><span class="checkmark ${complete[i]?'done':''}">${complete[i]?icon('check'):''}</span><span>${text}</span>${icon('arrow')}</a>`).join('')}</div>`}
    </section></div>
    <section class="panel activity-panel"><div class="panel-heading"><h2>Recent distributions</h2>${routeLink('history',`View history ${icon('arrow')}`,'text-link')}</div>${state.history.length?`<div class="compact-list">${state.history.slice(0,3).map(h=>`<div class="compact-row"><div><strong>${esc(new Date(h.at).toLocaleString())}</strong><small>Recorded distribution</small></div><span class="quantity">${fmt(h.rows.reduce((n,r)=>n+r.amount,0))} <small>units</small></span></div>`).join('')}</div>`:'<p class="inline-empty">Completed distributions will appear here.</p>'}</section>`;
}
function stock() {
  return heading('Stock','Know what is available before you start packing.',button('Export CSV','export-stock','download','btn-secondary') + button('Add stock item','add-item','plus')) +
  `<section class="panel stock-panel"><div class="panel-tabs" role="group" aria-label="Stock availability"><button type="button" data-stock-status="all" aria-pressed="${stockFilters.status==='all'}" class="${stockFilters.status==='all'?'active':''}">All stock <span>${state.items.length}</span></button><button type="button" data-stock-status="available" aria-pressed="${stockFilters.status==='available'}" class="${stockFilters.status==='available'?'active':''}">In stock <span>${state.items.filter(i=>i.qty>0).length}</span></button><button type="button" data-stock-status="empty" aria-pressed="${stockFilters.status==='empty'}" class="${stockFilters.status==='empty'?'active':''}">Out of stock <span>${state.items.filter(i=>!i.qty).length}</span></button></div>
  <div class="toolbar"><div class="search-field">${icon('search')}<label class="sr-only" for="stock-search">Search stock</label><input id="stock-search" type="search" autocomplete="off" placeholder="Search items or categories" value="${esc(stockFilters.query)}"></div><div class="filter-control"><label class="sr-only" for="stock-category">Filter category</label><select id="stock-category"><option value="">All categories</option>${[...new Set([...CATEGORIES,...state.items.map(i=>i.category)])].map(c=>`<option value="${esc(c)}" ${stockFilters.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div><div class="filter-control"><label class="sr-only" for="stock-sort">Sort stock</label><select id="stock-sort"><option value="name" ${stockFilters.sort==='name'?'selected':''}>Name: A–Z</option><option value="quantity" ${stockFilters.sort==='quantity'?'selected':''}>Quantity: high first</option><option value="date" ${stockFilters.sort==='date'?'selected':''}>Best-before date</option></select></div></div><div id="stock-results">${stockResults()}</div></section><p class="page-footnote">${icon('help')} Best-before dates are for review. Always check product labels and household suitability.</p>`;
}
function stockResults() {
  const items = filterStock(state.items,stockFilters);
  if (!state.items.length) return empty('Your shelf starts here','Add a stock item, its available quantity and the unit you count it in.',button('Add your first item','add-item','plus'),'box');
  if (!items.length) return empty('No matching stock','Try another search or clear your filters.',button('Clear filters','reset-filters','filter','btn-secondary'),'search');
  return `<table class="responsive-table stock-table"><thead><tr><th>Item</th><th>Category</th><th class="numeric">On hand</th><th>Best before</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${items.map(i=>`<tr><td class="identity-cell"><strong>${esc(i.name)}</strong></td><td data-label="Category">${esc(i.category)}</td><td class="numeric" data-label="On hand"><strong>${fmt(i.qty)}</strong> <span class="muted">${esc(i.unit)}</span></td><td data-label="Best before">${i.date?esc(i.date):'<span class="muted">Not set</span>'}</td><td data-label="Status"><span class="status ${i.qty?'available':'neutral'}">${i.qty?'In stock':'Out of stock'}</span></td><td class="row-actions">${rowButton(`Edit ${batchText(i)}`,'edit-item',i.id,'edit')}${rowButton(`Remove ${batchText(i)}`,'delete-item',i.id,'trash')}</td></tr>`).join('')}</tbody></table><div class="table-footer" role="status">Showing ${items.length} of ${state.items.length} stock items</div>`;
}
function requests() {
  return heading('Household requests','Record the items people choose, using a household reference.',button('Add request','add-request','plus')) +
  `<section class="panel"><div class="panel-heading"><h2>Open requests <span class="count-label">${state.requests.length}</span></h2><span class="muted">Unfilled quantities stay open</span></div>${state.requests.length?
    `<table class="responsive-table requests-table"><thead><tr><th>Household reference</th><th>Requested items</th><th class="numeric">Total units</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${state.requests.map(r=>`<tr><td class="identity-cell"><strong>${esc(r.label)}</strong></td><td data-label="Requested">${Object.entries(r.lines).map(([id,n])=>{const i=state.items.find(i=>i.id===id);return `<span class="request-line">${esc(i.name)} <span class="muted">· ${fmt(n)} ${esc(i.unit)}${i.date?` · Best before ${esc(i.date)}`:' · Date not set'}</span></span>`}).join('')}</td><td data-label="Total units" class="numeric">${fmt(Object.values(r.lines).reduce((a,b)=>a+b,0))}</td><td class="row-actions">${rowButton(`Edit request for ${r.label}`,'edit-request',r.id,'edit')}${rowButton(`Remove request for ${r.label}`,'delete-request',r.id,'trash')}</td></tr>`).join('')}</tbody></table>`:
    empty('Start with household choices','Add the specific items and quantities a household has asked for.',state.items.length?button('Add first request','add-request','plus'):routeLink('stock',`Add stock first ${icon('arrow')}`,'btn btn-primary'),'requests')}
  </section><p class="page-footnote">${icon('shield')} Use a reference rather than personal details. Volunteers should verify labels, allergens and suitability.</p>`;
}
function packing() {
  const p = preview?.revision === state.revision ? preview : plan(state); preview = p;
  return heading('Packing plan','Review requested quantities, adjust the plan, then record the distribution.',button('Print plan','print-plan','printer','btn-secondary')) +
    `<section class="packing-summary panel"><div><span class="muted">${adjusted?'Adjusted packing plan':'Proportional packing plan'}</span><h2>${fmt(p.totalAllocated)} <span>of ${fmt(p.totalRequested)} units planned</span></h2><progress value="${p.totalAllocated}" max="${Math.max(1,p.totalRequested)}" aria-label="Requested units planned"></progress><p>${p.rows.length} household ${p.rows.length===1?'request':'requests'} · ${p.shortages.length} stock ${p.shortages.length===1?'shortage':'shortages'}</p></div><div class="button-row">${p.rows.length?button('Adjust quantities','adjust-plan','edit','btn-secondary'):''}${adjusted?button('Reset plan','reset-plan','','btn-secondary'):''}${button('Record distribution','commit-plan','check','btn-primary',p.totalAllocated?'':'disabled')}</div></section>
    ${p.shortages.length?`<section class="shortage-banner"><div>${icon('filter')}<h2>Stock needs a review</h2></div><ul>${p.shortages.map(s=>`<li><strong>${esc(s.name)}</strong><span>${fmt(s.available)} available / ${fmt(s.requested)} requested</span><b>${fmt(s.missing)} ${esc(s.unit)} short</b></li>`).join('')}</ul></section>`:''}
    ${p.rows.length?`<div class="packing-lists">${p.rows.map(r=>`<section class="panel pack-card"><div class="panel-heading"><h2>${esc(r.label)}</h2><span>${fmt(r.allocated)} of ${fmt(r.requested)} units planned</span></div><table class="responsive-table pack-table"><thead><tr><th>Requested item</th><th>Best before</th><th class="numeric">Requested</th><th class="numeric">Pack</th><th class="numeric">Unfilled</th></tr></thead><tbody>${r.lines.map(l=>`<tr><td class="identity-cell"><strong>${esc(l.name)}</strong><small>${esc(l.unit)}</small></td><td data-label="Best before">${l.date?esc(l.date):'<span class="muted">Not set</span>'}</td><td class="numeric" data-label="Requested">${fmt(l.requested)}</td><td class="numeric pack-quantity" data-label="Pack">${fmt(l.amount)}</td><td class="numeric" data-label="Unfilled">${fmt(l.requested-l.amount)}</td></tr>`).join('')}</tbody></table></section>`).join('')}</div>`:
      `<section class="panel">${empty('A packing plan starts with requests','Add stock and household choices to see what can be packed.',routeLink('requests',`Go to requests ${icon('arrow')}`,'btn btn-primary'),'packing')}</section>`}
    <details class="method-details"><summary>How this plan works ${icon('chevron')}</summary><p>Whole units are shared proportionally to the quantity requested for each item. Stable request IDs resolve ties. You can adjust quantities before recording; each amount is limited by stock and the original request. Adjustments are held on this screen until recorded or refreshed. This is not a nutrition, food safety, allergy or eligibility assessment. Review labels, dates and suitability with the household.</p></details>`;
}
function history() {
  return heading('Distribution history','A record of what was packed, when and for which household reference.',button('Export CSV','export-history','download','btn-secondary')) +
    `<section class="panel">${state.history.length?state.history.map(h=>`<details class="history-record" data-history="${esc(h.id)}"><summary id="history-${esc(h.id)}"><span>${icon('packing')}<span><strong>${esc(new Date(h.at).toLocaleString())}</strong><small>Distribution recorded</small></span></span><span>${fmt(h.rows.reduce((n,r)=>n+r.amount,0))} units ${icon('chevron')}</span></summary><div class="history-content"></div></details>`).join(''):empty('No distributions recorded','Your completed packing lists will appear here.',routeLink('packing',`Open packing ${icon('arrow')}`,'btn btn-secondary'),'history')}</section>`;
}
function showHistoryRecord(details) {
  const content = details.querySelector('.history-content');
  if (!details.open || content.childElementCount) return;
  const record = state.history.find(h => h.id === details.dataset.history);
  if (!record) return;
  content.innerHTML = `<table class="responsive-table history-table"><thead><tr><th>Household reference</th><th>Item</th><th class="numeric">Quantity</th></tr></thead><tbody>${record.rows.map(r=>`<tr><td class="identity-cell"><strong>${esc(r.label)}</strong></td><td data-label="Item">${esc(r.item)}${r.date?`<small>Best before ${esc(r.date)}</small>`:''}</td><td class="numeric" data-label="Quantity">${fmt(r.amount)} <span class="muted">${esc(r.unit)}</span></td></tr>`).join('')}</tbody></table>`;
}
document.addEventListener('toggle', event => {
  if (event.target.matches('details[data-history]')) showHistoryRecord(event.target);
}, true);
function settings() {
  return heading('Settings & backup','Keep control of the records on this device.') +
    `<section class="settings-row"><div><h2>Your workspace</h2><p>Local storage and privacy</p></div><div class="panel settings-content"><div class="storage-heading">${icon('database')}<h3>Saved in this browser</h3></div><p>Records stay on this device and do not sync automatically. Use non-identifying household references whenever possible.</p><dl class="record-counts"><div><dt>Stock items</dt><dd>${state.items.length}</dd></div><div><dt>Open requests</dt><dd>${state.requests.length}</dd></div><div><dt>Distributions</dt><dd>${state.history.length}</dd></div></dl></div></section>
    <section class="settings-row"><div><h2>Backup & restore</h2><p>Take a copy of your records</p></div><div class="panel settings-content"><h3>Download a workspace backup</h3><p>Keep a JSON copy of stock, requests and history before clearing browser data or switching devices. Backup files are readable, so store them securely. This small-pantry workspace supports 1,000 stock items, 1,000 open requests and 1,000 distributions, within a 5 MB backup. Changes beyond these limits are rejected without replacing saved records.</p><div class="button-row">${button('Download backup','backup','download')}${button('Restore backup','restore','upload','btn-secondary')}</div><input id="restore-file" type="file" accept="application/json,.json" hidden></div></section>
    <section class="settings-row"><div><h2>Clear workspace</h2><p>Remove records from this browser</p></div><div class="panel settings-content danger-zone"><h3>Start with an empty workspace</h3><p>All stock, requests and distribution history will be removed. Download a backup first if you need to keep them.</p>${button('Clear workspace','clear','trash','btn-danger')}</div></section>`;
}
function render(preserveInteraction = false) {
  const focused = preserveInteraction ? document.activeElement : null;
  const focusId = focused?.id;
  const selection = focused?.tagName === 'INPUT' ? [focused.selectionStart,focused.selectionEnd] : null;
  const expanded = preserveInteraction ? [...document.querySelectorAll('details[data-history][open]')].map(el=>el.dataset.history) : [];
  renderNavigation();
  $('#app-content').innerHTML = ({overview,stock,requests,packing,history,settings}[currentView])();
  $('#stock-search')?.addEventListener('input',event=>{stockFilters.query=event.target.value;renderStockResults();});
  $('#stock-category')?.addEventListener('change',event=>{stockFilters.category=event.target.value;renderStockResults();});
  $('#stock-sort')?.addEventListener('change',event=>{stockFilters.sort=event.target.value;renderStockResults();});
  for (const details of document.querySelectorAll('details[data-history]')) {
    if (expanded.includes(details.dataset.history)) { details.open = true; showHistoryRecord(details); }
  }
  const replacement = focusId ? document.getElementById(focusId) : null;
  if (replacement && replacement !== focused) {
    replacement.focus({preventScroll:true});
    if (selection?.[0] != null && typeof replacement.setSelectionRange === 'function') replacement.setSelectionRange(...selection);
  }
}
function renderStockResults() { $('#stock-results').innerHTML=stockResults(); }
function navigate(view) {
  if (!routes.some(r=>r[0]===view)) return;
  currentView=view; window.history.pushState({},'',href(view)); render();
  $('#modal').open && $('#modal').close();
  $('#content').focus(); window.scrollTo({top:0,behavior:'instant'});
}
window.addEventListener('popstate',()=>{currentView=new URLSearchParams(location.search).get('view')||'overview';if(!routes.some(r=>r[0]===currentView))currentView='overview';render();});
function toast(text) {
  $('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4500);
}
function openModal(title,description,body,submit='Save changes') {
  lastFocused=document.activeElement;
  $('#modal-inner').innerHTML=`<header class="modal-heading"><div><h2 id="modal-title">${esc(title)}</h2><p>${esc(description)}</p></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button></header><form id="modal-form">${body}<p class="form-error" role="alert"></p><footer class="form-actions"><button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button><button type="submit" class="btn btn-primary">${esc(submit)}</button></footer></form>`;
  $('#modal').showModal(); return $('#modal-form');
}
$('#modal').addEventListener('close',()=>{if(lastFocused?.isConnected)lastFocused.focus();else $('#content').focus();});
$('#modal').addEventListener('cancel',event=>{if($('#modal-form')?.getAttribute('aria-busy')==='true')event.preventDefault();});
function onSubmit(form, fn) {
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(form.getAttribute('aria-busy')==='true')return;
    const submit=form.querySelector('[type=submit]'),dismiss=[...$('#modal').querySelectorAll('[data-action="close-modal"]')];
    submit.disabled=true;dismiss.forEach(button=>button.disabled=true);form.setAttribute('aria-busy','true');
    try {await fn();if($('#modal-form')===form)$('#modal').close();}
    catch(error){form.querySelector('.form-error').textContent=error.message||'Changes could not be saved.';}
    finally{submit.disabled=false;dismiss.forEach(button=>button.disabled=false);form.removeAttribute('aria-busy');}
  });
}
async function save(fn, expected=state.revision) {
  state=await updateState(expected,fn);preview=null;adjusted=false;channel?.postMessage('changed');render();
}
function itemForm(item) {
  const editing=!!item, revision=state.revision;
  item=item||{name:'',unit:'units',qty:0,category:'Pantry',date:''};
  const f=openModal(editing?'Edit stock item':'Add stock item','Count one type of item in a consistent unit.',
    `<div class="form-group"><label for="item-name">Item name</label><input id="item-name" name="name" type="text" maxlength="80" required autofocus value="${esc(item.name)}" placeholder="e.g. Long-grain rice"></div><div class="form-grid"><div class="form-group"><label for="item-qty">Quantity on hand</label><input id="item-qty" name="qty" type="number" min="0" max="10000" step="1" required value="${item.qty}" inputmode="numeric"></div><div class="form-group"><label for="item-unit">Unit</label><input id="item-unit" name="unit" type="text" maxlength="20" required value="${esc(item.unit)}" placeholder="e.g. bags"></div></div><div class="form-grid"><div class="form-group"><label for="item-category">Category</label><select id="item-category" name="category">${[...new Set([...CATEGORIES,item.category])].map(c=>`<option ${c===item.category?'selected':''}>${esc(c)}</option>`).join('')}</select></div><div class="form-group"><label for="item-date">Best-before date <span class="muted">(optional)</span></label><input id="item-date" name="date" type="date" value="${esc(item.date)}"></div></div>`,editing?'Save changes':'Add item');
  onSubmit(f,async()=>{
    const d=new FormData(f),fields={name:String(d.get('name')),unit:String(d.get('unit')),qty:Number(d.get('qty')),category:String(d.get('category')),date:String(d.get('date'))};
    await save(s=>putItem(s,fields,editing?item.id:crypto.randomUUID(),editing),revision);
    toast(editing?'Stock item updated.':'Stock item added.');
  });
}
function requestForm(request) {
  if(!state.items.length){toast('Add stock before creating a household request.');return;}
  const editing=!!request,revision=state.revision; request=request||{label:'',lines:{}};
  const f=openModal(editing?'Edit household request':'Add household request','Choose only the items and quantities the household asks for.',
    `<div class="form-group"><label for="req-label">Household reference</label><input id="req-label" name="label" type="text" maxlength="80" required autofocus value="${esc(request.label)}" placeholder="e.g. Household 12"><small>Use a reference rather than personal information.</small></div><fieldset class="request-fieldset"><legend>Requested quantities</legend><div class="line-editor">${state.items.map(i=>`<div><label for="r-${esc(i.id)}">${esc(i.name)}<small>${fmt(i.qty)} ${esc(i.unit)} on hand · ${i.date?`Best before ${esc(i.date)}`:'Date not set'}</small></label><input id="r-${esc(i.id)}" data-item="${esc(i.id)}" type="number" min="0" max="10000" step="1" required inputmode="numeric" value="${request.lines[i.id]||0}" aria-label="Requested ${esc(batchText(i))}"></div>`).join('')}</div></fieldset>`,editing?'Save request':'Add request');
  onSubmit(f,async()=>{
    const lines=Object.create(null);for(const input of f.querySelectorAll('[data-item]')){const n=Number(input.value);if(!quantity(n))throw Error('Use whole quantities from 0 to 10,000.');if(n)lines[input.dataset.item]=n;}
    await save(s=>putRequest(s,String(new FormData(f).get('label')),lines,editing?request.id:crypto.randomUUID(),editing),revision);
    toast(editing?'Household request updated.':'Household request added.');
  });
}
function confirm(title,text,label,fn) { const f=openModal(title,text,'',label);onSubmit(f,fn); }
function adjustPlan() {
  const p=structuredClone(preview),revision=state.revision;
  const f=openModal('Adjust packing quantities','Keep the original requests. Change only what you plan to pack.',`<div class="line-editor">${p.rows.map(r=>r.lines.map(l=>`<div><label for="p-${esc(r.id)}-${esc(l.itemId)}">${esc(r.label)} · ${esc(l.name)}<small>Requested: ${fmt(l.requested)} ${esc(l.unit)} · ${l.date?`Best before ${esc(l.date)}`:'Date not set'}</small></label><input id="p-${esc(r.id)}-${esc(l.itemId)}" data-request="${esc(r.id)}" data-item="${esc(l.itemId)}" type="number" min="0" max="${l.requested}" step="1" value="${l.amount}" required inputmode="numeric" aria-label="Pack ${esc(batchText(l))} for ${esc(r.label)}"></div>`).join('')).join('')}</div><p class="form-hint">The combined packing quantities cannot exceed your stock.</p>`,'Apply adjustments');
  onSubmit(f,async()=>{
    if(state.revision!==revision)throw Error('Stock or requests changed. Close this form and review the latest plan.');
    const overrides=Object.create(null);for(const input of f.querySelectorAll('[data-request]')){overrides[input.dataset.request] ||= Object.create(null);overrides[input.dataset.request][input.dataset.item]=Number(input.value);}
    preview=customizePlan(state,overrides);adjusted=true;render();toast('Packing quantities adjusted.');
  });
}
function download(name,content,type) {
  const blob=new Blob([content],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),30000);
}
const actions={
  'add-item':()=>itemForm(),
  'edit-item':id=>{const item=state.items.find(i=>i.id===id);if(item)itemForm(item);},
  'delete-item':id=>{const item=state.items.find(i=>i.id===id),revision=state.revision;if(!item)return;if(state.requests.some(r=>r.lines[id])){toast('Remove this item from open requests before deleting it.');return;}confirm('Remove stock item?',`${item.name} will be removed from the shelf. Distribution history is kept.`,'Remove item',async()=>{await save(s=>removeItem(s,id),revision);toast('Stock item removed.');});},
  'add-request':()=>requestForm(),
  'edit-request':id=>{const r=state.requests.find(r=>r.id===id);if(r)requestForm(r);},
  'delete-request':id=>{const revision=state.revision;confirm('Remove household request?','The open request will be removed. Stock and history will stay unchanged.','Remove request',async()=>{await save(s=>{s.requests=s.requests.filter(r=>r.id!==id);return s;},revision);toast('Household request removed.');});},
  'adjust-plan':()=>adjustPlan(),
  'reset-plan':()=>{preview=null;adjusted=false;render();toast('Proportional packing plan restored.');},
  'commit-plan':()=>{if(!preview?.totalAllocated)return;const p=structuredClone(preview);confirm('Record this distribution?',`Confirm the physical packing first. This records ${fmt(p.totalAllocated)} units, reduces stock and keeps unfilled requests.`,'Record distribution',async()=>{await save(s=>applyPlan(s,p),p.revision);toast('Distribution recorded.');});},
  'print-plan':()=>window.print(),
  'backup':()=>{download('gathershelf-backup.json',serializeBackup(state),'application/json');toast('Workspace backup downloaded.');},
  'restore':()=>$('#restore-file').click(),
  'clear':()=>{const revision=state.revision;confirm('Clear this workspace?','All stock, requests and distribution history on this browser will be removed. Download a backup first.','Clear workspace',async()=>{await save(s=>({...blankState(),revision:s.revision}),revision);toast('Workspace cleared.');});},
  'export-stock':()=>{download('gathershelf-stock.csv',stockCSV(state.items),'text/csv;charset=utf-8');toast('Stock CSV downloaded.');},
  'export-history':()=>{download('gathershelf-history.csv',historyCSV(state.history),'text/csv;charset=utf-8');toast('History CSV downloaded.');},
  'reset-filters':()=>{stockFilters={query:'',category:'',status:'all',sort:'name'};render();$('#stock-search')?.focus();},
  'close-modal':()=>$('#modal').close(),
  'retry-storage':()=>initialise(),
  'more-nav':()=>{lastFocused=document.activeElement;$('#modal-inner').innerHTML=`<header class="modal-heading"><h2 id="modal-title">More from GatherShelf</h2><button class="icon-button" type="button" data-action="close-modal" aria-label="Close navigation">${icon('close')}</button></header><nav class="more-nav">${routes.slice(4).map(([v,label,g])=>routeLink(v,`${icon(g)}${label}`,'nav-link')).join('')}<a class="nav-link" href="guide.html">${icon('help')}Workspace guide</a></nav>`;$('#modal').showModal();}
};
document.addEventListener('click',async event=>{
  const route=event.target.closest('a[data-route]');
  if(route&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();navigate(route.dataset.route);return;}
  const tab=event.target.closest('[data-stock-status]');
  if(tab){const status=tab.dataset.stockStatus;stockFilters.status=status;render();document.querySelector(`[data-stock-status="${status}"]`).focus();return;}
  const action=event.target.closest('[data-action]');if(!action||action.disabled)return;
  try{await actions[action.dataset.action]?.(action.dataset.id);}catch(error){toast(error.message);}
});
document.addEventListener('change',async event=>{
  if(event.target.id!=='restore-file'||!event.target.files[0])return;
  const file=event.target.files[0];event.target.value='';
  try{
    if(file.size>MAX_BACKUP_BYTES)throw Error('The backup limit is 5 MB.');
    const imported=readBackup(await file.text()),revision=state.revision;
    confirm('Replace workspace with backup?',`Restore ${imported.items.length} stock items, ${imported.requests.length} requests and ${imported.history.length} ${imported.history.length===1?'distribution':'distributions'}. This replaces the current workspace.`,'Restore backup',async()=>{await save(s=>({...imported,revision:s.revision}),revision);toast('Workspace backup restored.');});
  }catch(error){toast(error.message);}
});
async function initialise(){
  try{state=await readState();render();}
  catch(error){renderNavigation();$('#app-content').innerHTML=`<section class="panel">${empty('Could not open this workspace',esc(error.message),button('Try again','retry-storage','','btn-secondary'),'database')}</section>`;}
}
initialise();
