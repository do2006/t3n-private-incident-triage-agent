import { z } from 'zod';

const configSchema = z.object({
  T3N_BASE_URL: z.string().url().optional(),
  T3N_API_KEY: z.string().min(10).optional(),
  T3N_PRIVATE_MAP: z.string().min(1).default('incident-triage-private'),
  T3N_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
});

export type RuntimeConfig = {
  environment: 'sandbox' | 'production';
  baseUrl?: string;
  apiKey?: string;
  privateMap: string;
};

export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const value = configSchema.parse(env);
  return {
    environment: value.T3N_ENVIRONMENT,
    privateMap: value.T3N_PRIVATE_MAP,
    ...(value.T3N_BASE_URL ? { baseUrl: value.T3N_BASE_URL } : {}),
    ...(value.T3N_API_KEY ? { apiKey: value.T3N_API_KEY } : {}),
  };
}
