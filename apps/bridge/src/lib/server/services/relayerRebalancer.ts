/**
 * Relayer Rebalancer Service
 *
 * Scans the protocol relayer's EOA and Safe balances across all supported chains/tokens,
 * sweeps stray EOA funds into the Safe, and returns tasks that exceed rebalancing thresholds.
 */

import { createPublicClient, createWalletClient, http, erc20Abi, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { chainList, type SupportedChainId } from '$lib/config/chains';
import type { EvmStablecoin } from '$lib/types/swap';
import { getChainRpcUrl } from '$lib/server/config/chainRpc';
import { getRelayerEoaPrivateKey } from '$lib/server/config/relayer';
import { getRelayerAddresses, type RelayerAddresses } from './evmRelayer';
import { fetchTokenBalance } from './balances';

// =============================================================================
// Types
// =============================================================================

/**
 * Result of sweeping EOA balance to Safe
 */
export interface SweepResult {
	chainId: SupportedChainId;
	tokenSymbol: EvmStablecoin;
	tokenAddress: `0x${string}`;
	amount: string;
	txHash: `0x${string}`;
}

/**
 * A rebalance task for tokens exceeding the threshold
 */
export interface RebalanceTask {
	chainId: SupportedChainId;
	tokenSymbol: EvmStablecoin;
	tokenAddress: `0x${string}`;
	/** Balance in atomic units (as string for serialization) */
	balance: string;
	/** Configured threshold in atomic units (as string for serialization) */
	threshold: string;
	/** Address currently holding the balance (Safe on AA chains, EOA otherwise) */
	holdingAddress: `0x${string}`;
}

/**
 * Result of scanning and preparing rebalance tasks
 */
export interface ScanResult {
	/** EOA → Safe sweeps that were executed */
	sweeps: SweepResult[];
	/** Tasks for assets exceeding rebalance thresholds */
	rebalanceTasks: RebalanceTask[];
	/** Any errors encountered during scanning */
	errors: Array<{ chainId: number; tokenSymbol: string; error: string }>;
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Sweep ERC-20 balance from EOA to Safe using a direct wallet transaction.
 */
async function sweepEoaToSafe(
	chainId: SupportedChainId,
	tokenAddress: `0x${string}`,
	amount: bigint,
	safeAddress: `0x${string}`
): Promise<`0x${string}`> {
	const chain = chainList.find((c) => c.chainId === chainId);
	if (!chain) {
		throw new Error(`Chain ${chainId} not found in chainList`);
	}

	const rpcUrl = getChainRpcUrl(chainId);
	const privateKey = getRelayerEoaPrivateKey();
	const account = privateKeyToAccount(privateKey);

	const publicClient = createPublicClient({
		chain: chain.viemChain,
		transport: http(rpcUrl)
	});

	const walletClient = createWalletClient({
		chain: chain.viemChain,
		transport: http(rpcUrl),
		account
	});

	const data = encodeFunctionData({
		abi: erc20Abi,
		functionName: 'transfer',
		args: [safeAddress, amount]
	});

	const hash = await walletClient.sendTransaction({
		to: tokenAddress,
		data,
		value: 0n
	});

	// Wait for confirmation
	await publicClient.waitForTransactionReceipt({ hash });

	return hash;
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Scan relayer balances across all supported chains and tokens.
 *
 * For each (chain, token) pair:
 * 1. Fetch EOA and Safe balances
 * 2. If EOA has balance and Safe exists, sweep EOA → Safe
 * 3. If Safe balance exceeds threshold, add to rebalance tasks
 *
 * @returns ScanResult containing sweeps performed and tasks to rebalance
 */
export async function scanAndQueueRelayerRebalances(): Promise<ScanResult> {
	const sweeps: SweepResult[] = [];
	const rebalanceTasks: RebalanceTask[] = [];
	const errors: ScanResult['errors'] = [];

	// Collect all (chainId, tokenSymbol, tokenAddress) tuples
	const pairs: Array<{
		chainId: SupportedChainId;
		tokenSymbol: EvmStablecoin;
		tokenAddress: `0x${string}`;
		threshold: bigint;
	}> = [];

	for (const chain of chainList) {
		const chainId = chain.chainId as SupportedChainId;
		const tokens = chain.tokens;

		for (const [symbol, address] of Object.entries(tokens)) {
			const tokenSymbol = symbol as EvmStablecoin;
			const tokenAddress = address as `0x${string}`;
			const threshold = chain.rebalanceThresholds[tokenSymbol] ?? 0n;

			pairs.push({ chainId, tokenSymbol, tokenAddress, threshold });
		}
	}

	// Fetch relayer addresses for all chains in parallel
	const addressesByChain = new Map<SupportedChainId, RelayerAddresses>();
	const uniqueChainIds = [...new Set(pairs.map((p) => p.chainId))];

	await Promise.all(
		uniqueChainIds.map(async (chainId) => {
			try {
				const addresses = await getRelayerAddresses(chainId);
				addressesByChain.set(chainId, addresses);
			} catch (err) {
				console.error(
					`[relayerRebalancer] Failed to get relayer addresses for chain ${chainId}:`,
					err
				);
				errors.push({
					chainId,
					tokenSymbol: '*',
					error: `Failed to get relayer addresses: ${err instanceof Error ? err.message : String(err)}`
				});
			}
		})
	);

	// Process each (chain, token) pair
	for (const { chainId, tokenSymbol, tokenAddress, threshold } of pairs) {
		const addresses = addressesByChain.get(chainId);
		if (!addresses) {
			// Already logged error above
			continue;
		}

		try {
			// Fetch EOA balance
			const eoaBalance = await fetchTokenBalance(addresses.eoa, chainId, tokenAddress);

			// Fetch Safe balance (if Safe exists)
			let safeBalance = 0n;
			if (addresses.safe) {
				safeBalance = await fetchTokenBalance(addresses.safe, chainId, tokenAddress);
			}

			console.debug(`[relayerRebalancer] Chain ${chainId} ${tokenSymbol}:`, {
				eoaBalance: eoaBalance.toString(),
				safeBalance: safeBalance.toString(),
				hasSafe: !!addresses.safe
			});

			// Sweep EOA → Safe if EOA has balance and Safe exists
			if (eoaBalance > 0n && addresses.safe) {
				try {
					console.info(
						`[relayerRebalancer] Sweeping ${eoaBalance} ${tokenSymbol} from EOA to Safe on chain ${chainId}`
					);

					const txHash = await sweepEoaToSafe(chainId, tokenAddress, eoaBalance, addresses.safe);

					sweeps.push({
						chainId,
						tokenSymbol,
						tokenAddress,
						amount: eoaBalance.toString(),
						txHash
					});

					// Update Safe balance after sweep
					safeBalance = safeBalance + eoaBalance;

					console.info(`[relayerRebalancer] Sweep complete: ${txHash}`);
				} catch (err) {
					console.error(`[relayerRebalancer] Failed to sweep EOA → Safe on chain ${chainId}:`, err);
					errors.push({
						chainId,
						tokenSymbol,
						error: `Sweep failed: ${err instanceof Error ? err.message : String(err)}`
					});
				}
			}

			// Check if balance exceeds threshold.
			// For AA chains we look at the Safe balance; for EOA-only chains we use the EOA balance directly.
			const effectiveBalance = addresses.safe ? safeBalance : eoaBalance;
			const effectiveAddress = addresses.safe ?? addresses.eoa;

			if (effectiveBalance > threshold && threshold > 0n) {
				rebalanceTasks.push({
					chainId,
					tokenSymbol,
					tokenAddress,
					balance: effectiveBalance.toString(),
					threshold: threshold.toString(),
					holdingAddress: effectiveAddress
				});

				console.info(
					`[relayerRebalancer] Rebalance task created for ${tokenSymbol} on chain ${chainId} at ${effectiveAddress}:`,
					{
						balance: effectiveBalance.toString(),
						threshold: threshold.toString()
					}
				);
			}
		} catch (err) {
			console.error(
				`[relayerRebalancer] Error processing ${tokenSymbol} on chain ${chainId}:`,
				err
			);
			errors.push({
				chainId,
				tokenSymbol,
				error: err instanceof Error ? err.message : String(err)
			});
		}
	}

	return { sweeps, rebalanceTasks, errors };
}
