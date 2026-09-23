import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  const state=[], events=[];
  let cursor=0, resolveServer, rejectServer;
  const server=new Promise((resolve,reject)=>{resolveServer=resolve;rejectServer=reject;});
  const source=fs.readFileSync(new URL('../src/pages/common/landing/useLandingPage.jsx',import.meta.url),'utf8');
  const context={exports:{},navigator:{onLine:true},localStorage:{getItem:()=>null},require:path=>{
    if(path==='react')return {useEffect(){},useState(initial){const key=cursor++;if(!(key in state))state[key]=initial;return [state[key],value=>{state[key]=value;}];}};
    if(path.includes('translations'))return {landingTranslations:{fr:{}}};
    if(path.includes('react-i18next'))return {useTranslation:()=>({i18n:{language:'fr'}})};
    if(path.includes('ShopContext'))return {useShop:()=>({switchShop:async()=>events.push('switch'),switchRole:()=>events.push('role')})};
    if(path.includes('desktopVault'))return {isTauriDesktop:()=>false};
    if(path.includes('desktopBackup'))return {startDesktopBackupForShop:async()=>{}};
    if(path.includes('backupCredential'))return {setBackupPassword:()=>{}};
    if(path.includes('session'))return {NetworkError:Error};
    if(path.includes('cloudAuth'))return {registerCloudAccount:()=>{events.push('request');return server;}};
    if(path.includes('localAuth'))return {restoreLocalOwnerFromCloud:async session=>{events.push('local');assert.equal(session.shop.id,'remote-shop');return{id:'remote-user'};}};
    throw Error(path);
  }};
  vm.runInNewContext(ts.transpileModule(source,{fileName:'useLandingPage.jsx',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
  const render=()=>{cursor=0;return context.exports.useLandingPage({onLoginSuccess:()=>events.push('success')});};
  const form=render();form.setShopName('Shop');form.setAdminName('Owner');form.setEmail('owner@example.com');form.setPassword('Test-password!');
  return {render,events,context,resolveServer,rejectServer};
}
test('registration never writes local account or enters app before server acknowledgement',async()=>{
  const s=setup();const pending=s.render().handleRegister({preventDefault(){}});
  assert.deepEqual(s.events,['request']);
  s.resolveServer({user:{id:'remote-user'},shop:{id:'remote-shop'}});await pending;
  assert.deepEqual(s.events,['request','local','switch','role','success']);
});
test('server failure keeps registration form open without local creation',async()=>{
  const s=setup();const pending=s.render().handleRegister({preventDefault(){}});
  s.rejectServer(new Error('Serveur indisponible'));await pending;
  assert.deepEqual(s.events,['request']);assert.equal(s.render().error,'Serveur indisponible');
});
test('offline registration creates nothing',async()=>{
  const s=setup();s.context.navigator.onLine=false;
  await s.render().handleRegister({preventDefault(){}});
  assert.deepEqual(s.events,[]);assert.match(s.render().error,/Internet requis/);
});
