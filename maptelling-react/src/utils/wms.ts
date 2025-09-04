// Simple WMS Capabilities fetch & parse (limited scope for OSM demo)
// Not a full XML parser; we rely on DOMParser in browser, fallback to regexp in non-DOM env.
export interface ParsedWmsCapabilities {
  layers: string[];
}

export async function fetchWmsCapabilities(baseUrl: string, version: '1.1.1' | '1.3.0'): Promise<ParsedWmsCapabilities | null> {
  try {
    const url = `${baseUrl}service=WMS&request=GetCapabilities&version=${version}`;
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const text = await res.text();
    return parseWmsCapabilities(text);
  } catch {
    return null;
  }
}

export function parseWmsCapabilities(xml: string): ParsedWmsCapabilities | null {
  let layerNames: string[] = [];
  if (typeof window !== 'undefined' && typeof (window as any).DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const layers = Array.from(doc.getElementsByTagName('Layer'));
      for (const l of layers) {
        const nameEl = l.getElementsByTagName('Name')[0];
        const titleEl = l.getElementsByTagName('Title')[0];
        if (nameEl && nameEl.textContent) {
          const name = nameEl.textContent.trim();
          // Skip parent Layer elements lacking a Title or representing group only
          if (name) layerNames.push(name);
        } else if (titleEl && !nameEl) {
          // Some group layers may have title but no name; ignore
        }
      }
    } catch {
      // fallback to regex below
    }
  }
  if (!layerNames.length) {
    // Very naive regex fallback: capture <Name>...</Name>
    const regex = /<Name>([^<]+)<\/Name>/g; let m: RegExpExecArray | null;
    while ((m = regex.exec(xml)) !== null) {
      layerNames.push(m[1].trim());
    }
  }
  // Deduplicate preserving order
  const seen = new Set<string>();
  layerNames = layerNames.filter(n => { if (seen.has(n)) return false; seen.add(n); return true; });
  return { layers: layerNames };
}

export function chooseOsmLayer(caps: ParsedWmsCapabilities, preferred: string[]): string {
  for (const p of preferred) {
    if (caps.layers.includes(p)) return p;
  }
  // fallback: first layer containing 'osm'
  const alt = caps.layers.find(l => /osm/i.test(l));
  return alt || preferred[0];
}
