import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getOrderById } from '$lib/server/domain/orders';
import { SwapDomainError } from '$lib/server/errors';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;
	if (!id) {
		return json({ message: 'Order id is required', code: 'INVALID_REQUEST' }, { status: 400 });
	}

	try {
		const order = getOrderById(id);
		return json({ order });
	} catch (err) {
		if (err instanceof SwapDomainError) {
			return json({ message: err.message, code: err.code }, { status: err.statusCode ?? 500 });
		}
		return json({ message: 'Failed to fetch order', code: 'UNKNOWN_ERROR' }, { status: 500 });
	}
};
