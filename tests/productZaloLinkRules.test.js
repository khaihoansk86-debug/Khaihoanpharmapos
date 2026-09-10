const {execFileSync}=require('child_process');
test('Zalo deep link focuses an existing authorized catalog SKU once without writes',()=>{
execFileSync('node',['--input-type=module','-e',`
import assert from 'node:assert/strict';
import {consumeZaloSkuLink} from './js/features/products/productZaloLinkRules.js';
const id='00000000-0000-0000-0000-000000000001';let focus=null;let replaced=null;
const location={href:'https://example.test/pages/products.html?zaloSku='+id};
const history={replaceState:(_,__,url)=>{replaced=url}};
assert.equal(consumeZaloSkuLink([],location,history,x=>focus=x),false);
assert.equal(consumeZaloSkuLink([{id}],location,history,x=>focus=x),true);
assert.equal(focus,id);assert.equal(replaced,'/pages/products.html');
assert.equal(consumeZaloSkuLink([{id}],{href:'https://example.test/?zaloSku=bad'},history,()=>{throw Error()}),false);
`],{cwd:process.cwd(),stdio:'pipe'});
});
