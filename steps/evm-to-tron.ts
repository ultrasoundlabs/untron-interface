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
	getSignerTronWeb,
	getTronRelayerBalances,
	getReadonlyTronWeb,
	getUsdtContractForClient,
	type TronRelayerBalance
} from '../src/lib/server/services/tronRelayer';
import { ensureEnergyCapacity } from '../src/lib/server/services/tronEnergy';
import { EVM_TO_TRON_NETWORK_FEE_SUN } from '../src/lib/server/domain/quotes';
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

	const input = BigInt(execution.amount);
	const sourceDecimals = token.decimals;
	const tronDecimals = TRON_USDT.decimals;

	// Mirror the EVM_TO_TRON fee logic from server-side quoting:
	// - No protocol fee
	// - Flat 2 USDT network fee charged on the Tron side
	const networkFeeSource = convertBetweenDecimals(
		EVM_TO_TRON_NETWORK_FEE_SUN,
		tronDecimals,
		sourceDecimals
	);
	const totalFeeSource = networkFeeSource;
	const outputSource = input > totalFeeSource ? input - totalFeeSource : 0n;

	return convertBetweenDecimals(outputSource, sourceDecimals, tronDecimals);
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
const TRON_PAYOUT_FEE_LIMIT = Number(process.env.TRON_PAYOUT_FEE_LIMIT ?? '30000000'); // 30 TRX
const TRON_PAYOUT_MIN_ENERGY = Number(process.env.TRON_PAYOUT_MIN_ENERGY ?? '65000');
const TRON_PAYOUT_ENERGY_BUFFER = Number(process.env.TRON_PAYOUT_ENERGY_BUFFER ?? '5000');
const TRON_PAYOUT_ENERGY_DURATION_HOURS = Number(
	process.env.TRON_PAYOUT_ENERGY_DURATION_HOURS ?? '1'
);
const TRON_PAYOUT_SHOULD_POLL_RESPONSE =
	(process.env.TRON_PAYOUT_SHOULD_POLL_RESPONSE ?? 'false').toLowerCase() === 'true';
const TRON_CONFIRMATION_RETRY_OPTIONS: RetryOptions = {
	attempts: Number(process.env.TRON_CONFIRMATION_ATTEMPTS ?? '40'),
	initialDelayMs: Number(process.env.TRON_CONFIRMATION_INITIAL_DELAY_MS ?? '3000'),
	backoffFactor: Number(process.env.TRON_CONFIRMATION_BACKOFF ?? '1.2'),
	maxDelayMs: Number(process.env.TRON_CONFIRMATION_MAX_DELAY_MS ?? '15000'),
	timeoutMs: Number(process.env.TRON_CONFIRMATION_TIMEOUT_MS ?? '240000')
};

const TRON_ENERGY_RETRY_OPTIONS: RetryOptions = {
	attempts: Number(process.env.TRON_ENERGY_ATTEMPTS ?? '20'),
	initialDelayMs: Number(process.env.TRON_ENERGY_INITIAL_DELAY_MS ?? '5000'),
	backoffFactor: Number(process.env.TRON_ENERGY_BACKOFF ?? '2'),
	maxDelayMs: Number(process.env.TRON_ENERGY_MAX_DELAY_MS ?? '60000'),
	timeoutMs: Number(process.env.TRON_ENERGY_TIMEOUT_MS ?? '0')
};

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

export async function ensureTronRelayerEnergy(
	execution: SwapExecutionSummary,
	relayer: SerializableTronRelayerBalance
): Promise<void> {
	'use step';
	const log = getStepLogger(execution, 'ensure-tron-energy', {
		relayerAddress: relayer.address
	});
	log.info('Ensuring Tron relayer has enough energy', { relayerLabel: relayer.label });

	const tronWeb = getSignerTronWeb(relayer.address);
	const requiredSun = getRequiredSun(execution);

	try {
		const resources = await tronWeb.trx.getAccountResources(relayer.address);
		const currentEnergy = resolveEnergyRemaining(resources);
		const estimatedEnergy = await estimateTronTransferEnergy(
			tronWeb,
			relayer.address,
			execution.recipientAddress,
			requiredSun,
			log
		);
		const targetEnergy = Math.max(
			estimatedEnergy + TRON_PAYOUT_ENERGY_BUFFER,
			TRON_PAYOUT_MIN_ENERGY
		);

		if (currentEnergy >= targetEnergy) {
			log.debug('Relayer already has sufficient energy', {
				currentEnergy,
				targetEnergy
			});
			await transitionSettlementStatus(execution.orderId, {
				lastSuccessfulStep: 'ensure-tron-energy',
				lastSuccessfulAt: Date.now()
			});
			return;
		}

		const ensureResult = await withRetries(
			async (attempt) => {
				log.warn('Ensuring Tron energy capacity via APITRX', {
					attempt,
					currentEnergy,
					targetEnergy
				});

				return ensureEnergyCapacity({
					address: relayer.address,
					minRemaining: targetEnergy,
					currentEnergy,
					buffer: 0,
					durationHours: TRON_PAYOUT_ENERGY_DURATION_HOURS
				});
			},
			TRON_ENERGY_RETRY_OPTIONS,
			log,
			'ensure-tron-energy'
		);

		if (ensureResult.rental) {
			log.info('Rented Tron energy for relayer', {
				txid: ensureResult.rental.txid,
				value: ensureResult.rental.value,
				deficit: ensureResult.deficit
			});
		} else {
			log.debug('APITRX reported no additional rental required', {
				statusEnergyRemaining: ensureResult.status.energyRemaining
			});
		}

		await transitionSettlementStatus(execution.orderId, {
			lastSuccessfulStep: 'ensure-tron-energy',
			lastSuccessfulAt: Date.now()
		});
	} catch (error) {
		log.error('Failed to ensure Tron energy capacity', describeWorkflowError(error));
		await releaseRelayerReservation(execution.orderId);

		if (error instanceof FatalError) {
			throw error;
		}

		const message =
			typeof error === 'object' &&
			error &&
			'message' in error &&
			typeof (error as { message: unknown }).message === 'string'
				? (error as { message: string }).message
				: 'Unable to ensure Tron energy';

		throw new FatalError(message);
	}
}

function resolveEnergyRemaining(resources: unknown): number {
	if (!resources || typeof resources !== 'object') {
		return 0;
	}

	if (
		'EnergyRemaining' in resources &&
		typeof (resources as { EnergyRemaining?: unknown }).EnergyRemaining === 'number'
	) {
		return (resources as { EnergyRemaining: number }).EnergyRemaining;
	}

	if (
		'energyRemaining' in resources &&
		typeof (resources as { energyRemaining?: unknown }).energyRemaining === 'number'
	) {
		return (resources as { energyRemaining: number }).energyRemaining;
	}

	if ('energy_limit' in resources && 'energy_used' in resources) {
		const limit = Number((resources as Record<string, unknown>).energy_limit ?? 0);
		const used = Number((resources as Record<string, unknown>).energy_used ?? 0);
		return Math.max(limit - used, 0);
	}

	return 0;
}

async function estimateTronTransferEnergy(
	tronWeb: ReturnType<typeof getSignerTronWeb>,
	ownerAddress: string,
	recipientAddress: string,
	amountSun: bigint,
	log: SettlementWorkflowLogger
): Promise<number> {
	try {
		const ownerHex = tronWeb.address.toHex(ownerAddress);
		const recipientHex = tronWeb.address.toHex(recipientAddress);
		const parameter = [
			{ type: 'address', value: recipientHex },
			{ type: 'uint256', value: amountSun.toString() }
		];

		const response = await tronWeb.transactionBuilder.triggerSmartContract(
			TRON_USDT.address,
			'transfer(address,uint256)',
			{
				feeLimit: TRON_PAYOUT_FEE_LIMIT,
				callValue: 0
			},
			parameter,
			ownerHex
		);

		const energy = extractEnergyUsed(response);
		if (Number.isFinite(energy) && energy > 0) {
			return energy;
		}

		log.warn('APITRX energy estimate missing energy_used field, falling back to minimum', {
			responseKeys: Object.keys(response ?? {})
		});
	} catch (error) {
		log.warn(
			'Failed to estimate Tron transfer energy, falling back to minimum',
			describeWorkflowError(error)
		);
	}

	return TRON_PAYOUT_MIN_ENERGY;
}

function extractEnergyUsed(response: unknown): number {
	if (!response || typeof response !== 'object') {
		return NaN;
	}

	const flatEnergy =
		(response as { energy_used?: number }).energy_used ??
		(response as { energyUsed?: number }).energyUsed ??
		(response as { energy_usage?: number }).energy_usage;
	if (typeof flatEnergy === 'number') {
		return flatEnergy;
	}

	if (
		'transaction' in response &&
		response.transaction &&
		typeof response.transaction === 'object'
	) {
		const nested =
			(response.transaction as { energy_usage_total?: number }).energy_usage_total ??
			(response.transaction as { energy_usage?: number }).energy_usage;
		if (typeof nested === 'number') {
			return nested;
		}
	}

	if ('result' in response && response.result && typeof response.result === 'object') {
		const resultEnergy =
			(response.result as { energy_used?: number }).energy_used ??
			(response.result as { EnergyUsed?: number }).EnergyUsed;
		if (typeof resultEnergy === 'number') {
			return resultEnergy;
		}
	}

	return NaN;
}

function normalizeTronTxHash(result: unknown): string {
	if (typeof result === 'string' && result.length > 0) {
		return result;
	}
	if (result && typeof result === 'object') {
		const candidate =
			(result as { txid?: string }).txid ??
			(result as { transaction?: { txID?: string } }).transaction?.txID ??
			(result as { transactionId?: string }).transactionId;
		if (typeof candidate === 'string' && candidate.length > 0) {
			return candidate;
		}
	}
	throw new FatalError('Unable to determine Tron transaction hash from send result');
}

export async function sendTronPayout(
	execution: SwapExecutionSummary,
	relayer: SerializableTronRelayerBalance
): Promise<string> {
	'use step';
	const log = getStepLogger(execution, 'send-tron-payout', {
		relayerAddress: relayer.address
	});
	const requiredSun = getRequiredSun(execution);
	const tronWeb = getSignerTronWeb(relayer.address);

	let tronTxHash: string;
	try {
		const contract = await getUsdtContractForClient(tronWeb);
		const rawResult = await contract
			.transfer(execution.recipientAddress, requiredSun.toString())
			.send({
				feeLimit: TRON_PAYOUT_FEE_LIMIT,
				callValue: 0,
				shouldPollResponse: TRON_PAYOUT_SHOULD_POLL_RESPONSE
			});
		tronTxHash = normalizeTronTxHash(rawResult);
	} catch (error) {
		log.error('Failed to broadcast Tron payout', describeWorkflowError(error));
		await releaseRelayerReservation(execution.orderId);
		throw error instanceof FatalError ? error : new FatalError('Failed to send Tron payout');
	}

	try {
		await transitionSettlementStatus(execution.orderId, {
			tronTxHash,
			relayerAddress: relayer.address,
			relayerLabel: relayer.label,
			lastSuccessfulStep: 'send-tron-payout',
			lastSuccessfulAt: Date.now()
		});

		log.info('Broadcasted Tron payout', {
			tronTxHash,
			relayerLabel: relayer.label,
			amountSun: requiredSun.toString()
		});
		return tronTxHash;
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
	log.info('Waiting for Tron payout confirmation', { tronTxHash });

	const tronWeb = getReadonlyTronWeb();

	let receipt: Awaited<ReturnType<typeof tronWeb.trx.getTransactionInfo>>;
	try {
		receipt = await withRetries(
			async (attempt) => {
				log.debug('Polling Tron transaction receipt', { attempt });
				const info = await tronWeb.trx.getTransactionInfo(tronTxHash);
				const hasReceipt = info && Object.keys(info).length > 0 && info.receipt;
				if (!hasReceipt) {
					throw new Error('TRON_TX_PENDING');
				}

				const result = info.receipt?.result;
				if (result !== 'SUCCESS') {
					const revertError = new FatalError(
						`Tron payout reverted with status: ${result ?? 'UNKNOWN'}`
					);
					revertError.message = info.resMessage
						? `${revertError.message} (${info.resMessage})`
						: revertError.message;
					throw revertError;
				}

				return info;
			},
			TRON_CONFIRMATION_RETRY_OPTIONS,
			log,
			'tron-confirmation'
		);
	} catch (error) {
		if (error instanceof FatalError) {
			log.error('Tron payout failed during confirmation', describeWorkflowError(error));
			throw error;
		}

		const fatal = new FatalError('Failed to confirm Tron payout on-chain');
		log.error('Unable to confirm Tron payout', describeWorkflowError(error));
		throw fatal;
	}

	log.info('Tron payout confirmed', {
		blockNumber: receipt?.blockNumber,
		fee: receipt?.fee
	});
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
