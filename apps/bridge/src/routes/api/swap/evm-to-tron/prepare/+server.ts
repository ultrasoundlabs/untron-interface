import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { ZodError } from 'zod';

import type { SupportedChainId } from '$lib/config/chains';
import { getChainById, getTokenOnChain } from '$lib/config/swapConfig';
import { SwapDomainError } from '$lib/server/errors';
import { getQuote } from '$lib/server/domain/quotes';
import {
	createTransferAuthorizationPayloads,
	requireErc3009Token
} from '$lib/server/domain/evmToTron';
import {
	evmToTronPrepareSchema,
	type EvmToTronPreparePayload
} from '$lib/server/validation/swapSchemas';
import { getProtocolRelayTarget, RelayError } from '$lib/server/services/evmRelayer';

function invalidRequestResponse(error?: ZodError) {
	return json(
		{
			message: 'Invalid request',
			code: 'INVALID_REQUEST',
			issues: error?.flatten()
		},
		{ status: 400 }
	);
}

export const POST: RequestHandler = async ({ request }) => {
	let payload: EvmToTronPreparePayload;
	try {
		const body = await request.json();
		const parsed = evmToTronPrepareSchema.safeParse(body);
		if (!parsed.success) {
			return invalidRequestResponse(parsed.error);
		}
		payload = parsed.data;
	} catch {
		return invalidRequestResponse();
	}

	try {
		const chain = getChainById(payload.evmChainId);
		if (!chain) {
			throw new SwapDomainError('Unsupported chain', 'UNSUPPORTED_CHAIN');
		}

		const token = getTokenOnChain(payload.evmChainId, payload.evmToken);
		if (!token) {
			throw new SwapDomainError('Unsupported token for this chain', 'UNSUPPORTED_TOKEN');
		}

		const erc3009 = requireErc3009Token(token.symbol);

		const quote = await getQuote({
			direction: payload.direction,
			evmChainId: payload.evmChainId,
			evmToken: payload.evmToken,
			amount: payload.amount
		});

		const relayTarget = await getProtocolRelayTarget(chain.chainId as SupportedChainId);

		const eip712Payloads = createTransferAuthorizationPayloads({
			request: payload,
			tokenAddress: token.address,
			tokenName: token.name,
			tokenVersion: erc3009.version,
			relayAccountAddress: relayTarget.address
		});

		return json({
			payloads: eip712Payloads,
			relayAccountAddress: relayTarget.address,
			quote,
			preparedAt: Date.now()
		});
	} catch (err) {
		if (err instanceof SwapDomainError) {
			return json({ message: err.message, code: err.code }, { status: err.statusCode ?? 400 });
		}

		if (err instanceof RelayError) {
			const status = err.code === 'UNSUPPORTED_CHAIN' ? 400 : 500;
			return json({ message: err.message, code: err.code }, { status });
		}

		return json({ message: 'Failed to prepare payloads', code: 'UNKNOWN_ERROR' }, { status: 500 });
	}
};
