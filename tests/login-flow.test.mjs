import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
function setup({online=true,failure=false}={}) {
  const events=[];
  const credentials=[];
  let index=0;
  class NetworkError extends Error {}
  class ApiError extends Error {}
  const context={exports:{},navigator:{onLine:online},require:path=>{
    if(path==='react')return {...React,useState:initial=>[index++===0?'owner@example.com':index===2?'password':initial,()=>{}]};
    if(path==='react/jsx-runtime')return React;
    if(path.includes('ShopContext'))return {useShop:()=>({switchShop:async()=>events.push('shop'),switchRole:()=>events.push('role')})};
    if(path.includes('desktopVault'))return {isTauriDesktop:()=>false};
    if(path.includes('desktopBackup'))return {startDesktopBackupForShop:async()=>{}};
    if(path.includes('backupCredential'))return {setBackupPassword:()=>{}};
    if(path.includes('cloudAuth'))return {loginCloudAccount:async(email,password)=>{credentials.push({email,password});events.push('server');if(failure)throw new NetworkError();return{user_id:'server-id'};}};
    if(path.includes('localAuth'))return {loginLocalUser:async()=>{events.push('LOCAL LOGIN');return{id:'server-id'};},restoreLocalOwnerFromCloud:async()=>{events.push('restore');return{id:'server-id',shopId:'shop',role:'owner',name:'Owner'};}};
    if(path.includes('session'))return {ApiError,NetworkError,canWorkOffline:()=>true,getSession:()=>({userId:'server-id'})};
    return {};
  }};
  const source=fs.readFileSync(new URL('../src/pages/common/LoginPage.jsx',import.meta.url),'utf8');
  vm.runInNewContext(ts.transpileModule(source,{fileName:'LoginPage.jsx',compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,context);
  const tree=context.exports.LoginPage({onLoginSuccess:()=>events.push('success')});
  const find=node=>{if(!node)return;if(Array.isArray(node)){for(const child of node){const result=find(child);if(result)return result;}}else if(node.type==='form')return node;else return find(node.props?.children);};
  return {events,credentials,submit:values=>find(tree).props.onSubmit({preventDefault(){},currentTarget:values?{elements:{namedItem:name=>({value:values[name]})}}:undefined})};
}
test('false offline browser hint still attempts the server without local fallback',async()=>{
 const s=setup({online:false,failure:true});await s.submit();assert.deepEqual(s.events,['server']);
});
test('unreachable server never falls back to the local password',async()=>{
 const s=setup({failure:true});await s.submit();assert.deepEqual(s.events,['server']);
});
test('new login restores local data only after server success',async()=>{
 const s=setup();await s.submit();assert.deepEqual(s.events,['server','restore','shop','role','success']);
});
test('login sends visible autofilled credentials when React state is stale',async()=>{
 const s=setup();await s.submit({email:'autofill@example.com',password:'filled-password'});
 assert.deepEqual(s.credentials,[{email:'autofill@example.com',password:'filled-password'}]);
});
