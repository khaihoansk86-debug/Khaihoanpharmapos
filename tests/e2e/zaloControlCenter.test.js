// Isolated browser/SDK fixture. No live Supabase or Zalo sender is reachable.
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const repo=process.cwd();
const output=process.env.ZALO_UI_ARTIFACT_DIR || 'D:/Khaihoanpharmapos/zalo-ui-20260908';
fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(repo,'.'+pathname);
    if(!file.startsWith(repo+path.sep)){res.writeHead(403);res.end();return;}
    try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}
    catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
const id='00000000-0000-0000-0000-000000000001';
const item={productId:id,code:'SP1',name:'Thuốc mẫu thành phần',availableStock:20,baseUnit:'Viên',min:34,max:100,note:'Fixture đã phân loại ở backend'};
const dto={contractVersion:1,ruleVersion:'fixture-v1',observedAt:new Date().toISOString(),businessDate:'2026-09-08',
    counts:{outOfStock:0,belowMin:1,aboveMax:0,withoutMin:0,needsReview:0},sections:{outOfStock:[],belowMin:[item],aboveMax:[],withoutMin:[],needsReview:[]},
    messages:[{audience:'operations_group',parts:['[DỮ LIỆU KIỂM THỬ] SP1 — Tồn 20 viên | Min34 / Max100']} ]};
async function open({allowed=true,capable=false,preview=false,empty=false}={}){
    const page=await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request',request=>{
        const url=request.url();
        if(url===base+'/js/core/supabase.js')return request.respond({contentType:'application/javascript',body:`
            export const supabaseClient={auth:{getUser:async()=>({data:{user:{id:'${id}'}}})},rpc:async(name,args)=>{
                window.__calls.push({name,args});
                if(name==='is_current_employee_admin')return {data:window.__allowed,error:null};
                if(name==='enqueue_zalo_bot_command'){await new Promise(r=>setTimeout(r,100));return {data:'${id}',error:null};}
                if(name==='get_zalo_inventory_preview')return {data:window.__invalidDTO?{contractVersion:999}:window.__emptyDTO?${JSON.stringify({...dto,counts:{outOfStock:0,belowMin:0,aboveMax:0,withoutMin:0,needsReview:0},sections:{outOfStock:[],belowMin:[],aboveMax:[],withoutMin:[],needsReview:[]},messages:[]})}:${JSON.stringify(dto)},error:null};
                throw Error('Unexpected RPC');
            },from:(table)=>{window.__reads.push(table);let exact;const q={select(){return q},limit(){return q},order(){return q},eq(k,v){exact=v;return q},maybeSingle(){return q},then(resolve){
                if(window.__offline)return resolve({data:null,error:{message:'network'}});
                const data=table==='zalo_bot_settings'?{cron_low_stock:'0 16 * * *',cron_out_of_stock:'0 11 * * *'}:table==='zalo_bot_runtime_status'?window.__runtime:exact?{id:exact,command_type:'preview_inventory_health_v1',status:window.__previewCompleted?'completed':'queued',result:{status:'preview_ready',contractVersion:1,result_id:'${id}',expires_at:new Date(Date.now()+(window.__expired?-1000:900000)).toISOString(),byte_count:2000}}:window.__commands;
                resolve({data,error:null});
            }};return q;}};`});
        if(url===base+'/js/components/layout.js')return request.respond({contentType:'application/javascript',body:`export async function initLayout(){localStorage.setItem('pos_user',JSON.stringify({role:'admin',authenticatedSession:true}));return true;}`});
        if(!url.startsWith(base)&&!url.includes('cdn.tailwindcss.com')&&!url.includes('fonts.googleapis.com')&&!url.includes('fonts.gstatic.com')&&!url.includes('cdnjs.cloudflare.com'))return request.abort();
        request.continue();
    });
    await page.evaluateOnNewDocument((allowed,capable,empty,preview)=>{
        window.__allowed=allowed;window.__calls=[];window.__reads=[];
        window.__runtime=empty?null:{status:'online',zalo_connected:true,version:'production',last_heartbeat_at:new Date().toISOString(),metadata:capable?{controlCapabilities:{contractVersion:1,verified:true,sourceCommit:'a'.repeat(40),commands:['send_low_stock_report',...(preview?['preview_inventory_health_v1']:[])],previewInventoryHealthV1:preview}}:{}};
        window.__commands=empty?[]:Array.from({length:25},(_,i)=>({id:String(i),command_type:'send_low_stock_report',status:i%2?'queued':'completed',requested_at:new Date().toISOString(),result:{status:'completed'},requested_by:'fixture-admin'}));
    },allowed,capable,empty,preview);
    await page.goto(base+'/pages/zalo.html',{waitUntil:'networkidle0'});
    await page.waitForFunction(()=>!document.getElementById('zaloLoadState').textContent.includes('Đang xác minh'));
    return page;
}
try{
    browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
    let page=await open();
    assert.equal(await page.$$eval('[data-zalo-command]',bs=>bs.every(b=>b.disabled)),true);
    await page.click('#tab-inventory');
    assert.equal(await page.$eval('#btnPreviewInventory',b=>b.disabled),true);
    assert.match(await page.$eval('#inventoryAvailability',e=>e.textContent),/chưa được backend/);
    assert.equal(await page.evaluate(()=>window.__calls.filter(c=>c.name==='enqueue_zalo_bot_command').length),0);
    await page.setViewport({width:1440,height:1000});await page.screenshot({path:path.join(output,'desktop-unavailable.png'),fullPage:true});
    await page.click('#tab-history');
    assert.equal((await page.$$('#zaloCommandRows tr')).length,10);
    await page.click('#historyNext');assert.match(await page.$eval('#historyPage',e=>e.textContent),/Trang 2/);
    await page.select('#commandFilter','failed');assert.match(await page.$eval('#zaloCommandRows',e=>e.textContent),/Chưa có lệnh/);
    await page.evaluate(()=>window.__offline=true);await page.click('#btnRefreshZalo');
    await page.waitForFunction(()=>document.getElementById('zaloLoadState').textContent.includes('Không tải'));
    assert.match(await page.$eval('#botConnectionBadge',e=>e.textContent),/Chưa xác minh/);
    assert.equal(await page.$$eval('[data-zalo-command]',bs=>bs.every(b=>b.disabled)),true);await page.close();
    page=await open({allowed:false});assert.equal(await page.evaluate(()=>window.__reads.length),0);await page.close();
    page=await open({empty:true});assert.equal(await page.$eval('#botQueuedCount',e=>e.textContent),'0');assert.match(await page.$eval('#botConnectionBadge',e=>e.textContent),/Chưa có tín hiệu/);await page.close();
    page=await open({capable:true,preview:true});await page.click('#tab-inventory');await page.select('#inventoryGroup','belowMin');
    assert.equal(await page.evaluate(()=>window.__calls.filter(c=>c.name==='enqueue_zalo_bot_command').length),0);
    await page.$eval('#btnPreviewInventory',b=>{b.click();b.click();});
    await page.waitForFunction(()=>document.getElementById('inventoryAvailability').textContent.includes('đang chờ/đang xử lý'));
    assert.equal(await page.evaluate(()=>window.__calls.filter(c=>c.name==='enqueue_zalo_bot_command').length),1);
    await page.reload({waitUntil:'networkidle0'});await page.click('#tab-inventory');
    await page.waitForFunction(()=>document.getElementById('inventoryAvailability').textContent.includes('đang chờ/đang xử lý'));
    assert.equal(await page.evaluate(()=>window.__calls.filter(c=>c.name==='enqueue_zalo_bot_command').length),0); // same pending id survives F5
    await page.evaluate(()=>window.__offline=true);await page.click('#btnPreviewInventory');
    await page.waitForFunction(()=>document.getElementById('inventoryAvailability').textContent.includes('Chưa đọc được'));
    await page.evaluate(()=>{window.__offline=false;window.__previewCompleted=true;});await page.click('#btnPreviewInventory');
    await page.waitForFunction(()=>document.getElementById('inventoryAvailability').textContent.includes('Bản xem trước từ backend'));
    await page.select('#inventoryGroup','belowMin');
    assert.match(await page.$eval('#inventoryRows',e=>e.textContent),/Thuốc mẫu thành phần/);
    await page.type('#inventorySearch','khong-co');assert.match(await page.$eval('#inventoryRows',e=>e.textContent),/Không có mặt hàng/);
    await page.$eval('#inventorySearch',e=>{e.value='';e.dispatchEvent(new Event('input'));});
    await page.setViewport({width:390,height:844});await page.evaluate(()=>document.documentElement.classList.add('dark'));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
    await page.screenshot({path:path.join(output,'mobile-dark-fixture.png'),fullPage:true});
    await page.setViewport({width:1440,height:1000});await page.screenshot({path:path.join(output,'desktop-fixture.png'),fullPage:true});
    await page.evaluate(()=>window.__invalidDTO=true);await page.click('#btnPreviewInventory');
    await page.waitForFunction(()=>document.getElementById('inventoryAvailability').textContent.includes('không hợp lệ'));
    await page.screenshot({path:path.join(output,'preview-error-fixture.png'),fullPage:true});
    await page.evaluate(()=>{window.__invalidDTO=false;window.__expired=true;});await page.click('#btnPreviewInventory');
    await page.waitForFunction(()=>document.getElementById('inventoryAvailability').textContent.includes('hết hạn'));
    await page.evaluate(()=>{window.__expired=false;window.__emptyDTO=true;});await page.click('#btnPreviewInventory');
    await page.waitForFunction(()=>document.getElementById('inventoryAvailability').textContent.includes('Bản xem trước'));
    assert.match(await page.$eval('#inventoryRows',e=>e.textContent),/Không có mặt hàng/);
    assert.match(await page.$eval('#managerLayerStatus',e=>e.textContent),/Chưa có tín hiệu riêng/);
    await page.evaluate(()=>{window.__calls=[];});
    await page.click('#tab-overview');await page.click('[data-zalo-command="send_low_stock_report"]');
    assert.match(await page.$eval('#zaloConfirmMessage',e=>e.textContent),/Nhóm vận hành.*ngoài lịch/);
    await page.keyboard.press('Escape');assert.equal(await page.$eval('#zaloConfirmModal',e=>e.classList.contains('hidden')),true);
    await page.click('[data-zalo-command="send_low_stock_report"]');
    await page.$eval('#btnConfirmZaloCommand',b=>{b.click();b.click();});
    await page.waitForFunction(()=>document.getElementById('zaloConfirmModal').classList.contains('hidden'));
    assert.equal(await page.evaluate(()=>window.__calls.filter(c=>c.name==='enqueue_zalo_bot_command').length),1);
    assert.deepEqual(await page.evaluate(()=>window.__calls.find(c=>c.name==='enqueue_zalo_bot_command').args),{p_command_type:'send_low_stock_report',p_payload:{}});
    await page.evaluate(()=>window.__runtime.last_heartbeat_at='2026-01-01T00:00:00Z');await page.click('#btnRefreshZalo');
    await page.waitForFunction(()=>document.querySelector('[data-zalo-command="send_low_stock_report"]').disabled);
    await page.close();console.log('PASS: isolated UI/SDK flows, permission denial, absent capabilities/preview, pagination/filter, empty, offline, stale heartbeat, DTO search, no automatic send, confirmation and double-click.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
