const { execFileSync } = require('child_process');
test('preview adapter handles explicit admission, permissions, exact IDs, F5, network ambiguity, TTL and malformed results', () => {
execFileSync('node', ['--input-type=module', '-e', `
import assert from 'node:assert/strict';
import {createZaloInventoryPreviewService,PREVIEW_COMMAND} from './js/features/zalo/zaloInventoryPreviewService.js';
const user='11111111-1111-4111-8111-111111111111',id='22222222-2222-4222-8222-222222222222',rid='33333333-3333-4333-8333-333333333333';
const time=Date.now();
const dto={contractVersion:1,ruleVersion:'fixture',observedAt:new Date(time).toISOString(),businessDate:'2026-09-10',counts:{outOfStock:0,belowMin:0,aboveMax:0,withoutMin:0,needsReview:0},sections:{outOfStock:[],belowMin:[],aboveMax:[],withoutMin:[],needsReview:[]},messages:[]};
function fixture(){
 const calls=[],data=new Map();let status='queued',fail=false,allowed=true,capable=true,resultId=id,invalid=false,clock=time,delay=false;
 const ref={status:'preview_ready',contractVersion:1,result_id:rid,expires_at:new Date(time+900000).toISOString(),byte_count:500};
 const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const client={auth:{getUser:async()=>({data:{user:{id:user}}})},rpc:async(name,args)=>{
  calls.push({name,args});
  if(name==='is_current_employee_admin')return {data:allowed};
  if(name==='enqueue_zalo_bot_command'){if(delay)await new Promise(r=>setTimeout(r,30));if(fail)throw Error('network');return {data:id};}
  if(name==='get_zalo_inventory_preview')return {data:invalid?{...dto,counts:{}}:dto};
  throw Error('unexpected rpc');
 },from:table=>{let eq;const q={select:()=>q,order:()=>q,limit:()=>q,eq:(k,v)=>{eq=[k,v];return q},maybeSingle:async()=>{
  if(table==='zalo_bot_runtime_status')return {data:{status:'online',last_heartbeat_at:new Date(clock).toISOString(),metadata:{controlCapabilities:{contractVersion:1,verified:capable,sourceCommit:'a'.repeat(40),commands:[PREVIEW_COMMAND],previewInventoryHealthV1:true}}}};
  assert.deepEqual(eq,['id',id]);return {data:{id:resultId,command_type:PREVIEW_COMMAND,status,result:ref}};
 }};return q;}};
 return {calls,data,storage,ref,make:()=>createZaloInventoryPreviewService({client,storage,now:()=>clock,timeoutMs:10}),set:v=>{if('status'in v)status=v.status;if('fail'in v)fail=v.fail;if('allowed'in v)allowed=v.allowed;if('capable'in v)capable=v.capable;if('resultId'in v)resultId=v.resultId;if('invalid'in v)invalid=v.invalid;if('clock'in v)clock=v.clock;if('delay'in v)delay=v.delay;},enqueues:()=>calls.filter(c=>c.name==='enqueue_zalo_bot_command').length};
}
let f=fixture(),load=f.make();
assert.equal((await load()).status,'idle');assert.equal(f.enqueues(),0);
f.set({capable:false});assert.equal((await load({request:true})).status,'unavailable');assert.equal(f.enqueues(),0);
f.set({capable:true,allowed:false});assert.equal((await load({request:true})).status,'unavailable');assert.equal(f.enqueues(),0);
f.set({allowed:true});
const pair=await Promise.all([load({request:true}),load({request:true})]);assert.equal(f.enqueues(),1);assert.equal(pair[0].status,'pending');
assert.deepEqual(f.calls.find(c=>c.name==='enqueue_zalo_bot_command').args,{p_command_type:PREVIEW_COMMAND,p_payload:{}});
load=f.make();assert.equal((await load()).status,'pending');assert.equal(f.enqueues(),1); // reload resumes, no write
f.set({status:'completed',resultId:rid});assert.equal((await load({request:true})).status,'error');assert.equal(f.enqueues(),1);
f.set({resultId:id,invalid:true});assert.equal((await load()).status,'error');
f.set({invalid:false});const ready=await load();assert.equal(ready.status,'ready');assert.deepEqual(ready.data.counts,dto.counts);assert.equal(f.data.size,0);
f=fixture();f.set({fail:true});load=f.make();assert.equal((await load({request:true})).status,'uncertain');
load=f.make();assert.equal((await load({request:true})).status,'uncertain');assert.equal(f.enqueues(),1);
f.set({fail:false,clock:time+300001});assert.equal((await load()).status,'idle');assert.equal(f.enqueues(),1);
f=fixture();f.set({delay:true});load=f.make();assert.equal((await load({request:true})).status,'uncertain');assert.equal((await f.make()()).status,'uncertain');assert.equal(f.enqueues(),1);
f=fixture();load=f.make();await load({request:true});f.set({status:'completed'});f.ref.expires_at=new Date(time-1).toISOString();assert.equal((await load()).status,'expired');assert.equal(f.data.size,0);assert.equal(f.enqueues(),1);
f=fixture();load=f.make();await load({request:true});f.set({status:'failed'});assert.equal((await load()).status,'error');assert.equal(f.data.size,0);
f=fixture();f.storage.setItem=()=>{throw Error('storage blocked')};assert.equal((await f.make()({request:true})).status,'uncertain');assert.equal(f.enqueues(),0);
f=fixture();load=f.make();await load({request:true});f.set({clock:time+960000});assert.equal((await load({request:true})).status,'pending');assert.equal(f.enqueues(),1); // queue older than 15m must not enqueue another
f=fixture();load=f.make();await load({request:true});f.set({status:'completed'});f.ref.byte_count=1048577;assert.equal((await load()).status,'error');assert.equal(f.enqueues(),1);
`], { cwd:process.cwd(), stdio:'pipe' });
});
