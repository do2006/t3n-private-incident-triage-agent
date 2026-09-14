import { discoverWhoami, fetchTrustedManifest, type DiscoverOptions, type WhoamiResult } from '@terminal3/t3n-sdk';
import type { AgentIdentity, AgentIdentityDescription, PrivateStore } from '../domain/ports.js';

type MapsPort = {
  entrySet(tail: string, key: string, value: string): Promise<void>;
  entryGet(tail: string, key: string): Promise<string | null>;
  create?(input: { tail: string; visibility: string; writers: 'all'; readers: 'all' }): Promise<unknown>;
  getStatus?(tail: string): Promise<string>;
};

type DiscoverWhoami = (opts: DiscoverOptions) => Promise<WhoamiResult>;

export function preflightT3nTrustManifest(manifest: unknown, environment: string): void {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error(`T3N ${environment} trust manifest is not a JSON object`);
  }
  const rtmr1 = (manifest as Record<string, unknown>).rtmr1_allowlist;
  if (!Array.isArray(rtmr1) || rtmr1.length === 0 || rtmr1.some((value) => typeof value !== 'string' || value.length === 0)) {
    throw new Error(`T3N ${environment} trust manifest is missing a non-empty rtmr1_allowlist required by the current SDK; refusing to bypass attestation`);
  }
}

type T3nEnvironment = 'sandbox' | 'testnet' | 'production';
type ManifestFetch = (url: string) => Promise<{ ok: boolean; status?: number; json(): Promise<unknown> }>;
type TrustedManifestFetcher = (
  environment: T3nEnvironment,
  options: { baseUrl: string },
) => ReturnType<typeof fetchTrustedManifest>;

export async function resolveVerifiedT3nTrustAnchor(options: {
  environment: T3nEnvironment;
  baseUrl: string;
  fetchFn?: ManifestFetch;
  fetchTrustedManifestFn?: TrustedManifestFetcher;
}): Promise<Awaited<ReturnType<typeof fetchTrustedManifest>>> {
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  const response = await (options.fetchFn ?? fetch)(`${baseUrl}/api/trust-manifest`);
  if (!response.ok) throw new Error(`T3N ${options.environment} trust manifest preflight failed with HTTP ${response.status ?? 'error'}`);
  preflightT3nTrustManifest(await response.json(), options.environment);
  return (options.fetchTrustedManifestFn ?? fetchTrustedManifest)(options.environment, { baseUrl });
}

export class T3nPrivateStore implements PrivateStore {
  private provisionPromise?: Promise<void>;

  constructor(private readonly options: { maps: MapsPort; mapTail: string }) {}

  private ensureProvisioned(): Promise<void> {
    if (!this.provisionPromise) {
      this.provisionPromise = this.provision().catch((error: unknown) => {
        this.provisionPromise = undefined;
        throw error;
      });
    }
    return this.provisionPromise;
  }

  async provision(): Promise<void> {
    if (!this.options.maps.create || !this.options.maps.getStatus) return;
    const status = await this.options.maps.getStatus(this.options.mapTail);
    if (status === 'active') return;
    if (status !== 'absent') throw new Error(`T3N private map is not ready: ${status}`);
    await this.options.maps.create({
      tail: this.options.mapTail,
      visibility: 'private',
      writers: 'all',
      readers: 'all',
    });
  }

  async put(key: string, value: unknown): Promise<void> {
    try {
      await this.ensureProvisioned();
      await this.options.maps.entrySet(this.options.mapTail, key, JSON.stringify(value));
    } catch {
      throw new Error('T3N private store write failed');
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      await this.ensureProvisioned();
      const value = await this.options.maps.entryGet(this.options.mapTail, key);
      return value === null ? undefined : JSON.parse(value) as T;
    } catch {
      throw new Error('T3N private store read failed');
    }
  }
}

export class T3nAgentIdentity implements AgentIdentity {
  private readonly discover: DiscoverWhoami;

  constructor(private readonly options: { baseUrl: string; apiKey?: string; did?: string; discover?: DiscoverWhoami }) {
    this.discover = options.discover ?? discoverWhoami;
  }

  async describe(): Promise<AgentIdentityDescription> {
    if (this.options.did) return { runtime: 't3n', did: this.options.did, label: 'T3N agent' };
    if (!this.options.apiKey) throw new Error('T3N agent identity requires a resolved DID or API key');
    const result = await this.discover({ baseUrl: this.options.baseUrl, apiKey: this.options.apiKey });
    return { runtime: 't3n', did: result.did, label: 'T3N agent' };
  }
}
