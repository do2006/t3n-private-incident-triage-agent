import { incidentSchema, type IncidentInput, type Severity, type TriageReport } from './types.js';
import type { CveIntel, TriageDependencies } from './ports.js';

const impactWeight = { critical: 55, high: 40, medium: 25, low: 10 } as const;

function severityFor(score: number): Severity {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function kevEvidence(intel: CveIntel[]): string[] {
  return intel
    .filter((item) => item.knownExploited)
    .map((item) => `${item.cve} is listed as known exploited by ${item.source}.`);
}

function remediationFor(severity: Severity, active: boolean, internet: boolean, kev: CveIntel[]): string[] {
  const steps: string[] = [];
  if ((severity === 'critical' || severity === 'high') && (active || internet)) {
    steps.push('Isolate affected systems from untrusted networks and preserve evidence.');
  }
  if (kev.some((item) => item.knownExploited)) {
    steps.push('Patch or mitigate known-exploited vulnerabilities using vendor and CISA guidance.');
  }
  if (active) steps.push('Block observed malicious indicators at relevant control points.');
  steps.push('Validate containment, monitor for recurrence, and document recovery evidence.');
  return steps;
}

export async function triageIncident(input: IncidentInput, deps: TriageDependencies): Promise<TriageReport> {
  const incident = incidentSchema.parse(input);
  const intel = await deps.intel.lookupCves(incident.cves);
  const raw = impactWeight[incident.impact]
    + (incident.internetExposed ? 15 : 0)
    + (incident.activeExploitation ? 20 : 0)
    + (intel.some((item) => item.knownExploited) ? 20 : 0);
  const score = Math.min(100, Math.round(raw * (0.5 + incident.confidence * 0.5)));
  const severity = severityFor(score);
  const evidence = [
    `Declared business impact: ${incident.impact}.`,
    `Internet exposed: ${incident.internetExposed}.`,
    `Active exploitation: ${incident.activeExploitation}.`,
    `Confidence: ${incident.confidence.toFixed(2)}.`,
    ...kevEvidence(intel),
  ];
  const agent = await deps.identity.describe();
  const report: TriageReport = {
    incidentId: incident.id,
    score,
    severity,
    evidence,
    remediation: remediationFor(severity, incident.activeExploitation, incident.internetExposed, intel),
    redactedSummary: `${incident.id}: ${incident.summary} — ${severity} (${score}/100)`,
    agent,
  };
  await deps.store.put(`incident:${incident.id}:input`, incident);
  await deps.store.put(`incident:${incident.id}:report`, report);
  return report;
}
