import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createSigningSession } from '$lib/server/domain/signingSessions';
import { SwapDomainError } from '$lib/server/errors';
import {
	createSigningSessionSchema,
	type CreateSigningSessionRequestPayload
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
	let parsedBody: CreateSigningSessionRequestPayload;
	try {
		const body = await request.json();
		const parsed = createSigningSessionSchema.safeParse(body);
		if (!parsed.success) {
			return invalidRequestResponse(parsed.error);
		}
		parsedBody = parsed.data;
	} catch {
		return invalidRequestResponse();
	}

	try {
		const session = await createSigningSession(parsedBody);
		return json({ session });
	} catch (err) {
		if (err instanceof SwapDomainError) {
			return json({ message: err.message, code: err.code }, { status: err.statusCode ?? 500 });
		}
		return json(
			{ message: 'Failed to create signing session', code: 'UNKNOWN_ERROR' },
			{ status: 500 }
		);
	}
};
