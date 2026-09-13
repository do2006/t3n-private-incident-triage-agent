import type { TenantClient } from '@terminal3/t3n-sdk';
import { CisaKevClient } from './adapters/cisa-kev.js';
import { MemoryStore } from './adapters/memory-store.js';
import { T3nAgentIdentity, T3nPrivateStore } from './adapters/t3n.js';
import type { AgentIdentityDescription, ThreatIntelClient, TriageDependencies } from './domain/ports.js';

export class MemoryAgentIdentity {
  async describe(): Promise<AgentIdentityDescription> {
    return { runtime: 'memory', label: 'Local deterministic agent' };
  }
}

export function createMemoryDependencies(intel: ThreatIntelClient = new CisaKevClient()): TriageDependencies {
  return {
    store: new MemoryStore(),
    intel,
    identity: new MemoryAgentIdentity(),
  };
}

export type T3nRuntimeOptions = {
  tenantClient: Pick<TenantClient, 'maps'>;
  baseUrl: string;
  apiKey: string;
  mapTail?: string;
  intel?: ThreatIntelClient;
};

export function createT3nDependencies(options: T3nRuntimeOptions): TriageDependencies {
  const store = new T3nPrivateStore({
    maps: options.tenantClient.maps,
    mapTail: options.mapTail ?? 'incident-triage-private',
  });
  return {
    store,
    intel: options.intel ?? new CisaKevClient(),
    identity: new T3nAgentIdentity({ baseUrl: options.baseUrl, apiKey: options.apiKey }),
  };
}
