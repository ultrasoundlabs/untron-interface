import type { Order, SigningSession } from '$lib/types/swap';

const orders = new Map<string, Order>();
const signingSessions = new Map<string, SigningSession>();

export function generateEntityId(prefix: string): string {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateMockTxHash(seed: string): string {
	const base = seed
		.replace(/[^a-fA-F0-9]/g, '')
		.slice(-16)
		.padStart(16, '0');
	return `0x${base.padStart(64, '0')}`;
}

export function saveOrderRecord(order: Order): void {
	orders.set(order.id, order);
}

export function getOrderRecord(orderId: string): Order | undefined {
	return orders.get(orderId);
}

/**
 * Legacy dev helper that simulates the on-chain leg for flows that don't yet
 * call the real relayer. Tron→EVM now uses the actual relayer, so this is kept
 * only for future demos/tests where we still need fake async completion.
 */
export function scheduleOrderAutoCompletion(orderId: string): void {
	setTimeout(() => {
		const order = orders.get(orderId);
		if (!order) return;
		if (order.status !== 'awaiting_payment') return;

		const now = Date.now();
		order.status = 'relaying';
		order.timeline.push({
			type: 'relaying',
			timestamp: now
		});
		order.updatedAt = now;
		orders.set(orderId, order);

		setTimeout(() => {
			const current = orders.get(orderId);
			if (!current || current.status !== 'relaying') return;

			const completedAt = Date.now();
			current.status = 'completed';
			current.finalTxHashes = {
				source: generateMockTxHash(`${orderId}_source`),
				destination: generateMockTxHash(`${orderId}_dest`)
			};
			current.timeline.push({
				type: 'completed',
				timestamp: completedAt,
				txHash: current.finalTxHashes.destination
			});
			current.updatedAt = completedAt;
			orders.set(orderId, current);
		}, 4000);
	}, 4000);
}

export function saveSigningSessionRecord(session: SigningSession): void {
	signingSessions.set(session.id, session);
}

export function getSigningSessionRecord(sessionId: string): SigningSession | undefined {
	return signingSessions.get(sessionId);
}
