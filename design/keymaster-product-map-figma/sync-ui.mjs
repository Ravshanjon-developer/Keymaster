/**
 * Rebuild ui.html preload tags + SHOTS array from shots-manifest.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const shots = JSON.parse(fs.readFileSync(path.join(here, 'shots-manifest.json'), 'utf8'));
const uiPath = path.join(here, 'ui.html');
let html = fs.readFileSync(uiPath, 'utf8');
const imgs = shots
  .map((s, i) => `      <img id="shot-${i}" src="shots/${s.file}" alt="" width="1" height="1" />`)
  .join('\n');
html = html.replace(
  /<div id="preload">[\s\S]*?<\/div>/,
  `<div id="preload">\n${imgs}\n    </div>`,
);
html = html.replace(/const SHOTS = \[[\s\S]*?\];/, `const SHOTS = ${JSON.stringify(shots)};`);
fs.writeFileSync(uiPath, html);
console.log('synced ui.html shots', shots.length);
