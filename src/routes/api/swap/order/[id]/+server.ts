import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { SwapDomainError } from '$lib/server/errors';
import { decodeEvmRelayOrderId, projectEvmRelayOrderView } from '$lib/server/domain/evmToTron';
import { isTronToEvmOrderId, projectTronToEvmOrderView } from '$lib/server/domain/tronToEvm';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;
	if (!id) {
		return json({ message: 'Order id is required', code: 'INVALID_REQUEST' }, { status: 400 });
	}

	if (isTronToEvmOrderId(id)) {
		try {
			const order = await projectTronToEvmOrderView(id);
			return json({ order });
		} catch (err) {
			if (err instanceof SwapDomainError) {
				return json({ message: err.message, code: err.code }, { status: err.statusCode ?? 400 });
			}
			return json(
				{ message: 'Failed to project Tron→EVM order', code: 'UNKNOWN_ERROR' },
				{ status: 500 }
			);
		}
	}

	const looksStateless = id.includes(':');
	if (looksStateless) {
		try {
			const parts = decodeEvmRelayOrderId(id);
			const order = await projectEvmRelayOrderView(parts);
			return json({ order });
		} catch (err) {
			if (err instanceof SwapDomainError) {
				return json({ message: err.message, code: err.code }, { status: err.statusCode ?? 400 });
			}
			return json(
				{ message: 'Failed to project stateless order', code: 'UNKNOWN_ERROR' },
				{ status: 500 }
			);
		}
	}

	return json({ message: 'Order id is invalid', code: 'ORDER_NOT_FOUND' }, { status: 404 });
};
