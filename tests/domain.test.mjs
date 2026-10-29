import test from 'node:test';
import assert from 'node:assert/strict';
import { blankState, plan, applyPlan } from '../engine.mjs';
import { putItem, putRequest, removeItem, filterStock, stockCSV, historyCSV, readBackup } from '../domain.mjs';
const item = (name='Rice', qty=4) => ({name, qty, unit:'bags', category:'Grains', date:''});
function fixture() {
  const s = putItem(blankState(),item(),'rice');
  return putItem(s,{...item('Beans',0),category:'Protein',date:'2026-11-01'},'beans');
}
test('stock filters combine search, category, availability and sorting without mutating stock', () => {
  const s=fixture();
  assert.deepEqual(filterStock(s.items,{query:'  BEANS ',category:'Protein',status:'empty'}).map(x=>x.id),['beans']);
  assert.equal(filterStock(s.items,{query:'Beans',status:'available'}).length,0);
  assert.equal(filterStock(s.items,{sort:'date'})[0].id,'beans');
  assert.equal(filterStock(s.items,{sort:'quantity'})[0].id,'rice');
  assert.equal(s.items[0].id,'rice');
});
test('a requested item cannot be deleted and stale edits fail visibly', () => {
  const s=putRequest(fixture(),'Reference A',{rice:2},'r1');
  assert.throws(()=>removeItem(s,'rice'),/open requests/);
  assert.throws(()=>putItem(s,item(),'gone',true),/removed/);
  assert.throws(()=>putRequest(s,'Reference A',{rice:1},'gone',true),/removed/);
});
test('reject malformed dates, duplicate identifiers and dangling requests in backups', () => {
  const s=fixture();s.items[0].date=0;assert.throws(()=>readBackup(JSON.stringify(s)));
  s.items[0].date='2026-02-30';assert.throws(()=>readBackup(JSON.stringify(s)));
  s.items[0].date='';s.items[1].id='rice';assert.throws(()=>readBackup(JSON.stringify(s)));
  assert.throws(()=>readBackup('{not json'),/not valid JSON/);
});
test('backup survives a distribution round trip with stock, outstanding demand and history intact', () => {
  const s=putRequest(fixture(),'Reference A',{rice:6},'r1');
  const next=applyPlan(s,plan(s),'2026-10-29T12:00:00Z','d1');
  const restored=readBackup(JSON.stringify(next));
  assert.deepEqual(restored,next);assert.equal(restored.items[0].qty,0);assert.equal(restored.requests[0].lines.rice,2);
});
test('CSV exports include real stock/history and neutralize spreadsheet formulas', () => {
  const s=fixture();s.items[0].name='=HYPERLINK("https://example.com")';
  assert.match(stockCSV(s.items),/"'=HYPERLINK/);
  const state=putRequest(s,'@reference',{rice:1},'r1');
  const h=applyPlan(state,plan(state),'2026-10-29T12:00:00Z','d1').history;
  assert.match(historyCSV(h),/"'@reference"/);assert.match(historyCSV(h),/2026-10-29/);
});
