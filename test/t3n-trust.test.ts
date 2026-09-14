import { describe, expect, it, vi } from 'vitest';
import * as t3nAdapter from '../src/adapters/t3n.js';

type Preflight = (manifest: unknown, environment: string) => void;
type Resolve = (options: Record<string, unknown>) => Promise<unknown>;

const currentManifest = {
  cluster: 'testnet',
  version: 1787800422,
  peer_ids: ['peer'],
  rtmr3_allowlist: ['rtmr3'],
  rtmr1_allowlist: ['rtmr1'],
  signed_at: '2026-09-13T00:00:00Z',
  signature: '00',
};

describe('T3N trust-manifest preflight', () => {
  it('rejects a legacy manifest that omits RTMR1', () => {
    const preflight = (t3nAdapter as unknown as { preflightT3nTrustManifest?: Preflight })
      .preflightT3nTrustManifest;
    expect(typeof preflight).toBe('function');
    if (!preflight) return;
    expect(() => preflight({ ...currentManifest, rtmr1_allowlist: undefined }, 'testnet'))
      .toThrow(/rtmr1_allowlist/i);
  });

  it('preflights the live document, then delegates to SDK verification', async () => {
    const resolve = (t3nAdapter as unknown as { resolveVerifiedT3nTrustAnchor?: Resolve })
      .resolveVerifiedT3nTrustAnchor;
    expect(typeof resolve).toBe('function');
    if (!resolve) return;
    const fetchFn = vi.fn(async () => ({ ok: true, status: 200, json: async () => currentManifest }));
    const trustedAnchor = { expected_peer_ids: ['peer'] };
    const fetchTrustedManifestFn = vi.fn(async () => trustedAnchor);

    await expect(resolve({
      environment: 'testnet',
      baseUrl: 'https://node.example',
      fetchFn,
      fetchTrustedManifestFn,
    })).resolves.toEqual(trustedAnchor);
    expect(fetchFn).toHaveBeenCalledWith('https://node.example/api/trust-manifest');
    expect(fetchTrustedManifestFn).toHaveBeenCalledWith('testnet', { baseUrl: 'https://node.example' });
  });
});
