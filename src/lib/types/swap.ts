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
	/** Short name for compact display */
	shortName: string;
	/** Path to chain logo */
	logoUrl: string;
	/** Whether this chain is a testnet */
	isTestnet: boolean;
	/** Native currency symbol (for display) */
	nativeCurrency: string;
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
// Order Types
// ============================================================================

/**
 * Order status enum
 */
export type OrderStatusType =
	| 'created'
	| 'awaiting_payment' // Tron→EVM: waiting for Tron deposit
	| 'awaiting_signatures' // EVM→Tron: waiting for user to sign EIP-712 payloads
	| 'signatures_submitted' // EVM→Tron: signatures submitted, processing
	| 'relaying' // Transaction being relayed
	| 'completed'
	| 'failed'
	| 'expired'
	| 'cancelled';

/**
 * An EIP-712 payload that needs to be signed (for EVM→Tron flow)
 */
export interface Eip712Payload {
	/** Unique ID for this payload */
	id: string;
	/** Domain data for EIP-712 */
	domain: {
		name: string;
		version: string;
		chainId: number;
		verifyingContract: `0x${string}`;
	};
	/** Types for EIP-712 */
	types: Record<string, Array<{ name: string; type: string }>>;
	/** Primary type name */
	primaryType: string;
	/** Message to sign */
	message: Record<string, unknown>;
}

/**
 * Timeline event for order progress tracking
 */
export interface OrderTimelineEvent {
	/** Event type */
	type: OrderStatusType | 'signature_received';
	/** When this event occurred (Unix ms) */
	timestamp: number;
	/** Optional transaction hash if applicable */
	txHash?: string;
	/** Optional additional details */
	details?: string;
}

/**
 * Tron deposit info for Tron→EVM orders
 */
export interface TronDepositInfo {
	/** Tron address to send USDT to */
	depositAddress: string;
	/** Exact amount to send (in sun) */
	expectedAmount: string;
	/** Deadline for deposit (Unix ms) */
	expiresAt: number;
}

/**
 * Order data structure
 */
export interface Order {
	/** Unique order ID */
	id: string;
	/** Swap direction */
	direction: SwapDirection;
	/** Current status */
	status: OrderStatusType;
	/** Source side details */
	source: SwapSide;
	/** Destination side details */
	destination: SwapSide;
	/** Recipient address (EVM address for Tron→EVM, Tron address for EVM→Tron) */
	recipientAddress: string;
	/** Quote used for this order */
	quote: SwapQuote;
	/** For Tron→EVM: deposit info */
	tronDeposit?: TronDepositInfo;
	/** For EVM→Tron: payloads to sign */
	eip712Payloads?: Eip712Payload[];
	/** Number of signatures received (for EVM→Tron) */
	signaturesReceived?: number;
	/** Timeline of events */
	timeline: OrderTimelineEvent[];
	/** Order creation timestamp (Unix ms) */
	createdAt: number;
	/** Last update timestamp (Unix ms) */
	updatedAt: number;
	/** Final transaction hashes when completed */
	finalTxHashes?: {
		source?: string;
		destination?: string;
	};
}

/**
 * Pre-order signing session for EVM→Tron swaps
 */
export interface SigningSession {
	/** Unique session ID */
	id: string;
	/** Direction is always EVM→Tron for signing sessions */
	direction: 'EVM_TO_TRON';
	/** Address that must sign the payloads */
	evmSignerAddress: `0x${string}`;
	/** Selected EVM chain ID */
	evmChainId: number;
	/** Selected EVM token symbol */
	evmToken: EvmStablecoin;
	/** Amount in source token's smallest unit */
	amount: string;
	/** Destination Tron recipient address */
	recipientAddress: string;
	/** Quote captured at session creation */
	quote: SwapQuote;
	/** Payloads that must be signed */
	eip712Payloads: Eip712Payload[];
	/** Number of signatures received so far */
	signaturesReceived: number;
	/** IDs of payloads that have valid signatures */
	signedPayloadIds: string[];
	/** Creation timestamp (Unix ms) */
	createdAt: number;
	/** Last update timestamp (Unix ms) */
	updatedAt: number;
	/** When finalized, stores the resulting order ID */
	finalizedOrderId?: string;
}

export interface CreateSigningSessionRequest extends CreateOrderRequest {
	evmSignerAddress: `0x${string}`;
}

export interface CreateSigningSessionResponse {
	session: SigningSession;
}

export interface SubmitSigningSessionSignaturesRequest {
	sessionId: string;
	signatures: Array<{ payloadId: string; signature: string }>;
}

export interface SubmitSigningSessionSignaturesResponse {
	session: SigningSession;
}

export interface FinalizeSigningSessionResponse {
	order: Order;
}

/**
 * Order creation request
 */
export interface CreateOrderRequest {
	direction: SwapDirection;
	/** For Tron→EVM: the EVM chain and token */
	evmChainId: number;
	evmToken: EvmStablecoin;
	/**
	 * Amount in source token's smallest unit (atomic integer string).
	 * Client-side code is responsible for converting human decimals to this format.
	 */
	amount: string;
	/** Recipient address */
	recipientAddress: string;
}

/**
 * Order creation response
 */
export interface CreateOrderResponse {
	order: Order;
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
