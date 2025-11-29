import { randomBytes } from 'crypto';

import type { SupportedChainId } from '$lib/config/chains';
import { getChainById, getTokenOnChain } from '$lib/config/swapConfig';
import type {
	CreateSigningSessionRequest,
	Eip712Payload,
	EvmStablecoin,
	Order,
	SigningSession
} from '$lib/types/swap';
import { verifyTypedData } from 'viem';
import { getProtocolRelayTarget, RelayError } from '$lib/server/services/evmRelayer';
import { getQuote } from './quotes';
import { TRANSFER_WITH_AUTHORIZATION_PAYLOAD_ID } from './constants';
import { createOrderFromSigningSession, getOrderById } from './orders';
import { SwapDomainError } from '../errors';
import {
	generateEntityId,
	getSigningSessionRecord,
	saveSigningSessionRecord
} from '../adapters/mockPersistence';

type SignaturePayload = { payloadId: string; signature: string };

const ERC3009_AUTH_VALIDITY_SECONDS = 30 * 60; // 30 minutes
const ERC3009_TRANSFER_TYPE = [
	{ name: 'from', type: 'address' },
	{ name: 'to', type: 'address' },
	{ name: 'value', type: 'uint256' },
	{ name: 'validAfter', type: 'uint256' },
	{ name: 'validBefore', type: 'uint256' },
	{ name: 'nonce', type: 'bytes32' }
] as const;

const ERC3009_TOKEN_CONFIG: Partial<Record<EvmStablecoin, { version: string }>> = {
	USDC: { version: '2' },
	USDT: { version: '1' }
};

function createTransferAuthorizationPayloads(
	request: CreateSigningSessionRequest,
	options: {
		tokenAddress: `0x${string}`;
		tokenName: string;
		tokenVersion: string;
		relayAccountAddress: `0x${string}`;
	}
): Eip712Payload[] {
	const nowSeconds = Math.floor(Date.now() / 1000);
	const validAfter = nowSeconds;
	const validBefore = nowSeconds + ERC3009_AUTH_VALIDITY_SECONDS;
	const nonce = `0x${randomBytes(32).toString('hex')}` as `0x${string}`;

	return [
		{
			id: TRANSFER_WITH_AUTHORIZATION_PAYLOAD_ID,
			domain: {
				name: options.tokenName,
				version: options.tokenVersion,
				chainId: request.evmChainId,
				verifyingContract: options.tokenAddress
			},
			types: {
				TransferWithAuthorization: [...ERC3009_TRANSFER_TYPE]
			},
			primaryType: 'TransferWithAuthorization',
			message: {
				from: request.evmSignerAddress,
				to: options.relayAccountAddress,
				value: request.amount,
				validAfter: validAfter.toString(),
				validBefore: validBefore.toString(),
				nonce
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

function requireErc3009Token(symbol: EvmStablecoin) {
	const config = ERC3009_TOKEN_CONFIG[symbol];
	if (!config) {
		throw new SwapDomainError(
			`Token ${symbol} does not support ERC-3009 authorizations yet`,
			'UNSUPPORTED_TOKEN'
		);
	}
	return config;
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
	const erc3009Token = requireErc3009Token(token.symbol as EvmStablecoin);

	const chainId = chain.chainId as SupportedChainId;

	let relayAccountAddress: `0x${string}`;
	try {
		const relayTarget = await getProtocolRelayTarget(chainId);
		relayAccountAddress = relayTarget.address;
	} catch (err) {
		if (err instanceof RelayError) {
			if (err.code === 'UNSUPPORTED_CHAIN') {
				throw new SwapDomainError(err.message, 'UNSUPPORTED_CHAIN');
			}
			throw new SwapDomainError(
				'Protocol relayer is not configured for this chain',
				'UNKNOWN_ERROR',
				500
			);
		}
		throw err;
	}

	const quote = await getQuote({
		direction: request.direction,
		evmChainId: request.evmChainId,
		evmToken: request.evmToken,
		amount: request.amount
	});

	const eip712Payloads = createTransferAuthorizationPayloads(request, {
		tokenAddress: token.address,
		tokenName: token.name,
		tokenVersion: erc3009Token.version,
		relayAccountAddress
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
		eip712Payloads,
		signaturesReceived: 0,
		signedPayloadIds: [],
		payloadSignatures: {},
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
		session.payloadSignatures[entry.payloadId] = entry.signature as `0x${string}`;
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
