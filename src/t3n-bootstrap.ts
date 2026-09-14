import {
  T3nClient,
  TenantClient,
  createEthAuthInput,
  eth_get_address,
  loadWasmComponent,
  metamask_sign,
} from '@terminal3/t3n-sdk';
import { resolveVerifiedT3nTrustAnchor } from './adapters/t3n.js';
import { createT3nDependencies } from './runtime.js';
import type { TriageDependencies } from './domain/ports.js';

export type T3nEnvironment = 'sandbox' | 'testnet' | 'production';

type SessionClient = Pick<T3nClient, 'handshake' | 'authenticate' | 'execute' | 'executeWithBlob'>;
type TenantClientLike = Pick<TenantClient, 'maps'>;

type BootstrapSdk = {
  resolveTrustAnchor: typeof resolveVerifiedT3nTrustAnchor;
  loadWasm: typeof loadWasmComponent;
  ethGetAddress: typeof eth_get_address;
  metamaskSign: typeof metamask_sign;
  createAuthInput: typeof createEthAuthInput;
  createClient: (config: ConstructorParameters<typeof T3nClient>[0]) => SessionClient;
  createTenantClient: (config: ConstructorParameters<typeof TenantClient>[0]) => TenantClientLike;
};

const defaultSdk: BootstrapSdk = {
  resolveTrustAnchor: resolveVerifiedT3nTrustAnchor,
  loadWasm: loadWasmComponent,
  ethGetAddress: eth_get_address,
  metamaskSign: metamask_sign,
  createAuthInput: createEthAuthInput,
  createClient: (config) => new T3nClient(config),
  createTenantClient: (config) => new TenantClient(config),
};

export type T3nApiKeySession = {
  did: string;
  client: SessionClient;
  tenantClient: TenantClientLike;
  dependencies: TriageDependencies;
};

export async function bootstrapT3nApiKeySession(options: {
  environment: T3nEnvironment;
  baseUrl: string;
  apiKey: string;
  mapTail?: string;
  sdk?: BootstrapSdk;
}): Promise<T3nApiKeySession> {
  const sdk = options.sdk ?? defaultSdk;
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  const trustAnchor = await sdk.resolveTrustAnchor({ environment: options.environment, baseUrl });
  const wasmComponent = await sdk.loadWasm();
  const address = sdk.ethGetAddress(options.apiKey);
  const client = sdk.createClient({
    baseUrl,
    trustAnchor,
    wasmComponent,
    handlers: { EthSign: sdk.metamaskSign(address, undefined, options.apiKey) },
  });
  await client.handshake();
  const did = (await client.authenticate(sdk.createAuthInput(address))).toString();
  const tenantClient = sdk.createTenantClient({
    environment: options.environment,
    endpoint: baseUrl,
    baseUrl,
    t3n: client,
    tenantDid: did,
  });
  const dependencies = createT3nDependencies({
    tenantClient,
    baseUrl,
    did,
    mapTail: options.mapTail,
  });
  return { did, client, tenantClient, dependencies };
}
