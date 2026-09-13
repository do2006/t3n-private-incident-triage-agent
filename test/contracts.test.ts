import { describe, expect, it } from 'vitest';
import { incidentSchema } from '../src/domain/types.js';

describe('incident schema', () => {
  it('rejects an incident without a summary', () => {
    expect(() => incidentSchema.parse({ id: 'x' })).toThrow();
  });

  it('normalizes valid CVEs and rejects malformed CVEs', () => {
    const valid = incidentSchema.parse({ id: 'inc-1', summary: 'edge exploit', cves: ['cve-2026-1234'] });
    expect(valid.cves).toEqual(['CVE-2026-1234']);
    expect(() => incidentSchema.parse({ id: 'inc-2', summary: 'bad cve', cves: ['not-a-cve'] })).toThrow();
  });

  it('defaults optional arrays and confidence', () => {
    const incident = incidentSchema.parse({ id: 'inc-3', summary: 'auth anomaly' });
    expect(incident.cves).toEqual([]);
    expect(incident.indicators).toEqual([]);
    expect(incident.confidence).toBe(0.5);
  });
});
