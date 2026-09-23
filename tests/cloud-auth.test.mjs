import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function setup() {
  const calls = [], accepted = [];
  class NetworkError extends Error {}
  const session = { user_id: 'server-user', access_token: 'memory-token', user: { id: 'server-user', shop_id: 'server-shop' }, shop: { id: 'server-shop' } };
  let failure;
  const context = { exports: {}, navigator: { onLine: true }, require: name => {
    if (name.includes('backendConfig')) return { LOCAL_ONLY: true };
    return { NetworkError, finishPendingLogout: async () => {},
      sessionRequest: async (path, body) => { calls.push({path, body}); if (failure) throw failure; return session; },
      acceptSession: async value => accepted.push(value) };
  }};
  const source = fs.readFileSync(new URL('../src/services/cloudAuth.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, context);
  return {api:context.exports,context,calls,accepted,session,fail:error=>{failure=error;}};
}
test('new device authenticates remotely even when business sync is disabled', async () => {
  const s = setup();
  assert.equal(await s.api.loginCloudAccount(' User@Example.COM ', 'Exact Password!'), s.session);
  assert.equal(s.calls[0].path, '/auth/login');
  assert.equal(s.calls[0].body.email, 'user@example.com');
  assert.equal(s.calls[0].body.password, 'Exact Password!');
  assert.equal(s.accepted.length, 1);
});
test('server refusal does not create a local authenticated session', async () => {
  const s=setup(), error=new Error('Identifiants incorrects'); s.fail(error);
  await assert.rejects(s.api.loginCloudAccount('user@example.com','wrong'),error);
  assert.equal(s.accepted.length,0);
});
test('offline cloud login does not send requests or create sessions', async () => {
  const s=setup(); s.context.navigator.onLine=false;
  await assert.rejects(s.api.loginCloudAccount('user@example.com','password'));
  assert.equal(s.calls.length,0); assert.equal(s.accepted.length,0);
});

const registration = {shop_name:'Shop',name:'Owner',email:' Owner@Example.com ',password:'Exact Password!'};
test('registration requires network and never accepts a session on server failure', async () => {
  const s=setup(); s.context.navigator.onLine=false;
  await assert.rejects(s.api.registerCloudAccount(registration));
  assert.equal(s.calls.length,0); assert.equal(s.accepted.length,0);
  s.context.navigator.onLine=true; s.fail(new Error('Database unavailable'));
  await assert.rejects(s.api.registerCloudAccount(registration),/Database unavailable/);
  assert.equal(s.accepted.length,0);
});
test('registration waits for confirmed server user and shop', async () => {
  const s=setup(); await s.api.registerCloudAccount(registration);
  assert.equal(s.calls[0].path,'/auth/register');
  assert.equal(s.calls[0].body.email,'owner@example.com');
  assert.equal(s.accepted.length,1);
  const invalid=setup(); invalid.session.shop=null;
  await assert.rejects(invalid.api.registerCloudAccount(registration),/confirmé/);
  assert.equal(invalid.accepted.length,0);
});
