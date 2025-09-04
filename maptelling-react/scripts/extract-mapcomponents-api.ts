#!/usr/bin/env ts-node
/**
 * API Extraction Script (Initial Skeleton)
 * Goal: Parse installed @mapcomponents/react-maplibre type declarations and
 * produce machine + human readable summaries.
 */
import { Project, Symbol as MorphSymbol, InterfaceDeclaration, Type } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

interface PropEntry { name: string; type: string; optional: boolean; description?: string; }
interface ComponentEntry { name: string; kind: 'component'|'hook'|'utility'|'type'|'const'; props?: PropEntry[]; description?: string; raw?: string; }

const pkg = '@mapcomponents/react-maplibre';

function isProbablyComponent(name: string) { return /^[A-Z]/.test(name) && !name.startsWith('use'); }
function isHook(name: string) { return /^use[A-Z0-9].+/.test(name); }

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  compilerOptions: { allowJs: false, declaration: true }
});

// Locate d.ts entry points
const baseDir = path.dirname(require.resolve(`${pkg}/package.json`));
const typeRoot = baseDir; // assume declarations are collocated

function addDtsFiles(dir: string) {
  const entries = fs.readdirSync(dir);
  for (const e of entries) {
    const full = path.join(dir, e);
    if (fs.statSync(full).isDirectory()) { addDtsFiles(full); continue; }
    if (e.endsWith('.d.ts')) project.addSourceFileAtPath(full);
  }
}
addDtsFiles(typeRoot);

const sourceFiles = project.getSourceFiles();
const exportMap: Record<string, ComponentEntry> = {};

for (const sf of sourceFiles) {
  sf.getExportSymbols().forEach(sym => {
    const name = sym.getName();
    if (exportMap[name]) return; // de-dupe
    const decl = sym.getDeclarations()[0];
    const entry: ComponentEntry = { name, kind: 'utility' };

    if (isHook(name)) entry.kind = 'hook';
    else if (isProbablyComponent(name)) entry.kind = 'component';

    // Try to derive props for components (React.FC<Props>)
    try {
      const type = sym.getDeclaredType();
      if (entry.kind === 'component') {
        const callSigs = type.getCallSignatures();
        if (callSigs.length) {
          const params = callSigs[0].getParameters();
          if (params.length) {
            const paramType = params[0].getTypeAtLocation(params[0].getDeclarations()[0]);
            const props: PropEntry[] = [];
            paramType.getProperties().forEach(p => {
              const decls = p.getDeclarations();
              const d = decls[0];
              const t = p.getDeclaredType();
              const optional = (d as any).hasQuestionToken?.();
              let description = '';
              const jsDocs = (d as any).getJsDocs?.() || [];
              if (jsDocs.length) description = jsDocs.map((j: any)=>j.getComment()).filter(Boolean).join('\n');
              props.push({ name: p.getName(), type: t.getText(), optional: !!optional, description });
            });
            entry.props = props;
          }
        }
      }
      // Acquire JSDoc on primary declaration
      const jsDocs = (decl as any).getJsDocs?.() || [];
      if (jsDocs.length) entry.description = jsDocs.map((j: any)=>j.getComment()).filter(Boolean).join('\n');
      entry.raw = type.getText();
    } catch (err) {
      entry.description = (entry.description || '') + '\n(Extraction error: ' + (err as Error).message + ')';
    }

    exportMap[name] = entry;
  });
}

// Categorize & Sort
const entries = Object.values(exportMap).sort((a,b)=>a.name.localeCompare(b.name));

// Output JSON
const outDir = path.resolve(process.cwd(), 'docs/generated');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'mapcomponents-api.json'), JSON.stringify(entries, null, 2), 'utf8');

// Output Markdown
let md = '# MapComponents API (Automatisch extrahiert)\n\n';
md += `Generiert: ${new Date().toISOString()}  \nQuelle: ${pkg}\n\n`;

const groups: Record<string, ComponentEntry[]> = { component: [], hook: [], utility: [], type: [], const: [] };
entries.forEach(e => groups[e.kind].push(e));

function section(title: string, kind: keyof typeof groups) {
  if (!groups[kind].length) return; 
  md += `## ${title}\n\n`;
  groups[kind].forEach(e => {
    md += `### ${e.name}\n`;
    if (e.description) md += e.description + '\n\n';
    if (e.props && e.props.length) {
      md += '| Prop | Typ | Optional | Beschreibung |\n|------|-----|----------|--------------|\n';
      e.props.forEach(p => {
        md += `| ${p.name} | \`${p.type}\` | ${p.optional ? 'ja':'nein'} | ${(p.description||'').replace(/\n/g,' ')} |\n`;
      });
      md += '\n';
    }
  });
}

section('Komponenten', 'component');
section('Hooks', 'hook');
section('Utilities', 'utility');

fs.writeFileSync(path.join(outDir, 'mapcomponents-api.md'), md, 'utf8');

console.log('API extraction completed:', {
  components: groups.component.length,
  hooks: groups.hook.length,
  utilities: groups.utility.length
});
