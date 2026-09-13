import type { PrivateStore } from '../domain/ports.js';

export class MemoryStore implements PrivateStore {
  private readonly values = new Map<string, unknown>();

  async put(key: string, value: unknown): Promise<void> {
    this.values.set(key, structuredClone(value));
  }

  async get<T>(key: string): Promise<T | undefined> {
    const value = this.values.get(key);
    return value === undefined ? undefined : structuredClone(value) as T;
  }
}
