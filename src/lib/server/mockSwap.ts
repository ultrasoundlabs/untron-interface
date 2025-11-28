import { TRON_USDT, getChainById, getTokenOnChain } from '$lib/config/swapConfig';
import type {
	CapacityInfo,
	CreateOrderRequest,
	Eip712Payload,
	Order,
	OrderTimelineEvent,
	SwapDirection,
	SwapQuote
} from '$lib/types/swap';
import type { SwapServiceErrorCode } from '$lib/types/errors';

export class SwapServiceError extends Error {
	constructor(
		message: string,
		public code: SwapServiceErrorCode,
		public statusCode: number = 400
	) {
		super(message);
		this.name = 'SwapServiceError';
	}
}

const orders = new Map<string, Order>();

function convertBetweenDecimals(amount: bigint, fromDecimals: number, toDecimals: number): bigint {
	if (fromDecimals === toDecimals) return amount;
	const diff = Math.abs(fromDecimals - toDecimals);
	const factor = 10n ** BigInt(diff);
	return fromDecimals < toDecimals ? amount * factor : amount / factor;
}

function generateMockTxHash(suffixSeed: string): string {
	const base = suffixSeed
		.replace(/[^a-fA-F0-9]/g, '')
		.slice(-16)
		.padStart(16, '0');
	return `0x${base.padStart(64, '0')}`;
}

function scheduleAutoCompletion(orderId: string) {
	// First stage: move to relaying if still in a pre-completion state
	setTimeout(() => {
		const order = orders.get(orderId);
		if (!order) return;
		if (!['awaiting_payment', 'signatures_submitted'].includes(order.status)) return;

		const now = Date.now();
		order.status = 'relaying';
		order.timeline.push({
			type: 'relaying',
			timestamp: now
		});
		order.updatedAt = now;
		orders.set(orderId, order);

		// Second stage: complete the order with mock tx hashes
		setTimeout(() => {
			const current = orders.get(orderId);
			if (!current) return;
			if (current.status !== 'relaying') return;

			const completedAt = Date.now();
			current.status = 'completed';
			current.finalTxHashes = {
				source: generateMockTxHash(`${orderId}_source`),
				destination: generateMockTxHash(`${orderId}_dest`)
			};
			current.timeline.push({
				type: 'completed',
				timestamp: completedAt,
				txHash: current.finalTxHashes.destination
			});
			current.updatedAt = completedAt;
			orders.set(orderId, current);
		}, 4000);
	}, 4000);
}

export function generateMockCapacity(): CapacityInfo {
	return {
		maxAmount: '100000000000', // 100,000 with 6 decimals
		minAmount: '1000000', // 1 USDT
		availableLiquidity: '85000000000',
		fetchedAt: Date.now(),
		refreshAt: Date.now() + 5000
	};
}

export function generateMockQuote(
	direction: SwapDirection,
	inputAmount: string,
	sourceDecimals: number,
	destDecimals: number
): SwapQuote {
	const input = BigInt(inputAmount);
	const protocolFeeSource = (input * 50n) / 10000n; // 0.5%
	const networkFeeBase = direction === 'TRON_TO_EVM' ? 500000n : 100000n; // expressed with 6 decimals
	const networkFeeSource =
		direction === 'TRON_TO_EVM'
			? networkFeeBase
			: convertBetweenDecimals(networkFeeBase, 6, sourceDecimals);
	const totalFeeSource = protocolFeeSource + networkFeeSource;
	const outputSource = input > totalFeeSource ? input - totalFeeSource : 0n;

	const protocolFeeDest = convertBetweenDecimals(protocolFeeSource, sourceDecimals, destDecimals);
	const networkFeeDest = convertBetweenDecimals(networkFeeSource, sourceDecimals, destDecimals);
	const totalFeeDest = convertBetweenDecimals(totalFeeSource, sourceDecimals, destDecimals);
	const outputDest = convertBetweenDecimals(outputSource, sourceDecimals, destDecimals);

	return {
		direction,
		inputAmount,
		outputAmount: outputDest.toString(),
		effectiveRate: '0.995',
		fees: {
			protocolFeeBps: 50,
			protocolFeeAmount: protocolFeeDest.toString(),
			networkFeeAmount: networkFeeDest.toString(),
			totalFeeAmount: totalFeeDest.toString()
		},
		estimatedTimeSeconds: direction === 'TRON_TO_EVM' ? 180 : 60,
		hint: input > 10000_000000n ? 'Large swaps may take a bit longer to process' : undefined,
		expiresAt: Date.now() + 30000
	};
}

export function createMockOrder(request: CreateOrderRequest): Order {
	const chain = getChainById(request.evmChainId);
	if (!chain) {
		throw new SwapServiceError('Unsupported chain', 'UNSUPPORTED_CHAIN', 400);
	}

	const token = getTokenOnChain(request.evmChainId, request.evmToken);
	if (!token) {
		throw new SwapServiceError('Unsupported token for this chain', 'UNSUPPORTED_TOKEN', 400);
	}

	const amountBigInt = BigInt(request.amount);
	if (amountBigInt <= 0n) {
		throw new SwapServiceError('Amount must be greater than zero', 'INVALID_AMOUNT', 400);
	}

	const capacity = generateMockCapacity();
	const minAmount = BigInt(capacity.minAmount);
	const maxAmount = BigInt(capacity.maxAmount);
	if (amountBigInt < minAmount) {
		throw new SwapServiceError('Amount is below minimum', 'AMOUNT_TOO_LOW', 400);
	}
	if (amountBigInt > maxAmount) {
		throw new SwapServiceError('Amount exceeds maximum', 'AMOUNT_TOO_HIGH', 400);
	}

	const now = Date.now();
	const orderId = `order_${now}_${Math.random().toString(36).slice(2, 10)}`;
	const sourceDecimals = request.direction === 'TRON_TO_EVM' ? TRON_USDT.decimals : token.decimals;
	const destDecimals = request.direction === 'TRON_TO_EVM' ? token.decimals : TRON_USDT.decimals;
	const quote = generateMockQuote(request.direction, request.amount, sourceDecimals, destDecimals);

	const tronSide = {
		type: 'tron' as const,
		token: TRON_USDT,
		amount: request.direction === 'TRON_TO_EVM' ? request.amount : quote.outputAmount
	};

	const evmSide = {
		type: 'evm' as const,
		chain,
		token,
		amount: request.direction === 'TRON_TO_EVM' ? quote.outputAmount : request.amount
	};

	const baseOrder: Order = {
		id: orderId,
		direction: request.direction,
		status: 'created',
		source: request.direction === 'TRON_TO_EVM' ? tronSide : evmSide,
		destination: request.direction === 'TRON_TO_EVM' ? evmSide : tronSide,
		recipientAddress: request.recipientAddress,
		quote,
		timeline: [
			{
				type: 'created',
				timestamp: now
			}
		],
		createdAt: now,
		updatedAt: now
	};

	if (request.direction === 'TRON_TO_EVM') {
		baseOrder.status = 'awaiting_payment';
		baseOrder.tronDeposit = {
			depositAddress: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
			expectedAmount: request.amount,
			expiresAt: now + 30 * 60 * 1000
		};
		baseOrder.timeline.push({
			type: 'awaiting_payment',
			timestamp: now
		});
		// For the mock, automatically complete Tron→EVM orders after a short delay
		scheduleAutoCompletion(orderId);
	} else {
		baseOrder.status = 'awaiting_signatures';
		baseOrder.eip712Payloads = createMockPayloads(request);
		baseOrder.signaturesReceived = 0;
		baseOrder.timeline.push({
			type: 'awaiting_signatures',
			timestamp: now
		});
	}

	orders.set(orderId, baseOrder);
	return baseOrder;
}

function createMockPayloads(request: CreateOrderRequest) {
	const deadline = Math.floor((Date.now() + 30 * 60 * 1000) / 1000).toString();
	const payloads: Eip712Payload[] = [
		{
			id: 'approval',
			domain: {
				name: 'Untron',
				version: '1',
				chainId: request.evmChainId,
				verifyingContract: '0x0000000000000000000000000000000000000001'
			},
			types: {
				Permit: [
					{ name: 'owner', type: 'address' },
					{ name: 'spender', type: 'address' },
					{ name: 'value', type: 'uint256' },
					{ name: 'nonce', type: 'uint256' },
					{ name: 'deadline', type: 'uint256' }
				]
			},
			primaryType: 'Permit',
			message: {
				owner: '0x0000000000000000000000000000000000000000',
				spender: '0x0000000000000000000000000000000000000001',
				value: request.amount,
				nonce: '0',
				deadline
			}
		}
	];
	return payloads;
}

export function getMockOrder(orderId: string): Order {
	const stored = orders.get(orderId);
	if (!stored) {
		throw new SwapServiceError(`Order ${orderId} not found`, 'ORDER_NOT_FOUND', 404);
	}
	return stored;
}

export function submitMockSignatures(
	orderId: string,
	signatures: Array<{ payloadId: string; signature: string }>
): Order {
	const order = getMockOrder(orderId);
	if (order.direction !== 'EVM_TO_TRON' || !order.eip712Payloads) {
		throw new SwapServiceError(
			'No signatures required for this order',
			'NO_SIGNATURES_REQUIRED',
			400
		);
	}

	order.signaturesReceived = Math.min(
		(order.signaturesReceived ?? 0) + signatures.length,
		order.eip712Payloads.length
	);

	const now = Date.now();
	const timelineEvents: OrderTimelineEvent[] = [
		{
			type: 'signature_received',
			timestamp: now,
			details: `Received ${signatures.length} signature(s)`
		}
	];

	if (order.signaturesReceived >= order.eip712Payloads.length) {
		order.status = 'signatures_submitted';
		timelineEvents.push({
			type: 'signatures_submitted',
			timestamp: now
		});

		// When all signatures are submitted in the mock, automatically relay and complete the order
		scheduleAutoCompletion(orderId);
	}

	order.timeline.push(...timelineEvents);
	order.updatedAt = now;
	orders.set(orderId, order);
	return order;
}
