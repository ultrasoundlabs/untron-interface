import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { fetchAllBalances } from '$lib/services/balances';

interface BalancesRequestPayload {
	address: string;
}

export const POST: RequestHandler = async ({ request }) => {
	let parsedBody: BalancesRequestPayload;

	try {
		const body = await request.json();
		if (!body || typeof body.address !== 'string') {
			return json(
				{
					message: 'Invalid request',
					code: 'INVALID_REQUEST'
				},
				{ status: 400 }
			);
		}

		parsedBody = body;
	} catch {
		return json(
			{
				message: 'Invalid request',
				code: 'INVALID_REQUEST'
			},
			{ status: 400 }
		);
	}

	try {
		const balances = await fetchAllBalances(parsedBody.address as `0x${string}`);
		return json({ balances });
	} catch (error) {
		console.error('Failed to fetch balances on server:', error);
		return json(
			{
				message: 'Failed to fetch balances',
				code: 'UNKNOWN_ERROR'
			},
			{ status: 500 }
		);
	}
};
