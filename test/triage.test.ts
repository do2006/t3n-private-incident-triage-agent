import { describe, expect, it } from 'vitest';
import { triageIncident } from '../src/domain/triage.js';
import type { AgentIdentity, CveIntel, PrivateStore, ThreatIntelClient } from '../src/domain/ports.js';

class MemoryStore implements PrivateStore {
  values = new Map<string, unknown>();
  async put(key: string, value: unknown) { this.values.set(key, value); }
  async get<T>(key: string) { return this.values.get(key) as T | undefined; }
}

class StaticIntel implements ThreatIntelClient {
  constructor(private readonly exploited: string[] = []) {}
  async lookupCves(cves: string[]): Promise<CveIntel[]> {
    return cves.map((cve) => ({ cve, knownExploited: this.exploited.includes(cve), source: 'test-kev' }));
  }
}

const identity: AgentIdentity = {
  async describe() { return { runtime: 'memory', label: 'test-agent' } as const; },
};

function deps(exploited: string[] = []) {
  const store = new MemoryStore();
  return { store, intel: new StaticIntel(exploited), identity };
}

describe('triage engine', () => {
  it('produces a critical report with isolation first and KEV evidence', async () => {
    const d = deps(['CVE-2026-1234']);
    const report = await triageIncident({
      id: 'critical-1', summary: 'Internet-facing RCE', description: 'secret host details',
      impact: 'critical', internetExposed: true, activeExploitation: true,
      confidence: 1, cves: ['CVE-2026-1234'],
    }, d);
    expect(report.severity).toBe('critical');
    expect(report.remediation[0]).toMatch(/isolate/i);
    expect(report.evidence.join(' ')).toMatch(/known exploited/i);
    expect(report.redactedSummary).not.toContain('secret host details');
    expect(await d.store.get('incident:critical-1:input')).toBeDefined();
    expect(await d.store.get('incident:critical-1:report')).toBeDefined();
  });

  it.each([
    ['high', { impact: 'high', internetExposed: true, activeExploitation: true, confidence: 0.8 }],
    ['medium', { impact: 'medium', internetExposed: true, activeExploitation: false, confidence: 0.8 }],
    ['low', { impact: 'low', internetExposed: false, activeExploitation: false, confidence: 0.4 }],
  ] as const)('classifies %s severity deterministically', async (expected, fields) => {
    const report = await triageIncident({ id: `${expected}-1`, summary: expected, ...fields }, deps());
    expect(report.severity).toBe(expected);
  });
});
