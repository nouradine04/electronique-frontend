import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

export const seoTitle = 'NStock — Logiciel de caisse et gestion de stock';
export const seoDescription = 'Gérez les ventes, le stock, les appareils par IMEI, les crédits et les dépenses de votre boutique d’électronique avec NStock, même hors ligne.';
const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function siteUrl(value = 'https://nstock.medaaris.com') {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('VITE_SITE_URL doit être une origine HTTPS publique, par exemple https://nstock.medaaris.com');
  }
  return url.origin + '/';
}

export function seoHead(origin) {
  const image = new URL('icon-512.png', origin).href;
  const schema = {
    '@context': 'https://schema.org', '@type': 'WebSite',
    '@id': origin + '#website', name: 'NStock', url: origin,
    description: seoDescription, inLanguage: 'fr',
  };
  return `<link rel="canonical" href="${escapeHtml(origin)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:site_name" content="NStock" />
    <meta property="og:title" content="${escapeHtml(seoTitle)}" />
    <meta property="og:description" content="${escapeHtml(seoDescription)}" />
    <meta property="og:url" content="${escapeHtml(origin)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:alt" content="Logo NStock" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(seoTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(seoDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`;
}

export function privateShell(html) {
  return html.replace(/<div id="root">[\s\S]*<!--seo-root-end-->/, '<div id="root"></div>')
    .replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, follow" />')
    .replace(/<link rel="canonical"[^>]*>/, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
}

export function seoPlugin() {
  let config;
  let origin;
  return {
    name: 'nstock-public-seo',
    enforce: 'post',
    configResolved(resolved) {
      config = resolved;
      origin = siteUrl(resolved.env.VITE_SITE_URL || undefined);
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html) {
        html = html.replace('<!--seo-head-->', seoHead(origin));
        if (config.command !== 'build') return html;
        const renderer = await createServer({
          configFile: false, root: config.root, plugins: [react()],
          server: { middlewareMode: true, watch: null, hmr: false, ws: false },
          appType: 'custom', cacheDir: 'node_modules/.vite-seo', optimizeDeps: { noDiscovery: true, include: [] },
        });
        try {
          const { renderLanding } = await renderer.ssrLoadModule('/src/seo-entry.jsx');
          const content = renderLanding();
          const css = [...renderer.environments.ssr.moduleGraph.idToModuleMap.keys()]
            .filter(id => id.endsWith('.css') && id.startsWith(config.root + '/'))
            .map(id => `<link rel="stylesheet" href="${escapeHtml('/' + id.slice(config.root.length + 1))}" />`).join('\n');
          return html.replace('</head>', `${css}\n</head>`)
            .replace('<div id="root"></div>', `<div id="root">${content}</div><!--seo-root-end-->`);
        } finally {
          await renderer.close();
        }
      },
    },
    async writeBundle(_options, bundle) {
      const outDir = resolve(config.root, config.build.outDir);
      let index = await readFile(resolve(outDir, 'index.html'), 'utf8');
      // Vite rewrites image src attributes, but leaves links to full-size images alone.
      for (const asset of Object.values(bundle)) {
        if (asset.type !== 'asset') continue;
        for (const original of asset.originalFileNames || []) {
          index = index.replaceAll(`href="/${original}"`, `href="/${asset.fileName}"`);
        }
      }
      await writeFile(resolve(outDir, 'index.html'), index);
      const shell = privateShell(index);
      for (const route of ['app', 'platform']) {
        await mkdir(resolve(outDir, route), { recursive: true });
        await writeFile(resolve(outDir, route, 'index.html'), shell);
      }
      await writeFile(resolve(outDir, '404.html'), shell);
      await writeFile(resolve(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}sitemap.xml\n`);
      await writeFile(resolve(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escapeHtml(origin)}</loc></url></urlset>\n`);
    },
  };
}
