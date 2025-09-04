// Protocol allowlist scaffold (SEC-04)
const allowed = new Set<string>();
export const registerAllowedProtocol = (proto: string) => {
  if (!proto) return; allowed.add(proto.replace(/:$/,''));
};
export const isProtocolAllowed = (url: string) => {
  try {
    const base = typeof window !== 'undefined' ? window.location.href : 'http://localhost';
    const u = new URL(url, base);
    return allowed.has(u.protocol.replace(/:$/,''));
  } catch { return false; }
};
export const listAllowedProtocols = () => Array.from(allowed);
