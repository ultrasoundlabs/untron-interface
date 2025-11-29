import { env } from '$env/dynamic/private';

export interface TronRelayerBalance {
	address: string;
	balanceSun: bigint;
	label?: string;
}

function parseRelayerAddresses(): string[] {
	const raw = env.TRON_RELAYER_ADDRESSES ?? '';
	return raw
		.split(',')
		.map((value) => value.trim())
		.filter((value) => value.length > 0);
}

function getDefaultMockBalance(): bigint {
	const raw = env.TRON_RELAYER_MOCK_BALANCE_SUN;
	if (!raw) return 0n;
	try {
		return BigInt(raw);
	} catch {
		return 0n;
	}
}

/**
 * Placeholder Tron balance reader. Replace with a real TRC-20 balance fetcher.
 */
export async function getTronRelayerBalances(): Promise<TronRelayerBalance[]> {
	const addresses = parseRelayerAddresses();
	const mockBalance = getDefaultMockBalance();

	return addresses.map((address) => ({
		address,
		balanceSun: mockBalance
	}));
}

export function chooseBestRelayer(
	balances: TronRelayerBalance[],
	requiredSun: bigint
): TronRelayerBalance | null {
	const eligible = balances.filter((entry) => entry.balanceSun >= requiredSun);
	if (eligible.length === 0) {
		return null;
	}

	return eligible.sort((a, b) => {
		if (a.balanceSun === b.balanceSun) return 0;
		return a.balanceSun > b.balanceSun ? -1 : 1;
	})[0];
}

export function getTotalRelayerLiquiditySun(balances: TronRelayerBalance[]): bigint {
	return balances.reduce((sum, entry) => sum + entry.balanceSun, 0n);
}
