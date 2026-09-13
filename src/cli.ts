import { readFile as fsReadFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { triageIncident } from './domain/triage.js';
import { createMemoryDependencies } from './runtime.js';
import type { TriageDependencies } from './domain/ports.js';

type CliOptions = {
  deps?: TriageDependencies;
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
  if (runtime === 't3n' && !options.deps) {
    throw new Error('T3N CLI mode requires an authenticated TenantClient; use createT3nDependencies() after T3N authentication.');
  }

  const readFile = options.readFile ?? (async (path: string) => fsReadFile(path, 'utf8'));
  const write = options.write ?? ((text: string) => process.stdout.write(`${text}\n`));
  const incident = JSON.parse(await readFile(inputPath));
  const deps = options.deps ?? createMemoryDependencies();
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
