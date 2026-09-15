/**
 * Produce the Claude-artifact entry file from app/index.html.
 *
 * The app is a normal standalone page for GitHub Pages, but the Artifact
 * platform wraps whatever it is given in its own `<!doctype html><head>…<body>`
 * skeleton, so the same file cannot carry those tags. Rather than maintain two
 * copies of the markup, strip the document wrapper (and the PWA-only tags that
 * mean nothing inside the artifact frame) and keep everything else in order.
 *
 *   node tools/make-artifact.mjs <out.html>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const out = process.argv[2];
if (!out) {
  console.error('usage: node tools/make-artifact.mjs <out.html>');
  process.exit(1);
}

let html = readFileSync(new URL('../app/index.html', import.meta.url), 'utf8');

const drop = [
  /<!doctype html>\s*/i,
  /<html[^>]*>\s*/i,
  /<\/html>\s*$/i,
  /<head>\s*/i,
  /<\/head>\s*/i,
  /<body[^>]*>\s*/i,
  /<\/body>\s*/i,
  // Document-level metadata the platform supplies or the frame ignores.
  /<meta charset[^>]*>\s*/i,
  /<meta name="viewport"[^>]*>\s*/i,
  /<meta name="theme-color"[^>]*>\s*/i,
  /<link rel="manifest"[^>]*>\s*/i,
  /<link rel="apple-touch-icon"[^>]*>\s*/i,
  /<meta name="apple-mobile-web-app-[^>]*>\s*/gi,
];
for (const re of drop) html = html.replace(re, '');

html = html.replace(/\n{3,}/g, '\n\n').trimStart();

if (/<(html|head|body|!doctype)/i.test(html)) {
  console.error('wrapper tags survived the strip — check app/index.html');
  process.exit(1);
}
if (!/<title>/i.test(html)) {
  console.error('no <title> in output — the artifact would be unnamed');
  process.exit(1);
}

writeFileSync(out, html);
console.log(`wrote ${out} (${html.length} bytes)`);
