import { TRON_USDT, getTokenOnChain } from '$lib/config/swapConfig';
import type { CapacityInfo, EvmStablecoin, SwapDirection } from '$lib/types/swap';
import {
	getTronRelayerBalances,
	getTotalRelayerLiquiditySun
} from '$lib/server/services/tronRelayer';
import { SwapDomainError } from '../errors';

const MIN_HUMAN_AMOUNT = 1n; // 1 token
const MAX_HUMAN_AMOUNT = 100_000n; // 100k tokens
const AVAILABLE_LIQUIDITY_HUMAN = 85_000n; // 85k tokens

function toAtomic(amount: bigint, decimals: number): string {
	return (amount * 10n ** BigInt(decimals)).toString();
}

export interface CapacityParams {
	direction: SwapDirection;
	evmChainId: number;
	evmToken: EvmStablecoin;
}

/**
 * Mock capacity provider. For now we return static numbers but keep the API
 * async-friendly so it can later call into a DB or upstream service.
 */
export async function getCapacity(params: CapacityParams): Promise<CapacityInfo> {
	const token = getTokenOnChain(params.evmChainId, params.evmToken);
	if (!token) {
		throw new SwapDomainError('Unsupported token for this chain', 'UNSUPPORTED_TOKEN');
	}

	if (params.direction === 'EVM_TO_TRON') {
		const dynamic = await getEvmToTronCapacity(token.decimals);
		if (dynamic) {
			return dynamic;
		}
	}

	return getStaticCapacity(params.direction, token.decimals);
}

function getStaticCapacity(direction: SwapDirection, sourceDecimals: number): CapacityInfo {
	const maxAmount = toAtomic(MAX_HUMAN_AMOUNT, sourceDecimals);
	const minAmount = toAtomic(MIN_HUMAN_AMOUNT, sourceDecimals);
	const availableLiquidity =
		direction === 'TRON_TO_EVM' ? toAtomic(AVAILABLE_LIQUIDITY_HUMAN, sourceDecimals) : maxAmount;

	const now = Date.now();
	return {
		maxAmount,
		minAmount,
		availableLiquidity,
		fetchedAt: now,
		refreshAt: now + 5000
	};
}

async function getEvmToTronCapacity(sourceDecimals: number): Promise<CapacityInfo | null> {
	const balances = await getTronRelayerBalances();
	if (balances.length === 0) {
		return null;
	}

	const totalSun = getTotalRelayerLiquiditySun(balances);
	if (totalSun <= 0n) {
		return null;
	}

	const convertedMax = convertBetweenDecimals(totalSun, TRON_USDT.decimals, sourceDecimals);
	if (convertedMax <= 0n) {
		return null;
	}

	const staticMax = BigInt(toAtomic(MAX_HUMAN_AMOUNT, sourceDecimals));
	const cappedMax = convertedMax < staticMax ? convertedMax : staticMax;
	const minAmount = toAtomic(MIN_HUMAN_AMOUNT, sourceDecimals);
	const now = Date.now();

	return {
		maxAmount: cappedMax.toString(),
		minAmount,
		availableLiquidity: cappedMax.toString(),
		fetchedAt: now,
		refreshAt: now + 5000
	};
}

function convertBetweenDecimals(amount: bigint, fromDecimals: number, toDecimals: number): bigint {
	if (fromDecimals === toDecimals) return amount;
	const diff = Math.abs(fromDecimals - toDecimals);
	const factor = 10n ** BigInt(diff);
	return fromDecimals < toDecimals ? amount * factor : amount / factor;
}
