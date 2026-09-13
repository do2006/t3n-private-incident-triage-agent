import { describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/cli.js';
import { MemoryStore } from '../src/adapters/memory-store.js';
import type { TriageDependencies } from '../src/domain/ports.js';

const deps: TriageDependencies = {
  store: new MemoryStore(),
  intel: { lookupCves: async (cves) => cves.map((cve) => ({ cve, knownExploited: false, source: 'test' })) },
  identity: { describe: async () => ({ runtime: 'memory', label: 'test agent' }) },
};

describe('CLI', () => {
  it('prints only the redacted triage report', async () => {
    const output: string[] = [];
    const secret = 'customer-password-DO-NOT-PRINT';
    const readFile = vi.fn(async () => JSON.stringify({
      id: 'demo-1', summary: 'Suspicious edge activity', description: secret,
      impact: 'high', internetExposed: true, confidence: 0.9,
    }));
    const code = await runCli(['--input', 'incident.json', '--runtime', 'memory'], {
      deps, readFile, write: (text) => output.push(text),
    });
    expect(code).toBe(0);
    expect(output.join('\n')).toContain('demo-1');
    expect(output.join('\n')).not.toContain(secret);
  });

  it('fails closed when t3n CLI bootstrap is unavailable', async () => {
    await expect(runCli(['--input', 'x.json', '--runtime', 't3n'], { readFile: async () => '{}' }))
      .rejects.toThrow(/authenticated TenantClient/i);
  });
});