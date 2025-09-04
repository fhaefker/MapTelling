import React from 'react';
import { render } from '@testing-library/react';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import { useRegisterProtocol, createTextProtocolHandler } from '../../utils/protocolTemplate';

// Mock fetch for security tests
const makeFetch = (text:string, size:number=text.length) => jest.fn().mockResolvedValue({ blob: () => Promise.resolve({ size, text: () => Promise.resolve(text) }) });

describe('protocolTemplate security', () => {
  beforeEach(()=>{ jest.resetModules(); });
  it('blocks oversized payload', async () => {
    (global as any).fetch = makeFetch('x'.repeat(10), 10_000_001);
    let error: any;
    const handler = createTextProtocolHandler({ maxBytes: 100 });
    try { await handler({ url: 'csv://example.com/data.csv' }); } catch(e:any){ error = e; }
    expect(error).toBeDefined();
    expect(String(error.message||error)).toMatch(/too large|Payload/i);
  });
  it('blocks disallowed url by pattern', async () => {
    (global as any).fetch = makeFetch('a,b\n1,2');
    let error:any;
    const handler = createTextProtocolHandler({ allowPattern: /allowed-host/ });
    try { await handler({ url: 'csv://evil.com/data.csv' }); } catch(e:any){ error = e; }
    expect(error).toBeDefined();
    expect(String(error.message||error)).toMatch(/Blocked/);
  });
  it('parses csv via transform override', async () => {
    (global as any).fetch = makeFetch('h1,h2\n1,2');
    const handler = createTextProtocolHandler({ transform: async (raw)=>({ rows: raw.split(/\n/).length }) });
    const res = await handler({ url: 'csv://allowed-host/data.csv' });
    expect(res.data.rows).toBe(2);
  });
  it('defaults to text when no transform', async () => {
    (global as any).fetch = makeFetch('hello');
    const handler = createTextProtocolHandler();
    const res = await handler({ url: 'csv://allowed-host/data.csv' });
    expect(res.data.text).toBe('hello');
  });
});
