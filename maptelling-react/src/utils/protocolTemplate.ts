/**
 * protocolTemplate.ts
 * Boilerplate helper to register a custom data protocol (Proposal #5).
 * Shows canonical shape, validation & abort support.
 */
import { useAddProtocol } from '@mapcomponents/react-maplibre';

export interface ProtocolHandlerOptions {
  /** Maximum payload size in bytes (approx) before abort */
  maxBytes?: number;
  /** Regex allowlist for URL host/path if needed */
  allowPattern?: RegExp;
  /** Optional transform pipeline override */
  transform?: (raw: string, params: URLSearchParams) => Promise<any> | any;
}

/** Lightweight CSV/TSV parser (no quotes escape handling beyond basic split) */
export const parseDelimited = (raw: string, delimiter: string) => {
  const lines = raw.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const header = lines[0].split(delimiter).map(h => h.trim());
  return lines.slice(1).filter(l => l).map(line => {
    const cells = line.split(delimiter);
    const obj: Record<string, any> = {};
    header.forEach((h, i) => { obj[h] = cells[i] !== undefined ? cells[i].trim() : ''; });
    return obj;
  });
};

export const csvOrTsvTransform = async (raw: string, params: URLSearchParams) => {
  const format = (params.get('format') || 'csv').toLowerCase();
  const delim = format === 'tsv' ? '\t' : ',';
  return parseDelimited(raw, delim);
};

export const createTextProtocolHandler = (opts: ProtocolHandlerOptions = {}) => {
  const { maxBytes = 5_000_000, allowPattern, transform } = opts;
  return async function handler(request: any) {
    const url = request.url as string;
    // MapLibre passes e.g. csv://... full string
    const parsed = new URL(url.replace(/^(\w+):\/\//, 'https://')); // temp scheme swap for parsing
    if (allowPattern && !allowPattern.test(parsed.href)) {
      throw new Error('Blocked by allowPattern');
    }
    const res = await fetch(parsed.href);
    const blob = await res.blob();
    if (blob.size > maxBytes) throw new Error('Payload too large');
    const text = await blob.text();
    const qs = parsed.searchParams;
  const out = transform ? await transform(text, qs) : { text };
  return { data: out };
  };
};

export interface UseRegisterProtocolParams {
  scheme: string; // e.g. 'csv'
  handler: (request: any) => Promise<{ data: any }>;
}

export const useRegisterProtocol = ({ scheme, handler }: UseRegisterProtocolParams) => {
  // Cast for test/mock compatibility; upstream hook accepts { scheme, handler }
  (useAddProtocol as any)({ scheme, handler });
};

export default useRegisterProtocol;
