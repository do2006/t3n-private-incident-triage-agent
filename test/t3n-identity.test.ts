import { describe, expect, it, vi } from 'vitest';
import { T3nAgentIdentity } from '../src/adapters/t3n.js';

describe('T3N authenticated identity', () => {
  it('uses a resolved session DID without calling keyed discovery', async () => {
    const discover = vi.fn(async () => ({ did: 'did:t3n:wrong', organisations: [] }));
    const identity = new T3nAgentIdentity({
      baseUrl: 'https://node.example',
      did: 'did:t3n:session123',
      discover,
    } as never);

    await expect(identity.describe()).resolves.toEqual({
      runtime: 't3n',
      did: 'did:t3n:session123',
      label: 'T3N agent',
    });
    expect(discover).not.toHaveBeenCalled();
  });
});
