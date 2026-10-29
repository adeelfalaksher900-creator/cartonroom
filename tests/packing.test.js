import test from 'node:test';
import assert from 'node:assert/strict';
import {plan, validate, overlaps, isSupported} from '../packing.js';
const box=(l,w,h,maxWeight=100)=>({id:'box',name:'Box',l,w,h,maxWeight});
const item=(id,l,w,h,qty=1,weight=1,upright=false)=>({id,name:id,l,w,h,qty,weight,upright});

test('finds exact fit and reports zero empty space',()=>{
 const r=plan([item('A',10,10,10)],[box(10,10,10)],0);
 assert.equal(r.parcels.length,1); assert.equal(r.unpacked.length,0); assert.equal(r.parcels[0].packedVolume,1000);
});
test('rotates only when orientation permits',()=>{
 assert.equal(plan([item('A',4,2,3)],[box(3,2,4)],0).unpacked.length,0);
 assert.equal(plan([item('A',4,2,3,1,1,true)],[box(3,2,4)],0).unpacked.length,1);
});
test('includes protective padding in the occupied envelope',()=>{
 assert.equal(plan([item('A',10,10,10)],[box(10,10,10)],0.5).unpacked.length,1);
 assert.equal(plan([item('A',10,10,10)],[box(11,11,11)],0.5).unpacked.length,0);
});
test('splits into boxes when content weight limit requires it',()=>{
 const r=plan([item('A',2,2,2,2,4)],[box(10,10,10,5)],0);
 assert.equal(r.parcels.length,2); assert.ok(r.parcels.every(p=>p.weight<=5));
});
test('reports oversized goods and still packs the rest',()=>{
 const r=plan([item('huge',50,50,50),item('small',2,2,2)],[box(10,10,10)],0);
 assert.equal(r.unpacked.length,1); assert.equal(r.unpacked[0].name,'huge'); assert.equal(r.parcels[0].placements.length,1);
});
test('selects the smallest box that fits the entire remaining order',()=>{
 const r=plan([item('A',3,3,3)],[{...box(20,20,20),id:'large'}, {...box(4,4,4),id:'small'}],0);
 assert.equal(r.parcels[0].box.id,'small');
});
test('disallows floating or partially supported placements',()=>{
 const support={x:0,y:0,z:0,l:2,w:2,h:2};
 assert.equal(isSupported({x:0,y:0,z:2,l:2,w:2,h:1},[support]),true);
 assert.equal(isSupported({x:1,y:0,z:2,l:2,w:2,h:1},[support]),false);
});
test('touching surfaces are not overlapping',()=>{
 assert.equal(overlaps({x:0,y:0,z:0,l:2,w:2,h:2},{x:2,y:0,z:0,l:2,w:2,h:2}),false);
 assert.equal(overlaps({x:0,y:0,z:0,l:2,w:2,h:2},{x:1,y:0,z:0,l:2,w:2,h:2}),true);
});
test('rejects non-finite, invalid, and oversized input counts',()=>{
 assert.throws(()=>validate([item('x',NaN,1,1)],[box(1,1,1)],0));
 assert.throws(()=>validate([item('x',1,1,1,31)],[box(1,1,1)],0));
 assert.throws(()=>validate([item('x',1,1,1)],[box(0,1,1)],0));
 assert.throws(()=>validate([item('x',1,1,1)],[box(1,1,1)],-1));
});
test('all placements are contained, non-overlapping, supported and within weight',()=>{
 const r=plan([item('A',4,3,2,3),item('B',3,3,3,3)],[box(10,10,6,20)],0.1);
 for(const p of r.parcels){
  assert.ok(p.weight<=p.box.maxWeight+1e-9);
  for(let i=0;i<p.placements.length;i++){
   const a=p.placements[i];
   assert.ok(a.x>=0&&a.y>=0&&a.z>=0&&a.x+a.l<=p.box.l+1e-8&&a.y+a.w<=p.box.w+1e-8&&a.z+a.h<=p.box.h+1e-8);
   assert.ok(isSupported(a,p.placements.filter((_,j)=>j!==i)));
   for(let j=i+1;j<p.placements.length;j++)assert.equal(overlaps(a,p.placements[j]),false);
  }
 }
 assert.equal(r.parcels.reduce((n,p)=>n+p.placements.length,0)+r.unpacked.length,6);
});
test('small deterministic scenarios preserve geometry and quantities',()=>{
 let seed=4907;const rnd=()=>((seed=(seed*48271)%2147483647)/2147483647);
 for(let run=0;run<60;run++){
  const items=Array.from({length:5},(_,i)=>item(String(i),1+Math.floor(rnd()*6),1+Math.floor(rnd()*6),1+Math.floor(rnd()*6),1+Math.floor(rnd()*3),0.2+rnd(),rnd()>.5));
  const boxes=[box(8,8,8,4),{...box(12,10,9,8),id:'b2'}];const r=plan(items,boxes,0);
  assert.equal(r.parcels.flatMap(p=>p.placements).length+r.unpacked.length,items.reduce((s,i)=>s+i.qty,0));
  for(const parcel of r.parcels){assert.ok(parcel.weight<=parcel.box.maxWeight+1e-8);for(const [i,a] of parcel.placements.entries()){
    assert.ok(a.x>=0&&a.y>=0&&a.z>=0&&a.x+a.l<=parcel.box.l+1e-8&&a.y+a.w<=parcel.box.w+1e-8&&a.z+a.h<=parcel.box.h+1e-8);
    assert.ok(isSupported(a,parcel.placements.filter((_,j)=>i!==j)));
    assert.ok(parcel.placements.every((b,j)=>i===j||!overlaps(a,b)));
  }}
 }
});
