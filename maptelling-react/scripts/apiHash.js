// apiHash.js
// Script to compute a hash of all exported symbols/types from src/components and src/hooks for drift detection.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getFiles(dir, ext) {
  let files = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) files = files.concat(getFiles(full, ext));
    else if (full.endsWith(ext)) files.push(full);
  }
  return files;
}

function extractExports(file) {
  const src = fs.readFileSync(file, 'utf8');
  // crude: match export (default|const|function|class|interface|type) ...
  return Array.from(src.matchAll(/export\s+(default|const|function|class|interface|type)\s+([\w]+)/g)).map(m => m[2]);
}

function main() {
  const baseDirs = ['src/components', 'src/hooks'];
  let allExports = [];
  for (const dir of baseDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const file of getFiles(dir, '.ts')) {
      allExports = allExports.concat(extractExports(file).map(e => `${dir.replace('src/','')}/${path.basename(file)}:${e}`));
    }
    for (const file of getFiles(dir, '.tsx')) {
      allExports = allExports.concat(extractExports(file).map(e => `${dir.replace('src/','')}/${path.basename(file)}:${e}`));
    }
  }
  allExports.sort();
  const hash = crypto.createHash('sha256').update(allExports.join('\n')).digest('hex');
  fs.writeFileSync('API_HASH.txt', hash + '\n' + allExports.join('\n'));
  console.log('API hash:', hash);
}

if (require.main === module) main();
