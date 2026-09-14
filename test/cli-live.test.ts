import { describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/cli.js';
import { MemoryStore } from '../src/adapters/memory-store.js';
import type { TriageDependencies } from '../src/domain/ports.js';

const liveDeps: TriageDependencies = {
  store: new MemoryStore(),
  intel: { lookupCves: async (cves) => cves.map((cve) => ({ cve, knownExploited: false, source: 'test' })) },
  identity: { describe: async () => ({ runtime: 't3n', did: 'did:t3n:live123', label: 'T3N agent' }) },
};

describe('live T3N CLI bootstrap', () => {
  it('bootstraps --runtime t3n from environment configuration', async () => {
    const output: string[] = [];
    const bootstrap = vi.fn(async () => ({ dependencies: liveDeps }));
    const code = await runCli(['--input', 'incident.json', '--runtime', 't3n'], {
      env: {
        T3N_ENVIRONMENT: 'testnet',
        T3N_BASE_URL: 'https://node.example/',
        T3N_API_KEY: 'test-api-key-1234567890',
        T3N_PRIVATE_MAP: 'triage-private',
      },
      t3nBootstrap: bootstrap,
      readFile: async () => JSON.stringify({ id: 'live-1', summary: 'edge anomaly' }),
      write: (text: string) => output.push(text),
    } as never);

    expect(code).toBe(0);
    expect(bootstrap).toHaveBeenCalledWith({
      environment: 'testnet',
      baseUrl: 'https://node.example',
      apiKey: 'test-api-key-1234567890',
      mapTail: 'triage-private',
    });
    expect(output.join('\n')).toContain('did:t3n:live123');
  });
});
