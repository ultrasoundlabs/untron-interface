/**
 * Static frontend configuration for supported chains, tokens, and swap rules.
 * Dynamic data (rates, capacity, fees) comes from the backend.
 */

import type {
	SupportedChain,
	SupportedToken,
	TronToken,
	EvmStablecoin,
	SwapDirection
} from '$lib/types/swap';
import {
	TOKEN_METADATA as BASE_TOKEN_METADATA,
	getSupportedChains,
	supportedChainIds
} from './chains';

// ============================================================================
// Tron Configuration
// ============================================================================

export const TRON_USDT: TronToken = {
	symbol: 'USDT',
	name: 'Tether USD',
	address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // Mainnet USDT TRC-20
	decimals: 6,
	logoUrl: '/logos/tokens/usdt.svg'
};

// ============================================================================
// EVM Chains Configuration
// ============================================================================

const CHAIN_DEFINITIONS = getSupportedChains();

const SUPPORTED_CHAIN_LIST: SupportedChain[] = CHAIN_DEFINITIONS.map(
	({ chainId, name, logoUrl, isTestnet, explorerUrl }) => ({
		chainId,
		name,
		logoUrl,
		isTestnet,
		explorerUrl
	})
);

const SUPPORTED_CHAIN_MAP = new Map(SUPPORTED_CHAIN_LIST.map((chain) => [chain.chainId, chain]));

export const SUPPORTED_CHAINS: SupportedChain[] = SUPPORTED_CHAIN_LIST;

// ============================================================================
// Token Configurations per Chain
// ============================================================================

/**
 * Token addresses per chain. Not all tokens are available on all chains.
 * Addresses are checksummed.
 */
export const TOKEN_ADDRESSES: Record<
	number,
	Partial<Record<EvmStablecoin, `0x${string}`>>
> = Object.fromEntries(CHAIN_DEFINITIONS.map(({ chainId, tokens }) => [chainId, tokens]));

/**
 * Token metadata (same across all chains)
 */
export const TOKEN_METADATA: Record<
	EvmStablecoin,
	Omit<SupportedToken, 'address'>
> = BASE_TOKEN_METADATA;

// ============================================================================
// Swap Direction Rules
// ============================================================================

/**
 * Configuration for what's allowed in each direction
 */
export interface DirectionConfig {
	/** Tokens allowed as source (for EVM→Tron) or destination (for Tron→EVM) */
	allowedTokens: EvmStablecoin[];
	/** Chains allowed for this direction */
	allowedChainIds: number[];
}

/**
 * Direction-specific rules. Some chains/tokens might only work in one direction.
 */
export const DIRECTION_CONFIG: Record<SwapDirection, DirectionConfig> = {
	TRON_TO_EVM: {
		allowedTokens: ['USDT', 'USDC'],
		allowedChainIds: [...supportedChainIds]
	},
	EVM_TO_TRON: {
		allowedTokens: ['USDT', 'USDC'],
		allowedChainIds: [...supportedChainIds]
	}
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a chain by its ID
 */
export function getChainById(chainId: number): SupportedChain | undefined {
	return SUPPORTED_CHAIN_MAP.get(chainId);
}

/**
 * Get supported tokens for a specific chain
 */
export function getTokensForChain(chainId: number): SupportedToken[] {
	const addresses = TOKEN_ADDRESSES[chainId];
	if (!addresses) return [];

	return (Object.entries(addresses) as [EvmStablecoin, `0x${string}`][]).map(
		([symbol, address]) => ({
			...TOKEN_METADATA[symbol],
			address
		})
	);
}

/**
 * Get a specific token on a specific chain
 */
export function getTokenOnChain(
	chainId: number,
	symbol: EvmStablecoin
): SupportedToken | undefined {
	const address = TOKEN_ADDRESSES[chainId]?.[symbol];
	if (!address) return undefined;

	return {
		...TOKEN_METADATA[symbol],
		address
	};
}

/**
 * Check if a token is available on a chain for a given direction
 */
export function isTokenAvailableForDirection(
	chainId: number,
	symbol: EvmStablecoin,
	direction: SwapDirection
): boolean {
	const config = DIRECTION_CONFIG[direction];
	if (!config.allowedChainIds.includes(chainId)) return false;
	if (!config.allowedTokens.includes(symbol)) return false;
	return TOKEN_ADDRESSES[chainId]?.[symbol] !== undefined;
}

/**
 * Get all valid token/chain pairs for a direction
 */
export function getValidPairsForDirection(direction: SwapDirection): Array<{
	chain: SupportedChain;
	token: SupportedToken;
}> {
	const config = DIRECTION_CONFIG[direction];
	const pairs: Array<{ chain: SupportedChain; token: SupportedToken }> = [];

	for (const chainId of config.allowedChainIds) {
		const chain = getChainById(chainId);
		if (!chain) continue;

		for (const symbol of config.allowedTokens) {
			const token = getTokenOnChain(chainId, symbol);
			if (token) {
				pairs.push({ chain, token });
			}
		}
	}

	return pairs;
}

/**
 * Get chains that support a specific token for a direction
 */
export function getChainsForToken(
	symbol: EvmStablecoin,
	direction: SwapDirection
): SupportedChain[] {
	const config = DIRECTION_CONFIG[direction];

	return config.allowedChainIds
		.filter((chainId) => TOKEN_ADDRESSES[chainId]?.[symbol] !== undefined)
		.map((chainId) => getChainById(chainId))
		.filter((chain): chain is SupportedChain => chain !== undefined);
}

/**
 * Get tokens available on a specific chain for a direction
 */
export function getTokensForChainAndDirection(
	chainId: number,
	direction: SwapDirection
): SupportedToken[] {
	const config = DIRECTION_CONFIG[direction];
	if (!config.allowedChainIds.includes(chainId)) return [];

	return config.allowedTokens
		.filter((symbol) => TOKEN_ADDRESSES[chainId]?.[symbol] !== undefined)
		.map((symbol) => getTokenOnChain(chainId, symbol))
		.filter((token): token is SupportedToken => token !== undefined);
}

// ============================================================================
// Default Selections
// ============================================================================

/**
 * Default EVM selection for new users (Ethereum USDC - safest, most liquid)
 */
export const DEFAULT_EVM_CHAIN_ID = 1; // Ethereum
export const DEFAULT_EVM_TOKEN: EvmStablecoin = 'USDC';

/**
 * Get the default EVM selection
 */
export function getDefaultEvmSelection(): { chain: SupportedChain; token: SupportedToken } {
	const chain = getChainById(DEFAULT_EVM_CHAIN_ID)!;
	const token = getTokenOnChain(DEFAULT_EVM_CHAIN_ID, DEFAULT_EVM_TOKEN)!;
	return { chain, token };
}
