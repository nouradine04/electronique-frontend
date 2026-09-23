import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const passthrough = ({ children }) => React.createElement(React.Fragment, null, children);
const context = {
  exports: {},
  require(specifier) {
    if (specifier === 'react' || specifier === 'react/jsx-runtime' || specifier === 'lucide-react') return require(specifier);
    if (specifier.includes('ShopContext')) return { useShop: () => ({ userRole: 'owner', userName: 'Test' }) };
    if (specifier.includes('FormUI')) return { FormStep: passthrough, StepProgress: () => null, LoadingButton: passthrough };
    if (specifier.includes('LocalImage')) return { LocalImage: ({src,alt}) => React.createElement('img', {src,alt}) };
    // External storage, catalog and camera are not invoked during initial render.
    return {};
  },
};
vm.runInNewContext(ts.transpileModule(
  fs.readFileSync(new URL('../src/components/stock/AddProductWizard.jsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: 'AddProductWizard.jsx' },
).outputText, context);
const render = props => renderToStaticMarkup(React.createElement(context.exports.AddProductWizard, {
  categories: [{id:'accessories',name:'Accessoires'}], onClose() {}, onSubmit() {}, ...props,
}));

function assertIdentityFields(html) {
  assert.match(html, /<label[^>]*for="product-name"/);
  assert.match(html, /<input(?=[^>]*id="product-name")(?=[^>]*name="name")(?=[^>]*required="")[^>]*>/);
  assert.match(html, /<label[^>]*for="product-category"/);
  assert.match(html, /<select[^>]*id="product-category"[^>]*name="category_id"[^>]*required=""/);
}

test('new product exposes required identity fields before any catalog or manual action', () => {
  const html = render({});
  assertIdentityFields(html);
  assert.match(html, /Saisissez le nom ou choisissez un modèle proposé/);
  assert.doesNotMatch(html, /type="search"/);
  assert.match(html, /value="accessories"/);
});

test('catalog product remains editable with a visible name and category', () => {
  const html = render({initialData:{id:'p',name:'Téléphone',catalog_id:'catalog-1',category_id:'accessories'}});
  assertIdentityFields(html);
  assert.match(html, /value="Téléphone"/);
  assert.match(html, /Modèle sélectionné/);
});

test('empty categories show an explicit next action instead of hiding the selector', () => {
  const html = render({categories:[]});
  assertIdentityFields(html);
  assert.match(html, /Choisir une catégorie/);
  assert.match(html, /Aucune catégorie disponible/);
});
