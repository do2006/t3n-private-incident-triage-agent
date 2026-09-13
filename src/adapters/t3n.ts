import { discoverWhoami, type DiscoverOptions, type WhoamiResult } from '@terminal3/t3n-sdk';
import type { AgentIdentity, AgentIdentityDescription, PrivateStore } from '../domain/ports.js';

type MapsPort = {
  entrySet(tail: string, key: string, value: string): Promise<void>;
  entryGet(tail: string, key: string): Promise<string | null>;
  create?(input: { tail: string; visibility: string; writers: 'all'; readers: 'all' }): Promise<unknown>;
  getStatus?(tail: string): Promise<string>;
};

type DiscoverWhoami = (opts: DiscoverOptions) => Promise<WhoamiResult>;

export class T3nPrivateStore implements PrivateStore {
  constructor(private readonly options: { maps: MapsPort; mapTail: string }) {}

  async provision(): Promise<void> {
    if (!this.options.maps.create || !this.options.maps.getStatus) return;
    const status = await this.options.maps.getStatus(this.options.mapTail);
    if (status === 'active') return;
    if (status !== 'absent') throw new Error(`T3N private map is not ready: ${status}`);
    await this.options.maps.create({
      tail: this.options.mapTail,
      visibility: 'private',
      writers: 'all',
      readers: 'all',
    });
  }

  async put(key: string, value: unknown): Promise<void> {
    try {
      await this.options.maps.entrySet(this.options.mapTail, key, JSON.stringify(value));
    } catch {
      throw new Error('T3N private store write failed');
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.options.maps.entryGet(this.options.mapTail, key);
      return value === null ? undefined : JSON.parse(value) as T;
    } catch {
      throw new Error('T3N private store read failed');
    }
  }
}

export class T3nAgentIdentity implements AgentIdentity {
  private readonly discover: DiscoverWhoami;

  constructor(private readonly options: { baseUrl: string; apiKey: string; discover?: DiscoverWhoami }) {
    this.discover = options.discover ?? discoverWhoami;
  }

  async describe(): Promise<AgentIdentityDescription> {
    const result = await this.discover({ baseUrl: this.options.baseUrl, apiKey: this.options.apiKey });
    return { runtime: 't3n', did: result.did, label: 'T3N agent' };
  }
}
