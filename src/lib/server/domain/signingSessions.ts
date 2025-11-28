import { getChainById, getTokenOnChain } from '$lib/config/swapConfig';
import type {
	CreateSigningSessionRequest,
	Eip712Payload,
	Order,
	SigningSession
} from '$lib/types/swap';
import { verifyTypedData } from 'viem';
import { getQuote } from './quotes';
import { createOrderFromSigningSession, getOrderById } from './orders';
import { SwapDomainError } from '../errors';
import {
	generateEntityId,
	getSigningSessionRecord,
	saveSigningSessionRecord
} from '../adapters/mockPersistence';

type SignaturePayload = { payloadId: string; signature: string };

function createMockPayloads(
	request: CreateSigningSessionRequest,
	options?: { ownerAddress?: `0x${string}` }
): Eip712Payload[] {
	const deadline = Math.floor((Date.now() + 30 * 60 * 1000) / 1000).toString();
	const ownerAddress = options?.ownerAddress ?? '0x0000000000000000000000000000000000000000';
	return [
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
				owner: ownerAddress,
				spender: '0x0000000000000000000000000000000000000001',
				value: request.amount,
				nonce: '0',
				deadline
			}
		}
	];
}

function requireEvmToTron(request: CreateSigningSessionRequest) {
	if (request.direction !== 'EVM_TO_TRON') {
		throw new SwapDomainError(
			'Signing sessions are only supported for EVM→Tron swaps',
			'SIGNING_SESSION_UNSUPPORTED'
		);
	}
}

export async function createSigningSession(
	request: CreateSigningSessionRequest
): Promise<SigningSession> {
	requireEvmToTron(request);

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

	const now = Date.now();
	const session: SigningSession = {
		id: generateEntityId('session'),
		direction: 'EVM_TO_TRON',
		evmSignerAddress: request.evmSignerAddress,
		evmChainId: chain.chainId,
		evmToken: token.symbol,
		amount: request.amount,
		recipientAddress: request.recipientAddress,
		quote,
		eip712Payloads: createMockPayloads(request, { ownerAddress: request.evmSignerAddress }),
		signaturesReceived: 0,
		signedPayloadIds: [],
		createdAt: now,
		updatedAt: now
	};

	saveSigningSessionRecord(session);
	return session;
}

export function getSigningSession(sessionId: string): SigningSession {
	const session = getSigningSessionRecord(sessionId);
	if (!session) {
		throw new SwapDomainError(`Session ${sessionId} not found`, 'SESSION_NOT_FOUND', 404);
	}
	return session;
}

export async function submitSigningSessionSignatures(
	sessionId: string,
	signatures: SignaturePayload[]
): Promise<SigningSession> {
	const session = getSigningSession(sessionId);
	if (session.eip712Payloads.length === 0 || signatures.length === 0) {
		return session;
	}

	const signedIds = new Set(session.signedPayloadIds ?? []);

	for (const entry of signatures) {
		const payload = session.eip712Payloads.find((item) => item.id === entry.payloadId);
		if (!payload) {
			throw new SwapDomainError('Invalid request', 'INVALID_REQUEST');
		}
		if (signedIds.has(entry.payloadId)) {
			continue;
		}

		const isValid = await verifyTypedData({
			address: session.evmSignerAddress,
			domain: payload.domain,
			types: payload.types as Record<string, { name: string; type: string }[]>,
			primaryType: payload.primaryType as keyof typeof payload.types,
			message: payload.message,
			signature: entry.signature as `0x${string}`
		});

		if (!isValid) {
			throw new SwapDomainError('Invalid signature', 'INVALID_SIGNATURE');
		}

		signedIds.add(entry.payloadId);
	}

	session.signaturesReceived = Math.min(signedIds.size, session.eip712Payloads.length);
	session.signedPayloadIds = Array.from(signedIds);
	session.updatedAt = Date.now();
	saveSigningSessionRecord(session);
	return session;
}

export async function finalizeSigningSession(sessionId: string): Promise<Order> {
	const session = getSigningSession(sessionId);
	if (session.signaturesReceived < session.eip712Payloads.length) {
		throw new SwapDomainError(
			'Signing session is not fully signed yet',
			'SIGNING_SESSION_INCOMPLETE'
		);
	}

	if (session.finalizedOrderId) {
		return getOrderById(session.finalizedOrderId);
	}

	const order = await createOrderFromSigningSession(session);
	session.finalizedOrderId = order.id;
	session.updatedAt = Date.now();
	saveSigningSessionRecord(session);
	return order;
}
