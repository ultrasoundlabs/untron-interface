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

	const settlementRecord = await recordInitialExecution(
		execution,
		logger.child({ step: 'record-initial-execution' })
	);

	if (settlementRecord.status !== 'relaying') {
		logger.info('Settlement already in terminal state, skipping workflow run', {
			status: settlementRecord.status
		});
		return { orderId: execution.orderId, tronTxHash: settlementRecord.tronTxHash };
	}

	try {
		await waitForEvmRelayConfirmation(
			execution,
			logger.child({ step: 'wait-evm-relay-confirmation' })
		);
		const relayer = await selectTronRelayer(
			execution,
			logger.child({ step: 'select-tron-relayer' })
		);
		const tronTxHash = await sendTronPayout(
			execution,
			relayer,
			logger.child({ step: 'send-tron-payout', relayerAddress: relayer.address })
		);
		await waitForTronConfirmation(
			tronTxHash,
			logger.child({ step: 'wait-tron-confirmation', tronTxHash })
		);
		await markSettlementCompleted(
			execution.orderId,
			tronTxHash,
			logger.child({ step: 'mark-settlement-completed', tronTxHash })
		);
		logger.info('EVM→Tron settlement workflow completed', { tronTxHash });
		return { orderId: execution.orderId, tronTxHash };
	} catch (error) {
		logger.error('EVM→Tron settlement workflow failed', describeWorkflowError(error));
		await markSettlementFailed(
			execution.orderId,
			error instanceof Error ? error.message : 'Unknown error',
			logger.child({ step: 'mark-settlement-failed' })
		);
		throw error;
	}
}
