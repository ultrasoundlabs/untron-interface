import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { ZodError } from 'zod';

import type { SupportedChainId } from '$lib/config/chains';
import { getChainById, getTokenOnChain } from '$lib/config/swapConfig';
import { SwapDomainError } from '$lib/server/errors';
import { getQuote } from '$lib/server/domain/quotes';
import {
	encodeEvmRelayOrderId,
	requireErc3009Token,
	validateAndBuildRelayCallFromExecution
} from '$lib/server/domain/evmToTron';
import {
	evmToTronExecuteSchema,
	type EvmToTronExecutePayload
} from '$lib/server/validation/swapSchemas';
import { getProtocolRelayTarget, RelayError } from '$lib/server/services/evmRelayer';
import { relayEvmTxs } from '$lib/server/services/evmRelayer';

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
	let payload: EvmToTronExecutePayload;
	try {
		const body = await request.json();
		const parsed = evmToTronExecuteSchema.safeParse(body);
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

		requireErc3009Token(token.symbol);

		// Ensure amount is still within capacity limits
		const quote = await getQuote({
			direction: payload.direction,
			evmChainId: payload.evmChainId,
			evmToken: payload.evmToken,
			amount: payload.amount
		});

		const relayTarget = await getProtocolRelayTarget(chain.chainId as SupportedChainId);

		const relayCall = await validateAndBuildRelayCallFromExecution(payload, {
			tokenAddress: token.address,
			relayAccountAddress: relayTarget.address
		});

		const relayResult = await relayEvmTxs({
			chainId: chain.chainId as SupportedChainId,
			fromUserId: undefined,
			calls: [relayCall]
		});

		const orderId = encodeEvmRelayOrderId({
			evmChainId: chain.chainId,
			evmTxHash: relayResult.txHash
		});

		return json({
			execution: {
				orderId,
				direction: payload.direction,
				evmChainId: chain.chainId,
				evmToken: token.symbol,
				amount: payload.amount,
				recipientAddress: payload.recipientAddress,
				evmTxHash: relayResult.txHash,
				relayMethod: relayResult.relayedVia,
				status: 'relaying'
			},
			quote
		});
	} catch (err) {
		if (err instanceof SwapDomainError) {
			return json({ message: err.message, code: err.code }, { status: err.statusCode ?? 400 });
		}

		if (err instanceof RelayError) {
			const status = err.code === 'UNSUPPORTED_CHAIN' ? 400 : 500;
			return json({ message: err.message, code: err.code }, { status });
		}

		return json({ message: 'Failed to execute swap', code: 'UNKNOWN_ERROR' }, { status: 500 });
	}
};
