import { randomUUID } from 'node:crypto';

import type { EvmStablecoin, SwapExecutionSummary } from '$lib/types/swap';
import { redis } from '$lib/server/redis';

export type EvmToTronSettlementStatus = 'relaying' | 'completed' | 'failed';

export interface EvmToTronSettlementRecord {
	orderId: string;
	direction: 'EVM_TO_TRON';
	evmChainId: number;
	evmToken: EvmStablecoin;
	amount: string;
	recipientAddress: string;
	evmTxHash: `0x${string}`;
	tronTxHash?: string;
	status: EvmToTronSettlementStatus;
	relayMethod?: 'aa' | 'eoa';
	errorReason?: string;
	relayerAddress?: string;
	relayerLabel?: string;
	relayerReservedSun?: string;
	relayerReservedAt?: number;
	relayerReservationReleasedAt?: number;
	lastSuccessfulStep?: string;
	lastSuccessfulAt?: number;
	lastErrorStep?: string;
	lastErrorAt?: number;
	lastRpcEndpoint?: string;
	createdAt: number;
	updatedAt: number;
}

const settlementKey = (orderId: string) => `settlement:${orderId}`;
const settlementIndexKey = 'settlement:ids';
const activeReservationsKey = 'settlement:active-reservations';
const relayerMutexKey = (address: string) => `settlement:relayer-lock:${address}`;
const RELEASE_RELAYER_LOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
	return redis.call("DEL", KEYS[1])
end
return 0
`;

async function loadSettlement(orderId: string): Promise<EvmToTronSettlementRecord | null> {
	const data = await redis.get<EvmToTronSettlementRecord>(settlementKey(orderId));
	return (data as EvmToTronSettlementRecord | null) ?? null;
}

async function saveSettlement(
	record: EvmToTronSettlementRecord
): Promise<EvmToTronSettlementRecord> {
	await redis.set(settlementKey(record.orderId), record);
	await redis.sadd(settlementIndexKey, record.orderId);
	return record;
}

export async function upsertSettlement(
	record: Partial<EvmToTronSettlementRecord> & { orderId: string }
): Promise<EvmToTronSettlementRecord> {
	const now = Date.now();
	const previous = await loadSettlement(record.orderId);

	if (!previous && (!record.evmTxHash || !record.evmToken || !record.amount)) {
		throw new Error('Settlement upsert missing required execution fields');
	}

	const pick = <K extends keyof EvmToTronSettlementRecord>(
		key: K,
		defaultValue: EvmToTronSettlementRecord[K]
	): EvmToTronSettlementRecord[K] => {
		if (Object.prototype.hasOwnProperty.call(record, key)) {
			return record[key] as EvmToTronSettlementRecord[K];
		}
		if (previous) {
			return previous[key];
		}
		return defaultValue;
	};

	const next: EvmToTronSettlementRecord = {
		orderId: record.orderId,
		direction: pick('direction', 'EVM_TO_TRON'),
		evmChainId: pick('evmChainId', 0),
		evmToken: pick('evmToken', 'USDT'),
		amount: pick('amount', '0'),
		recipientAddress: pick('recipientAddress', '0x0'),
		evmTxHash: pick('evmTxHash', ('0x' + ''.padStart(64, '0')) as `0x${string}`),
		tronTxHash: pick('tronTxHash', undefined),
		status: pick('status', 'relaying'),
		relayMethod: pick('relayMethod', undefined),
		errorReason: pick('errorReason', undefined),
		relayerAddress: pick('relayerAddress', undefined),
		relayerLabel: pick('relayerLabel', undefined),
		relayerReservedSun: pick('relayerReservedSun', undefined),
		relayerReservedAt: pick('relayerReservedAt', undefined),
		relayerReservationReleasedAt: pick('relayerReservationReleasedAt', undefined),
		lastSuccessfulStep: pick('lastSuccessfulStep', undefined),
		lastSuccessfulAt: pick('lastSuccessfulAt', undefined),
		lastErrorStep: pick('lastErrorStep', undefined),
		lastErrorAt: pick('lastErrorAt', undefined),
		lastRpcEndpoint: pick('lastRpcEndpoint', undefined),
		createdAt: previous?.createdAt ?? now,
		updatedAt: now
	};

	return saveSettlement(next);
}

export async function getSettlement(orderId: string): Promise<EvmToTronSettlementRecord | null> {
	return loadSettlement(orderId);
}

export async function ensureSettlementFromExecution(
	execution: SwapExecutionSummary
): Promise<EvmToTronSettlementRecord> {
	const orderId = execution.orderId;
	const existing = await loadSettlement(orderId);
	if (existing) {
		return existing;
	}

	return upsertSettlement({
		orderId,
		direction: execution.direction,
		evmChainId: execution.evmChainId,
		evmToken: execution.evmToken,
		amount: execution.amount,
		recipientAddress: execution.recipientAddress,
		evmTxHash: execution.evmTxHash!,
		relayMethod: execution.relayMethod,
		status: 'relaying'
	});
}

export async function lockRelayerForSettlement(params: {
	orderId: string;
	relayerAddress: string;
	relayerLabel?: string;
	requiredSun: bigint;
}): Promise<EvmToTronSettlementRecord> {
	const record = await upsertSettlement({
		orderId: params.orderId,
		relayerAddress: params.relayerAddress,
		relayerLabel: params.relayerLabel,
		relayerReservedSun: params.requiredSun.toString(),
		relayerReservedAt: Date.now(),
		relayerReservationReleasedAt: undefined
	});

	await redis.sadd(activeReservationsKey, params.orderId);

	return record;
}

export async function releaseRelayerReservation(
	orderId: string
): Promise<EvmToTronSettlementRecord | null> {
	const existing = await loadSettlement(orderId);
	if (!existing) {
		return null;
	}

	await redis.srem(activeReservationsKey, orderId);

	if (existing.relayerReservationReleasedAt !== undefined) {
		return existing;
	}

	return upsertSettlement({
		orderId,
		relayerReservationReleasedAt: Date.now()
	});
}

export async function acquireRelayerMutex(
	relayerAddress: string,
	ttlMs = 15_000
): Promise<string | null> {
	const token = randomUUID();
	const acquired = await redis.set(relayerMutexKey(relayerAddress), token, {
		nx: true,
		px: ttlMs
	});
	return acquired ? token : null;
}

export async function releaseRelayerMutex(relayerAddress: string, token: string): Promise<void> {
	if (!token) return;
	await redis.eval(RELEASE_RELAYER_LOCK_SCRIPT, [relayerMutexKey(relayerAddress)], [token]);
}

export async function getPendingRelayerReservations(): Promise<Map<string, bigint>> {
	const reservations = new Map<string, bigint>();
	const ids = (await redis.smembers(activeReservationsKey)) as string[];
	if (!ids || ids.length === 0) {
		return reservations;
	}

	const keys = ids.map((id) => settlementKey(id));
	const records = (await redis.mget(...keys)) as (EvmToTronSettlementRecord | null)[];

	for (const record of records) {
		if (!record) continue;
		if (record.status === 'failed' || record.status === 'completed') continue;
		if (!record.relayerAddress || !record.relayerReservedSun) continue;
		if (record.relayerReservationReleasedAt !== undefined) continue;

		const amount = BigInt(record.relayerReservedSun);
		const current = reservations.get(record.relayerAddress) ?? 0n;
		reservations.set(record.relayerAddress, current + amount);
	}

	return reservations;
}

export type SettlementStatusMutation = Partial<
	Pick<
		EvmToTronSettlementRecord,
		| 'status'
		| 'tronTxHash'
		| 'errorReason'
		| 'relayerAddress'
		| 'relayerLabel'
		| 'relayerReservedSun'
		| 'relayerReservedAt'
		| 'relayerReservationReleasedAt'
		| 'lastSuccessfulStep'
		| 'lastSuccessfulAt'
		| 'lastErrorStep'
		| 'lastErrorAt'
		| 'lastRpcEndpoint'
	>
>;

export async function transitionSettlementStatus(
	orderId: string,
	update: SettlementStatusMutation
): Promise<EvmToTronSettlementRecord> {
	const current = await loadSettlement(orderId);
	if (!current) {
		throw new Error(`Settlement ${orderId} not found`);
	}

	const isTerminal = current.status === 'completed' || current.status === 'failed';
	const nextStatus = isTerminal ? current.status : (update.status ?? current.status);

	return upsertSettlement({
		orderId,
		...update,
		status: nextStatus
	});
}
