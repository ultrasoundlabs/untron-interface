/**
 * Admin API: Relayer Rebalancing Trigger
 *
 * This endpoint allows manual triggering of the relayer rebalancing workflow.
 * It scans all chains/tokens, sweeps EOA → Safe, and starts rebalancing workflows
 * for balances exceeding thresholds.
 *
 * In production, this endpoint should be protected with authentication.
 * Currently, it only runs in development mode for safety.
 *
 * Usage:
 *   POST /api/admin/relayer-rebalancing
 *
 * Response:
 *   - 200: Workflow completed successfully, returns summary
 *   - 500: Workflow failed
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import { runRelayerRebalancing } from '../../../../../workflows/relayer-rebalancing';

export const POST: RequestHandler = async () => {
	// TODO: Add proper authentication for production use.
	// For now, restrict to development mode only.
	if (!import.meta.env.DEV) {
		throw error(404, 'Not found');
	}

	console.info('[api/admin/relayer-rebalancing] Manual trigger received');

	try {
		const result = await runRelayerRebalancing();

		console.info('[api/admin/relayer-rebalancing] Workflow completed', {
			durationMs: result.durationMs,
			sweepsCount: result.sweeps.length,
			rebalancesStartedCount: result.rebalancesStarted.length,
			errorsCount: result.errors.length
		});

		return json(result);
	} catch (err) {
		console.error('[api/admin/relayer-rebalancing] Workflow failed', {
			error: err instanceof Error ? err.message : String(err),
			stack: err instanceof Error ? err.stack : undefined
		});

		throw error(
			500,
			`Relayer rebalancing workflow failed: ${err instanceof Error ? err.message : 'Unknown error'}`
		);
	}
};

/**
 * GET handler to check the status/health of the rebalancing system.
 * Returns basic info without triggering the workflow.
 */
export const GET: RequestHandler = async () => {
	if (!import.meta.env.DEV) {
		throw error(404, 'Not found');
	}

	return json({
		endpoint: '/api/admin/relayer-rebalancing',
		description: 'Relayer rebalancing workflow trigger',
		methods: {
			POST: 'Trigger full rebalancing workflow (scan, sweep, rebalance)',
			GET: 'This status endpoint'
		},
		notes: [
			'Currently restricted to development mode only',
			'In production, add authentication middleware',
			'The per-asset rebalance workflow is currently a stub'
		]
	});
};
