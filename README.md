# T3N Private Incident Triage Agent

[![CI](https://github.com/do2006/t3n-private-incident-triage-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/do2006/t3n-private-incident-triage-agent/actions/workflows/ci.yml)

A privacy-first enterprise incident triage agent built for the Terminal 3 Network (T3N) Agent Build Challenge.

It validates sensitive incident reports, enriches public CVE identifiers against CISA Known Exploited Vulnerabilities data, calculates an explainable severity score, stores sensitive records behind a private-store interface, and emits only a concise redacted result.

## Why T3N

The production adapter uses T3N SDK `5.15.2` primitives instead of inventing a parallel security layer:

- `TenantClient.maps.entrySet()` / `entryGet()` for tenant-owned incident state.
- `discoverWhoami()` for API-key agent identity resolution.
- T3N delegation can constrain functions, scopes, read scopes, and allowed outbound hosts.
- Credentials remain external to the repository.

The same domain engine runs with deterministic memory adapters so reviewers can verify behavior without credentials.

## Quick demo

```bash
npm ci
npm test
npm run typecheck
npm run demo
```

The demo uses `examples/redacted-incident.json` and the in-memory runtime. It requires no paid API, wallet funding, model key, or T3N credential.
## Scoring model

The score is deterministic and bounded to 0–100. It combines declared business impact, internet exposure, active exploitation, CISA KEV status, and analyst confidence. The output includes the numeric score, severity band, evidence strings, and ordered remediation steps.

No LLM is required for scoring, which keeps triage reproducible and avoids sending incident details to a third-party model provider.

## Runtime modes

### Memory runtime

`npm run demo` executes the full workflow with an in-memory private store and a deterministic local identity. CISA enrichment still uses the public allowlisted feed when invoked by the default runtime; tests inject fetch and do not require network access.

### T3N runtime

Use `createT3nDependencies()` after authenticating a T3N `TenantClient` and obtaining the agent's opaque API key:

```ts
const deps = createT3nDependencies({
  tenantClient,
  baseUrl: process.env.T3N_BASE_URL!,
  apiKey: process.env.T3N_AGENT_API_KEY!,
  mapTail: 'incident-triage-private'
});
```

The T3N adapter creates/uses a tenant map for private incident records and resolves the agent DID through T3N keyed discovery. The CLI intentionally refuses `--runtime t3n` without an authenticated dependency bundle rather than silently falling back.
## Security boundaries

- Raw incident bodies are never printed by the CLI.
- CVE enrichment is restricted to the configured CISA hostname over HTTPS.
- T3N API keys are accepted only through runtime configuration and are never written to repository files.
- Adapter errors use generic messages instead of embedding secrets or response bodies.
- Malformed incidents, blocked egress, and private-store failures fail closed.

See `docs/SECURITY.md` for the complete threat model and T3N delegation assumptions.

## Project layout

- `src/domain/` — validation, contracts, deterministic triage logic.
- `src/adapters/` — memory, CISA KEV, and T3N integrations.
- `src/runtime.ts` — dependency factories.
- `src/cli.ts` — reproducible redacted CLI demo.
- `test/` — credential-free automated tests.
- `examples/` — synthetic incident input.
- `submission/` — challenge evidence and submission notes.

## Handover

The implementation is intentionally small and provider-separated. Replacing the enrichment source or changing the T3N tenant map does not require changing the scoring engine. All production credentials stay outside version control.

## License

MIT. See `LICENSE`.
