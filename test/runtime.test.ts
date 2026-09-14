import { describe, expect, it, vi } from 'vitest';
import { createT3nDependencies } from '../src/runtime.js';

describe('T3N runtime dependency factory', () => {
  it('binds a pre-authenticated DID without requiring keyed discovery', async () => {
    const tenantClient = {
      maps: {
        entrySet: vi.fn(async () => undefined),
        entryGet: vi.fn(async () => null),
      },
    };
    const deps = createT3nDependencies({
      tenantClient,
      baseUrl: 'https://node.example',
      did: 'did:t3n:session123',
    } as never);

    await expect(deps.identity.describe()).resolves.toEqual({
      runtime: 't3n',
      did: 'did:t3n:session123',
      label: 'T3N agent',
    });
  });
});
