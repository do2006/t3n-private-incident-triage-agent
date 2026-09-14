import { describe, expect, it } from 'vitest';
import { loadRuntimeConfig } from '../src/config.js';

describe('runtime config', () => {
  it('accepts the T3N testnet environment', () => {
    const config = loadRuntimeConfig({ T3N_ENVIRONMENT: 'testnet' });
    expect(config.environment).toBe('testnet');
  });
});

  it('accepts the documented agent API key variable', () => {
    const config = loadRuntimeConfig({ T3N_AGENT_API_KEY: 'agent-key-1234567890' });
    expect(config.apiKey).toBe('agent-key-1234567890');
  });

  it('keeps T3N_API_KEY as a compatibility alias', () => {
    const config = loadRuntimeConfig({ T3N_API_KEY: 'legacy-key-1234567890' });
    expect(config.apiKey).toBe('legacy-key-1234567890');
  });
