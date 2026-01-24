/**
 * Swap service - frontend client for the Untron API routes.
 */

import type {
	CapacityInfo,
	EvmRelayOrderView,
	EvmStablecoin,
	EvmToTronExecuteRequest,
	EvmToTronExecuteResponse,
	EvmToTronPrepareRequest,
	EvmToTronPrepareResponse,
	SwapDirection,
	SwapQuote,
	TronDepositResponse,
	TronToEvmDepositRequest,
	TronToEvmOrderView
} from '$lib/types/swap';
import type { SwapServiceErrorCode } from '$lib/types/errors';

export class SwapServiceError extends Error {
	constructor(
		message: string,
		public code: SwapServiceErrorCode,
		public statusCode?: number
	) {
		super(message);
		this.name = 'SwapServiceError';
	}
}

function backendDisabled(): never {
	throw new SwapServiceError(
		'Backend is disabled in this build',
		'DISABLED' satisfies SwapServiceErrorCode
	);
}

export async function fetchCapacity(params: {
	direction: SwapDirection;
	evmChainId: number;
	evmToken: EvmStablecoin;
}): Promise<CapacityInfo> {
	void params;
	return {
		maxAmount: '1000000000000',
		minAmount: '0',
		availableLiquidity: '1000000000000',
		fetchedAt: Date.now(),
		refreshAt: Date.now() + 30_000
	};
}

export async function fetchQuote(params: {
	direction: SwapDirection;
	evmChainId: number;
	evmToken: EvmStablecoin;
	amount: string;
	recipientAddress: string;
}): Promise<SwapQuote> {
	return {
		direction: params.direction,
		inputAmount: params.amount,
		outputAmount: params.amount,
		effectiveRate: '1',
		fees: {
			protocolFeeBps: 0,
			protocolFeeAmount: '0',
			networkFeeAmount: '0',
			totalFeeAmount: '0'
		},
		estimatedTimeSeconds: 0,
		expiresAt: Date.now() + 60_000
	};
}

export async function getOrder(orderId: string): Promise<TronToEvmOrderView | EvmRelayOrderView> {
	void orderId;
	throw new SwapServiceError('Order not found', 'ORDER_NOT_FOUND', 404);
}

export async function prepareEvmToTronSwap(
	request: EvmToTronPrepareRequest
): Promise<EvmToTronPrepareResponse> {
	void request;
	return backendDisabled();
}

export async function executeEvmToTronSwap(
	request: EvmToTronExecuteRequest
): Promise<EvmToTronExecuteResponse> {
	void request;
	return backendDisabled();
}

export async function requestTronDeposit(
	request: TronToEvmDepositRequest
): Promise<TronDepositResponse> {
	void request;
	return backendDisabled();
}
