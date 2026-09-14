import { readFile as fsReadFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { NODE_URLS } from '@terminal3/t3n-sdk';
import { triageIncident } from './domain/triage.js';
import { createMemoryDependencies } from './runtime.js';
import { loadRuntimeConfig } from './config.js';
import { bootstrapT3nApiKeySession } from './t3n-bootstrap.js';
import type { TriageDependencies } from './domain/ports.js';

type CliOptions = {
  deps?: TriageDependencies;
  env?: NodeJS.ProcessEnv;
  t3nBootstrap?: typeof bootstrapT3nApiKeySession;
  readFile?: (path: string) => Promise<string>;
  write?: (text: string) => void;
};

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

export async function runCli(args: string[], options: CliOptions = {}): Promise<number> {
  const inputPath = argValue(args, '--input');
  const runtime = argValue(args, '--runtime') ?? 'memory';
  if (!inputPath) throw new Error('Usage: --input <json> [--runtime memory|t3n]');
  if (runtime !== 'memory' && runtime !== 't3n') throw new Error(`Unsupported runtime: ${runtime}`);

  let deps = options.deps;
  if (runtime === 't3n' && !deps) {
    const config = loadRuntimeConfig(options.env);
    const baseUrl = (config.baseUrl ?? NODE_URLS[config.environment])?.replace(/\/+$/, '');
    if (!baseUrl || !config.apiKey) {
      throw new Error('T3N CLI mode requires an authenticated TenantClient or T3N_API_KEY/T3N_AGENT_API_KEY runtime configuration.');
    }
    const session = await (options.t3nBootstrap ?? bootstrapT3nApiKeySession)({
      environment: config.environment,
      baseUrl,
      apiKey: config.apiKey,
      mapTail: config.privateMap,
    });
    deps = session.dependencies;
  }

  const readFile = options.readFile ?? (async (path: string) => fsReadFile(path, 'utf8'));
  const write = options.write ?? ((text: string) => process.stdout.write(`${text}\n`));
  const incident = JSON.parse(await readFile(inputPath));
  deps ??= createMemoryDependencies();
  const report = await triageIncident(incident, deps);
  write(JSON.stringify(report, null, 2));
  return 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  runCli(process.argv.slice(2)).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown CLI error';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
