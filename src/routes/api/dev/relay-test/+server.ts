import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import type { SupportedChainId } from '$lib/config/chains';
import {
	relayEvmTxs,
	RelayError,
	AaInfraError,
	type RelayRequest
} from '$lib/server/services/evmRelayer';

interface RelayTestPayload {
	chainId: number | string;
	to: string;
	data: string;
	value?: string | number;
}

function parseRequestPayload(payload: RelayTestPayload): RelayRequest {
	const chainId = Number(payload.chainId);
	if (!Number.isInteger(chainId)) {
		throw error(400, 'chainId must be an integer');
	}

	const to = payload.to;
	if (typeof to !== 'string' || !to.startsWith('0x') || to.length !== 42) {
		throw error(400, 'to must be a valid EVM address');
	}

	const data = payload.data;
	if (typeof data !== 'string' || !data.startsWith('0x')) {
		throw error(400, 'data must be a 0x-prefixed calldata string');
	}

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
