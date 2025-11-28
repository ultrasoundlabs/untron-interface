import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { submitMockSessionSignatures, SwapServiceError } from '$lib/server/mockSwap';
import {
	submitSignaturesSchema,
	type SubmitSignaturesPayload
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

export const POST: RequestHandler = async ({ params, request }) => {
	const sessionId = params.id;
	if (!sessionId) {
		return json({ message: 'Session ID is required', code: 'INVALID_REQUEST' }, { status: 400 });
	}

	let parsedBody: SubmitSignaturesPayload;
	try {
		const body = await request.json();
		const parsed = submitSignaturesSchema.safeParse(body);
		if (!parsed.success) {
			return invalidRequestResponse(parsed.error);
		}
		parsedBody = parsed.data;
	} catch {
		return invalidRequestResponse();
	}

	try {
		const session = await submitMockSessionSignatures(sessionId, parsedBody.signatures);
		return json({ session });
	} catch (err) {
		if (err instanceof SwapServiceError) {
			return json({ message: err.message, code: err.code }, { status: err.statusCode ?? 500 });
		}
		return json(
			{ message: 'Failed to submit session signatures', code: 'UNKNOWN_ERROR' },
			{ status: 500 }
		);
	}
};
