import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { siteUrl, seoTitle } from '../scripts/seo.mjs';

const read = path => readFile(new URL('../dist/' + path, import.meta.url), 'utf8');

test('public landing exposes branded content, metadata and structured data without JavaScript', async () => {
  const html = await read('index.html');
  assert.ok(html.includes(`<title>${seoTitle}</title>`));
  assert.match(html, /<link rel="canonical" href="https:\/\/nstock\.medaaris\.com\/"/);
  assert.match(html, /<h1[^>]*>[\s\S]*?NStock[\s\S]*?<\/h1>/);
  assert.ok(html.includes('appareils par IMEI'));
  assert.ok(html.includes('Tarifs simples et sans surprise'));
  assert.ok(!html.includes('/src/'), 'source asset URLs must be rewritten for deployment');
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema.name, 'NStock');
  assert.equal(schema.url, 'https://nstock.medaaris.com/');
  const stylesheet = html.match(/<link[^>]+href="(\/assets\/[^"?]+\.css)"/)[1];
  const css = await read(stylesheet.slice(1));
  assert.ok(css.includes('.shop-hero'), 'prerender must include landing styles');
  for (const [, path] of html.matchAll(/(?:src|href)="(\/(?:assets\/|icon-)[^"?]+)(?:\?[^"\s]*)?"/g)) {
    await access(new URL('../dist' + path, import.meta.url));
  }
});

test('app, platform and missing-page shells are noindex and exclude public prerender', async () => {
  for (const path of ['app/index.html', 'platform/index.html', '404.html']) {
    const html = await read(path);
    assert.match(html, /name="robots" content="noindex, follow"/);
    assert.ok(html.includes('<div id="root"></div>'));
    assert.ok(!html.includes('rel="canonical"'));
    assert.ok(!html.includes('application/ld+json'));
  }
});

test('discovery files list only the public canonical homepage', async () => {
  assert.match(await read('robots.txt'), /Sitemap: https:\/\/nstock\.medaaris\.com\/sitemap.xml/);
  const sitemap = await read('sitemap.xml');
  assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), ['https://nstock.medaaris.com/']);
});

test('canonical configuration rejects credentials and non-origin URLs', () => {
  assert.equal(siteUrl('https://example.com'), 'https://example.com/');
  for (const value of ['http://example.com', 'https://user:password@example.com', 'https://example.com/app', 'https://example.com/?x=1']) {
    assert.throws(() => siteUrl(value));
  }
});
