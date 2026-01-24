/**
 * Bridge API service (client-side).
 *
 * This file intentionally contains no chain/wallet logic — it only talks to the
 * Untron Bridge HTTP API described by `openapi.json`.
 */

import { api } from '$lib/api/client';
import type { components } from '$lib/api/schema';
import type { BridgeCapabilities, BridgeOrder, BridgeQuote } from '$lib/types/swap';
import type { SwapServiceErrorCode } from '$lib/types/errors';

type Problem = components['schemas']['Problem'];

export class SwapServiceError extends Error {
	constructor(
		message: string,
		public code: SwapServiceErrorCode,
		public statusCode?: number,
		public problem?: Problem
	) {
		super(message);
		this.name = 'SwapServiceError';
	}
}

function formatProblem(problem: Problem): string {
	const title = problem.title?.trim();
	const detail = problem.detail?.trim();
	if (title && detail) return `${title}: ${detail}`;
	return title || detail || 'Request failed';
}

function toSwapServiceError(args: {
	code: SwapServiceErrorCode;
	statusCode?: number;
	problem?: Problem;
	fallbackMessage?: string;
}): SwapServiceError {
	const message = args.problem
		? formatProblem(args.problem)
		: (args.fallbackMessage ?? 'Request failed');
	return new SwapServiceError(message, args.code, args.statusCode, args.problem);
}

export async function fetchCapabilities(fetchImpl?: typeof fetch): Promise<{
	capabilities: BridgeCapabilities;
	etag?: string;
}> {
	const client = api(fetchImpl);
	const res = await client.GET('/v1/capabilities', {});

	if (res.data) {
		return { capabilities: res.data, etag: res.response.headers.get('ETag') ?? undefined };
	}

	if (res.response.status === 304) {
		throw toSwapServiceError({
			code: 'INVALID_RESPONSE',
			statusCode: 304,
			fallbackMessage: 'Capabilities not modified (ETag caching not enabled in this client)'
		});
	}

	const problem = (res.error as { 'application/problem+json'?: Problem } | undefined)?.[
		'application/problem+json'
	];

	throw toSwapServiceError({
		code: 'INVALID_RESPONSE',
		statusCode: res.response.status,
		problem
	});
}

export async function createQuote(
	request: components['schemas']['QuoteRequest'],
	fetchImpl?: typeof fetch
): Promise<BridgeQuote> {
	const client = api(fetchImpl);
	const res = await client.POST('/v1/quotes', { body: request });

	if (res.data) return res.data;

	const problem = (res.error as { 'application/problem+json'?: Problem } | undefined)?.[
		'application/problem+json'
	];

	throw toSwapServiceError({
		code: 'INVALID_REQUEST',
		statusCode: res.response.status,
		problem
	});
}

export async function createOrder(
	args: {
		quoteId: string;
		recipient: components['schemas']['AccountId'];
		refundTo?: components['schemas']['AccountId'];
		idempotencyKey: string;
		clientOrderId?: string;
		turnstileToken?: string;
	},
	fetchImpl?: typeof fetch
): Promise<BridgeOrder> {
	const client = api(fetchImpl);
	const body: components['schemas']['CreateOrderRequest'] = {
		quoteId: args.quoteId,
		recipient: args.recipient,
		...(args.refundTo ? { refund: { to: args.refundTo } } : {})
	};

	const res = await client.POST('/v1/orders', {
		body,
		params: {
			header: {
				'Idempotency-Key': args.idempotencyKey,
				...(args.clientOrderId ? { 'X-Client-Order-Id': args.clientOrderId } : {}),
				...(args.turnstileToken ? { 'cf-turnstile-response': args.turnstileToken } : {})
			} as unknown as {
				'Idempotency-Key': string;
				'X-Client-Order-Id'?: string;
			}
		}
	});

	if (res.data) return res.data;

	const problem = (res.error as { 'application/problem+json'?: Problem } | undefined)?.[
		'application/problem+json'
	];

	throw toSwapServiceError({
		code: 'INVALID_REQUEST',
		statusCode: res.response.status,
		problem
	});
}

export async function getOrder(orderId: string, fetchImpl?: typeof fetch): Promise<BridgeOrder> {
	const client = api(fetchImpl);
	const res = await client.GET('/v1/orders/{orderId}', { params: { path: { orderId } } });

	if (res.data) return res.data;

	const problem = (res.error as { 'application/problem+json'?: Problem } | undefined)?.[
		'application/problem+json'
	];

	if (res.response.status === 404) {
		throw toSwapServiceError({
			code: 'ORDER_NOT_FOUND',
			statusCode: 404,
			problem
		});
	}

	throw toSwapServiceError({
		code: 'INVALID_RESPONSE',
		statusCode: res.response.status,
		problem
	});
}
