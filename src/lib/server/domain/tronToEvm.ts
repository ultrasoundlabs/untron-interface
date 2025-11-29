import { Buffer } from 'node:buffer';

import { getChainById, getTokenOnChain } from '$lib/config/swapConfig';
import type {
	EvmStablecoin,
	TronDepositTicket,
	TronToEvmDepositRequest,
	TronToEvmOrderView
} from '$lib/types/swap';
import { SwapDomainError } from '$lib/server/errors';
import { getQuote } from './quotes';

const TRON_TO_EVM_PREFIX = 'TRON_TO_EVM';
const DEFAULT_DEPOSIT_ADDRESS = 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9';
const DEPOSIT_TTL_MS = 30 * 60 * 1000;

export async function createTronDepositTicket(
	request: TronToEvmDepositRequest
): Promise<TronDepositTicket> {
	const chain = getChainById(request.evmChainId);
	if (!chain) {
		throw new SwapDomainError('Unsupported chain', 'UNSUPPORTED_CHAIN');
	}

	const token = getTokenOnChain(request.evmChainId, request.evmToken as EvmStablecoin);
	if (!token) {
		throw new SwapDomainError('Unsupported token for this chain', 'UNSUPPORTED_TOKEN');
	}

	const quote = await getQuote({
		direction: request.direction,
		evmChainId: request.evmChainId,
		evmToken: request.evmToken,
		amount: request.amount
	});

	const now = Date.now();

	return {
		direction: 'TRON_TO_EVM',
		evmChainId: chain.chainId,
		evmToken: token.symbol as EvmStablecoin,
		amount: request.amount,
		recipientAddress: request.recipientAddress,
		depositAddress: DEFAULT_DEPOSIT_ADDRESS,
		expectedAmount: request.amount,
		expiresAt: now + DEPOSIT_TTL_MS,
		quote
	};
}

export function encodeTronToEvmOrder(ticket: TronDepositTicket): string {
	const payload = Buffer.from(JSON.stringify(ticket), 'utf8').toString('base64url');
	return `${TRON_TO_EVM_PREFIX}:${payload}`;
}

export function isTronToEvmOrderId(id: string): boolean {
	return id.startsWith(`${TRON_TO_EVM_PREFIX}:`);
}

export function decodeTronToEvmOrder(orderId: string): TronDepositTicket {
	if (!isTronToEvmOrderId(orderId)) {
		throw new SwapDomainError('Invalid Tron→EVM order id', 'INVALID_REQUEST');
	}
	const encoded = orderId.slice(TRON_TO_EVM_PREFIX.length + 1);
	try {
		const json = Buffer.from(encoded, 'base64url').toString('utf8');
		const ticket = JSON.parse(json) as TronDepositTicket;
		if (ticket.direction !== 'TRON_TO_EVM') {
			throw new SwapDomainError('Order direction mismatch', 'INVALID_REQUEST');
		}
		return ticket;
	} catch (err) {
		throw new SwapDomainError(
			`Failed to decode Tron→EVM order: ${err instanceof Error ? err.message : 'Unknown error'}`,
			'INVALID_REQUEST',
			400
		);
	}
}

export async function projectTronToEvmOrderView(orderId: string): Promise<TronToEvmOrderView> {
	const ticket = decodeTronToEvmOrder(orderId);
	return {
		...ticket,
		kind: 'tronDeposit',
		id: orderId
	};
}
