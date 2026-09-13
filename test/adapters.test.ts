import { describe, expect, it, vi } from 'vitest';
import { MemoryStore } from '../src/adapters/memory-store.js';
import { CisaKevClient, fetchAllowlistedJson } from '../src/adapters/cisa-kev.js';
import { T3nAgentIdentity, T3nPrivateStore } from '../src/adapters/t3n.js';

describe('secure adapters', () => {
  it('round-trips private values in memory', async () => {
    const store = new MemoryStore();
    await store.put('incident:1', { secret: 'redacted' });
    expect(await store.get('incident:1')).toEqual({ secret: 'redacted' });
  });

  it('blocks outbound hosts that are not allowlisted', async () => {
    const fakeFetch = vi.fn();
    await expect(fetchAllowlistedJson('https://example.com/x', ['www.cisa.gov'], fakeFetch as never))
      .rejects.toThrow(/not allowlisted/i);
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it('parses CISA KEV data using only CVE identifiers', async () => {
    const fakeFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ vulnerabilities: [{ cveID: 'CVE-2026-1234', vulnerabilityName: 'Example' }] }),
    }));
    const client = new CisaKevClient({ fetchFn: fakeFetch as never });
    const rows = await client.lookupCves(['CVE-2026-1234', 'CVE-2026-9999']);
    expect(rows.map((row) => row.knownExploited)).toEqual([true, false]);
  });
});

describe('T3N adapters', () => {
  it('writes and reads JSON through tenant map entry APIs', async () => {
    const values = new Map<string, string>();
    const maps = {
      entrySet: vi.fn(async (_tail: string, key: string, value: string) => { values.set(key, value); }),
      entryGet: vi.fn(async (_tail: string, key: string) => values.get(key) ?? null),
      create: vi.fn(async () => undefined),
      getStatus: vi.fn(async () => 'active'),
    };
    const store = new T3nPrivateStore({ maps: maps as never, mapTail: 'incident-triage-private' });
    await store.put('incident:42', { severity: 'high' });
    expect(await store.get('incident:42')).toEqual({ severity: 'high' });
  });

  it('resolves the agent DID without exposing the API key', async () => {
    const discover = vi.fn(async () => ({ did: 'did:t3n:abc123', organisations: [] }));
    const identity = new T3nAgentIdentity({ baseUrl: 'https://node.example', apiKey: 't3n_key_secret', discover: discover as never });
    expect(await identity.describe()).toEqual({ runtime: 't3n', did: 'did:t3n:abc123', label: 'T3N agent' });
    expect(JSON.stringify(await identity.describe())).not.toContain('t3n_key_secret');
  });

  it('does not echo stored secrets when T3N storage fails', async () => {
    const maps = { entrySet: vi.fn(async () => { throw new Error('backend failure'); }) };
    const store = new T3nPrivateStore({ maps: maps as never, mapTail: 'incident-triage-private' });
    await expect(store.put('x', { password: 'SUPER-SECRET' })).rejects.toThrow('T3N private store write failed');
    await expect(store.put('x', { password: 'SUPER-SECRET' })).rejects.not.toThrow(/SUPER-SECRET/);
  });
});