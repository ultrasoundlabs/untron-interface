import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
// import { TRON_USDT, getTokenOnChain } from '$lib/config/swapConfig';
import { getQuote } from '$lib/server/domain/quotes';
import { SwapDomainError } from '$lib/server/errors';
import { quoteRequestSchema, type QuoteRequestPayload } from '$lib/server/validation/swapSchemas';
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
	let parsedBody: QuoteRequestPayload;
	try {
		const body = await request.json();
		const parsed = quoteRequestSchema.safeParse(body);
		if (!parsed.success) {
			return invalidRequestResponse(parsed.error);
		}
		parsedBody = parsed.data;
	} catch {
		return invalidRequestResponse();
	}

	try {
		const quote = await getQuote(parsedBody);
		return json(quote);
	} catch (err) {
		if (err instanceof SwapDomainError) {
			return json({ message: err.message, code: err.code }, { status: err.statusCode ?? 500 });
		}
		return json({ message: 'Failed to fetch quote', code: 'UNKNOWN_ERROR' }, { status: 500 });
	}
};
