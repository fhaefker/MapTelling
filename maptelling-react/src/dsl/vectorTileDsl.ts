// Vector Tile DSL Prototype (LT-03) – minimal schema & validator.
// Goal: Provide typed structure to describe style layers decoupled from raw MapLibre style JSON.

export type DslLayerType = 'line' | 'fill' | 'symbol' | 'circle';

export interface DslLayerBase {
  id: string;
  type: DslLayerType;
  source: string;          // source id
  sourceLayer?: string;    // vector source layer
  filter?: any[];          // MapLibre style filter syntax
  minzoom?: number;
  maxzoom?: number;
  paint?: Record<string, any>;
  layout?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface DslSpec {
  version: 1;
  name?: string;
  sources: Record<string, any>; // Forward-compatible: MapLibre style source objects
  layers: DslLayerBase[];
}

export interface DslValidationIssue { level: 'error' | 'warn'; message: string; layerId?: string; }

export function validateDsl(spec: unknown): { ok: boolean; issues: DslValidationIssue[] } {
  const issues: DslValidationIssue[] = [];
  const push = (i: DslValidationIssue) => issues.push(i);
  if (!spec || typeof spec !== 'object') return { ok: false, issues: [{ level: 'error', message: 'Spec must be object' }] };
  const s = spec as DslSpec;
  if ((s as any).version !== 1) push({ level: 'error', message: 'version must be 1' });
  if (!s.sources || typeof s.sources !== 'object') push({ level: 'error', message: 'sources missing' });
  if (!Array.isArray(s.layers)) push({ level: 'error', message: 'layers must be array' });
  else {
    const ids = new Set<string>();
    s.layers.forEach(l => {
      if (!l.id) push({ level: 'error', message: 'layer id missing' });
      else if (ids.has(l.id)) push({ level: 'error', message: 'duplicate layer id', layerId: l.id });
      else ids.add(l.id);
      if (!l.type) push({ level: 'error', message: 'layer type missing', layerId: l.id });
      else if (!['line','fill','symbol','circle'].includes(l.type)) push({ level: 'error', message: 'unsupported layer type', layerId: l.id });
      if (!l.source) push({ level: 'error', message: 'layer source missing', layerId: l.id });
      if (l.minzoom && l.maxzoom && l.minzoom > l.maxzoom) push({ level: 'warn', message: 'minzoom > maxzoom', layerId: l.id });
    });
  }
  return { ok: !issues.some(i => i.level === 'error'), issues };
}

// Convert DSL spec to partial MapLibre style fragment (no sprite/glyphs handled)
export function dslToStyle(spec: DslSpec): { version: 8; sources: any; layers: any[] } {
  const { ok, issues } = validateDsl(spec);
  if (!ok) throw new Error('Invalid DSL: ' + issues.map(i => i.message).join('; '));
  return {
    version: 8,
    sources: spec.sources,
    layers: spec.layers.map(l => ({
      id: l.id,
      type: l.type,
      source: l.source,
      'source-layer': l.sourceLayer,
      filter: l.filter,
      minzoom: l.minzoom,
      maxzoom: l.maxzoom,
      paint: l.paint,
      layout: l.layout,
      metadata: { ...(l.metadata || {}), dsl: true },
    })),
  };
}
