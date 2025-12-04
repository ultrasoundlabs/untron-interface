/**
 * Swap-related TypeScript types for the Untron bridge.
 * These types define the data model for cross-chain swaps between Tron USDT and EVM stablecoins.
 */

// ============================================================================
// Direction & Core Enums
// ============================================================================

/**
 * Swap direction - the protocol only supports Tron<>EVM swaps, not EVM<>EVM or Tron<>Tron
 */
export type SwapDirection = 'TRON_TO_EVM' | 'EVM_TO_TRON';

/**
 * Supported stablecoin symbols on EVM chains
 */
export type EvmStablecoin = 'USDT' | 'USDC';

// ============================================================================
// Chain & Token Types
// ============================================================================

/**
 * Represents a supported EVM chain
 */
export interface SupportedChain {
	/** Chain ID as used by wagmi/viem */
	chainId: number;
	/** Human-readable chain name */
	name: string;
	/** Path to chain logo */
	logoUrl: string;
	/** Whether this chain is a testnet */
	isTestnet: boolean;
	/** Block explorer URL */
	explorerUrl: string;
}

/**
 * Represents a supported token on a specific chain
 */
export interface SupportedToken {
	/** Token symbol */
	symbol: EvmStablecoin;
	/** Token name */
	name: string;
	/** Token contract address on the chain */
	address: `0x${string}`;
	/** Token decimals (typically 6 for USDT/USDC) */
	decimals: number;
	/** Path to token logo */
	logoUrl: string;
}

/**
 * Represents the Tron side of a swap (always USDT)
 */
export interface TronToken {
	symbol: 'USDT';
	name: 'Tether USD';
	/** TRC-20 contract address */
	address: string;
	decimals: 6;
	logoUrl: string;
}

/**
 * A token on a specific chain - used for EVM side selection
 */
export interface TokenChainPair {
	chain: SupportedChain;
	token: SupportedToken;
}

/**
 * Token/chain pair with user balance - used in EVM→Tron selection dialog
 */
export interface TokenChainBalance extends TokenChainPair {
	/** User's balance in the token's smallest unit (as bigint string for serialization) */
	balance: string;
	/** Formatted balance for display */
	formattedBalance: string;
}

// ============================================================================
// Swap Side Types
// ============================================================================

/**
 * Represents the Tron side of a swap
 */
export interface TronSide {
	type: 'tron';
	token: TronToken;
	/** Amount in smallest unit (sun for USDT = 6 decimals) as string to avoid precision loss */
	amount: string;
}

/**
 * Represents the EVM side of a swap
 */
export interface EvmSide {
	type: 'evm';
	chain: SupportedChain;
	token: SupportedToken;
	/** Amount in smallest unit as string to avoid precision loss */
	amount: string;
}

/**
 * Union type for either side of a swap
 */
export type SwapSide = TronSide | EvmSide;

// ============================================================================
// Quote & Capacity Types
// ============================================================================

/**
 * Fee breakdown for a swap
 */
export interface FeeBreakdown {
	/** Protocol fee in basis points */
	protocolFeeBps: number;
	/** Protocol fee amount in destination token's smallest unit */
	protocolFeeAmount: string;
	/** Network/gas fee estimate in destination token's smallest unit */
	networkFeeAmount: string;
	/** Total fees in destination token's smallest unit */
	totalFeeAmount: string;
}

/**
 * A swap quote returned from the server
 */
export interface SwapQuote {
	/** Direction of the swap */
	direction: SwapDirection;
	/** Input amount in source token's smallest unit */
	inputAmount: string;
	/** Expected output amount after fees (destination token's smallest unit) */
	outputAmount: string;
	/** Effective exchange rate (1 input = X output, as string) */
	effectiveRate: string;
	/** Fee breakdown */
	fees: FeeBreakdown;
	/** Estimated time to completion in seconds */
	estimatedTimeSeconds: number;
	/** Optional hint/warning to show user (e.g. "Large swap may take longer") */
	hint?: string;
	/** Quote validity timestamp (Unix ms) */
	expiresAt: number;
}

/**
 * Protocol capacity info for a specific pair
 */
export interface CapacityInfo {
	/** Maximum amount the protocol can handle for this pair (in source token's smallest unit) */
	maxAmount: string;
	/** Minimum amount required for this pair */
	minAmount: string;
	/** Current available liquidity */
	availableLiquidity: string;
	/** When this capacity info was fetched (Unix ms) */
	fetchedAt: number;
	/** When this info should be refreshed (Unix ms) */
	refreshAt: number;
}

// ============================================================================
// Orderless Swap Result Types
// ============================================================================

export interface Eip712Payload {
	id: string;
	domain: {
		name: string;
		version: string;
		chainId: number;
		verifyingContract: `0x${string}`;
	};
	types: Record<string, Array<{ name: string; type: string }>>;
	primaryType: string;
	message: Record<string, unknown>;
}

export interface TronDepositTicket {
	direction: 'TRON_TO_EVM';
	evmChainId: number;
	evmToken: EvmStablecoin;
	amount: string;
	recipientAddress: string;
	depositAddress: string;
	expectedAmount: string;
	expiresAt: number;
	quote: SwapQuote;
}

export interface TronDepositResponse {
	orderId: string;
	ticket: TronDepositTicket;
}

export interface TronToEvmOrderView extends TronDepositTicket {
	kind: 'tronDeposit';
	id: string;
}

// ============================================================================
// Stateless EVM→Tron Flow Types
// ============================================================================

/**
 * Request payload for preparing single-use EIP-712 payloads on the server.
 * Direction is fixed to EVM→Tron for this flow.
 */
export interface EvmToTronPrepareRequest {
	direction: 'EVM_TO_TRON';
	evmChainId: number;
	evmToken: EvmStablecoin;
	amount: string;
	recipientAddress: string;
	evmSignerAddress: `0x${string}`;
}

/**
 * Response payload returned by the stateless prepare endpoint.
 */
export interface EvmToTronPrepareResponse {
	/** Deterministic payloads that the client must present for signing */
	payloads: Eip712Payload[];
	/** Address of the protocol relay account (Safe/EOA) that receives ERC-3009 funds */
	relayAccountAddress: `0x${string}`;
	/** Quote snapshot used when building the payloads */
	quote: SwapQuote;
	/** Unix ms timestamp when the payloads were generated */
	preparedAt: number;
}

/**
 * Request payload for executing an EVM→Tron swap with signed authorizations.
 */
export interface EvmToTronExecuteRequest extends EvmToTronPrepareRequest {
	/** Payloads that were presented to the user for signing */
	payloads: Eip712Payload[];
	/** Raw signatures keyed by payload ID */
	payloadSignatures: Record<string, `0x${string}`>;
}

/**
 * Lightweight execution summary returned after relay submission.
 */
export interface SwapExecutionSummary {
	orderId: string;
	direction: 'EVM_TO_TRON';
	evmChainId: number;
	evmToken: EvmStablecoin;
	amount: string;
	recipientAddress: string;
	evmTxHash: `0x${string}`;
	relayMethod: 'aa' | 'eoa';
	status: 'relaying' | 'completed' | 'failed';
	tronTxHash?: string;
}

/**
 * Stateless response for the EVM→Tron execute endpoint.
 */
export interface EvmToTronExecuteResponse {
	execution: SwapExecutionSummary;
}

/**
 * Normalized view returned by GET /api/swap/order/:id in a stateless world.
 */
export interface EvmRelayOrderView {
	kind: 'evmRelay';
	id: string;
	direction: 'EVM_TO_TRON';
	status: 'relaying' | 'completed' | 'failed';
	evmTxHash?: `0x${string}`;
	tronTxHash?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Internal helper to encode/decode stateless order IDs.
 */
export interface EvmRelayOrderIdParts {
	evmChainId: number;
	evmTxHash: `0x${string}`;
}

/**
 * Order creation request
 */
export interface TronToEvmDepositRequest {
	direction: 'TRON_TO_EVM';
	evmChainId: number;
	evmToken: EvmStablecoin;
	amount: string;
	recipientAddress: string;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation error for swap form
 */
export type SwapValidationErrorCode =
	| 'AMOUNT_REQUIRED'
	| 'AMOUNT_INVALID'
	| 'AMOUNT_ZERO'
	| 'AMOUNT_TOO_LOW'
	| 'AMOUNT_TOO_HIGH'
	| 'RECIPIENT_REQUIRED'
	| 'RECIPIENT_INVALID_EVM'
	| 'RECIPIENT_INVALID_TRON';

export interface SwapValidationError {
	field: 'amount' | 'recipient' | 'token' | 'chain' | 'general';
	code: SwapValidationErrorCode;
}

/**
 * Result of swap form validation
 */
export interface SwapValidationResult {
	isValid: boolean;
	errors: SwapValidationError[];
}
