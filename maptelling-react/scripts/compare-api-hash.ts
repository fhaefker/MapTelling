import fs from 'fs';
import path from 'path';

// Compares newly generated API hash with stored baseline (api-hash.baseline) and exits non-zero on drift.

const docsDir = path.join(process.cwd(), 'docs/generated');
const metaPath = path.join(docsDir, 'mapcomponents-api.meta.json');
if(!fs.existsSync(metaPath)) {
  console.error('Meta file not found. Run npm run extract:api first.');
  process.exit(2);
}
const meta = JSON.parse(fs.readFileSync(metaPath,'utf8'));
const currentHash: string = meta.hash;
const baselinePath = path.join(docsDir, 'api-hash.baseline');
let baseline: string | null = null;
if (fs.existsSync(baselinePath)) baseline = fs.readFileSync(baselinePath,'utf8').trim();

if (!baseline) {
  fs.writeFileSync(baselinePath, currentHash,'utf8');
  console.log('Baseline created:', currentHash.slice(0,12));
  process.exit(0);
}

if (baseline !== currentHash) {
  console.error('API HASH DRIFT DETECTED');
  console.error('Baseline:', baseline.slice(0,12));
  console.error('Current :', currentHash.slice(0,12));
  process.exit(1);
}
console.log('API hash unchanged:', currentHash.slice(0,12));
process.exit(0);
