import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getMockOrder, SwapServiceError } from '$lib/server/mockSwap';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;
	if (!id) {
		return json({ message: 'Order id is required', code: 'INVALID_REQUEST' }, { status: 400 });
	}

	try {
		const order = getMockOrder(id);
		return json({ order });
	} catch (err) {
		if (err instanceof SwapServiceError) {
			return json({ message: err.message, code: err.code }, { status: err.statusCode ?? 500 });
		}
		return json({ message: 'Failed to fetch order', code: 'UNKNOWN_ERROR' }, { status: 500 });
	}
};
