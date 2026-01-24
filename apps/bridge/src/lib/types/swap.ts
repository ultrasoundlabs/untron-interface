/**
 * Swap-related TypeScript types for the Untron Bridge UI.
 *
 * The bridge UI is a frontend over the Untron Bridge OpenAPI:
 * `src/lib/api/schema.d.ts` (generated from `openapi.json`).
 */

import type { components } from '$lib/api/schema';

// ============================================================================
// Direction & Core Enums
// ============================================================================

export type SwapDirection = 'TRON_TO_EVM' | 'EVM_TO_TRON';

export type EvmStablecoin = 'USDT' | 'USDC';

// ============================================================================
// Chain & Token Types (UI metadata)
// ============================================================================

export interface SupportedChain {
	chainId: number;
	name: string;
	logoUrl: string;
	isTestnet: boolean;
	explorerUrl: string;
}

export interface SupportedToken {
	symbol: EvmStablecoin;
	name: string;
	address: `0x${string}`;
	decimals: number;
	logoUrl: string;
}

export interface TronToken {
	symbol: EvmStablecoin;
	name: string;
	address: string;
	decimals: number;
	logoUrl: string;
}

export interface TokenChainPair {
	chain: SupportedChain;
	token: SupportedToken;
}

export interface TokenChainBalance extends TokenChainPair {
	balance: string;
	formattedBalance: string;
}

// ============================================================================
// API Types (Bridge OpenAPI)
// ============================================================================

export type BridgeCapabilities = components['schemas']['Capabilities'];
export type BridgeQuote = components['schemas']['Quote'];
export type BridgeOrder = components['schemas']['Order'];
export type BridgeDepositRequirement = components['schemas']['DepositRequirement'];
export type BridgeFeeComponent = components['schemas']['FeeComponent'];

// ============================================================================
// Validation Types
// ============================================================================

export type SwapValidationErrorCode =
	| 'AMOUNT_REQUIRED'
	| 'AMOUNT_INVALID'
	| 'AMOUNT_ZERO'
	| 'AMOUNT_TOO_LOW'
	| 'AMOUNT_TOO_HIGH'
	| 'RECIPIENT_REQUIRED'
	| 'RECIPIENT_INVALID_EVM'
	| 'RECIPIENT_INVALID_TRON'
	| 'CAPABILITIES_UNAVAILABLE'
	| 'PAIR_UNSUPPORTED';

export interface SwapValidationError {
	field: 'amount' | 'recipient' | 'token' | 'chain' | 'general';
	code: SwapValidationErrorCode;
}
