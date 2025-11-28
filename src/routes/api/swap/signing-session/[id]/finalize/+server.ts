import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { finalizeSigningSession } from '$lib/server/domain/signingSessions';
import { SwapDomainError } from '$lib/server/errors';

export const POST: RequestHandler = async ({ params }) => {
	const sessionId = params.id;
	if (!sessionId) {
		return json({ message: 'Session ID is required', code: 'INVALID_REQUEST' }, { status: 400 });
	}

	try {
		const order = await finalizeSigningSession(sessionId);
		return json({ order });
	} catch (err) {
		if (err instanceof SwapDomainError) {
			return json({ message: err.message, code: err.code }, { status: err.statusCode ?? 500 });
		}
		return json(
			{ message: 'Failed to finalize signing session', code: 'UNKNOWN_ERROR' },
			{ status: 500 }
		);
	}
};
