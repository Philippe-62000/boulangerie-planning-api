import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'deploy-camaris-vercel');
const src = path.join(root, 'camaris-semaine-standalone.html');
const dest = path.join(root, 'index.html');

const vercelConfig = {
  rewrites: [{ source: '/(.*)', destination: '/index.html' }],
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
fs.copyFileSync(src, dest);
fs.writeFileSync(path.join(root, 'vercel.json'), `${JSON.stringify(vercelConfig, null, 2)}\n`);
console.log('index.html + vercel.json prêts pour Vercel');
