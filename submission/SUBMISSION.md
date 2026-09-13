# T3N Agent Build Challenge Submission

## Project

**Private Incident Triage Agent** — a privacy-first enterprise security triage agent for Terminal 3 Network.

Public repository: https://github.com/do2006/t3n-private-incident-triage-agent

Canonical public submission document: https://github.com/do2006/t3n-private-incident-triage-agent/blob/main/submission/SUBMISSION.md

Verified main commit: `0777c2fbb106846d3e3be8d2beaf5045839f84d6`

GitHub Actions verification: https://github.com/do2006/t3n-private-incident-triage-agent/actions/runs/34788796721

## What it does

The agent validates sensitive incident reports, enriches only normalized public CVE identifiers against the allowlisted CISA Known Exploited Vulnerabilities feed, calculates a deterministic and explainable severity score, stores sensitive records through a T3N-backed private-store adapter, and returns prioritized remediation guidance with a redacted summary.

## T3N integration

- Pinned SDK: `@terminal3/t3n-sdk` `5.15.2`.
- Private state adapter: `TenantClient.maps.entrySet()` / `entryGet()`.
- Agent identity: API-key `discoverWhoami()`.
- T3N runtime is injected with an authenticated `TenantClient`; credentials are never embedded in source.
- Recommended delegation is least-privilege: only required functions/data scopes plus the CISA egress hostname.

## Maintainability

The domain engine depends only on small `PrivateStore`, `ThreatIntelClient`, and `AgentIdentity` interfaces. Reviewers can run the complete memory-backed workflow without T3N credentials, while production uses the same domain code with T3N adapters.
## Verification and screenshots

- Automated tests: `submission/verification.png`
- Demo result: `submission/demo.png`
- Raw verification transcript: `submission/verification-output.txt`
- Raw demo transcript: `submission/demo-output.txt`
- Reproduction commands: `submission/SCREENSHOTS.md`

## Bugs and friction encountered

1. **Test discovery after build:** compiled `dist/test/*.js` files were initially rediscovered by Vitest after a build, doubling the suite. Root cause was build output not being excluded from test discovery. Fixed with `vitest.config.ts`; regression verification now produces exactly 15 tests even when build output already exists.
2. **T3N storage API discovery:** the SDK does not expose a simplistic top-level `kv.put()` API. Inspection of SDK 5.15.2 found the supported tenant-map surface, so the integration uses `TenantClient.maps.entrySet()` / `entryGet()` instead of an undocumented contract call.
3. No confirmed Terminal 3 network defect is claimed by this submission; account-specific onboarding is kept separate from the public codebase.

## Post-challenge preference

I am willing to continue maintaining and operating the agent. If Terminal 3 prefers to host or maintain it, handover is straightforward: fork/transfer the repository, configure an authenticated T3N tenant client and agent API key, create the private incident map, and apply the documented least-privilege delegation/egress policy. No proprietary service or paid LLM dependency is required.

## Security

See `docs/SECURITY.md`. The project never requests autonomous remediation, wallet access, arbitrary web browsing, or production secrets in source control.
