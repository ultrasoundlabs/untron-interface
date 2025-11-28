import { env } from '$env/dynamic/private';
import type { SupportedChainId } from '$lib/config/chains';

const RPC_ENV_KEYS: Record<SupportedChainId, string> = {
	1: 'RPC_URL_1',
	10: 'RPC_URL_10',
	130: 'RPC_URL_130',
	137: 'RPC_URL_137',
	143: 'RPC_URL_143',
	42161: 'RPC_URL_42161',
	480: 'RPC_URL_480',
	8453: 'RPC_URL_8453',
	42220: 'RPC_URL_42220',
	5000: 'RPC_URL_5000',
	9745: 'RPC_URL_9745'
};

export function getChainRpcUrl(chainId: SupportedChainId): string {
	const envKey = RPC_ENV_KEYS[chainId];
	const url = env[envKey];
	if (!url) {
		throw new Error(`Missing RPC URL. Set ${envKey} for chain ${chainId}`);
	}
	return url;
}
