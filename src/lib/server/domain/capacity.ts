import { TRON_USDT, getTokenOnChain } from '$lib/config/swapConfig';
import type { CapacityInfo, EvmStablecoin, SwapDirection } from '$lib/types/swap';
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

	const sourceDecimals = params.direction === 'TRON_TO_EVM' ? TRON_USDT.decimals : token.decimals;
	const maxAmount = toAtomic(MAX_HUMAN_AMOUNT, sourceDecimals);
	const minAmount = toAtomic(MIN_HUMAN_AMOUNT, sourceDecimals);
	const availableLiquidity = toAtomic(AVAILABLE_LIQUIDITY_HUMAN, sourceDecimals);

	const now = Date.now();
	return {
		maxAmount,
		minAmount,
		availableLiquidity,
		fetchedAt: now,
		refreshAt: now + 5000
	};
}
