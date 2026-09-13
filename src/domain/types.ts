import { z } from 'zod';

const cveSchema = z
  .string()
  .transform((value) => value.trim().toUpperCase())
  .pipe(z.string().regex(/^CVE-\d{4}-\d{4,}$/));

export const impactSchema = z.enum(['critical', 'high', 'medium', 'low']);

export const incidentSchema = z.object({
  id: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().default(''),
  impact: impactSchema.default('medium'),
  internetExposed: z.boolean().default(false),
  activeExploitation: z.boolean().default(false),
  cves: z.array(cveSchema).default([]),
  indicators: z.array(z.string().min(1)).default([]),
  affectedAssets: z.array(z.string().min(1)).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
  observedAt: z.string().datetime().optional(),
});

export type Incident = z.infer<typeof incidentSchema>;
export type IncidentInput = z.input<typeof incidentSchema>;

export const severitySchema = z.enum(['critical', 'high', 'medium', 'low']);
export type Severity = z.infer<typeof severitySchema>;

export const triageReportSchema = z.object({
  incidentId: z.string().min(1),
  score: z.number().min(0).max(100),
  severity: severitySchema,
  evidence: z.array(z.string()),
  remediation: z.array(z.string()),
  redactedSummary: z.string().min(1),
  agent: z.object({
    runtime: z.enum(['memory', 't3n']),
    did: z.string().optional(),
    label: z.string().min(1),
  }),
});

export type TriageReport = z.infer<typeof triageReportSchema>;
