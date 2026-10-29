import { cleanText, quantity, safeCSV, validateState, serializeBackup, MAX_BACKUP_BYTES } from './engine.mjs';

export const CATEGORIES = ['Produce', 'Grains', 'Protein', 'Dairy', 'Pantry', 'Household', 'Other'];
export function putItem(state, fields, id, editing = false) {
  const name = cleanText(fields.name), unit = cleanText(fields.unit, 20);
  if (!name || !unit || !quantity(fields.qty)) throw Error('Enter a name, a unit and a whole quantity from 0 to 10,000.');
  const item = {id, name, unit, qty:fields.qty, category:fields.category, date:fields.date || ''};
  if (editing) {
    const index = state.items.findIndex(i => i.id === id);
    if (index < 0) throw Error('This stock item was removed. Close this form and review your stock.');
    state.items[index] = item;
  } else {
    if (state.items.length >= 1000) throw Error('This workspace supports up to 1,000 stock items. Remove unused items or start a new backed-up workspace.');
    state.items.push(item);
  }
  return validateState(state);
}
export function removeItem(state, id) {
  if (state.requests.some(r => r.lines[id])) throw Error('Remove this item from open requests before deleting it.');
  state.items = state.items.filter(i => i.id !== id);
  return validateState(state);
}
export function putRequest(state, label, lines, id, editing = false) {
  label = cleanText(label);
  if (!label || !Object.keys(lines).length) throw Error('Enter a household reference and request at least one item.');
  const request = { id, label, lines };
  if (editing) {
    const index = state.requests.findIndex(r => r.id === id);
    if (index < 0) throw Error('This request was removed. Close this form and review the requests.');
    state.requests[index] = request;
  } else {
    if (state.requests.length >= 1000) throw Error('This workspace supports up to 1,000 open requests. Complete or remove requests before adding more.');
    state.requests.push(request);
  }
  return validateState(state);
}
export function filterStock(items, {query = '', category = '', status = 'all', sort = 'name'} = {}) {
  const q = query.trim().toLowerCase();
  const result = items.filter(i => (!q || `${i.name} ${i.category} ${i.unit}`.toLowerCase().includes(q)) &&
    (!category || i.category === category) &&
    (status === 'all' || (status === 'available' ? i.qty > 0 : i.qty === 0)));
  return result.sort((a,b) => {
    if (sort === 'quantity') return b.qty - a.qty || a.name.localeCompare(b.name);
    if (sort === 'date') return (a.date || '9999-12-31').localeCompare(b.date || '9999-12-31') || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  });
}
export function stockCSV(items) {
  const rows = [['Item','Category','Quantity','Unit','Best before'], ...items.map(i => [i.name,i.category,i.qty,i.unit,i.date])];
  return rows.map(row => row.map(safeCSV).join(',')).join('\r\n');
}
export function historyCSV(history) {
  const rows = [['Date','Household reference','Item','Quantity','Unit','Best before'], ...history.flatMap(h => h.rows.map(r => [h.at,r.label,r.item,r.amount,r.unit,r.date || '']))];
  return rows.map(row => row.map(safeCSV).join(',')).join('\r\n');
}
export function readBackup(text) {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw Error('The backup limit is 5 MB.');
  let value;
  try { value = JSON.parse(text); } catch { throw Error('This file is not valid JSON. Choose a GatherShelf backup.'); }
  serializeBackup(value);
  return value;
}
