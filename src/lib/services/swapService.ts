/**
 * Swap service - frontend client for the Untron API routes.
 */

import type {
	SwapDirection,
	SwapQuote,
	CapacityInfo,
	Order,
	CreateOrderRequest,
	CreateOrderResponse,
	CreateSigningSessionRequest,
	CreateSigningSessionResponse,
	SubmitSigningSessionSignaturesResponse,
	FinalizeSigningSessionResponse,
	EvmStablecoin
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

export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
	return postJson<CreateOrderResponse>('/api/swap/order', request);
}

export async function createSigningSession(
	request: CreateSigningSessionRequest
): Promise<CreateSigningSessionResponse> {
	return postJson<CreateSigningSessionResponse>('/api/swap/signing-session', request);
}

export async function submitSigningSessionSignatures(
	sessionId: string,
	signatures: Array<{ payloadId: string; signature: string }>
): Promise<SubmitSigningSessionSignaturesResponse> {
	return postJson<SubmitSigningSessionSignaturesResponse>(
		`/api/swap/signing-session/${sessionId}/signatures`,
		{
			signatures
		}
	);
}

export async function finalizeSigningSession(
	sessionId: string
): Promise<FinalizeSigningSessionResponse> {
	return postJson<FinalizeSigningSessionResponse>(
		`/api/swap/signing-session/${sessionId}/finalize`,
		{}
	);
}

export async function getOrder(orderId: string): Promise<Order> {
	const res = await fetch(`/api/swap/order/${orderId}`);
	const data = await handleResponse<{ order: Order }>(res);
	return data.order;
}

export async function submitSignatures(
	orderId: string,
	signatures: Array<{ payloadId: string; signature: string }>
): Promise<Order> {
	const data = await postJson<{ order: Order }>(`/api/swap/order/${orderId}/signatures`, {
		signatures
	});
	return data.order;
}
