import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createMockOrder, SwapServiceError } from '$lib/server/mockSwap';
import {
	createOrderSchema,
	type CreateOrderRequestPayload
} from '$lib/server/validation/swapSchemas';
import type { ZodError } from 'zod';

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
	let parsedBody: CreateOrderRequestPayload;
	try {
		const body = await request.json();
		const parsed = createOrderSchema.safeParse(body);
		if (!parsed.success) {
			return invalidRequestResponse(parsed.error);
		}
		parsedBody = parsed.data;
	} catch {
		return invalidRequestResponse();
	}

	try {
		const order = createMockOrder(parsedBody);
		return json({ order });
	} catch (err) {
		if (err instanceof SwapServiceError) {
			return json({ message: err.message, code: err.code }, { status: err.statusCode ?? 500 });
		}
		return json({ message: 'Failed to create order', code: 'UNKNOWN_ERROR' }, { status: 500 });
	}
};
