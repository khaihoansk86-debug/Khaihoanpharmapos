// Evidence-only CLI: one read-only SQL snapshot -> official bot read adapter/classifier/serializer.
// No command enqueue, Manager, sender, environment/profile copying or business writes.
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const repo=resolve(fileURLToPath(new URL('..',import.meta.url)));
const bot=process.argv[2];
const output=process.argv[3];
if(!bot || !output) throw Error('Usage: node scripts/previewZaloInventoryLinked.mjs <registered-bot-worktree> <report-directory>');
const {previewInventoryHealthV1}=await import(pathToFileURL(join(bot,'services/inventoryPreviewService.js')));
const {INVENTORY_HEALTH_SELECT}=await import(pathToFileURL(join(bot,'services/inventoryHealthDataService.js')));
const {readInventoryDTO}=await import('../js/features/zalo/zaloInventoryViewRules.js');
const sql=`BEGIN READ ONLY;
SELECT jsonb_build_object('observedAt',statement_timestamp(),
 'products',(SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT p.id,p.name,p.product_code,p.description,p.is_active,p.is_direct_sale,p.parent_id,p.min_stock_quantity,p.max_stock_quantity,
   jsonb_build_object('name',c.name) AS categories FROM products p LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.id)x),
 'product_units',(SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT id,product_id,unit_name,conversion_rate,is_base_unit,cost_price FROM product_units ORDER BY id)x),
 'product_batches',(SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT id,product_id,batch_number,expiry_date,stock_quantity,cost_price FROM product_batches ORDER BY id)x)
) AS snapshot; COMMIT;`;
const result=spawnSync(process.execPath,[join(repo,'node_modules/supabase/dist/supabase.js'),'db','query','--linked',sql,'--output-format','json','--agent','no'],
 {cwd:repo,encoding:'utf8',maxBuffer:32*1024*1024,timeout:60000,windowsHide:true});
if(result.status!==0) throw Error('Read-only Supabase query failed; no DTO generated.');
const snapshot=JSON.parse(result.stdout)[0]?.snapshot;
if(!snapshot?.observedAt) throw Error('Snapshot missing; no DTO generated.');
const reads=[];
const client={from(table){
 if(!Object.hasOwn(INVENTORY_HEALTH_SELECT,table)) throw Error('Unexpected table');
 const q={select(columns){if(columns!==INVENTORY_HEALTH_SELECT[table])throw Error('Read contract changed');return q;},
 order(column){if(column!=='id')throw Error('Unexpected order');return q;},range:async(start,end)=>{reads.push({table,start,end});return {data:snapshot[table].slice(start,end+1),error:null};}};
 return q;
}};
const dto=await previewInventoryHealthV1(client,{now:snapshot.observedAt,sourceCommit:null});
readInventoryDTO(dto);
const evidence={observedAt:dto.observedAt,businessDate:dto.businessDate,ruleVersion:dto.ruleVersion,sourceCommit:null,
 method:'Supabase CLI BEGIN READ ONLY, one SQL snapshot; in-memory transport feeds official bot adapter/classifier/serializer; not a live worker command or Auth browser test',
 bytes:Buffer.byteLength(JSON.stringify(dto)),counts:dto.counts,reads,managerCalls:0,senderCalls:0,commandWrites:0,businessWrites:0,
 messageParts:dto.messages.map(m=>({audience:m.audience,count:m.parts.length}))};
await mkdir(output,{recursive:true});
await writeFile(join(output,'dto.json'),JSON.stringify(dto,null,2));
await writeFile(join(output,'evidence.json'),JSON.stringify(evidence,null,2));
await writeFile(join(output,'messages.md'),dto.messages.map(m=>'## '+m.audience+'\n\n'+m.parts.join('\n\n')).join('\n\n'));
console.log(JSON.stringify(evidence,null,2));
