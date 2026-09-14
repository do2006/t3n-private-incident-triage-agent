import { describe, expect, it, vi } from 'vitest';
import { T3nPrivateStore } from '../src/adapters/t3n.js';

describe('T3N private-store provisioning', () => {
  it('creates an absent private map before the first write', async () => {
    const values = new Map<string, string>();
    let status = 'absent';
    const maps = {
      getStatus: vi.fn(async () => status),
      create: vi.fn(async () => { status = 'active'; }),
      entrySet: vi.fn(async (_tail: string, key: string, value: string) => { values.set(key, value); }),
      entryGet: vi.fn(async (_tail: string, key: string) => values.get(key) ?? null),
    };
    const store = new T3nPrivateStore({ maps: maps as never, mapTail: 'incident-triage-private' });

    await store.put('incident:1', { severity: 'high' });

    expect(maps.create).toHaveBeenCalledWith({
      tail: 'incident-triage-private',
      visibility: 'private',
      writers: 'all',
      readers: 'all',
    });
    expect(maps.entrySet).toHaveBeenCalledTimes(1);
  });

  it('provisions only once across multiple writes', async () => {
    const maps = {
      getStatus: vi.fn(async () => 'active'),
      create: vi.fn(async () => undefined),
      entrySet: vi.fn(async () => undefined),
      entryGet: vi.fn(async () => null),
    };
    const store = new T3nPrivateStore({ maps: maps as never, mapTail: 'incident-triage-private' });
    await store.put('a', 1);
    await store.put('b', 2);
    expect(maps.getStatus).toHaveBeenCalledTimes(1);
  });
});
