import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const { Database, Model, appSchema, Q } = require('@nozbe/watermelondb');
const LokiAdapter = require('@nozbe/watermelondb/adapters/lokijs').default;
const Loki = require('lokijs');
const context = {exports:{},require: name => name.includes('localId') ? {createLocalId:randomUUID} : require(name)};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/services/productUnits.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
const {prepareReceivedUnits,validateSelectedUnits,normalizeIdentifierSearch,parseIdentifiers} = context.exports;
const {default:schema} = await import('../src/db/schema.js');
const unitSchema = appSchema({version:1,tables:Object.values(schema.tables).filter(t=>['products','product_units','unit_events'].includes(t.name))});
class Product extends Model {static table='products';}
class Unit extends Model {static table='product_units';}
class Event extends Model {static table='unit_events';}

test('identical phones remain distinct units; search finds a sold IMEI and sale validation excludes it', async()=>{
 const adapter=new LokiAdapter({schema:unitSchema,useWebWorker:false,useIncrementalIndexedDB:false,_testLokiAdapter:new Loki.LokiMemoryAdapter(),extraLokiOptions:{autosave:false}});
 const db=new Database({adapter,modelClasses:[Product,Unit,Event]});
 let product;
 await db.write(async()=>{
  product=db.get('products').prepareCreateFromDirtyRaw({id:'phone',shop_id:'shop',tracking_mode:'IMEI',name:'Same model',quantity:2});
  const records=await prepareReceivedUnits(db,product,'490154203237518\n356938035643809',2);
  await db.batch(product,...records);
 });
 const units=await db.get('product_units').query().fetch();
 assert.equal(units.length,2);
 assert.notEqual(units[0].id,units[1].id);
 assert.equal((await db.get('unit_events').query().fetchCount()),2);
 assert.equal((await validateSelectedUnits(db,product,units.map(u=>u.id),2)).length,2);
 await assert.rejects(validateSelectedUnits(db,product,[units[0].id,units[0].id],2),/distinct/);
 await db.write(()=>units[0].update(u=>{u._raw.state='SOLD';}));
 const search=normalizeIdentifierSearch(units[0]._raw.identifier.replace(/(.{5})/g,'$1 '));
 const found=await db.get('product_units').query(Q.where('shop_id','shop'),Q.where('identifier',Q.like(`${Q.sanitizeLikeString(search)}%`))).fetch();
 assert.equal(found[0].id,units[0].id);
 await assert.rejects(validateSelectedUnits(db,product,[units[0].id],1),/disponible/);
 await assert.rejects(db.write(async()=>await prepareReceivedUnits(db,product,units[0]._raw.identifier,1)),/existe déjà/);
 assert.throws(()=>parseIdentifiers('490154203237518\n490154203237518','IMEI'),/plusieurs fois/);
});
