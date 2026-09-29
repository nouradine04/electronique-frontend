import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  const state=[], events=[], requests=[];
  let cursor=0, resolveServer, rejectServer;
  const server=new Promise((resolve,reject)=>{resolveServer=resolve;rejectServer=reject;});
  const source=fs.readFileSync(new URL('../src/pages/common/landing/useLandingPage.jsx',import.meta.url),'utf8');
  const context={exports:{},TextEncoder,navigator:{onLine:true},localStorage:{getItem:()=>null},require:path=>{
    if(path==='react')return {useEffect(){},useState(initial){const key=cursor++;if(!(key in state))state[key]=initial;return [state[key],value=>{state[key]=value;}];},useRef(initial){const key=cursor++;if(!(key in state))state[key]={current:initial};return state[key];}};
    if(path.includes('translations'))return {landingTranslations:{fr:{}}};
    if(path.includes('react-i18next'))return {useTranslation:()=>({i18n:{language:'fr'}})};
    if(path.includes('ShopContext'))return {useShop:()=>({switchShop:async()=>events.push('switch'),switchRole:()=>events.push('role')})};
    if(path.includes('desktopVault'))return {isTauriDesktop:()=>false};
    if(path.includes('desktopBackup'))return {startDesktopBackupForShop:async()=>{}};
    if(path.includes('backupCredential'))return {setBackupPassword:()=>{}};
    if(path.includes('session'))return {NetworkError:Error};
    if(path.includes('cloudAuth'))return {registerCloudAccount:input=>{events.push('request');requests.push(input);return server;}};
    if(path.includes('localAuth'))return {restoreLocalOwnerFromCloud:async session=>{events.push('local');assert.equal(session.shop.id,'remote-shop');return{id:'remote-user'};}};
    throw Error(path);
  }};
  vm.runInNewContext(ts.transpileModule(source,{fileName:'useLandingPage.jsx',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
  const render=()=>{cursor=0;return context.exports.useLandingPage({onLoginSuccess:()=>events.push('success')});};
  const form=render();form.setShopName('Shop');form.setAdminName('Owner');form.setEmail('owner@example.com');form.setPassword('Test-password!');form.setRegisterStep(2);
  return {render,events,requests,context,resolveServer,rejectServer};
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
test('registration tries the server despite a false offline browser hint and keeps data if it fails',async()=>{
  const s=setup();s.context.navigator.onLine=false;
  const pending=s.render().handleRegister({preventDefault(){}});
  assert.deepEqual(s.events,['request']);
  s.rejectServer(new Error('Serveur injoignable'));await pending;
  assert.deepEqual(s.events,['request']);assert.match(s.render().error,/Serveur injoignable/);
});

test('mobile trailing email space is accepted and Enter on step one only advances the form',async()=>{
 const s=setup();const form=s.render();form.setEmail('owner@example.com ');form.setRegisterStep(1);
 await s.render().handleRegister({preventDefault(){}});
 assert.equal(s.render().registerStep,2);assert.equal(s.render().error,'');assert.deepEqual(s.events,[]);
});

test('autofilled name survives the first step even when its input is absent on submit',async()=>{
 const s=setup();const form=s.render();form.setAdminName('');form.setRegisterStep(1);
 const elements={'register-name':{value:'Nom Safari'},'register-email':{value:'owner@example.com'}};
 await s.render().handleRegister({preventDefault(){},currentTarget:{elements}});
 assert.equal(s.render().adminName,'Nom Safari');
 assert.equal(s.render().registerStep,2);
 const pending=s.render().handleRegister({preventDefault(){},currentTarget:{elements:{'register-shop':{value:'Shop'},'register-password':{value:'Test-password!'}}}});
 assert.deepEqual(s.events,['request']);
 s.resolveServer({user:{id:'remote-user'},shop:{id:'remote-shop'}});await pending;
 assert.deepEqual(s.events,['request','local','switch','role','success']);
});

test('an overlong owner name is rejected before signup reaches the server',async()=>{
 const s=setup();s.render().setAdminName('x'.repeat(101));
 await s.render().handleRegister({preventDefault(){}});
 assert.deepEqual(s.events,[]);
 assert.match(s.render().error,/Votre nom ne doit pas dépasser 100 caractères/);
});

test('short names create the owner and shop in one request with exact credentials',async()=>{
 const s=setup();const form=s.render();
 form.setAdminName('  Ali  ');form.setShopName('  Mon magasin  ');
 form.setEmail(' ALI@Example.com ');form.setPassword('  secret123  ');
 const pending=s.render().handleRegister({preventDefault(){}});
 assert.equal(s.requests.length,1);
 assert.deepEqual(JSON.parse(JSON.stringify(s.requests[0])),{
   shop_name:'Mon magasin',name:'Ali',email:'ALI@Example.com',password:'  secret123  '
 });
 s.resolveServer({user:{id:'remote-user'},shop:{id:'remote-shop'}});await pending;
 assert.equal(s.events.at(-1),'success');
});

test('step two sends the visible first-step fields even if React state is stale',async()=>{
 const s=setup();s.render().setAdminName('x'.repeat(101));
 const elements={
   'register-name':{value:'Ali'},'register-email':{value:'ali@example.com'},
   'register-shop':{value:'Mon magasin'},'register-password':{value:'secret123'},
 };
 const pending=s.render().handleRegister({preventDefault(){},currentTarget:{elements}});
 assert.equal(s.requests.length,1);
 assert.equal(s.requests[0].name,'Ali');
 assert.equal(s.requests[0].shop_name,'Mon magasin');
 s.resolveServer({user:{id:'remote-user'},shop:{id:'remote-shop'}});await pending;
 assert.equal(s.events.at(-1),'success');
});

test('a local setup error after server confirmation says the account exists',async()=>{
 const s=setup();s.render().setShopName('Shop');
 const pending=s.render().handleRegister({preventDefault(){}});
 s.resolveServer({user:{id:'remote-user'},shop:null});
 await pending;
 assert.match(s.render().error,/compte et votre boutique sont créés/);
 assert.equal(s.events.includes('success'),false);
});

test('two rapid taps submit only one registration',async()=>{
 const s=setup(),form=s.render(),event={preventDefault(){}};
 const first=form.handleRegister(event);
 const second=form.handleRegister(event);
 assert.equal(s.requests.length,1);
 s.resolveServer({user:{id:'remote-user'},shop:{id:'remote-shop'}});
 await Promise.all([first,second]);
 assert.equal(s.events.filter(event=>event==='success').length,1);
});
