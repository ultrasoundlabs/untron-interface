import { TRON_USDT, getChainById, getTokenOnChain } from '$lib/config/swapConfig';
import type {
	CreateOrderRequest,
	EvmStablecoin,
	Order,
	OrderTimelineEvent,
	SigningSession
} from '$lib/types/swap';
import { encodeFunctionData, erc20Abi } from 'viem';
import { getQuote } from './quotes';
import { SwapDomainError } from '../errors';
import { generateEntityId, getOrderRecord, saveOrderRecord } from '../adapters/mockPersistence';
import type { SupportedChainId } from '$lib/config/chains';
import {
	relayEvmTxs,
	type RelayCall,
	RelayError,
	AaInfraError
} from '$lib/server/services/evmRelayer';
import { TRANSFER_WITH_AUTHORIZATION_PAYLOAD_ID } from './constants';

// =============================================================================
// EVM Relayer Integration
// =============================================================================
//
// `processConfirmedTronDeposit` is invoked once the Tron watcher confirms that
// the user sent the required USDT. It transitions the order from
// `awaiting_payment` → `relaying` → `completed`/`failed` by building a relay
// request that transfers the destination ERC-20 token to the user's EVM wallet.
//
// TRON→EVM now relies on the shared `relayEvmTxs` service, so AA/EOA selection,
// bundler fallback, and AA health tracking are handled centrally.
// =============================================================================

type EvmDestinationSide = Extract<Order['destination'], { type: 'evm' }>;
type TronToEvmOrder = Order & {
	direction: 'TRON_TO_EVM';
	destination: EvmDestinationSide;
};

type EvmSourceSide = Extract<Order['source'], { type: 'evm' }>;
type TronDestinationSide = Extract<Order['destination'], { type: 'tron' }>;
type EvmToTronOrder = Order & {
	direction: 'EVM_TO_TRON';
	source: EvmSourceSide;
	destination: TronDestinationSide;
};

function assertTronToEvmOrder(order: Order): asserts order is TronToEvmOrder {
	if (order.direction !== 'TRON_TO_EVM' || order.destination.type !== 'evm') {
		throw new SwapDomainError('Order is not a Tron→EVM transfer', 'INVALID_REQUEST', 409);
	}
}

function assertEvmToTronOrder(order: Order): asserts order is EvmToTronOrder {
	if (
		order.direction !== 'EVM_TO_TRON' ||
		order.source.type !== 'evm' ||
		order.destination.type !== 'tron'
	) {
		throw new SwapDomainError('Order is not an EVM→Tron transfer', 'INVALID_REQUEST', 409);
	}
}

function ensureEvmRecipient(address: string): `0x${string}` {
	if (!address || !address.startsWith('0x') || address.length !== 42) {
		throw new SwapDomainError('Invalid EVM recipient address', 'INVALID_REQUEST');
	}
	return address as `0x${string}`;
}

function encodePayoutCalldata(order: TronToEvmOrder): `0x${string}` {
	const amount = BigInt(order.destination.amount);
	if (amount <= 0n) {
		throw new SwapDomainError('Payout amount must be greater than zero', 'INVALID_REQUEST');
	}

	return encodeFunctionData({
		abi: erc20Abi,
		functionName: 'transfer',
		args: [ensureEvmRecipient(order.recipientAddress), amount]
	});
}

function buildRelayCalls(order: TronToEvmOrder): RelayCall[] {
	const call: RelayCall = {
		to: order.destination.token.address,
		data: encodePayoutCalldata(order),
		value: 0n
	};

	// Single-call for now, but we could push more calls here in future
	return [call];
}

function describeRelayFailure(err: unknown): string {
	if (err instanceof RelayError) {
		return `RelayError(${err.code}): ${err.message}`;
	}
	if (err instanceof AaInfraError) {
		return `AA infrastructure error: ${err.message}`;
	}
	if (err instanceof Error) {
		return err.message;
	}
	return 'Unknown relay failure';
}

const erc3009Abi = [
	{
		type: 'function',
		name: 'transferWithAuthorization',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'from', type: 'address' },
			{ name: 'to', type: 'address' },
			{ name: 'value', type: 'uint256' },
			{ name: 'validAfter', type: 'uint256' },
			{ name: 'validBefore', type: 'uint256' },
			{ name: 'nonce', type: 'bytes32' },
			{ name: 'signature', type: 'bytes' }
		],
		outputs: []
	}
] as const;

function getTransferAuthorization(order: EvmToTronOrder) {
	const payloads = order.eip712Payloads ?? [];
	if (payloads.length === 0) {
		throw new SwapDomainError('Missing transfer authorization payload', 'INVALID_REQUEST');
	}

	const payload =
		payloads.find((item) => item.id === TRANSFER_WITH_AUTHORIZATION_PAYLOAD_ID) ?? payloads[0];

	const signature = order.payloadSignatures?.[payload.id];
	if (!signature) {
		throw new SwapDomainError('Missing signature for transfer authorization', 'INVALID_SIGNATURE');
	}

	return { payload, signature: signature as `0x${string}` };
}

function buildTransferAuthorizationRelayCall(order: EvmToTronOrder): RelayCall {
	const { payload, signature } = getTransferAuthorization(order);
	const message = payload.message as Record<string, string>;
	const verifyingContract = payload.domain?.verifyingContract;
	if (!verifyingContract) {
		throw new SwapDomainError(
			'Transfer authorization missing verifying contract',
			'INVALID_REQUEST'
		);
	}

	const tokenAddress = order.source.token.address;
	if (verifyingContract.toLowerCase() !== tokenAddress.toLowerCase()) {
		throw new SwapDomainError('Transfer authorization token mismatch', 'INVALID_REQUEST');
	}

	const from = message.from as `0x${string}`;
	const to = message.to as `0x${string}`;
	const value = BigInt(message.value);
	if (value <= 0n) {
		throw new SwapDomainError('Transfer amount must be greater than zero', 'INVALID_REQUEST');
	}

	const validAfter = BigInt(message.validAfter);
	const validBefore = BigInt(message.validBefore);
	const nonce = message.nonce as `0x${string}`;

	return {
		to: tokenAddress,
		data: encodeFunctionData({
			abi: erc3009Abi,
			functionName: 'transferWithAuthorization',
			args: [from, to, value, validAfter, validBefore, nonce, signature]
		}),
		value: 0n
	};
}

export async function processConfirmedTronDeposit(orderId: string): Promise<Order> {
	const order = getOrderById(orderId);
	assertTronToEvmOrder(order);

	if (order.status !== 'awaiting_payment') {
		throw new SwapDomainError(
			`Order ${orderId} is not awaiting Tron payment (current status: ${order.status})`,
			'INVALID_REQUEST',
			409
		);
	}

	const relayReadyAt = Date.now();
	order.status = 'relaying';
	order.timeline.push({ type: 'relaying', timestamp: relayReadyAt });
	order.updatedAt = relayReadyAt;
	saveOrderRecord(order);

	const relayCalls = buildRelayCalls(order);

	try {
		const relayResult = await relayEvmTxs({
			chainId: order.destination.chain.chainId as SupportedChainId,
			fromUserId: undefined,
			calls: relayCalls
		});
		const completedAt = Date.now();
		order.status = 'completed';
		order.finalTxHashes = {
			...order.finalTxHashes,
			destination: relayResult.txHash
		};
		order.timeline.push({
			type: 'completed',
			timestamp: completedAt,
			txHash: relayResult.txHash,
			details: `Relayed via ${relayResult.relayedVia}`
		});
		order.updatedAt = completedAt;
		saveOrderRecord(order);
		return order;
	} catch (error) {
		const failedAt = Date.now();
		order.status = 'failed';
		order.timeline.push({
			type: 'failed',
			timestamp: failedAt,
			details: describeRelayFailure(error)
		});
		order.updatedAt = failedAt;
		saveOrderRecord(order);
		throw error;
	}
}

export async function processEvmToTronTransfer(orderId: string): Promise<Order> {
	const order = getOrderById(orderId);
	assertEvmToTronOrder(order);

	if (order.status !== 'signatures_submitted') {
		return order;
	}

	let relayCall: RelayCall;
	try {
		relayCall = buildTransferAuthorizationRelayCall(order);
	} catch (error) {
		const failedAt = Date.now();
		order.status = 'failed';
		order.timeline.push({
			type: 'failed',
			timestamp: failedAt,
			details: describeRelayFailure(error)
		});
		order.updatedAt = failedAt;
		saveOrderRecord(order);
		throw error;
	}

	const relayReadyAt = Date.now();
	order.status = 'relaying';
	order.timeline.push({ type: 'relaying', timestamp: relayReadyAt });
	order.updatedAt = relayReadyAt;
	saveOrderRecord(order);

	try {
		const relayResult = await relayEvmTxs({
			chainId: order.source.chain.chainId as SupportedChainId,
			fromUserId: undefined,
			calls: [relayCall]
		});

		const completedAt = Date.now();
		order.status = 'completed';
		order.finalTxHashes = {
			...order.finalTxHashes,
			source: relayResult.txHash
		};
		order.timeline.push({
			type: 'completed',
			timestamp: completedAt,
			txHash: relayResult.txHash,
			details: `transferWithAuthorization via ${relayResult.relayedVia}`
		});
		order.updatedAt = completedAt;
		saveOrderRecord(order);
		return order;
	} catch (error) {
		const failedAt = Date.now();
		order.status = 'failed';
		order.timeline.push({
			type: 'failed',
			timestamp: failedAt,
			details: describeRelayFailure(error)
		});
		order.updatedAt = failedAt;
		saveOrderRecord(order);
		throw error;
	}
}

type SignaturePayload = { payloadId: string; signature: string };

async function prepareOrderContext(request: CreateOrderRequest) {
	const chain = getChainById(request.evmChainId);
	if (!chain) {
		throw new SwapDomainError('Unsupported chain', 'UNSUPPORTED_CHAIN');
	}

	const token = getTokenOnChain(request.evmChainId, request.evmToken);
	if (!token) {
		throw new SwapDomainError('Unsupported token for this chain', 'UNSUPPORTED_TOKEN');
	}

	const quote = await getQuote({
		direction: request.direction,
		evmChainId: request.evmChainId,
		evmToken: request.evmToken,
		amount: request.amount
	});

	return { chain, token, quote };
}

function buildOrderBase(
	request: CreateOrderRequest,
	chain: ReturnType<typeof getChainById>,
	token: ReturnType<typeof getTokenOnChain>,
	quote: Awaited<ReturnType<typeof getQuote>>
) {
	const now = Date.now();
	const orderId = generateEntityId('order');
	const tronSide = {
		type: 'tron' as const,
		token: TRON_USDT,
		amount: request.direction === 'TRON_TO_EVM' ? request.amount : quote.outputAmount
	};

	const evmSide = {
		type: 'evm' as const,
		chain: chain!,
		token: token!,
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

	return baseOrder;
}

export async function createOrder(request: CreateOrderRequest): Promise<Order> {
	const { chain, token, quote } = await prepareOrderContext(request);
	const order = buildOrderBase(request, chain, token, quote);

	if (request.direction === 'TRON_TO_EVM') {
		order.status = 'awaiting_payment';
		order.tronDeposit = {
			depositAddress: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
			expectedAmount: request.amount,
			expiresAt: Date.now() + 30 * 60 * 1000
		};
		order.timeline.push({
			type: 'awaiting_payment',
			timestamp: order.createdAt
		});
		// Real completion happens when the Tron watcher calls processConfirmedTronDeposit.
	} else {
		order.status = 'awaiting_signatures';
		order.eip712Payloads = []; // populated via signing sessions flow
		order.signaturesReceived = 0;
		order.payloadSignatures = {};
		order.timeline.push({
			type: 'awaiting_signatures',
			timestamp: order.createdAt
		});
	}

	saveOrderRecord(order);
	return order;
}

export function getOrderById(orderId: string): Order {
	const stored = getOrderRecord(orderId);
	if (!stored) {
		throw new SwapDomainError(`Order ${orderId} not found`, 'ORDER_NOT_FOUND', 404);
	}
	return stored;
}

function pushTimeline(order: Order, events: OrderTimelineEvent[]) {
	order.timeline.push(...events);
	order.updatedAt = Date.now();
}

export function submitOrderSignatures(orderId: string, signatures: SignaturePayload[]): Order {
	const order = getOrderById(orderId);
	if (order.direction !== 'EVM_TO_TRON' || !order.eip712Payloads) {
		throw new SwapDomainError('No signatures required for this order', 'NO_SIGNATURES_REQUIRED');
	}

	order.payloadSignatures = order.payloadSignatures ?? {};
	for (const entry of signatures) {
		order.payloadSignatures[entry.payloadId] = entry.signature as `0x${string}`;
	}

	order.signaturesReceived = Math.min(
		(order.signaturesReceived ?? 0) + signatures.length,
		order.eip712Payloads.length
	);

	const timelineEvents: OrderTimelineEvent[] = [
		{
			type: 'signature_received',
			timestamp: Date.now(),
			details: `Received ${signatures.length} signature(s)`
		}
	];

	const readyForRelay = order.signaturesReceived >= order.eip712Payloads.length;

	if (readyForRelay) {
		order.status = 'signatures_submitted';
		timelineEvents.push({
			type: 'signatures_submitted',
			timestamp: Date.now()
		});
	}

	pushTimeline(order, timelineEvents);
	saveOrderRecord(order);

	if (readyForRelay) {
		processEvmToTronTransfer(order.id).catch((error) => {
			console.error('[orders] Failed to process EVM→Tron transfer', {
				orderId: order.id,
				error
			});
		});
	}

	return order;
}

export async function createOrderFromSigningSession(session: SigningSession): Promise<Order> {
	const chain = getChainById(session.evmChainId);
	if (!chain) {
		throw new SwapDomainError('Unsupported chain', 'UNSUPPORTED_CHAIN');
	}

	const token = getTokenOnChain(session.evmChainId, session.evmToken as EvmStablecoin);
	if (!token) {
		throw new SwapDomainError('Unsupported token for this chain', 'UNSUPPORTED_TOKEN');
	}

	const now = Date.now();
	const order: Order = {
		id: generateEntityId('order'),
		direction: 'EVM_TO_TRON',
		status: 'signatures_submitted',
		source: {
			type: 'evm',
			chain,
			token,
			amount: session.amount
		},
		destination: {
			type: 'tron',
			token: TRON_USDT,
			amount: session.quote.outputAmount
		},
		recipientAddress: session.recipientAddress,
		quote: session.quote,
		eip712Payloads: session.eip712Payloads,
		payloadSignatures: { ...session.payloadSignatures },
		signaturesReceived: session.eip712Payloads.length,
		timeline: [
			{
				type: 'created',
				timestamp: now
			},
			{
				type: 'signatures_submitted',
				timestamp: now
			}
		],
		createdAt: now,
		updatedAt: now
	};

	saveOrderRecord(order);
	processEvmToTronTransfer(order.id).catch((error) => {
		console.error('[orders] Failed to process EVM→Tron transfer', {
			orderId: order.id,
			error
		});
	});
	return order;
}
