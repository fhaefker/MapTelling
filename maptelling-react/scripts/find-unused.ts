import { Project } from 'ts-morph';
import path from 'path';
import fs from 'fs';

// Simple heuristic unused TS/TSX finder (does not follow dynamic imports)
const project = new Project({ tsConfigFilePath: path.join(__dirname, '..', 'tsconfig.json') });
const srcDir = path.join(__dirname, '..', 'src');
const allFiles = project.getSourceFiles().filter(f => f.getFilePath().includes('/src/'));
const entryPoints = [
  path.join(srcDir, 'index.tsx'),
  path.join(srcDir, 'App.tsx'),
  path.join(srcDir, 'layout', 'MapShell.tsx')
].filter(fs.existsSync);

// mark reachable
const reachable = new Set<string>();
function dfs(filePath: string) {
  if (reachable.has(filePath)) return;
  reachable.add(filePath);
  const sf = project.getSourceFile(filePath);
  if (!sf) return;
  sf.getImportDeclarations().forEach(imp => {
    const resolved = imp.getModuleSpecifierSourceFile();
    if (resolved) dfs(resolved.getFilePath());
  });
}
entryPoints.forEach(dfs);

// Simple allowlist patterns (test utilities, i18n, hooks, utils likely imported indirectly)
const allowlist = [/hooks\//, /utils\//, /i18n\//, /theme\//, /workers\//, /context\//, /config\//];

const unused = allFiles
  .map(f => f.getFilePath())
  .filter(p => !p.endsWith('.d.ts'))
  .filter(p => !reachable.has(p))
  .filter(p => !/\.test\./.test(p))
  .filter(p => !/setupTests\.ts$/.test(p));

const filtered = unused.filter(p => !allowlist.some(r => r.test(p)));

if (filtered.length) {
  console.log('Potentially unused files:');
  filtered.forEach(f => console.log(' -', path.relative(srcDir, f)));
  process.exitCode = 1;
} else {
  console.log('No unused files detected.');
}