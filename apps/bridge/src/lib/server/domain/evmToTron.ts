import { randomBytes } from 'crypto';

import type {
	Eip712Payload,
	EvmRelayOrderIdParts,
	EvmRelayOrderView,
	EvmStablecoin,
	EvmToTronExecuteRequest,
	EvmToTronPrepareRequest
} from '$lib/types/swap';
import { encodeFunctionData } from 'viem';
import { verifyTypedData } from 'viem';

import { TRANSFER_WITH_AUTHORIZATION_PAYLOAD_ID } from './constants';
import type { RelayCall } from '$lib/server/services/evmRelayer';
import { SwapDomainError } from '$lib/server/errors';
import { getSettlement } from '$lib/server/domain/evmToTronSettlement';

export const ERC3009_AUTH_VALIDITY_SECONDS = 30 * 60; // 30 minutes

const ERC3009_TOKEN_CONFIG: Partial<Record<EvmStablecoin, { version: string }>> = {
	USDC: { version: '2' },
	USDT: { version: '1' }
};

export const ERC3009_TRANSFER_TYPE = [
	{ name: 'from', type: 'address' },
	{ name: 'to', type: 'address' },
	{ name: 'value', type: 'uint256' },
	{ name: 'validAfter', type: 'uint256' },
	{ name: 'validBefore', type: 'uint256' },
	{ name: 'nonce', type: 'bytes32' }
] as const;

export const ERC3009_ABI = [
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

export interface TransferAuthorizationPayloadInput {
	request: EvmToTronPrepareRequest;
	tokenAddress: `0x${string}`;
	tokenName: string;
	tokenVersion: string;
	relayAccountAddress: `0x${string}`;
}

export function createTransferAuthorizationPayloads({
	request,
	tokenAddress,
	tokenName,
	tokenVersion,
	relayAccountAddress
}: TransferAuthorizationPayloadInput): Eip712Payload[] {
	const nowSeconds = Math.floor(Date.now() / 1000);
	const validAfter = nowSeconds;
	const validBefore = nowSeconds + ERC3009_AUTH_VALIDITY_SECONDS;
	const nonce = `0x${randomBytes(32).toString('hex')}` as `0x${string}`;

	return [
		{
			id: TRANSFER_WITH_AUTHORIZATION_PAYLOAD_ID,
			domain: {
				name: tokenName,
				version: tokenVersion,
				chainId: request.evmChainId,
				verifyingContract: tokenAddress
			},
			types: {
				TransferWithAuthorization: [...ERC3009_TRANSFER_TYPE]
			},
			primaryType: 'TransferWithAuthorization',
			message: {
				from: request.evmSignerAddress,
				to: relayAccountAddress,
				value: request.amount,
				validAfter: validAfter.toString(),
				validBefore: validBefore.toString(),
				nonce
			}
		}
	];
}

export interface AuthorizationEnvelope {
	payload: Eip712Payload;
	signature: `0x${string}`;
}

export function resolveAuthorizationEnvelope(
	payloads: Eip712Payload[] | undefined,
	signatures: Record<string, `0x${string}`> | undefined
): AuthorizationEnvelope {
	if (!payloads || payloads.length === 0) {
		throw new SwapDomainError('Missing transfer authorization payload', 'INVALID_REQUEST');
	}

	const payload =
		payloads.find((item) => item.id === TRANSFER_WITH_AUTHORIZATION_PAYLOAD_ID) ?? payloads[0];

	if (!signatures) {
		throw new SwapDomainError('Missing signatures map', 'INVALID_SIGNATURE');
	}

	const signature = signatures[payload.id];
	if (!signature) {
		throw new SwapDomainError('Missing signature for transfer authorization', 'INVALID_SIGNATURE');
	}

	return { payload, signature };
}

export function buildRelayCallFromAuthorization(
	payload: Eip712Payload,
	signature: `0x${string}`,
	expectedTokenAddress: `0x${string}`
): RelayCall {
	const message = payload.message as unknown as Partial<
		Record<'from' | 'to' | 'value' | 'validAfter' | 'validBefore' | 'nonce', string>
	>;

	const verifyingContract = payload.domain?.verifyingContract;
	if (!verifyingContract) {
		throw new SwapDomainError(
			'Authorization payload missing verifying contract',
			'INVALID_REQUEST'
		);
	}

	if (verifyingContract.toLowerCase() !== expectedTokenAddress.toLowerCase()) {
		throw new SwapDomainError('Authorization token mismatch', 'INVALID_REQUEST');
	}

	const from = message.from as `0x${string}`;
	const to = message.to as `0x${string}`;
	const value = BigInt(message.value ?? '0');
	const validAfter = BigInt(message.validAfter ?? '0');
	const validBefore = BigInt(message.validBefore ?? '0');
	const nonce = message.nonce as `0x${string}`;

	if (!from || !to || !nonce) {
		throw new SwapDomainError('Malformed authorization payload', 'INVALID_REQUEST');
	}

	if (value <= 0n) {
		throw new SwapDomainError('Transfer amount must be greater than zero', 'INVALID_REQUEST');
	}

	return {
		to: expectedTokenAddress,
		data: encodeFunctionData({
			abi: ERC3009_ABI,
			functionName: 'transferWithAuthorization',
			args: [from, to, value, validAfter, validBefore, nonce, signature]
		}),
		value: 0n
	};
}

export function requireErc3009Token(symbol: EvmStablecoin): { version: string } {
	const config = ERC3009_TOKEN_CONFIG[symbol];
	if (!config) {
		throw new SwapDomainError(
			`Token ${symbol} does not support ERC-3009 authorizations`,
			'UNSUPPORTED_TOKEN'
		);
	}
	return config;
}

export async function verifyAuthorizationSignature(
	payload: Eip712Payload,
	signature: `0x${string}`,
	signerAddress: `0x${string}`
): Promise<boolean> {
	return verifyTypedData({
		address: signerAddress,
		domain: payload.domain,
		types: payload.types as Record<string, { name: string; type: string }[]>,
		primaryType: payload.primaryType as keyof typeof payload.types,
		message: payload.message,
		signature
	});
}

function normalizeAddress(value: string | undefined): string {
	return (value ?? '').toLowerCase();
}

export async function validateAndBuildRelayCallFromExecution(
	request: EvmToTronExecuteRequest,
	options: {
		tokenAddress: `0x${string}`;
		relayAccountAddress: `0x${string}`;
	}
): Promise<RelayCall> {
	const envelope = resolveAuthorizationEnvelope(request.payloads, request.payloadSignatures);

	const message = envelope.payload.message as Record<string, string>;
	const from = normalizeAddress(message.from);
	const to = normalizeAddress(message.to);
	const expectedSigner = normalizeAddress(request.evmSignerAddress);
	const expectedRelay = normalizeAddress(options.relayAccountAddress);

	if (from !== expectedSigner) {
		throw new SwapDomainError('Authorization signer mismatch', 'INVALID_SIGNATURE');
	}

	if (to !== expectedRelay) {
		throw new SwapDomainError('Authorization relay target mismatch', 'INVALID_SIGNATURE');
	}

	const value = BigInt(message.value ?? '0');
	if (value <= 0n || value !== BigInt(request.amount)) {
		throw new SwapDomainError('Authorization amount mismatch', 'INVALID_REQUEST');
	}

	const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
	const validAfter = BigInt(message.validAfter ?? '0');
	if (validAfter > nowSeconds + 300n) {
		throw new SwapDomainError('Authorization not active yet', 'INVALID_REQUEST');
	}

	const validBefore = BigInt(message.validBefore ?? '0');
	if (validBefore <= nowSeconds) {
		throw new SwapDomainError('Authorization has already expired', 'INVALID_REQUEST');
	}

	const isValidSignature = await verifyAuthorizationSignature(
		envelope.payload,
		envelope.signature,
		request.evmSignerAddress
	);

	if (!isValidSignature) {
		throw new SwapDomainError('Invalid authorization signature', 'INVALID_SIGNATURE');
	}

	return buildRelayCallFromAuthorization(
		envelope.payload,
		envelope.signature,
		options.tokenAddress
	);
}

export function encodeEvmRelayOrderId(parts: EvmRelayOrderIdParts): string {
	const { evmChainId, evmTxHash } = parts;
	return `EVM_TO_TRON:${evmChainId}:${evmTxHash}`;
}

export function decodeEvmRelayOrderId(orderId: string): EvmRelayOrderIdParts {
	const [direction, chainIdStr, txHash] = orderId.split(':');
	if (direction !== 'EVM_TO_TRON') {
		throw new SwapDomainError('Invalid EVM relay order id', 'INVALID_REQUEST');
	}

	const chainId = Number(chainIdStr);
	if (!Number.isInteger(chainId) || chainId <= 0) {
		throw new SwapDomainError('Invalid chain id in order ID', 'INVALID_REQUEST');
	}

	if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
		throw new SwapDomainError('Invalid transaction hash in order ID', 'INVALID_REQUEST');
	}

	return {
		evmChainId: chainId,
		evmTxHash: txHash as `0x${string}`
	};
}

export async function projectEvmRelayOrderView(
	parts: EvmRelayOrderIdParts
): Promise<EvmRelayOrderView> {
	const orderId = encodeEvmRelayOrderId(parts);
	const settlement = await getSettlement(orderId);

	if (!settlement) {
		return {
			kind: 'evmRelay',
			id: orderId,
			direction: 'EVM_TO_TRON',
			status: 'relaying',
			evmTxHash: parts.evmTxHash,
			metadata: {
				evmChainId: parts.evmChainId
			}
		};
	}

	return {
		kind: 'evmRelay',
		id: orderId,
		direction: 'EVM_TO_TRON',
		status: settlement.status,
		evmTxHash: settlement.evmTxHash ?? parts.evmTxHash,
		tronTxHash: settlement.tronTxHash,
		metadata: {
			evmChainId: parts.evmChainId,
			relayMethod: settlement.relayMethod,
			errorReason: settlement.errorReason
		}
	};
}
