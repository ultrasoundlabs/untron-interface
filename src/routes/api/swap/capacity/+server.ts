import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { generateMockCapacity, SwapServiceError } from '$lib/server/mockSwap';
import { capacityRequestSchema } from '$lib/server/validation/swapSchemas';
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
	try {
		const body = await request.json();
		const parsed = capacityRequestSchema.safeParse(body);
		if (!parsed.success) {
			return invalidRequestResponse(parsed.error);
		}
	} catch {
		return invalidRequestResponse();
	}

	try {
		const capacity = generateMockCapacity();
		return json(capacity);
	} catch (err) {
		if (err instanceof SwapServiceError) {
			return json({ message: err.message, code: err.code }, { status: err.statusCode ?? 500 });
		}
		return json({ message: 'Failed to fetch capacity', code: 'UNKNOWN_ERROR' }, { status: 500 });
	}
};
