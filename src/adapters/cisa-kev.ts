import type { CveIntel, ThreatIntelClient } from '../domain/ports.js';

const DEFAULT_KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
const DEFAULT_ALLOWED_HOSTS = ['www.cisa.gov'];

type FetchLike = typeof fetch;

export async function fetchAllowlistedJson(
  url: string,
  allowedHosts = DEFAULT_ALLOWED_HOSTS,
  fetchFn: FetchLike = fetch,
  timeoutMs = 10_000,
): Promise<unknown> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !allowedHosts.includes(parsed.hostname)) {
    throw new Error(`Outbound host is not allowlisted: ${parsed.hostname}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchFn(parsed, { signal: controller.signal, headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error('Threat-intelligence request failed');
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

type KevPayload = { vulnerabilities?: Array<{ cveID?: string; vulnerabilityName?: string }> };

export class CisaKevClient implements ThreatIntelClient {
  constructor(private readonly options: { fetchFn?: FetchLike; url?: string; timeoutMs?: number } = {}) {}

  async lookupCves(cves: string[]): Promise<CveIntel[]> {
    if (cves.length === 0) return [];
    const payload = await fetchAllowlistedJson(
      this.options.url ?? DEFAULT_KEV_URL,
      DEFAULT_ALLOWED_HOSTS,
      this.options.fetchFn ?? fetch,
      this.options.timeoutMs ?? 10_000,
    ) as KevPayload;
    const known = new Map(
      (payload.vulnerabilities ?? [])
        .filter((row): row is { cveID: string; vulnerabilityName?: string } => typeof row.cveID === 'string')
        .map((row) => [row.cveID.toUpperCase(), row.vulnerabilityName]),
    );
    return cves.map((cve) => ({
      cve,
      knownExploited: known.has(cve),
      source: 'CISA Known Exploited Vulnerabilities',
      ...(known.get(cve) ? { note: known.get(cve) } : {}),
    }));
  }
}
