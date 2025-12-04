import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { encodeFunctionData } from 'viem';

import type { SupportedChainId } from '$lib/config/chains';
import {
	relayEvmTxs,
	RelayError,
	AaInfraError,
	type RelayRequest
} from '$lib/server/services/evmRelayer';

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

interface TransferWithAuthorizationPayload {
	token: string;
	from: string;
	to: string;
	value: string;
	validAfter: string;
	validBefore: string;
	nonce: string;
	signature: string;
}

interface RelayTestPayload {
	chainId: number | string;
	to?: string;
	data?: string;
	value?: string | number;
	authorization?: TransferWithAuthorizationPayload;
}

function parseRequestPayload(payload: RelayTestPayload): RelayRequest {
	const chainId = Number(payload.chainId);
	if (!Number.isInteger(chainId)) {
		throw error(400, 'chainId must be an integer');
	}

	const { to, data } = resolveCallTarget(payload);

	let value: bigint | undefined;
	if (payload.value !== undefined) {
		try {
			value =
				typeof payload.value === 'string'
					? BigInt(payload.value)
					: BigInt(Math.trunc(payload.value));
		} catch (err) {
			throw error(400, `Invalid value: ${err instanceof Error ? err.message : String(err)}`);
		}
	}

	return {
		chainId: chainId as SupportedChainId,
		fromUserId: undefined,
		calls: [
			{
				to: to as `0x${string}`,
				data: data as `0x${string}`,
				value
			}
		]
	};
}

function resolveCallTarget(payload: RelayTestPayload): { to: string; data: string } {
	if (payload.authorization) {
		return buildTransferWithAuthorizationCall(payload.authorization);
	}

	const to = payload.to;
	if (typeof to !== 'string' || !to.startsWith('0x') || to.length !== 42) {
		throw error(400, 'to must be a valid EVM address');
	}

	const data = payload.data;
	if (typeof data !== 'string' || !data.startsWith('0x')) {
		throw error(400, 'data must be a 0x-prefixed calldata string');
	}

	return { to, data };
}

function buildTransferWithAuthorizationCall(auth: TransferWithAuthorizationPayload): {
	to: string;
	data: string;
} {
	const token = auth.token;
	if (typeof token !== 'string' || !token.startsWith('0x') || token.length !== 42) {
		throw error(400, 'authorization.token must be a valid EVM address');
	}

	for (const field of ['from', 'to'] as const) {
		const value = auth[field];
		if (typeof value !== 'string' || !value.startsWith('0x') || value.length !== 42) {
			throw error(400, `authorization.${field} must be a valid EVM address`);
		}
	}

	const numericFields: Array<{ key: keyof TransferWithAuthorizationPayload; label: string }> = [
		{ key: 'value', label: 'authorization.value' },
		{ key: 'validAfter', label: 'authorization.validAfter' },
		{ key: 'validBefore', label: 'authorization.validBefore' }
	];

	for (const { key, label } of numericFields) {
		const raw = auth[key];
		try {
			BigInt(raw);
		} catch (err) {
			throw error(
				400,
				`${label} must be an integer string: ${err instanceof Error ? err.message : String(err)}`
			);
		}
	}

	const value = BigInt(auth.value);
	const validAfter = BigInt(auth.validAfter);
	const validBefore = BigInt(auth.validBefore);

	if (typeof auth.nonce !== 'string' || !auth.nonce.startsWith('0x') || auth.nonce.length !== 66) {
		throw error(400, 'authorization.nonce must be a 32-byte 0x-prefixed string');
	}

	if (typeof auth.signature !== 'string' || !auth.signature.startsWith('0x')) {
		throw error(400, 'authorization.signature must be a 0x-prefixed string');
	}

	const data = encodeFunctionData({
		abi: erc3009Abi,
		functionName: 'transferWithAuthorization',
		args: [
			auth.from as `0x${string}`,
			auth.to as `0x${string}`,
			value,
			validAfter,
			validBefore,
			auth.nonce as `0x${string}`,
			auth.signature as `0x${string}`
		]
	});

	return {
		to: token,
		data
	};
}

export const POST: RequestHandler = async ({ request }) => {
	if (!import.meta.env.DEV) {
		throw error(404, 'Not found');
	}

	let body: RelayTestPayload;
	try {
		body = (await request.json()) as RelayTestPayload;
	} catch (err) {
		throw error(400, `Invalid JSON payload: ${err instanceof Error ? err.message : String(err)}`);
	}

	const relayRequest = parseRequestPayload(body);

	try {
		const result = await relayEvmTxs(relayRequest);
		return json(result);
	} catch (err) {
		if (err instanceof RelayError) {
			return json(
				{
					error: err.code,
					message: err.message
				},
				{ status: 400 }
			);
		}

		if (err instanceof AaInfraError) {
			return json(
				{
					error: 'AA_INFRA_ERROR',
					message: err.message
				},
				{ status: 502 }
			);
		}

		throw error(500, err instanceof Error ? err.message : 'Unknown relay failure');
	}
};
