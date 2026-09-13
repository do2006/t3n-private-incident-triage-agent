import { z } from 'zod';

const cveSchema = z
  .string()
  .transform((value) => value.trim().toUpperCase())
  .pipe(z.string().regex(/^CVE-\d{4}-\d{4,}$/));

export const incidentSchema = z.object({
  id: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().default(''),
  cves: z.array(cveSchema).default([]),
  indicators: z.array(z.string().min(1)).default([]),
  affectedAssets: z.array(z.string().min(1)).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
  observedAt: z.string().datetime().optional(),
});

export type Incident = z.infer<typeof incidentSchema>;
