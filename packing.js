/** Cartonroom's bounded, deterministic rectangular-envelope packing engine. Units: cm and kg. */
const EPS=1e-8;
const finitePositive = n => typeof n==='number' && Number.isFinite(n) && n>0 && n<=10000;
const cleanName = n => typeof n==='string' && n.trim().length>0 && n.length<=80;
export function validate(items, boxes, padding=0){
  if(!Array.isArray(items)||!items.length||items.length>30) throw new Error('Add at least one item and no more than 30 item types.');
  if(!Array.isArray(boxes)||!boxes.length||boxes.length>12) throw new Error('Add between 1 and 12 box sizes.');
  if(typeof padding!=='number'||!Number.isFinite(padding)||padding<0||padding>25) throw new Error('Padding must be between 0 and 25 cm per side.');
  let count=0;
  for(const i of items){
    if(!cleanName(i.name)||![i.l,i.w,i.h,i.weight].every(finitePositive)||![i.l,i.w,i.h].every(n=>n<=1000)||!Number.isInteger(i.qty)||i.qty<1||i.qty>30||typeof i.upright!=='boolean') throw new Error('Check each item: a name, positive dimensions and weight, and a quantity from 1 to 30 are required.');
    count+=i.qty;
  }
  if(count>30) throw new Error('A plan supports up to 30 individual items.');
  for(const b of boxes){
    if(!cleanName(b.name)||![b.l,b.w,b.h,b.maxWeight].every(finitePositive)||![b.l,b.w,b.h].every(n=>n<=1000)) throw new Error('Check each box: a name, positive inner dimensions and a content-weight limit are required.');
  }
  return true;
}
export function overlaps(a,b){
  return a.x < b.x+b.l-EPS && a.x+a.l > b.x+EPS && a.y < b.y+b.w-EPS && a.y+a.w > b.y+EPS && a.z < b.z+b.h-EPS && a.z+a.h > b.z+EPS;
}
export function isSupported(a,placed){
  if(Math.abs(a.z)<EPS)return true;
  let area=0;
  for(const b of placed){
    if(Math.abs(b.z+b.h-a.z)>EPS)continue;
    const dx=Math.max(0,Math.min(a.x+a.l,b.x+b.l)-Math.max(a.x,b.x));
    const dy=Math.max(0,Math.min(a.y+a.w,b.y+b.w)-Math.max(a.y,b.y));
    area+=dx*dy;
  }
  return area+EPS >= a.l*a.w;
}
function orientations(i){
  const [a,b,c]=[i.l,i.w,i.h];
  const options=i.upright?[[a,b,c],[b,a,c]]:[[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]];
  return options.filter((v,idx,arr)=>arr.findIndex(q=>q.every((x,j)=>x===v[j]))===idx);
}
function fits(p,box,placed){
  return p.x+p.l<=box.l+EPS&&p.y+p.w<=box.w+EPS&&p.z+p.h<=box.h+EPS&&placed.every(other=>!overlaps(p,other))&&isSupported(p,placed);
}
function volume(o){return o.l*o.w*o.h}
function attempt(source,box,ordering){
  const items=[...source].sort(ordering);
  const placed=[], skipped=[]; let weight=0;
  for(const i of items){
    if(weight+i.weight>box.maxWeight+EPS){skipped.push(i);continue;}
    const points=[[0,0,0]];
    for(const p of placed){points.push([p.x+p.l,p.y,p.z],[p.x,p.y+p.w,p.z],[p.x,p.y,p.z+p.h]);}
    points.sort((a,b)=>a[2]-b[2]||a[1]-b[1]||a[0]-b[0]);
    let best=null;
    for(const [x,y,z] of points){
      for(const [l,w,h] of orientations(i)){
        const p={...i,x,y,z,l,w,h};
        if(fits(p,box,placed)){
          const score=[z+h,y+w,x+l,z,y,x];
          if(!best||score.some((n,k)=>n<best.score[k]-EPS&&score.slice(0,k).every((v,j)=>Math.abs(v-best.score[j])<EPS))) best={p,score};
        }
      }
    }
    if(best){placed.push(best.p);weight+=i.weight;} else skipped.push(i);
  }
  return {box,placements:placed,skipped,weight,packedVolume:placed.reduce((sum,p)=>sum+volume(p),0)};
}
const sorters=[
 (a,b)=>volume(b)-volume(a)||a.order-b.order,
 (a,b)=>Math.max(b.l,b.w,b.h)-Math.max(a.l,a.w,a.h)||volume(b)-volume(a)||a.order-b.order,
 (a,b)=>b.weight-a.weight||volume(b)-volume(a)||a.order-b.order,
 (a,b)=>a.order-b.order
];
export function plan(items,boxes,padding=0){
  validate(items,boxes,padding);
  let order=0;
  let remaining=items.flatMap(item=>Array.from({length:item.qty},(_,index)=>({id:item.id,name:item.name,instance:index+1,l:item.l+2*padding,w:item.w+2*padding,h:item.h+2*padding,weight:item.weight,upright:item.upright,order:order++})));
  const parcels=[];
  while(remaining.length){
    const choices=[];
    for(const b of boxes){
      for(const sort of sorters){
        const a=attempt(remaining,b,sort);
        if(a.placements.length)choices.push(a);
      }
    }
    if(!choices.length)break;
    choices.sort((a,b)=>{
      const af=a.skipped.length===0,bf=b.skipped.length===0;
      if(af!==bf)return af?-1:1;
      if(af)return volume(a.box)-volume(b.box)||a.weight-b.weight;
      return b.placements.length-a.placements.length||volume(a.box)-volume(b.box)||b.packedVolume-a.packedVolume;
    });
    const chosen=choices[0];
    parcels.push(chosen); remaining=chosen.skipped;
  }
  return {parcels,unpacked:remaining, totalItems:order,padding};
}
