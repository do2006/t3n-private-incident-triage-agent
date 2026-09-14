import { NODE_URLS } from '@terminal3/t3n-sdk';
import { loadRuntimeConfig } from './config.js';
import { resolveVerifiedT3nTrustAnchor } from './adapters/t3n.js';

export async function runT3nPreflight(): Promise<void> {
  const config = loadRuntimeConfig();
  const baseUrl = config.baseUrl ?? NODE_URLS[config.environment];
  if (!baseUrl) throw new Error(`No T3N node URL configured for ${config.environment}`);

  const anchor = await resolveVerifiedT3nTrustAnchor({
    environment: config.environment,
    baseUrl,
  });
  process.stdout.write(JSON.stringify({
    environment: config.environment,
    baseUrl,
    manifestVersion: anchor.source?.manifest_version,
    signedAt: anchor.source?.signed_at,
    peerCount: anchor.expected_peer_ids.length,
    rtmr1Count: anchor.rtmr1_allowlist.length,
  }, null, 2) + '\n');
}

runT3nPreflight().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Unknown T3N preflight error'}\n`);
  process.exitCode = 1;
});
