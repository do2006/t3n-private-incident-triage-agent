import type { Incident, TriageReport } from './types.js';

export interface PrivateStore {
  put(key: string, value: unknown): Promise<void>;
  get<T>(key: string): Promise<T | undefined>;
}

export type CveIntel = {
  cve: string;
  knownExploited: boolean;
  source: string;
  note?: string;
};

export interface ThreatIntelClient {
  lookupCves(cves: string[]): Promise<CveIntel[]>;
}

export type AgentIdentityDescription = {
  runtime: 'memory' | 't3n';
  did?: string;
  label: string;
};

export interface AgentIdentity {
  describe(): Promise<AgentIdentityDescription>;
}

export type TriageDependencies = {
  store: PrivateStore;
  intel: ThreatIntelClient;
  identity: AgentIdentity;
};

export type StoredIncidentRecord = {
  incident: Incident;
  report?: TriageReport;
};
