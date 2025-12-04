import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { ZodError } from 'zod';

import { SwapDomainError } from '$lib/server/errors';
import { createTronDepositTicket, encodeTronToEvmOrder } from '$lib/server/domain/tronToEvm';
import {
	tronToEvmDepositSchema,
	type TronToEvmDepositPayload
} from '$lib/server/validation/swapSchemas';

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
	let payload: TronToEvmDepositPayload;
	try {
		const body = await request.json();
		const parsed = tronToEvmDepositSchema.safeParse(body);
		if (!parsed.success) {
			return invalidRequestResponse(parsed.error);
		}
		payload = parsed.data;
	} catch {
		return invalidRequestResponse();
	}

	try {
		const ticket = await createTronDepositTicket(payload);
		const orderId = encodeTronToEvmOrder(ticket);
		return json({ orderId, ticket });
	} catch (err) {
		if (err instanceof SwapDomainError) {
			return json({ message: err.message, code: err.code }, { status: err.statusCode ?? 400 });
		}
		return json(
			{ message: 'Failed to create deposit ticket', code: 'UNKNOWN_ERROR' },
			{ status: 500 }
		);
	}
};
