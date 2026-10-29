// Allocation is deliberately deterministic and only considers explicit requests.
// Quantities are whole units of one stock item, not nutritional equivalents.
export const MAX_QTY = 10000;
export function blankState() { return {version: 1, revision: 0, items: [], requests: [], history: []}; }
export function quantity(n, allowZero = true) {
  return Number.isInteger(n) && n >= (allowZero ? 0 : 1) && n <= MAX_QTY;
}
export function cleanText(s, max = 80) { return typeof s === 'string' ? s.trim().slice(0, max) : ''; }
const validId = s => typeof s === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(s) && !['__proto__','constructor','prototype'].includes(s);
const validDate = d => d === '' || (/^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0,10) === d);
export function validateState(s) {
  if (!s || s.version !== 1 || !Number.isSafeInteger(s.revision) || s.revision < 0 || !Array.isArray(s.items) || !Array.isArray(s.requests) || !Array.isArray(s.history) || s.items.length > 1000 || s.requests.length > 1000 || s.history.length > 1000) throw Error('This backup is not a valid GatherShelf file.');
  const items = new Set(), requests = new Set();
  for (const i of s.items) {
    if (!i || !validId(i.id) || items.has(i.id) || !cleanText(i.name) || i.name.length > 80 || !cleanText(i.unit, 20) || i.unit.length > 20 || !quantity(i.qty) || typeof i.category !== 'string' || i.category.length > 40 || !validDate(i.date || '')) throw Error('A stock item in this backup is invalid.');
    items.add(i.id);
  }
  for (const r of s.requests) {
    if (!r || !validId(r.id) || requests.has(r.id) || !cleanText(r.label) || r.label.length > 80 || !r.lines || typeof r.lines !== 'object' || Array.isArray(r.lines)) throw Error('A request in this backup is invalid.');
    requests.add(r.id);
    for (const [id, n] of Object.entries(r.lines)) if (!items.has(id) || !quantity(n, false)) throw Error('A request contains invalid items or quantities.');
  }
  // History is display-only. Validate shape, bound text and amounts, and reject markup-sized payloads.
  for (const h of s.history) {
    if (!h || !validId(h.id) || typeof h.at !== 'string' || h.at.length > 40 || !Array.isArray(h.rows) || h.rows.length > 10000) throw Error('The distribution history is invalid.');
    for (const row of h.rows) if (!row || typeof row.label !== 'string' || row.label.length > 80 || typeof row.item !== 'string' || row.item.length > 80 || typeof row.unit !== 'string' || row.unit.length > 20 || !quantity(row.amount, false)) throw Error('A distribution history row is invalid.');
  }
  return s;
}

// Hamilton/largest-remainder apportionment for each item. Ties use stable request
// IDs, making the same input reproducible. This is not a nutrition or equity model.
export function plan(state) {
  validateState(state);
  const stock = new Map(state.items.map(i => [i.id, i]));
  const rows = state.requests.map(r => ({id: r.id, label: r.label, lines: [], requested: 0, allocated: 0}));
  const byRequest = new Map(rows.map(r => [r.id, r]));
  const shortages = [];
  for (const item of state.items) {
    const asks = state.requests.filter(r => r.lines[item.id] > 0).map(r => ({id:r.id, qty:r.lines[item.id]}));
    const total = asks.reduce((s, a) => s + a.qty, 0);
    if (!total) continue;
    const available = Math.min(item.qty, total);
    const shares = asks.map(a => ({...a, amount:Math.floor(available * a.qty / total), remainder:(available * a.qty) % total}));
    let left = available - shares.reduce((s,a) => s+a.amount, 0);
    shares.sort((a,b) => b.remainder - a.remainder || a.id.localeCompare(b.id));
    for (const share of shares) if (left > 0 && share.amount < share.qty) { share.amount++; left--; }
    for (const s of shares) {
      const r=byRequest.get(s.id); r.lines.push({itemId:item.id, name:item.name, unit:item.unit, date:item.date, requested:s.qty, amount:s.amount}); r.requested+=s.qty; r.allocated+=s.amount;
    }
    if (available < total) shortages.push({itemId:item.id, name:item.name, unit:item.unit, requested:total, available, missing:total-available});
  }
  return {revision:state.revision, rows, shortages, totalRequested:rows.reduce((s,r)=>s+r.requested,0), totalAllocated:rows.reduce((s,r)=>s+r.allocated,0)};
}
// Volunteers can change quantities without editing the household's request.
// Every proposed line is bounded by both demand and available stock.
export function customizePlan(state, overrides) {
  const p = plan(state), totals = new Map();
  for (const r of p.rows) {
    r.allocated = 0;
    for (const line of r.lines) {
      const amount = overrides?.[r.id]?.[line.itemId];
      if (!quantity(amount) || amount > line.requested) throw Error('Each packed quantity must be a whole number no greater than the request.');
      line.amount = amount; r.allocated += amount;
      totals.set(line.itemId, (totals.get(line.itemId)||0) + amount);
    }
  }
  for (const item of state.items) if ((totals.get(item.id)||0) > item.qty) throw Error(`Not enough ${item.name} in stock for these adjustments.`);
  p.totalAllocated=p.rows.reduce((n,r)=>n+r.allocated,0);
  return p;
}
export function applyPlan(state, p, at = new Date().toISOString(), id = globalThis.crypto.randomUUID()) {
  validateState(state);
  if (p.revision !== state.revision) throw Error('Stock or requests changed. Build the plan again.');
  const overrides = Object.create(null);
  for (const row of p.rows || []) { overrides[row.id]=Object.create(null); for (const line of row.lines || []) overrides[row.id][line.itemId]=line.amount; }
  const expected = customizePlan(state, overrides);
  if (JSON.stringify(p) !== JSON.stringify(expected)) throw Error('Plan does not match the current stock and requests.');
  if (!p.totalAllocated) throw Error('There are no items to record.');
  const next = structuredClone(state);
  const items = new Map(next.items.map(i=>[i.id,i]));
  const reqs = new Map(next.requests.map(r=>[r.id,r]));
  const historyRows=[];
  for (const r of p.rows) for (const line of r.lines) if(line.amount) {
    const item = items.get(line.itemId), req=reqs.get(r.id);
    item.qty -= line.amount; req.lines[line.itemId] -= line.amount;
    if (!req.lines[line.itemId]) delete req.lines[line.itemId];
    historyRows.push({label:r.label, item:line.name, unit:line.unit, amount:line.amount});
  }
  next.requests = next.requests.filter(r=>Object.keys(r.lines).length);
  next.history.unshift({id,at,rows:historyRows}); next.revision++;
  return validateState(next);
}
export function safeCSV(s) {
  let v=String(s ?? ''); if (/^[\s]*[=+\-@\t\r]/.test(v)) v="'"+v;
  return '"'+v.replaceAll('"','""')+'"';
}
