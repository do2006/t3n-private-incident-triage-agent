import { describe, expect, it, vi } from 'vitest';
import * as bootstrapModule from '../src/t3n-bootstrap.js';

const address = '0x1234567890abcdef1234567890abcdef12345678';

describe('T3N API-key bootstrap', () => {
  it('builds an authenticated tenant client behind a verified trust anchor', async () => {
    const authenticate = vi.fn(async () => ({ toString: (): string => 'did:t3n:abc123' }));
    const handshake = vi.fn(async () => ({ authenticated: false }));
    const client = {
      handshake,
      authenticate,
      execute: vi.fn(async () => '{}'),
      executeWithBlob: vi.fn(async () => '{}'),
    };
    const tenantClient = { maps: { entrySet: vi.fn(), entryGet: vi.fn() } };
    const resolveTrustAnchor = vi.fn(async () => ({ expected_peer_ids: ['peer'] }));
    const loadWasm = vi.fn(async () => ({ wasm: true }));
    const ethGetAddress = vi.fn(() => address);
    const signHandler = vi.fn();
    const metamaskSign = vi.fn(() => signHandler);
    const createAuthInput = vi.fn(() => ({ method: 'ethereum', address }));
    const createClient = vi.fn(() => client);
    const createTenantClient = vi.fn(() => tenantClient);

    const result = await bootstrapModule.bootstrapT3nApiKeySession({
      environment: 'testnet',
      baseUrl: 'https://node.example/',
      apiKey: 'test-api-key-1234567890',
      sdk: {
        resolveTrustAnchor,
        loadWasm,
        ethGetAddress,
        metamaskSign,
        createAuthInput,
        createClient,
        createTenantClient,
      } as never,
    });

    expect(resolveTrustAnchor).toHaveBeenCalledWith({ environment: 'testnet', baseUrl: 'https://node.example' });
    expect(ethGetAddress).toHaveBeenCalledWith('test-api-key-1234567890');
    expect(handshake).toHaveBeenCalledTimes(1);
    expect(authenticate).toHaveBeenCalledWith({ method: 'ethereum', address });
    expect(result.did).toBe('did:t3n:abc123');
    expect(result.tenantClient).toBe(tenantClient);
    await expect(result.dependencies.identity.describe()).resolves.toEqual({
      runtime: 't3n',
      did: 'did:t3n:abc123',
      label: 'T3N agent',
    });
  });
});
