import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getCapacity } from '$lib/server/domain/capacity';
import { SwapDomainError } from '$lib/server/errors';
import {
	capacityRequestSchema,
	type CapacityRequestPayload
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
	let parsedBody: CapacityRequestPayload;
	try {
		const body = await request.json();
		const parsed = capacityRequestSchema.safeParse(body);
		if (!parsed.success) {
			return invalidRequestResponse(parsed.error);
		}
		parsedBody = parsed.data;
	} catch {
		return invalidRequestResponse();
	}

	try {
		const capacity = await getCapacity(parsedBody);
		return json(capacity);
	} catch (err) {
		if (err instanceof SwapDomainError) {
			return json({ message: err.message, code: err.code }, { status: err.statusCode ?? 500 });
		}
		return json({ message: 'Failed to fetch capacity', code: 'UNKNOWN_ERROR' }, { status: 500 });
	}
};
