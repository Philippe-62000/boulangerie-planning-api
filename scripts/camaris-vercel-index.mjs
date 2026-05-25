import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'deploy-camaris-vercel');
const buildId = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
const src = path.join(root, 'camaris-semaine-standalone.html');
const dest = path.join(root, 'index.html');

const vercelConfig = {
  framework: null,
  installCommand: 'npm install',
  buildCommand: '',
  outputDirectory: '.',
  rewrites: [{ source: '/((?!api/).*)', destination: '/index.html' }],
  headers: [
    {
      source: '/index.html',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }]
    },
    {
      source: '/static/(.*)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
    }
  ]
};

if (!fs.existsSync(src)) {
  console.error('Build Camaris Vercel : fichier source absent', src);
  process.exit(1);
}
let html = fs.readFileSync(src, 'utf8');
if (!html.includes('camaris-build-id')) {
  html = html.replace(
    '<head>',
    `<head>\n    <meta name="camaris-build-id" content="${buildId}" />`
  );
}
fs.writeFileSync(dest, html);
fs.writeFileSync(path.join(root, 'vercel.json'), `${JSON.stringify(vercelConfig, null, 2)}\n`);
console.log('index.html + vercel.json prêts pour Vercel');
