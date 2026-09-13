# Known Limitations and Maintenance Notes

## Current limitations

1. The public CLI directly supports the credential-free memory runtime. T3N runtime is intentionally programmatic because constructing an authenticated `TenantClient` requires account-specific authentication material that must not be embedded in this repository.
2. CISA KEV is the only production enrichment source. CVEs absent from KEV are treated as not known-exploited by that source, not as proven safe.
3. Scoring is deterministic policy logic, not a replacement for analyst judgment or a SIEM/SOAR platform.
4. The agent recommends remediation actions but never executes remediation automatically.

## Operational maintenance

- Keep `@terminal3/t3n-sdk` pinned and review breaking changes before upgrades.
- Periodically verify the CISA KEV endpoint schema and hostname.
- Review score thresholds when organizational risk appetite changes.
- Add new threat-intelligence sources only behind `ThreatIntelClient` and explicit hostname allowlists.
- Run `npm ci && npm test && npm run typecheck && npm run build` before release.

## Reporting issues

Open a GitHub issue with a redacted reproducer. Never attach real API keys, wallet keys, session credentials, or sensitive incident contents.
