# Known Limitations and Maintenance Notes

## Current limitations

1. Live T3N execution requires runtime-only authentication material; no signing key is embedded in this repository.
2. As observed on September 13, 2026, T3N testnet serves an operator-signed trust manifest dated August 27 that omits `rtmr1_allowlist`. `@terminal3/t3n-sdk` 5.15.2 requires a non-empty RTMR1 allowlist, so secure testnet bootstrap is provider-blocked until Terminal 3 republishes a compatible signed manifest. The application refuses to downgrade or use `unsafe_trust_server` as a workaround.
3. CISA KEV is the only production enrichment source. CVEs absent from KEV are treated as not known-exploited by that source, not as proven safe.
4. Scoring is deterministic policy logic, not a replacement for analyst judgment or a SIEM/SOAR platform.
5. The agent recommends remediation actions but never executes remediation automatically.

## Operational maintenance

- Keep `@terminal3/t3n-sdk` pinned and review breaking changes before upgrades.
- Periodically verify the CISA KEV endpoint schema and hostname.
- Review score thresholds when organizational risk appetite changes.
- Add new threat-intelligence sources only behind `ThreatIntelClient` and explicit hostname allowlists.
- Run `npm ci && npm test && npm run typecheck && npm run build` before release.

## Reporting issues

Open a GitHub issue with a redacted reproducer. Never attach real API keys, wallet keys, session credentials, or sensitive incident contents.
