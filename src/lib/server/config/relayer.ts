/**
 * Server-only EVM relayer configuration.
 * Defines per-chain relay modes (EOA vs AA) and bundler URL helpers.
 */

import { env } from '$env/dynamic/private';
import type { SupportedChainId } from '$lib/config/chains';

// =============================================================================
// Types
// =============================================================================

export type RelayMode = 'eoa' | 'aa';

export interface AaParams {
	/** Override the default entry point address (v0.7) */
	entryPoint?: `0x${string}`;
	/** Smart account type to use */
	accountType?: 'safe' | 'kernel' | 'simple';
	/** Safe version when using Safe accounts */
	safeVersion?: '1.4.1';
}

export interface ChainRelayConfig {
	/** Relay mode for this chain */
	mode: RelayMode;
	/** AA-specific parameters (only used when mode is 'aa') */
	aa?: AaParams;
	/**
	 * Whether to fall back to EOA if AA infra is unhealthy.
	 * When true, AA failures mark the chain as unhealthy for a short window and
	 * subsequent relays will use the EOA path until AA recovers.
	 */
	allowEoaFallback?: boolean;
}

// =============================================================================
// Per-chain relay configuration
// =============================================================================

/**
 * Per-chain relay configuration.
 * Chains not listed here default to EOA mode.
 */
const CHAIN_RELAY_CONFIG: Partial<Record<SupportedChainId, ChainRelayConfig>> = {
	// Ethereum mainnet - AA with EOA fallback
	1: { mode: 'aa', allowEoaFallback: true },
	// Arbitrum One - AA with EOA fallback
	42161: { mode: 'aa', allowEoaFallback: true },
	// Base - AA with EOA fallback
	8453: { mode: 'aa', allowEoaFallback: true },
	// OP Mainnet - AA with EOA fallback
	10: { mode: 'aa', allowEoaFallback: true },
	// Polygon - AA with EOA fallback
	137: { mode: 'aa', allowEoaFallback: true },
	// Plasma - AA with EOA fallback
	9745: { mode: 'aa', allowEoaFallback: true },
	// Mantle - AA with EOA fallback
	5000: { mode: 'aa', allowEoaFallback: true },
	// Monad - AA with EOA fallback
	143: { mode: 'aa', allowEoaFallback: true },
	// Unichain - AA with EOA fallback
	130: { mode: 'aa', allowEoaFallback: true },

	// Celo - EOA only (not supported by Gelato or other bundlers)
	42220: { mode: 'eoa' },
	// World Chain - EOA only (not supported by Gelato or other bundlers)
	480: { mode: 'eoa' }
};

const DEFAULT_RELAY_CONFIG: ChainRelayConfig = { mode: 'eoa' };

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get the relay configuration for a given chain.
 * Returns EOA-only config for chains not explicitly configured.
 */
export function getRelayConfig(chainId: SupportedChainId): ChainRelayConfig {
	return CHAIN_RELAY_CONFIG[chainId] ?? DEFAULT_RELAY_CONFIG;
}

/**
 * Get the bundler RPC URL for a given chain.
 * Returns undefined if BUNDLER_RPC_URL_TEMPLATE is not set.
 *
 * The template should contain `<chain-id>` which will be replaced with the actual chain ID.
 * Example: https://api.gelato.digital/bundlers/<chain-id>/rpc?apiKey=YOUR_SPONSOR_KEY&sponsored=true
 */
export function getBundlerRpcUrl(chainId: SupportedChainId): string | undefined {
	const template = env.BUNDLER_RPC_URL_TEMPLATE;
	if (!template) return undefined;
	return template.replace('<chain-id>', String(chainId));
}

/**
 * Get the EOA relayer private key from environment.
 * Throws if not configured when called.
 */
export function getRelayerEoaPrivateKey(): `0x${string}` {
	const key = env.RELAYER_EOA_PRIVATE_KEY;
	if (!key) {
		throw new Error('RELAYER_EOA_PRIVATE_KEY is not configured');
	}
	if (!key.startsWith('0x')) {
		throw new Error('RELAYER_EOA_PRIVATE_KEY must start with 0x');
	}
	return key as `0x${string}`;
}
