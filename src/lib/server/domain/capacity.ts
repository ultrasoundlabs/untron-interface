import type { CapacityInfo, EvmStablecoin, SwapDirection } from '$lib/types/swap';

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
	const now = Date.now();
	return {
		maxAmount: params.direction === 'TRON_TO_EVM' ? '100000000000' : '1000000000000000000', // 100,000 with 6 decimals
		minAmount: params.direction === 'TRON_TO_EVM' ? '1000000' : '1000000000000000000', // 1 USDT
		availableLiquidity:
			params.direction === 'TRON_TO_EVM' ? '85000000000' : '850000000000000000000000000000000000',
		fetchedAt: now,
		refreshAt: now + 5000
	};
}
