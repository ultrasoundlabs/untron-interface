export type SupportedPair = {
	target_chain_id: number;
	target_token: `0x${string}`;
};

export type ChainMeta = {
	chainId: string;
	name: string;
};

const CHAIN_META: Record<string, ChainMeta> = {
	'1': { chainId: '1', name: 'Ethereum' },
	'10': { chainId: '10', name: 'OP Mainnet' },
	'14': { chainId: '14', name: 'Flare' },
	'30': { chainId: '30', name: 'Rootstock' },
	'42161': { chainId: '42161', name: 'Arbitrum One' },
	'43114': { chainId: '43114', name: 'Avalanche C-Chain' },
	'8453': { chainId: '8453', name: 'Base' },
	'137': { chainId: '137', name: 'Polygon' },
	'146': { chainId: '146', name: 'Sonic' },
	'480': { chainId: '480', name: 'World Chain' },
	'80094': { chainId: '80094', name: 'Berachain' },
	'57073': { chainId: '57073', name: 'Ink' },
	'130': { chainId: '130', name: 'Unichain' },
	'59144': { chainId: '59144', name: 'Linea' },
	'21000000': { chainId: '21000000', name: 'Corn' },
	'1329': { chainId: '1329', name: 'Sei Network' },
	'999': { chainId: '999', name: 'HyperEVM' },
	'196': { chainId: '196', name: 'X Layer' },
	'9745': { chainId: '9745', name: 'Plasma' },
	'1030': { chainId: '1030', name: 'Conflux eSpace' },
	'5000': { chainId: '5000', name: 'Mantle' },
	'143': { chainId: '143', name: 'Monad' },
	'988': { chainId: '988', name: 'Stable' }
};

function isSupportedPair(value: unknown): value is SupportedPair {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Record<string, unknown>;
	return (
		typeof v.target_chain_id === 'number' &&
		typeof v.target_token === 'string' &&
		v.target_token.startsWith('0x')
	);
}

function sortChainIdsByName(chainIds: string[]): string[] {
	return [...chainIds].sort((a, b) => {
		const aName = getChainMeta(a)?.name ?? a;
		const bName = getChainMeta(b)?.name ?? b;
		const byName = aName.localeCompare(bName, undefined, { sensitivity: 'base' });
		if (byName !== 0) return byName;
		const aNum = Number(a);
		const bNum = Number(b);
		if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
		return a.localeCompare(b, undefined, { sensitivity: 'base' });
	});
}

export function getTargetChainOptions(
	supportedPairs: Array<SupportedPair | Record<string, unknown>>,
	deprecatedTargetChains: Set<string> = new Set()
): string[] {
	const ids = new Set<string>();
	for (const r of supportedPairs) {
		if (typeof r !== 'object' || r === null) continue;
		const rr = r as Record<string, unknown>;
		const chainId =
			typeof rr.target_chain_id === 'number'
				? String(rr.target_chain_id)
				: typeof rr.target_chain_id === 'string'
					? rr.target_chain_id
					: null;
		if (!chainId) continue;
		if (deprecatedTargetChains.has(chainId)) continue;
		ids.add(chainId);
	}
	return sortChainIdsByName([...ids]);
}

export function getTargetTokenOptions(
	supportedPairs: Array<SupportedPair | Record<string, unknown>>,
	targetChainId: string,
	deprecatedTargetChains: Set<string> = new Set()
): `0x${string}`[] {
	if (deprecatedTargetChains.has(targetChainId)) return [];

	const tokens = new Set<`0x${string}`>();
	for (const r of supportedPairs) {
		if (!isSupportedPair(r)) continue;
		if (String(r.target_chain_id) !== targetChainId) continue;
		tokens.add(r.target_token);
	}
	return [...tokens].sort();
}

export function getChainMeta(chainId: string): ChainMeta | null {
	return CHAIN_META[chainId] ?? null;
}

export function getChainLabel(chainId: string): string {
	const meta = getChainMeta(chainId);
	return meta ? `${meta.name} (${meta.chainId})` : chainId;
}
