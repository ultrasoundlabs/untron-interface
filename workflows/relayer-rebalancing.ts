/**
 * Relayer Rebalancing Orchestrator Workflow
 *
 * This workflow acts as the main entry point for relayer balance management.
 * It scans all supported chains/tokens, sweeps EOA funds to Safe accounts,
 * and triggers per-asset rebalancing workflows for balances exceeding thresholds.
 *
 * This workflow is intended to be scheduled via cron or triggered manually
 * through the admin API endpoint.
 */

import type { SupportedChainId } from '../src/lib/config/chains';
import type { EvmStablecoin } from '../src/lib/types/swap';
import {
	scanAndQueueRelayerRebalances,
	type ScanResult,
	type SweepResult,
	type RebalanceTask
} from '../src/lib/server/services/relayerRebalancer';
import {
	rebalanceToArbitrumUsdt,
	type RebalanceToArbitrumInput,
	type RebalanceToArbitrumResult
} from './rebalance-to-arbitrum-usdt';

// =============================================================================
// Types
// =============================================================================

/**
 * Summary of a started rebalance workflow
 */
export interface RebalanceWorkflowStarted {
	chainId: SupportedChainId;
	tokenSymbol: EvmStablecoin;
	amount: string;
	workflowStarted: true;
	result: RebalanceToArbitrumResult;
}

/**
 * Result of the orchestrator workflow
 */
export interface RelayerRebalancingResult {
	/** Timestamp when workflow started */
	startedAt: number;
	/** Timestamp when workflow completed */
	completedAt: number;
	/** Duration in milliseconds */
	durationMs: number;
	/** EOA → Safe sweeps that were executed */
	sweeps: SweepResult[];
	/** Rebalance workflows that were started */
	rebalancesStarted: RebalanceWorkflowStarted[];
	/** Any errors encountered during the run */
	errors: ScanResult['errors'];
}

// =============================================================================
// Workflow Steps
// =============================================================================

/**
 * Step: Scan relayer balances and perform sweeps
 */
async function scanRelayerBalances(): Promise<ScanResult> {
	'use step';
	console.info('[relayer-rebalancing] Scanning relayer balances across all chains');
	return scanAndQueueRelayerRebalances();
}

/**
 * Step: Start a single rebalance workflow for a task
 */
async function startRebalanceWorkflow(task: RebalanceTask): Promise<RebalanceToArbitrumResult> {
	'use step';
	console.info('[relayer-rebalancing] Starting rebalance workflow', {
		chainId: task.chainId,
		tokenSymbol: task.tokenSymbol,
		balance: task.balance
	});

	const input: RebalanceToArbitrumInput = {
		sourceChainId: task.chainId,
		tokenSymbol: task.tokenSymbol,
		tokenAddress: task.tokenAddress,
		amount: task.balance,
		holdingAddress: task.holdingAddress
	};

	return rebalanceToArbitrumUsdt(input);
}

// =============================================================================
// Main Workflow
// =============================================================================

/**
 * Run the relayer rebalancing orchestrator.
 *
 * This workflow:
 * 1. Scans all supported chains/tokens for relayer balances
 * 2. Sweeps any EOA balances into the corresponding Safe accounts
 * 3. For each Safe balance exceeding the configured threshold, starts a
 *    rebalance workflow to move funds to USDT on Arbitrum
 *
 * @returns Summary of all actions taken
 */
export async function runRelayerRebalancing(): Promise<RelayerRebalancingResult> {
	'use workflow';

	const startedAt = Date.now();
	console.info('[relayer-rebalancing] Starting relayer rebalancing orchestrator');

	// Step 1: Scan balances and perform EOA → Safe sweeps
	const scanResult = await scanRelayerBalances();

	console.info('[relayer-rebalancing] Scan complete', {
		sweepsCount: scanResult.sweeps.length,
		rebalanceTasksCount: scanResult.rebalanceTasks.length,
		errorsCount: scanResult.errors.length
	});

	// Step 2: Fan out rebalance workflows for each task
	const rebalancesStarted: RebalanceWorkflowStarted[] = [];

	for (const task of scanResult.rebalanceTasks) {
		try {
			const result = await startRebalanceWorkflow(task);

			rebalancesStarted.push({
				chainId: task.chainId,
				tokenSymbol: task.tokenSymbol,
				amount: task.balance,
				workflowStarted: true,
				result
			});
		} catch (err) {
			console.error('[relayer-rebalancing] Failed to start rebalance workflow', {
				chainId: task.chainId,
				tokenSymbol: task.tokenSymbol,
				error: err instanceof Error ? err.message : String(err)
			});

			scanResult.errors.push({
				chainId: task.chainId,
				tokenSymbol: task.tokenSymbol,
				error: `Failed to start rebalance workflow: ${err instanceof Error ? err.message : String(err)}`
			});
		}
	}

	const completedAt = Date.now();
	const result: RelayerRebalancingResult = {
		startedAt,
		completedAt,
		durationMs: completedAt - startedAt,
		sweeps: scanResult.sweeps,
		rebalancesStarted,
		errors: scanResult.errors
	};

	console.info('[relayer-rebalancing] Orchestrator workflow completed', {
		durationMs: result.durationMs,
		sweepsCount: result.sweeps.length,
		rebalancesStartedCount: result.rebalancesStarted.length,
		errorsCount: result.errors.length
	});

	return result;
}
