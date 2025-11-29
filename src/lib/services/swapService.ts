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

const JSON_HEADERS = {
	'Content-Type': 'application/json'
};

async function handleResponse<T>(response: Response): Promise<T> {
	let payload: unknown = null;
	const text = await response.text();

	if (text) {
		try {
			payload = JSON.parse(text);
		} catch {
			throw new SwapServiceError('Invalid server response', 'INVALID_RESPONSE', response.status);
		}
	}

	if (!response.ok) {
		const message =
			typeof (payload as { message?: string })?.message === 'string'
				? (payload as { message: string }).message
				: 'Request failed';
		const code =
			typeof (payload as { code?: SwapServiceErrorCode })?.code === 'string'
				? ((payload as { code: SwapServiceErrorCode }).code as SwapServiceErrorCode)
				: 'UNKNOWN_ERROR';
		throw new SwapServiceError(message, code, response.status);
	}

	return payload as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
	const res = await fetch(url, {
		method: 'POST',
		headers: JSON_HEADERS,
		body: JSON.stringify(body)
	});
	return handleResponse<T>(res);
}

export async function fetchCapacity(params: {
	direction: SwapDirection;
	evmChainId: number;
	evmToken: EvmStablecoin;
}): Promise<CapacityInfo> {
	return postJson<CapacityInfo>('/api/swap/capacity', params);
}

export async function fetchQuote(params: {
	direction: SwapDirection;
	evmChainId: number;
	evmToken: EvmStablecoin;
	amount: string;
	recipientAddress: string;
}): Promise<SwapQuote> {
	return postJson<SwapQuote>('/api/swap/quote', params);
}

export async function getOrder(orderId: string): Promise<TronToEvmOrderView | EvmRelayOrderView> {
	const res = await fetch(`/api/swap/order/${orderId}`);
	const data = await handleResponse<{ order: TronToEvmOrderView | EvmRelayOrderView }>(res);
	return data.order;
}

export async function prepareEvmToTronSwap(
	request: EvmToTronPrepareRequest
): Promise<EvmToTronPrepareResponse> {
	return postJson<EvmToTronPrepareResponse>('/api/swap/evm-to-tron/prepare', request);
}

export async function executeEvmToTronSwap(
	request: EvmToTronExecuteRequest
): Promise<EvmToTronExecuteResponse> {
	return postJson<EvmToTronExecuteResponse>('/api/swap/evm-to-tron/execute', request);
}

export async function requestTronDeposit(
	request: TronToEvmDepositRequest
): Promise<TronDepositResponse> {
	return postJson<TronDepositResponse>('/api/swap/tron-to-evm/deposit', request);
}
