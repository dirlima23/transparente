import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('./', import.meta.url);
const read = name => readFile(new URL(name, root), 'utf8');
const [html, css, mask, app] = await Promise.all([
  read('index.html'), read('src/style.css'), read('src/mask.js'), read('src/app.js'),
]);
const output = html
  .replace('<link rel="stylesheet" href="/src/style.css">', () => `<style>${css}</style>`)
  .replace('<script type="module" src="/src/app.js"></script>', () => `<script>${mask.replace('export function', 'function')}\n${app.replace("import {makeMask} from './mask.js';", '')}</script>`)
  .replace('href="/" aria-label="Transparente início"', 'href="#" aria-label="Transparente início"');
await writeFile(new URL('transparente.html', root), output);
console.log('transparente.html gerado: abra diretamente no navegador, sem instalação.');
