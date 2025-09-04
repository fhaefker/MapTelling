#!/usr/bin/env ts-node
/**
 * API Extraction Script (Initial Skeleton)
 * Goal: Parse installed @mapcomponents/react-maplibre type declarations and
 * produce machine + human readable summaries.
 */
import { Project } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

interface PropEntry { name: string; type: string; optional: boolean; description?: string; deprecated?: boolean }
interface ComponentEntry { name: string; kind: 'component'|'hook'|'utility'|'type'|'const'|'style'|'context'; props?: PropEntry[]; description?: string; raw?: string; deprecated?: boolean }

const pkg = '@mapcomponents/react-maplibre';

// Basic deny/allow lists (can evolve)
const denyList = new Set<string>([
  'default', // synthetic
]);
// Optionally force kind overrides
const styleSuffix = 'Style';

// Marker classification helpers
function classifyKind(name: string, current: ComponentEntry['kind']): ComponentEntry['kind'] {
  if (isHook(name)) return 'hook';
  if (isProbablyComponent(name)) return 'component';
  if (name.endsWith(styleSuffix)) return 'style';
  if (/Context$/.test(name)) return 'context';
  return current;
}

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
    if (denyList.has(name)) return;
    const decl = sym.getDeclarations()[0];
    const entry: ComponentEntry = { name, kind: classifyKind(name,'utility') };

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
        const deprecated = /@deprecated/i.test(description);
        props.push({ name: p.getName(), type: simplifyType(t.getText()), optional: !!optional, description, deprecated });
            });
            entry.props = props;
          }
        }
      }
      // Acquire JSDoc on primary declaration
      const jsDocs = (decl as any).getJsDocs?.() || [];
      if (jsDocs.length) entry.description = jsDocs.map((j: any)=>j.getComment()).filter(Boolean).join('\n');
      entry.raw = type.getText();
      entry.deprecated = /@deprecated/i.test(entry.description || '');
    } catch (err) {
      entry.description = (entry.description || '') + '\n(Extraction error: ' + (err as Error).message + ')';
    }

    exportMap[name] = entry;
  });
}

// Categorize & Sort
const entries = Object.values(exportMap).sort((a,b)=>a.name.localeCompare(b.name));

// Output JSON & meta
const outDir = path.resolve(process.cwd(), 'docs/generated');
fs.mkdirSync(outDir, { recursive: true });
const jsonString = JSON.stringify(entries, null, 2);
fs.writeFileSync(path.join(outDir, 'mapcomponents-api.json'), jsonString, 'utf8');
const hash = createHash('sha256').update(jsonString).digest('hex');

const counts = entries.reduce((acc, e) => { acc[e.kind] = (acc[e.kind]||0)+1; return acc; }, {} as Record<string, number>);
fs.writeFileSync(path.join(outDir, 'mapcomponents-api.meta.json'), JSON.stringify({ hash, generated: new Date().toISOString(), counts }, null, 2));

// Output Markdown
let md = '# MapComponents API (Automatisch extrahiert)\n\n';
md += `Generiert: ${new Date().toISOString()}  \nQuelle: ${pkg}\n\n`;

const groups: Record<string, ComponentEntry[]> = { component: [], hook: [], utility: [], type: [], const: [], style: [], context: [] };
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
section('Styles', 'style');
section('Contexts', 'context');

// Generate condensed prop matrix for core components
const coreComponentNames = ['MapLibreMap','MlGeoJsonLayer'];
let matrix = '# Core Component Prop Matrix\n\n| Component | Prop | Type | Optional | Deprecated | Description |\n|-----------|------|------|----------|------------|-------------|\n';
entries.filter(e=>coreComponentNames.includes(e.name) && e.props).forEach(e => {
  e.props!.forEach(p => {
    matrix += `| ${e.name} | ${p.name} | \`${p.type}\` | ${p.optional?'yes':'no'} | ${p.deprecated?'yes':'no'} | ${(p.description||'').split(/\n/)[0]} |\n`;
  });
});
fs.writeFileSync(path.join(outDir,'mapcomponents-prop-matrix.md'), matrix, 'utf8');

// Deprecation report
const deprecatedLines: string[] = [];
entries.forEach(e => {
  if (e.deprecated) {
    deprecatedLines.push(`- Component ${e.name} (deprecated)`);
  }
  if (e.props) {
    e.props.filter(p=>p.deprecated).forEach(p=>{
      deprecatedLines.push(`- ${e.name}.${p.name} (prop deprecated)`);
    });
  }
});
if (deprecatedLines.length) {
  fs.writeFileSync(path.join(outDir,'mapcomponents-deprecations.md'), '# Deprecated API Elements\n\n' + deprecatedLines.join('\n') + '\n','utf8');
}

// Insert/update summary markers in capabilities doc if present
const capabilitiesPath = path.resolve(process.cwd(),'../MAPCOMPONENTS_CAPABILITIES.md');
if (fs.existsSync(capabilitiesPath)) {
  let doc = fs.readFileSync(capabilitiesPath,'utf8');
  const markerStart = '<!-- API_SURFACE_SUMMARY_START -->';
  const markerEnd = '<!-- API_SURFACE_SUMMARY_END -->';
  const summary = `API Surface Hash: \`${hash.slice(0,12)}\`  | Components: ${groups.component.length} | Hooks: ${groups.hook.length} | Utilities: ${groups.utility.length} | Styles: ${groups.style.length} | Contexts: ${groups.context.length}`;
  if (doc.includes(markerStart) && doc.includes(markerEnd)) {
    doc = doc.replace(new RegExp(`${markerStart}[\s\S]*?${markerEnd}`,'m'), `${markerStart}\n${summary}\n${markerEnd}`);
    fs.writeFileSync(capabilitiesPath, doc,'utf8');
  }
}

fs.writeFileSync(path.join(outDir, 'mapcomponents-api.md'), md, 'utf8');

console.log('API extraction completed:', {
  hash: hash.slice(0,12),
  components: groups.component.length,
  hooks: groups.hook.length,
  utilities: groups.utility.length
});

// Utility: simplify noisy type strings
function simplifyType(t: string): string {
  return t
    .replace(/import\([^)]*\)\./g,'')
    .replace(/\s+/g,' ')
    .replace(/Readonly</g,'')
    .replace(/>;/g,'>')
    .trim();
}
