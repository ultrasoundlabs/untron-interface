import { TronWeb } from 'tronweb';

import { env } from '$env/dynamic/private';
import { TRON_USDT } from '$lib/config/swapConfig';

export interface TronRelayerBalance {
	address: string;
	balanceSun: bigint;
	label?: string;
}

export interface TronRelayerCredential {
	addressBase58: string;
	label: string;
	privateKeyHex: string;
}

export interface Trc20Contract {
	balanceOf(address: string): {
		call(): Promise<unknown>;
	};
	transfer(
		address: string,
		amount: string | number | bigint
	): {
		send(options?: {
			feeLimit?: number;
			callValue?: number;
			shouldPollResponse?: boolean;
		}): Promise<unknown>;
	};
}

const RELAYER_KEYS_ENV = 'TRON_RELAYER_PRIVATE_KEYS'; // comma-separated hex private keys
const TRON_RPC_ENV = 'TRON_RPC_URL'; // HTTP(s) endpoint for a Tron full node
const RELAYER_BALANCE_TTL_MS = 5000; // cache relayer balances for 5s to avoid RPC spam

let cachedRelayers: TronRelayerCredential[] | null = null;
let relayerLookup: Map<string, TronRelayerCredential> | null = null;
const signerClients = new Map<string, TronWeb>();
const usdtContractCache = new Map<TronWeb, Promise<Trc20Contract>>();
let tronWebClient: TronWeb | null = null;

let relayerBalancesCache: {
	balances: TronRelayerBalance[];
	fetchedAt: number;
} | null = null;
let relayerBalancesPromise: Promise<TronRelayerBalance[]> | null = null;

function normalizePrivateKey(rawKey: string): string {
	const trimmed = rawKey.trim();
	if (trimmed.length === 0) {
		throw new Error('Encountered empty Tron relayer private key entry.');
	}
	return trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
}

function buildRelayerLabel(address: string, index: number): string {
	const prefix = address.slice(0, 6);
	const suffix = address.slice(-4);
	return `Relayer ${index + 1} (${prefix}…${suffix})`;
}

function parseRelayerPrivateKeys(): TronRelayerCredential[] {
	if (cachedRelayers) {
		return cachedRelayers;
	}

	const rawKeys = env[RELAYER_KEYS_ENV] ?? '';
	const keys = rawKeys
		.split(',')
		.map((value) => value.trim())
		.filter((value) => value.length > 0);

	if (keys.length === 0) {
		cachedRelayers = [];
		return cachedRelayers;
	}

	const relayers: TronRelayerCredential[] = keys.map((entry, index) => {
		const normalized = normalizePrivateKey(entry);
		try {
			const derivedAddress = TronWeb.address.fromPrivateKey(normalized);
			if (!derivedAddress) {
				throw new Error('Unable to derive Tron address from private key.');
			}
			return {
				addressBase58: derivedAddress,
				label: buildRelayerLabel(derivedAddress, index),
				privateKeyHex: normalized
			};
		} catch (error) {
			throw new Error(
				`Invalid Tron relayer private key at index ${index}. ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	});

	cachedRelayers = relayers;
	relayerLookup = new Map(relayers.map((credential) => [credential.addressBase58, credential]));
	signerClients.clear();
	return relayers;
}

function ensureRelayerLookup(): Map<string, TronRelayerCredential> {
	if (!relayerLookup) {
		const relayers = parseRelayerPrivateKeys();
		relayerLookup = new Map(relayers.map((credential) => [credential.addressBase58, credential]));
	}
	return relayerLookup;
}

function getTronRpcUrl(): string {
	const rpcUrl = env[TRON_RPC_ENV];
	if (!rpcUrl) {
		throw new Error(`Missing ${TRON_RPC_ENV} environment variable for Tron RPC access.`);
	}
	return rpcUrl;
}

function getTronWeb(): TronWeb {
	if (tronWebClient) {
		return tronWebClient;
	}

	const fullHost = getTronRpcUrl();
	tronWebClient = new TronWeb({
		fullHost
	});
	return tronWebClient;
}

function toBigInt(value: unknown): bigint {
	if (typeof value === 'bigint') {
		return value;
	}
	if (typeof value === 'number') {
		return BigInt(value);
	}
	if (typeof value === 'string') {
		if (value.length === 0) {
			return 0n;
		}
		return BigInt(value);
	}
	if (Array.isArray(value) && value.length > 0) {
		return toBigInt(value[0]);
	}
	if (value && typeof value === 'object') {
		const maybeHex = (value as { _hex?: string })._hex;
		if (typeof maybeHex === 'string') {
			return BigInt(maybeHex);
		}
		if ('toString' in value && typeof value.toString === 'function') {
			return BigInt(value.toString());
		}
	}
	throw new Error('Unable to convert TRC-20 balance to bigint.');
}

async function fetchRelayerBalances(): Promise<TronRelayerBalance[]> {
	const relayers = parseRelayerPrivateKeys();
	if (relayers.length === 0) {
		return [];
	}
	const referenceRelayer = relayers[0];

	// Use a signer-scoped TronWeb client so that TronWeb has a default
	// owner address set. Some Tron full nodes require `owner_address`
	// for even constant contract calls, and a purely read-only client
	// without a default address will fail with `owner_address isn't set`.
	//
	// We can safely reuse a single signer client + USDT contract for
	// all balance checks: `owner_address` only needs to be *some* valid
	// address, it does not need to match the `balanceOf` target.
	const tronWeb = getSignerTronWeb(referenceRelayer.addressBase58);
	const contract = await getUsdtContractForClient(tronWeb);

	const balances = await Promise.all(
		relayers.map(async (relayer) => {
			const balanceResult = await contract.balanceOf(relayer.addressBase58).call();
			const balanceSun = toBigInt(balanceResult);

			return {
				address: relayer.addressBase58,
				label: relayer.label,
				balanceSun
			};
		})
	);

	return balances;
}

/**
 * Fetch the TRC-20 USDT balances for every configured relayer EOA.
 * Results are cached for a short TTL to avoid spamming the Tron RPC
 * provider (many UIs will call this endpoint frequently).
 */
export async function getTronRelayerBalances(): Promise<TronRelayerBalance[]> {
	const now = Date.now();
	if (relayerBalancesCache && now - relayerBalancesCache.fetchedAt < RELAYER_BALANCE_TTL_MS) {
		return relayerBalancesCache.balances;
	}

	if (relayerBalancesPromise) {
		return relayerBalancesPromise;
	}

	const promise = fetchRelayerBalances();
	relayerBalancesPromise = promise;

	try {
		const balances = await promise;
		relayerBalancesCache = {
			balances,
			fetchedAt: Date.now()
		};
		return balances;
	} finally {
		// Always clear the in-flight marker so future calls can refetch
		// if needed, even when the underlying request fails.
		if (relayerBalancesPromise === promise) {
			relayerBalancesPromise = null;
		}
	}
}

export function getRelayerCredentials(): TronRelayerCredential[] {
	return parseRelayerPrivateKeys();
}

export function getRelayerCredential(address: string): TronRelayerCredential | null {
	if (!address) return null;
	const lookup = ensureRelayerLookup();
	return lookup.get(address) ?? null;
}

export function getSignerTronWeb(address: string): TronWeb {
	const credential = getRelayerCredential(address);
	if (!credential) {
		throw new Error(`Unknown Tron relayer address: ${address}`);
	}

	const cached = signerClients.get(credential.addressBase58);
	if (cached) {
		return cached;
	}

	const client = new TronWeb({
		fullHost: getTronRpcUrl(),
		privateKey: credential.privateKeyHex
	});
	signerClients.set(credential.addressBase58, client);
	return client;
}

export async function getUsdtContractForClient(tronWeb: TronWeb): Promise<Trc20Contract> {
	const cached = usdtContractCache.get(tronWeb);
	if (cached) {
		return cached;
	}

	const promise: Promise<Trc20Contract> = (async () => {
		const contract = await tronWeb.contract().at(TRON_USDT.address);
		return contract as unknown as Trc20Contract;
	})();

	usdtContractCache.set(tronWeb, promise);

	try {
		return await promise;
	} catch (error) {
		if (usdtContractCache.get(tronWeb) === promise) {
			usdtContractCache.delete(tronWeb);
		}
		throw error;
	}
}

export function getReadonlyTronWeb(): TronWeb {
	return getTronWeb();
}

export function chooseBestRelayer(
	balances: TronRelayerBalance[],
	requiredSun: bigint
): TronRelayerBalance | null {
	const eligible = balances.filter((entry) => entry.balanceSun >= requiredSun);
	if (eligible.length === 0) {
		return null;
	}

	return [...eligible].sort((a, b) => {
		if (a.balanceSun === b.balanceSun) return 0;
		return a.balanceSun < b.balanceSun ? -1 : 1;
	})[0];
}

/**
 * Capacity UI wants to surface the single largest relayer as "available liquidity".
 */
export function getTotalRelayerLiquiditySun(balances: TronRelayerBalance[]): bigint {
	return balances.reduce<bigint>((currentMax, entry) => {
		return entry.balanceSun > currentMax ? entry.balanceSun : currentMax;
	}, 0n);
}
