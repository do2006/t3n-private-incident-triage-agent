# Private Incident Triage Agent Design

## Purpose
Build a maintainable enterprise security agent for the Terminal 3 Network T3N bounty that can receive sensitive incident data, store it privately, enrich only explicitly allowed indicators, and return a prioritized remediation plan.

## Success Criteria
- Uses the current `@terminal3/t3n-sdk` pinned by the project lockfile.
- Separates sensitive incident storage from public enrichment data.
- Supports a T3N-backed runtime and a deterministic local test runtime.
- Restricts outbound enrichment to an explicit hostname allowlist.
- Produces a structured triage result with severity, evidence, and remediation steps.
- Includes tests, setup documentation, screenshots/evidence hooks, and submission notes.

## User Workflow
1. Operator submits an incident JSON document.
2. Agent validates and normalizes the incident.
3. Sensitive incident state is written through a private key-value adapter.
4. CVEs and non-secret public indicators may be enriched through an allowlisted threat-intelligence adapter.
5. The triage engine scores impact, exploit evidence, exposure, and confidence.
6. The agent writes the final report back to private storage and returns a concise redacted summary.

## Architecture
The core is intentionally provider-independent: domain logic depends on `PrivateStore`, `ThreatIntelClient`, and `AgentIdentity` interfaces. A T3N adapter binds those interfaces to Terminal 3 capabilities; in tests, in-memory adapters prove behavior without network credentials.
## Security Model
- Never log raw incident bodies, credentials, secrets, tokens, or private-store values.
- Outbound HTTP is denied unless the hostname is explicitly allowlisted.
- Public enrichment inputs are restricted to CVE identifiers and similarly non-secret indicators.
- T3N credentials are supplied only through environment variables and are never committed.
- Agent identity/DID is exposed in diagnostics, but signing material is not.
- Fail closed on malformed incident input, storage failure, or blocked egress.

## Triage Model
Severity is deterministic and explainable. The score combines declared business impact, internet exposure, active exploitation evidence, known-exploited-vulnerability status, and confidence. The report contains the numeric score, `critical|high|medium|low`, evidence strings, and ordered remediation actions.

## Public Enrichment
The first production enrichment source is CISA Known Exploited Vulnerabilities data. The implementation keeps the HTTP client behind an interface so the T3N-specific egress/delegation mechanism can be changed without touching triage logic.

## Interfaces
- `PrivateStore.put(key, value)` and `PrivateStore.get(key)` for protected incident state.
- `ThreatIntelClient.lookupCves(cves)` returns normalized exploit evidence.
- `AgentIdentity.describe()` returns non-secret runtime identity metadata.
- `triageIncident(input, deps)` returns `TriageReport`.

## Submission Deliverables
Public GitHub repository, clear README, architecture/security notes, automated tests, sample redacted incident, reproducible demo command, screenshot/evidence directory, bug-notes document, and a public-submission document that links all required artifacts.

## Non-Goals
No autonomous remediation, credential harvesting, vulnerability exploitation, arbitrary web browsing, SIEM replacement, or dependency on a paid LLM/API.