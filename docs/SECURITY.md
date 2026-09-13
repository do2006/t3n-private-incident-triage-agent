# Security Model

## Protected data

Incident descriptions, asset names, indicators, analyst confidence, and full triage reports are treated as sensitive. Production storage is routed through the T3N private-store adapter; the public CLI emits only the structured report and never prints the raw incident body.

## Egress policy

Public threat enrichment is restricted to the configured CISA KEV feed hostname. `fetchAllowlistedJson()` rejects non-HTTPS URLs and any hostname outside the explicit allowlist before invoking `fetch`.

Only normalized CVE identifiers are sent to the threat-intelligence adapter. Incident descriptions and private indicators are not included in the enrichment request.

## T3N storage

`T3nPrivateStore` uses `TenantClient.maps.entrySet()` and `entryGet()` from `@terminal3/t3n-sdk` 5.15.2. It ensures the configured map exists and stores JSON-serialized values by namespaced key.

The adapter is injected with an authenticated `TenantClient`; authentication material is not constructed or persisted by this project.

## Agent identity

`T3nAgentIdentity` resolves the agent DID using `discoverWhoami()` with the opaque T3N agent API key. The key is passed at runtime and is never interpolated into errors or output.
## Delegation assumptions

A deployed agent should receive only the contract functions and data scopes required for incident triage. T3N's delegation document supports function restrictions, read scopes, and `allowed_hosts`; the recommended policy grants only the triage storage contract/map access and CISA hostname required by this agent.

The code does not request broad web access, arbitrary tenant enumeration, signing authority, autonomous remediation, or wallet access.

## Failure behavior

The system fails closed when incident validation fails, egress is not allowlisted, T3N storage operations fail, or T3N identity resolution fails. Memory runtime exists only for deterministic review/testing and is clearly identified in the returned agent metadata.

## Secrets

Do not commit `T3N_AGENT_API_KEY`, wallet private keys, session material, or production incident inputs. `.gitignore` excludes common environment/secret files. CI runs only against the credential-free memory/test path.
