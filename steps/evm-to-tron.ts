import { FatalError } from 'workflow';
import { createPublicClient, http } from 'viem';

import type { SwapExecutionSummary } from '../src/lib/types/swap';
import { getChainDefinition, type SupportedChainId } from '../src/lib/config/chains';
import { getChainRpcUrl } from '../src/lib/server/config/chainRpc';
import { getTokenOnChain, TRON_USDT } from '../src/lib/config/swapConfig';
import type { EvmToTronSettlementRecord } from '../src/lib/server/domain/evmToTronSettlement';
import {
	acquireRelayerMutex,
	ensureSettlementFromExecution,
	getPendingRelayerReservations,
	getSettlement,
	lockRelayerForSettlement,
	releaseRelayerMutex,
	releaseRelayerReservation,
	transitionSettlementStatus
} from '../src/lib/server/domain/evmToTronSettlement';
import {
	chooseBestRelayer,
	getTronRelayerBalances,
	type TronRelayerBalance
} from '../src/lib/server/services/tronRelayer';
import {
	createSettlementWorkflowLogger,
	describeWorkflowError,
	withRetries,
	type RetryOptions,
	type SettlementWorkflowLogger
} from './workflowContext';

function convertBetweenDecimals(amount: bigint, fromDecimals: number, toDecimals: number): bigint {
	if (fromDecimals === toDecimals) return amount;
	const diff = Math.abs(fromDecimals - toDecimals);
	const factor = 10n ** BigInt(diff);
	return fromDecimals < toDecimals ? amount * factor : amount / factor;
}

function getRequiredSun(execution: SwapExecutionSummary): bigint {
	const token = getTokenOnChain(execution.evmChainId, execution.evmToken);
	if (!token) {
		throw new FatalError(`Unsupported token for settlement: ${execution.evmToken}`);
	}

	const amount = BigInt(execution.amount);
	return convertBetweenDecimals(amount, token.decimals, TRON_USDT.decimals);
}

function getChainConfig(chainId: number): { rpcUrl: string; supportedId: SupportedChainId } {
	const chain = getChainDefinition(chainId);
	if (!chain) {
		throw new FatalError(`Unsupported chain for settlement: ${chainId}`);
	}

	const rpcUrl = getChainRpcUrl(chain.chainId as SupportedChainId);
	if (!rpcUrl) {
		throw new FatalError(`Missing RPC URL for chain ${chainId}`);
	}

	return { rpcUrl, supportedId: chain.chainId as SupportedChainId };
}

interface SerializableTronRelayerBalance {
	address: string;
	label?: string;
	balanceSun: string;
}

const REQUIRED_EVM_CONFIRMATIONS = 2;
const EVM_RECEIPT_RETRY_OPTIONS: RetryOptions = {
	attempts: 5,
	initialDelayMs: 1_500,
	backoffFactor: 1.8,
	maxDelayMs: 20_000,
	timeoutMs: 45_000
};
const RELAYER_LOCK_MAX_ATTEMPTS = 3;
const RELAYER_LOCK_RETRY_DELAY_MS = 250;

function getStepLogger(
	execution: SwapExecutionSummary,
	step: string,
	extra?: Record<string, unknown>
): SettlementWorkflowLogger {
	return createSettlementWorkflowLogger({
		orderId: execution.orderId,
		evmTxHash: execution.evmTxHash,
		step,
		...(extra ?? {})
	});
}

export async function recordInitialExecution(
	execution: SwapExecutionSummary
): Promise<EvmToTronSettlementRecord> {
	'use step';
	const log = getStepLogger(execution, 'record-initial-execution');
	const settlement = await ensureSettlementFromExecution(execution);

	if (settlement.createdAt === settlement.updatedAt) {
		log.info('Settlement record created');
	} else {
		log.info('Settlement record already existed', { status: settlement.status });
	}

	return settlement;
}

export async function waitForEvmRelayConfirmation(execution: SwapExecutionSummary): Promise<void> {
	'use step';
	const log = getStepLogger(execution, 'wait-evm-relay-confirmation');
	if (!execution.evmTxHash) {
		const error = new FatalError('Missing relay transaction hash for settlement');
		log.error('Missing relay transaction hash', describeWorkflowError(error));
		throw error;
	}

	const { rpcUrl, supportedId } = getChainConfig(execution.evmChainId);
	const chainDef = getChainDefinition(supportedId)!;
	log.info('Waiting for EVM transaction receipt', {
		rpcUrl,
		evmChainId: supportedId
	});

	const publicClient = createPublicClient({
		chain: chainDef.viemChain,
		transport: http(rpcUrl)
	});

	let receipt: Awaited<ReturnType<typeof publicClient.waitForTransactionReceipt>>;
	try {
		receipt = await withRetries(
			async (attempt) => {
				log.debug('Polling relay receipt', { attempt });
				return await publicClient.waitForTransactionReceipt({
					hash: execution.evmTxHash,
					confirmations: REQUIRED_EVM_CONFIRMATIONS
				});
			},
			EVM_RECEIPT_RETRY_OPTIONS,
			log,
			'evm-relay-receipt'
		);
	} catch (error) {
		const isTimeout = error instanceof Error && /timed out/i.test(error.message);
		const fatal = new FatalError(
			isTimeout ? 'EVM relay confirmation timed out' : 'Failed to confirm EVM relay transaction'
		);
		log.error('Failed to confirm EVM relay transaction', {
			isTimeout,
			...describeWorkflowError(error)
		});
		throw fatal;
	}

	if (receipt.status === 'reverted') {
		const revertError = new FatalError('Relay transaction reverted on-chain');
		log.error('Relay transaction reverted', {
			...describeWorkflowError(revertError),
			blockNumber: Number(receipt.blockNumber)
		});
		throw revertError;
	}

	log.info('EVM relay confirmed', {
		blockNumber: Number(receipt.blockNumber),
		status: receipt.status
	});

	await transitionSettlementStatus(execution.orderId, {
		lastSuccessfulStep: 'wait-evm-relay-confirmation',
		lastSuccessfulAt: Date.now(),
		lastRpcEndpoint: rpcUrl
	});
}

export async function selectTronRelayer(
	execution: SwapExecutionSummary
): Promise<SerializableTronRelayerBalance> {
	'use step';
	const log = getStepLogger(execution, 'select-tron-relayer');
	const requiredSun = getRequiredSun(execution);
	log.info('Fetching Tron relayer balances', { requiredSun: requiredSun.toString() });

	const settlement = await getSettlement(execution.orderId);
	const hasExistingReservation =
		settlement?.relayerAddress && settlement.relayerReservationReleasedAt === undefined;

	if (hasExistingReservation && settlement?.relayerAddress) {
		const existingBalances = await getTronRelayerBalances();
		log.debug('Fetched Tron relayer balances', { relayerCount: existingBalances.length });
		const reservedRelayer =
			existingBalances.find((entry) => entry.address === settlement.relayerAddress) ??
			({
				address: settlement.relayerAddress,
				label: settlement.relayerLabel,
				balanceSun: settlement.relayerReservedSun
					? BigInt(settlement.relayerReservedSun)
					: requiredSun
			} satisfies TronRelayerBalance);

		log.info('Using existing relayer reservation', {
			relayerAddress: reservedRelayer.address,
			relayerLabel: reservedRelayer.label
		});

		return {
			address: reservedRelayer.address,
			label: reservedRelayer.label,
			balanceSun: reservedRelayer.balanceSun.toString()
		};
	}

	for (let attempt = 1; attempt <= RELAYER_LOCK_MAX_ATTEMPTS; attempt++) {
		const balances = await getTronRelayerBalances();
		log.debug('Fetched Tron relayer balances', { relayerCount: balances.length, attempt });

		const activeReservations = await getPendingRelayerReservations();
		const effectiveBalances = balances.map((balance) => {
			const reserved = activeReservations.get(balance.address) ?? 0n;
			const available = balance.balanceSun > reserved ? balance.balanceSun - reserved : 0n;
			return { original: balance, available, reserved };
		});

		const selectionPool = effectiveBalances.map(({ original, available }) => ({
			...original,
			balanceSun: available
		}));

		const selected = chooseBestRelayer(selectionPool, requiredSun);
		if (!selected) {
			const error = new FatalError('No Tron relayer has enough liquidity for this payout');
			log.error('No suitable Tron relayer available', {
				requiredSun: requiredSun.toString(),
				activeReservationCount: activeReservations.size,
				...describeWorkflowError(error)
			});
			throw error;
		}

		const selectedMeta = effectiveBalances.find(
			(entry) => entry.original.address === selected.address
		)!;

		const lockToken = await acquireRelayerMutex(selected.address);
		if (!lockToken) {
			log.warn('Relayer is currently locked, retrying', {
				relayerAddress: selected.address,
				attempt
			});
			await new Promise((resolve) => setTimeout(resolve, RELAYER_LOCK_RETRY_DELAY_MS * attempt));
			continue;
		}

		try {
			await lockRelayerForSettlement({
				orderId: execution.orderId,
				relayerAddress: selected.address,
				relayerLabel: selected.label,
				requiredSun
			});

			log.info('Selected Tron relayer', {
				relayerAddress: selected.address,
				relayerLabel: selected.label,
				availableSun: selectedMeta.available.toString(),
				reservedSun: selectedMeta.reserved.toString(),
				attempt
			});

			return {
				address: selectedMeta.original.address,
				label: selectedMeta.original.label,
				balanceSun: selectedMeta.original.balanceSun.toString()
			};
		} finally {
			await releaseRelayerMutex(selected.address, lockToken);
		}
	}

	const lockError = new FatalError('Unable to acquire a relayer lock after multiple attempts');
	log.error('Failed to secure Tron relayer lock', describeWorkflowError(lockError));
	throw lockError;
}

export async function sendTronPayout(
	execution: SwapExecutionSummary,
	relayer: SerializableTronRelayerBalance
): Promise<string> {
	'use step';
	const log = getStepLogger(execution, 'send-tron-payout', {
		relayerAddress: relayer.address
	});
	log.info('Creating Tron payout placeholder transaction', {
		relayerLabel: relayer.label
	});

	// Placeholder implementation. Replace with actual Tron RPC / signing logic.
	const placeholderTxHash = `TRON_TX_${execution.orderId}_${relayer.address}`;

	try {
		await transitionSettlementStatus(execution.orderId, {
			tronTxHash: placeholderTxHash,
			relayerAddress: relayer.address,
			relayerLabel: relayer.label,
			lastSuccessfulStep: 'send-tron-payout',
			lastSuccessfulAt: Date.now()
		});

		log.info('Persisted placeholder Tron transaction hash', { tronTxHash: placeholderTxHash });
		return placeholderTxHash;
	} catch (error) {
		log.error('Failed to persist Tron payout data', describeWorkflowError(error));
		await releaseRelayerReservation(execution.orderId);
		throw error;
	}
}

export async function waitForTronConfirmation(tronTxHash: string): Promise<void> {
	'use step';
	const log = createSettlementWorkflowLogger({
		step: 'wait-tron-confirmation',
		tronTxHash
	});
	log.info('Waiting for Tron confirmation (placeholder implementation)', { tronTxHash });
	log.debug('Tron confirmation polling not yet implemented');
}

export async function markSettlementCompleted(orderId: string, tronTxHash: string): Promise<void> {
	'use step';
	const log = createSettlementWorkflowLogger({
		orderId,
		step: 'mark-settlement-completed'
	});
	await releaseRelayerReservation(orderId);
	const now = Date.now();
	await transitionSettlementStatus(orderId, {
		status: 'completed',
		tronTxHash,
		lastSuccessfulStep: 'mark-settlement-completed',
		lastSuccessfulAt: now
	});
	log.info('Marked settlement as completed', { tronTxHash });
}

export async function markSettlementFailed(orderId: string, reason: string): Promise<void> {
	'use step';
	const log = createSettlementWorkflowLogger({
		orderId,
		step: 'mark-settlement-failed'
	});
	await releaseRelayerReservation(orderId);
	const now = Date.now();
	await transitionSettlementStatus(orderId, {
		status: 'failed',
		errorReason: reason,
		lastErrorStep: 'mark-settlement-failed',
		lastErrorAt: now
	});
	log.warn('Marked settlement as failed', { reason });
}
