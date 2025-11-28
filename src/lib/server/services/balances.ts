/**
 * Balance service - fetches EVM token balances using viem.
 */

import { createPublicClient, http, erc20Abi } from 'viem';
import type { TokenChainBalance } from '$lib/types/swap';
import { SUPPORTED_CHAINS, getTokensForChainAndDirection } from '$lib/config/swapConfig';
import { formatAtomicToDecimal } from '$lib/math/amounts';
import { chainsConfig, type SupportedChainId } from '$lib/config/chains';
import { getChainRpcUrl } from '$lib/server/config/chainRpc';

// Create public clients for each chain (cached)
const clients: Map<SupportedChainId, ReturnType<typeof createPublicClient>> = new Map();

function getClient(chainId: SupportedChainId) {
	if (!clients.has(chainId)) {
		const chainDefinition = chainsConfig[chainId];
		if (!chainDefinition) return null;

		try {
			const rpcUrl = getChainRpcUrl(chainId);
			clients.set(
				chainId,
				createPublicClient({
					chain: chainDefinition.viemChain,
					transport: http(rpcUrl)
				})
			);
		} catch (error) {
			console.error(`Missing RPC for chain ${chainId}:`, error);
			return null;
		}
	}
	return clients.get(chainId)!;
}

/**
 * Fetch balance for a single token on a single chain
 */
export async function fetchTokenBalance(
	address: `0x${string}`,
	chainId: SupportedChainId,
	tokenAddress: `0x${string}`
): Promise<bigint> {
	const client = getClient(chainId);
	if (!client) return 0n;

	try {
		const balance = await client.readContract({
			address: tokenAddress,
			abi: erc20Abi,
			functionName: 'balanceOf',
			args: [address]
		});
		return balance;
	} catch (error) {
		console.error(`Failed to fetch balance for ${tokenAddress} on chain ${chainId}:`, error);
		return 0n;
	}
}

/**
 * Fetch all supported token balances for a user across all chains
 * Used for the EVM→Tron selection dialog
 */
export async function fetchAllBalances(userAddress: `0x${string}`): Promise<TokenChainBalance[]> {
	const balancePromises: Promise<TokenChainBalance | null>[] = [];

	for (const chain of SUPPORTED_CHAINS) {
		const chainId = chain.chainId as SupportedChainId;
		const tokens = getTokensForChainAndDirection(chainId, 'EVM_TO_TRON');

		for (const token of tokens) {
			balancePromises.push(
				fetchTokenBalance(userAddress, chainId, token.address)
					.then(
						(balance): TokenChainBalance => ({
							chain,
							token,
							balance: balance.toString(),
							formattedBalance: formatBalance(balance, token.decimals)
						})
					)
					.catch((): null => null)
			);
		}
	}

	const results = await Promise.all(balancePromises);

	return results
		.filter((r): r is TokenChainBalance => r !== null && r.balance !== '0')
		.sort((a, b) => {
			const aVal = BigInt(a.balance);
			const bVal = BigInt(b.balance);
			if (bVal > aVal) return 1;
			if (bVal < aVal) return -1;
			return 0;
		});
}

function formatBalance(balance: bigint, decimals: number): string {
	return formatAtomicToDecimal(balance, decimals, {
		maxFractionDigits: 6,
		useGrouping: true
	});
}

export async function getBalance(
	userAddress: `0x${string}`,
	chainId: SupportedChainId,
	tokenAddress: `0x${string}`
): Promise<{ balance: string; formattedBalance: string }> {
	const balance = await fetchTokenBalance(userAddress, chainId, tokenAddress);
	const tokenMeta = getTokensForChainAndDirection(chainId, 'EVM_TO_TRON').find(
		(token) => token.address.toLowerCase() === tokenAddress.toLowerCase()
	);
	const decimals = tokenMeta?.decimals ?? 6;

	return {
		balance: balance.toString(),
		formattedBalance: formatBalance(balance, decimals)
	};
}
