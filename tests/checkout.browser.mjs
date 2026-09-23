import fs from 'node:fs';
import {createServer} from '../node_modules/vite/dist/node/index.js';
import react from '../node_modules/@vitejs/plugin-react/dist/index.js';
const { chromium } = await import(process.env.NSTOCK_PLAYWRIGHT_MODULE || 'playwright');
const pageFile=new URL('../__checkout-qa.html',import.meta.url);
const profile=fs.mkdtempSync('/tmp/nstock-checkout-');
fs.writeFileSync(pageFile,`<html><script type="module">import db from '/src/db/watermelondb.js';import * as queries from '/src/db/queries.js';import {prepareCheckoutOperation} from '/src/services/operationQueue.ts';import {pushPendingOperations} from '/src/services/syncOperations.ts';window.qa={db,queries,prepareCheckoutOperation,pushPendingOperations};</script></html>`);
const server=await createServer({configFile:false,root:new URL('..',import.meta.url).pathname,define:{global:'globalThis'},plugins:[{name:'test-session',enforce:'pre',load(id){if(id.split('?')[0].endsWith('/services/session.ts'))return `export const assertSessionWritable=()=>{};export const ensureAccessToken=async()=>"test";export const getAccessToken=()=>"test";export const invalidateAccessToken=()=>{};export class NetworkError extends Error{};export class ApiError extends Error{constructor(status,message){super(message);this.status=status;}}`;}},react({include:/\.(jsx|js|tsx|ts)$/,babel:{plugins:[['@babel/plugin-proposal-decorators',{legacy:true}],['@babel/plugin-proposal-class-properties',{loose:true}]]}})],server:{host:'127.0.0.1',port:3198,strictPort:true}});
let context;
try{
 await server.listen();
 const open=async()=>{context=await chromium.launchPersistentContext(profile,{headless:true,channel:'chrome'});const page=await context.newPage();page.on('pageerror',e=>console.error(e.message));await page.goto('http://127.0.0.1:3198/__checkout-qa.html');await page.waitForFunction(()=>window.qa);return page;};
 let page=await open();
 const ids=await page.evaluate(async()=>{
  localStorage.setItem('currentUserId','owner');localStorage.setItem('backend_url','http://127.0.0.1:3198');
  const {db,queries:q,prepareCheckoutOperation}=window.qa;
  const shop=await q.createShop({name:'Checkout test'});
  const product=await q.createProduct({shop_id:shop.id,name:'Phone',quantity:5,price:100,unit_cost:50,status:'ACTIVE'});
  for(let i=0;i<2;i++)await db.write(async()=>{
   const sale=db.get('sales').prepareCreate(s=>{s.shopId=shop.id;s.productId=product.id;s.quantity=1;s.totalPrice=100;s.paymentMethod='cash';s.date=new Date().toISOString();});
   const movement=db.get('stock_movements').prepareCreate(m=>{m.shopId=shop.id;m.productId=product.id;m.type='OUT';m.quantity=1;m.date=new Date().toISOString();});
   const update=product.prepareUpdate(p=>{p.quantity-=1;p.synced=false;});
   const records=[sale,movement,update];const journal=await prepareCheckoutOperation(db,shop.id,records);
   await db.batch(...records,...journal);
  });
  const generic=await q.getUnsyncedRecords(shop.id,true,500);
  if(generic.products.length||generic.sales.length||generic.stockMovements.length)throw Error('Generic sync split a pending checkout');
  return {shop:shop.id,product:product.id};
 });
 const receipts=new Map();let abortOnce=true;let calls=0;
 const mock=async page=>page.route('**/sync/checkout?*',async route=>{
  calls++;const body=route.request().postDataJSON();
  let ack=receipts.get(body.id);
  if(!ack){const versions={};let processed=0;for(const [table,c]of Object.entries(body.changes)){versions[table]={};for(const row of [...c.created,...c.updated]){versions[table][row.id]=(body.base_versions[table][row.id]||0)+1;processed++;}}ack={status:'ok',versions,processed,has_more:false,rejected_ids:{}};receipts.set(body.id,ack);}
  if(abortOnce){abortOnce=false;await route.abort();return;}
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(ack)});
 });
 await mock(page);
 await page.evaluate(async ids=>{try{await window.qa.pushPendingOperations(ids.shop);}catch{}if(await window.qa.db.get('sync_operations').query().fetchCount()!==2)throw Error('Lost response removed journal');},ids);
 await context.close();context=null;page=await open();await mock(page);
 await page.evaluate(async ids=>{
  const {db,pushPendingOperations,queries:q}=window.qa;
  if(await db.get('sync_operations').query().fetchCount()!==2)throw Error('Journal lost on restart');
  await pushPendingOperations(ids.shop);
  if(await db.get('sync_operations').query().fetchCount()!==0)throw Error('Confirmed operation still queued');
  if(await db.get('sync_operation_links').query().fetchCount()!==0)throw Error('Confirmed operation still protected');
  const product=await db.get('products').find(ids.product);
  if(product.quantity!==3||product._raw._status!=='synced')throw Error('Later local stock overwritten or not acknowledged');
  if((await q.getUnsyncedRecords(ids.shop,true,500)).sales.length)throw Error('Sales still pending');
 },ids);
 if(receipts.size!==2||calls!==3)throw Error('Unexpected number of operations or retries');
 console.log('PASS: two offline checkouts, generic sync exclusion, lost response, full restart, same operation ID retry, later stock preserved and final acknowledgement.');

}finally{await context?.close();await server.close();fs.unlinkSync(pageFile);fs.rmSync(profile,{recursive:true,force:true});}
