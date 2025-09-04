#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
try {
  execSync('vite build', { stdio: 'ignore' });
  const getDirSize = dir => execSync(`du -sb ${dir}`).toString().split('\t')[0];
  const distSize = Number(getDirSize('dist'));
  const kb = (distSize/1024).toFixed(1);
  const summary = { distBytes: distSize, distKB: kb, timestamp: new Date().toISOString() };
  fs.writeFileSync('dist-size.json', JSON.stringify(summary, null, 2));
  console.log('[bundle-size]', summary);
} catch (e) {
  console.error('Bundle size script failed', e);
  process.exit(1);
}
