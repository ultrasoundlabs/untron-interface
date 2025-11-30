import type { SwapExecutionSummary } from '../src/lib/types/swap';
import {
	markSettlementCompleted,
	markSettlementFailed,
	recordInitialExecution,
	selectTronRelayer,
	sendTronPayout,
	waitForEvmRelayConfirmation,
	waitForTronConfirmation
} from '../steps/evm-to-tron';
import { createSettlementWorkflowLogger, describeWorkflowError } from '../steps/workflowContext';

export async function evmToTronSettlement(execution: SwapExecutionSummary) {
	'use workflow';
	const logger = createSettlementWorkflowLogger({
		orderId: execution.orderId,
		evmTxHash: execution.evmTxHash
	});

	logger.info('Starting EVM→Tron settlement workflow', {
		relayMethod: execution.relayMethod,
		evmChainId: execution.evmChainId
	});

	const settlementRecord = await recordInitialExecution(execution);

	if (settlementRecord.status !== 'relaying') {
		logger.info('Settlement already in terminal state, skipping workflow run', {
			status: settlementRecord.status
		});
		return { orderId: execution.orderId, tronTxHash: settlementRecord.tronTxHash };
	}

	try {
		await waitForEvmRelayConfirmation(execution);
		const relayer = await selectTronRelayer(execution);
		const tronTxHash = await sendTronPayout(execution, relayer);
		await waitForTronConfirmation(tronTxHash);
		await markSettlementCompleted(execution.orderId, tronTxHash);
		logger.info('EVM→Tron settlement workflow completed', { tronTxHash });
		return { orderId: execution.orderId, tronTxHash };
	} catch (error) {
		logger.error('EVM→Tron settlement workflow failed', describeWorkflowError(error));
		await markSettlementFailed(
			execution.orderId,
			error instanceof Error ? error.message : 'Unknown error'
		);
		throw error;
	}
}
