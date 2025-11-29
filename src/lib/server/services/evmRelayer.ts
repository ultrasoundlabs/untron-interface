/**
 * EVM Relayer Service
 *
 * A unified module for relaying EVM transactions on behalf of the protocol.
 * Supports both EOA (plain viem) and AA (permissionless + Gelato-style bundler) paths,
 * with config-driven per-chain mode selection and automatic fallback.
 */

import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sendUserOperation, waitForUserOperationReceipt } from 'viem/account-abstraction';
import { createSmartAccountClient } from 'permissionless';
import { toSafeSmartAccount } from 'permissionless/accounts';
import type { Chain } from 'viem/chains';

import { getChainDefinition, type SupportedChainId } from '$lib/config/chains';
import { getChainRpcUrl } from '$lib/server/config/chainRpc';
import {
	getRelayConfig,
	getBundlerRpcUrl,
	getRelayerEoaPrivateKey,
	type ChainRelayConfig
} from '$lib/server/config/relayer';

// =============================================================================
// Types
// =============================================================================

export interface RelayCall {
	/** Target contract address */
	to: `0x${string}`;
	/** Calldata to execute */
	data: `0x${string}`;
	/** Optional value to send (defaults to 0) */
	value?: bigint;
}

export interface RelayRequest {
	/** Target chain ID */
	chainId: SupportedChainId;
	/** Optional user identifier for per-user AA accounts (future use) */
	fromUserId?: string;
	/** One or more calls to execute on the destination chain */
	calls: RelayCall[];
}

export interface RelayResult {
	/** The transaction hash on-chain */
	txHash: `0x${string}`;
	/** The user operation hash (only set when relayed via AA) */
	userOpHash?: `0x${string}`;
	/** Which path was used to relay */
	relayedVia: 'aa' | 'eoa';
}

/** Error thrown when AA infrastructure is unhealthy */
export class AaInfraError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown
	) {
		super(message);
		this.name = 'AaInfraError';
	}
}

/** Error thrown when relay fails */
export class RelayError extends Error {
	constructor(
		message: string,
		public readonly code: 'UNSUPPORTED_CHAIN' | 'EOA_NOT_CONFIGURED' | 'RELAY_FAILED',
		public readonly cause?: unknown
	) {
		super(message);
		this.name = 'RelayError';
	}
}

// =============================================================================
// AA Health Tracking
// =============================================================================

/**
 * Simple in-memory cache to track AA health per chain.
 * When AA fails for a chain, we mark it unhealthy for a short period
 * to avoid hammering a broken bundler.
 */
const aaUnhealthyUntil = new Map<SupportedChainId, number>();
const AA_UNHEALTHY_DURATION_MS = 60_000; // 1 minute

// =============================================================================
// AA Retry / Backoff Configuration
// =============================================================================

/**
 * Maximum number of additional attempts for AA relays when we hit
 * infra / rate-limit style errors. Total attempts = 1 (initial) + AA_MAX_RETRY_ATTEMPTS.
 */
const AA_MAX_RETRY_ATTEMPTS = 3;

/** Initial backoff delay in ms; grows exponentially per attempt. */
const AA_RETRY_BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAaHealthy(chainId: SupportedChainId): boolean {
	const until = aaUnhealthyUntil.get(chainId);
	if (!until) return true;
	if (Date.now() >= until) {
		aaUnhealthyUntil.delete(chainId);
		return true;
	}
	return false;
}

function markAaUnhealthy(chainId: SupportedChainId): void {
	aaUnhealthyUntil.set(chainId, Date.now() + AA_UNHEALTHY_DURATION_MS);
}

// =============================================================================
// EOA Relayer Implementation
// =============================================================================

/**
 * Relay one or more calls using a plain EOA wallet.
 * Executes calls sequentially and waits for each receipt.
 */
async function relayViaEoa(req: RelayRequest, viemChain: Chain): Promise<RelayResult> {
	const rpcUrl = getChainRpcUrl(req.chainId);

	let privateKey: `0x${string}`;
	try {
		privateKey = getRelayerEoaPrivateKey();
	} catch (err) {
		throw new RelayError('EOA relayer private key not configured', 'EOA_NOT_CONFIGURED', err);
	}

	const account = privateKeyToAccount(privateKey);

	const publicClient = createPublicClient({
		chain: viemChain,
		transport: http(rpcUrl)
	});

	const walletClient = createWalletClient({
		chain: viemChain,
		transport: http(rpcUrl),
		account
	});

	try {
		if (req.calls.length === 0) {
			throw new RelayError('No calls provided for EOA relay', 'RELAY_FAILED');
		}

		let lastHash: `0x${string}` | undefined;

		for (const call of req.calls) {
			const hash = await walletClient.sendTransaction({
				to: call.to,
				data: call.data,
				value: call.value ?? 0n
			});

			lastHash = hash;
			// Optionally wait for confirmation (can be made configurable)
			await publicClient.waitForTransactionReceipt({ hash });
		}

		return {
			txHash: lastHash!,
			relayedVia: 'eoa'
		};
	} catch (err) {
		throw new RelayError(
			`EOA relay failed: ${err instanceof Error ? err.message : String(err)}`,
			'RELAY_FAILED',
			err
		);
	}
}

// =============================================================================
// AA Relayer Implementation
// =============================================================================

/**
 * Check if an error indicates AA infrastructure issues (bundler down, etc.)
 */
function isAaInfraError(err: unknown): boolean {
	if (!(err instanceof Error)) return false;

	const message = err.message.toLowerCase();

	// HTTP errors from bundler
	if (message.includes('500') || message.includes('502') || message.includes('503')) {
		return true;
	}

	// Timeout errors
	if (message.includes('timeout') || message.includes('timed out')) {
		return true;
	}

	// Bundler-specific errors
	if (
		message.includes('bundler') ||
		message.includes('not available') ||
		message.includes('service unavailable')
	) {
		return true;
	}

	// Rate limiting / throttling
	if (
		message.includes('too many requests') ||
		message.includes('rate limit') ||
		message.includes('rate-limited')
	) {
		return true;
	}

	// Network errors
	if (message.includes('econnrefused') || message.includes('network error')) {
		return true;
	}

	return false;
}

/**
 * Relay a transaction using Account Abstraction (Smart Account + Bundler).
 */
async function relayViaAa(
	req: RelayRequest,
	viemChain: Chain,
	relayConfig: ChainRelayConfig
): Promise<RelayResult> {
	// Extra defensive validation on our side so we don't accidentally pass
	// undefined or non-bigint values into the AA SDK / viem, which would
	// surface as opaque BigInt conversion errors.
	if (req.calls.length === 0) {
		throw new RelayError('No calls provided for AA relay', 'RELAY_FAILED');
	}

	for (const call of req.calls) {
		if (call.value !== undefined && typeof call.value !== 'bigint') {
			throw new RelayError('RelayCall.value must be a bigint when provided', 'RELAY_FAILED');
		}
	}

	const rpcUrl = getChainRpcUrl(req.chainId);
	const bundlerUrl = getBundlerRpcUrl(req.chainId);

	if (!bundlerUrl) {
		throw new AaInfraError(`No bundler URL configured for chain ${req.chainId}`);
	}

	// Get the signer - for now we use the same EOA key as the Safe owner.
	// That means one protocol-owned Safe per chain (saltNonce 0) and the relayer
	// EOA compromise = Safe compromise, so keep that key locked down.
	let privateKey: `0x${string}`;
	try {
		privateKey = getRelayerEoaPrivateKey();
	} catch (err) {
		throw new AaInfraError('AA signer private key not configured', err);
	}

	const owner = privateKeyToAccount(privateKey);

	const publicClient = createPublicClient({
		chain: viemChain,
		transport: http(rpcUrl)
	});

	try {
		// Resolve fee data up-front so we always pass concrete BigInt values into
		// the AA stack (Safe / permissionless tooling assumes these are defined
		// when building EIP-712 typed data).
		//
		// For sponsored Gelato-style bundlers (`...sponsored=true`), gas prices
		// MUST be zero – the paymaster sponsors the transaction off-chain.
		let resolvedMaxFeePerGas: bigint;
		let resolvedMaxPriorityFeePerGas: bigint;

		const isSponsoredBundler = bundlerUrl.includes('sponsored=true');
		if (isSponsoredBundler) {
			resolvedMaxFeePerGas = 0n;
			resolvedMaxPriorityFeePerGas = 0n;
		} else {
			const feeData = await publicClient.estimateFeesPerGas();
			const maxFee = feeData.maxFeePerGas ?? feeData.gasPrice;
			if (!maxFee) {
				throw new RelayError('Failed to estimate maxFeePerGas for AA relay', 'RELAY_FAILED');
			}
			resolvedMaxFeePerGas = maxFee;
			resolvedMaxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? 0n;
		}

		console.debug('[evmRelayer] Building Safe smart account for chain', req.chainId, {
			entryPoint: relayConfig.aa?.entryPoint,
			safeVersion: relayConfig.aa?.safeVersion ?? '1.4.1'
		});

		// Build the Safe smart account using the new permissionless API
		const safeAccount = await toSafeSmartAccount({
			client: publicClient,
			owners: [owner],
			version: relayConfig.aa?.safeVersion ?? '1.4.1',
			entryPoint: relayConfig.aa?.entryPoint
				? { address: relayConfig.aa.entryPoint, version: '0.7' }
				: undefined,
			saltNonce: 0n // Protocol-owned account, deterministic address
		});

		// Create the smart account client with bundler transport
		const smartAccountClient = createSmartAccountClient({
			account: safeAccount,
			chain: viemChain,
			bundlerTransport: http(bundlerUrl)
		});

		console.debug('[evmRelayer] Created Safe account & smartAccountClient', {
			safeAddress: safeAccount.address,
			bundlerUrl
		});

		// ---------------------------------------------------------------------
		// UserOperation-centric AA flow with exponential backoff on infra errors
		// ---------------------------------------------------------------------
		// 1) Build & send a UserOperation via viem's `sendUserOperation`.
		// 2) Wait for inclusion with `waitForUserOperationReceipt`.
		// 3) Return both the userOp hash and the bundled tx hash.
		//
		// We retry a few times with exponential backoff when the bundler is
		// overloaded (rate limits, transient infra issues) to avoid hammering it.
		const maxAttempts = 1 + AA_MAX_RETRY_ATTEMPTS;

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			try {
				const userOpHash = await sendUserOperation(smartAccountClient, {
					account: safeAccount,
					calls: req.calls.map((call) => ({
						to: call.to,
						value: call.value ?? 0n,
						data: call.data
					})),
					maxFeePerGas: resolvedMaxFeePerGas,
					maxPriorityFeePerGas: resolvedMaxPriorityFeePerGas
				});

				const userOpReceipt = await waitForUserOperationReceipt(smartAccountClient, {
					hash: userOpHash
				});

				const result: RelayResult = {
					txHash: userOpReceipt.receipt.transactionHash,
					userOpHash,
					relayedVia: 'aa'
				};

				console.debug('[evmRelayer] AA relay succeeded', {
					chainId: req.chainId,
					txHash: result.txHash,
					userOpHash: result.userOpHash
				});

				return result;
			} catch (err) {
				const attemptNumber = attempt + 1;

				// Only retry on infra-style errors (including rate limits). For
				// business-logic errors (reverts, validation issues) we fail fast.
				if (!isAaInfraError(err) || attemptNumber >= maxAttempts) {
					throw err;
				}

				const delayMs = AA_RETRY_BASE_DELAY_MS * 2 ** (attemptNumber - 1);

				console.warn('[evmRelayer] AA infra error, retrying with backoff', {
					chainId: req.chainId,
					attempt: attemptNumber,
					maxAttempts,
					delayMs,
					errorName: err instanceof Error ? err.name : typeof err,
					errorMessage: err instanceof Error ? err.message : String(err)
				});

				await sleep(delayMs);
			}
		}

		// This should be unreachable because the loop either returns or throws.
		throw new RelayError('AA relay failed after retries', 'RELAY_FAILED');
	} catch (err) {
		// Log the full error for debugging; the API layer only exposes a
		// sanitized message, but during dev you can check server logs to see
		// where the BigInt conversion is actually happening.
		console.error('[evmRelayer] AA relay error', {
			chainId: req.chainId,
			errorName: err instanceof Error ? err.name : typeof err,
			errorMessage: err instanceof Error ? err.message : String(err),
			errorStack: err instanceof Error ? err.stack : undefined
		});

		// Check if this is an infrastructure error that should trigger fallback
		if (isAaInfraError(err)) {
			throw new AaInfraError(
				`AA infrastructure error: ${err instanceof Error ? err.message : String(err)}`,
				err
			);
		}

		// Re-throw other errors (e.g., contract reverts, insufficient funds)
		throw new RelayError(
			`AA relay failed: ${err instanceof Error ? err.message : String(err)}`,
			'RELAY_FAILED',
			err
		);
	}
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Relay a set of EVM transactions (calls) on behalf of the protocol.
 *
 * This function automatically selects between EOA and AA based on per-chain configuration,
 * handles AA health tracking, and falls back to EOA when configured.
 *
 * @param req - The relay request containing chain, calls
 * @returns The relay result with transaction hash and relay method used
 * @throws {RelayError} When the relay fails
 */
export async function relayEvmTxs(req: RelayRequest): Promise<RelayResult> {
	// Validate chain
	const chainDef = getChainDefinition(req.chainId);
	if (!chainDef) {
		throw new RelayError(`Unsupported chain: ${req.chainId}`, 'UNSUPPORTED_CHAIN');
	}

	const relayConfig = getRelayConfig(req.chainId);
	const viemChain = chainDef.viemChain;

	// If mode is EOA, or AA is currently unhealthy for this chain, use EOA directly
	if (relayConfig.mode === 'eoa' || !isAaHealthy(req.chainId)) {
		return relayViaEoa(req, viemChain);
	}

	// Try AA path
	try {
		return await relayViaAa(req, viemChain, relayConfig);
	} catch (err) {
		// If AA infra failed and fallback is allowed, try EOA
		if (err instanceof AaInfraError && relayConfig.allowEoaFallback) {
			console.warn(
				`[evmRelayer] AA relay failed for chain ${req.chainId}, falling back to EOA:`,
				err.message
			);
			markAaUnhealthy(req.chainId);
			return relayViaEoa(req, viemChain);
		}

		// Re-throw if no fallback or not an infra error
		throw err;
	}
}
