# Private Incident Triage Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tested T3N enterprise incident-triage agent that privately stores incident data, performs allowlisted public threat enrichment, and returns explainable remediation guidance.

**Architecture:** Domain logic is isolated from Terminal 3 through small interfaces for private storage, threat intelligence, and agent identity. The T3N adapter is optional at test time; deterministic in-memory adapters make the full workflow testable without credentials.

**Tech Stack:** TypeScript, Node.js 24, `@terminal3/t3n-sdk` 5.15.2, Vitest, Zod.

**Spec:** `docs/superpowers/specs/2026-09-13-private-incident-triage-agent-design.md`

## Global Constraints
- Pin `@terminal3/t3n-sdk` to `5.15.2`.
- Never commit T3N API keys, DIDs with secret material, or incident secrets.
- Deny outbound HTTP unless the target hostname is allowlisted.
- No paid model/API dependency.
- Tests must run without network credentials.

---

### Task 1: Project scaffold and domain contracts

**Files:** Create `package.json`, `tsconfig.json`, `src/domain/types.ts`, `src/domain/ports.ts`, `test/contracts.test.ts`.

**Interfaces:** Produces `IncidentInput`, `TriageReport`, `PrivateStore`, `ThreatIntelClient`, and `AgentIdentity`.

- [ ] **Step 1: Write the failing contract test**
```ts
import { describe, expect, it } from 'vitest';
import { incidentSchema } from '../src/domain/types.js';
it('rejects an incident without a summary', () => expect(() => incidentSchema.parse({ id: 'x' })).toThrow());
```
- [ ] **Step 2: Run `npm test -- contracts` and verify RED.**
- [ ] **Step 3: Implement Zod schemas/types and dependency interfaces with no network code.**
- [ ] **Step 4: Run the contract test and `npm run typecheck`; verify GREEN.**
- [ ] **Step 5: Commit `feat: define incident triage contracts`.**
### Task 2: Deterministic triage engine

**Files:** Create `src/domain/triage.ts`, `test/triage.test.ts`.

**Interfaces:** Consumes `IncidentInput`, `ThreatIntelClient`, `PrivateStore`; produces `triageIncident(input, deps): Promise<TriageReport>`.

- [ ] **Step 1: Write failing tests for critical/high/medium/low scoring, KEV evidence, and remediation ordering.**
```ts
const report = await triageIncident(criticalIncident, deps);
expect(report.severity).toBe('critical');
expect(report.remediation[0]).toMatch(/isolate/i);
```
- [ ] **Step 2: Run `npm test -- triage`; verify RED.**
- [ ] **Step 3: Implement normalized scoring and explainable evidence collection.**
- [ ] **Step 4: Persist raw input and full report through `PrivateStore`; return a redacted summary field.**
- [ ] **Step 5: Run tests/typecheck; commit `feat: add explainable incident triage engine`.**

### Task 3: Secure adapters and T3N integration

**Files:** Create `src/adapters/memory-store.ts`, `src/adapters/cisa-kev.ts`, `src/adapters/t3n.ts`, `src/config.ts`, `test/adapters.test.ts`.

**Interfaces:** `CisaKevClient` implements `ThreatIntelClient`; `T3nPrivateStore` and `T3nAgentIdentity` wrap SDK behavior behind domain ports.

- [ ] **Step 1: Write failing tests proving blocked hosts fail closed and sensitive values are not logged.**
```ts
await expect(client.fetchJson('https://example.com/x')).rejects.toThrow(/not allowlisted/i);
```
- [ ] **Step 2: Run adapter tests; verify RED.**
- [ ] **Step 3: Implement CISA KEV parsing with injected `fetch`, timeout, and hostname allowlist.**
- [ ] **Step 4: Inspect SDK 5.15.2 exports/types, then implement the narrow T3N adapter using only supported APIs.**
- [ ] **Step 5: Run tests/typecheck; commit `feat: add secure T3N and threat-intel adapters`.**
### Task 4: CLI demo and maintainability documentation

**Files:** Create `src/cli.ts`, `examples/redacted-incident.json`, `README.md`, `docs/SECURITY.md`, `docs/BUGS.md`, `test/cli.test.ts`.

**Interfaces:** CLI accepts `--input <json>` and `--runtime memory|t3n`; prints only redacted report data.

- [ ] **Step 1: Write a failing CLI test using the redacted example.**
- [ ] **Step 2: Implement argument parsing, runtime selection, and JSON output.**
- [ ] **Step 3: Document setup, architecture, delegation/egress assumptions, and handover procedure.**
- [ ] **Step 4: Run `npm test`, `npm run typecheck`, and the demo command.**
- [ ] **Step 5: Commit `feat: add reproducible triage demo and documentation`.**

### Task 5: Submission evidence and release verification

**Files:** Create `submission/SUBMISSION.md`, `submission/SCREENSHOTS.md`, `.github/workflows/ci.yml`.

**Interfaces:** Produces the public-repo artifact set required by the Superteam listing.

- [ ] **Step 1: Add CI running install, typecheck, tests, and build on Node 24.**
- [ ] **Step 2: Run a clean local install and all verification commands.**
- [ ] **Step 3: Capture terminal/demo evidence and record exact commands/results in `submission/SCREENSHOTS.md`.**
- [ ] **Step 4: Write `submission/SUBMISSION.md` with repo link placeholder resolved after publication, handover choice, maintenance notes, and known bugs.**
- [ ] **Step 5: Commit `docs: prepare T3N bounty submission`; publish the public GitHub repository and verify CI.**

## Self-Review
- Spec coverage: private storage, allowlisted enrichment, deterministic scoring, T3N adapter, tests, docs, and submission evidence are each assigned to a task.
- Placeholder scan: the final repo link is resolved during Task 5 publication; no implementation placeholders remain.
- Type consistency: all tasks use the domain ports and `triageIncident` contract defined in Tasks 1–2.