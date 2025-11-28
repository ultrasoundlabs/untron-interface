import { TRON_USDT, getTokenOnChain } from '$lib/config/swapConfig';
import type { SwapDirection, SwapQuote } from '$lib/types/swap';
import type { CapacityParams } from './capacity';
import { getCapacity } from './capacity';
import { SwapDomainError } from '../errors';

export interface QuoteParams extends CapacityParams {
	amount: string;
}

/**
 * Convert between token decimals. Kept here for now; later this can move to a shared math helper.
 */
function convertBetweenDecimals(amount: bigint, fromDecimals: number, toDecimals: number): bigint {
	if (fromDecimals === toDecimals) return amount;
	const diff = Math.abs(fromDecimals - toDecimals);
	const factor = 10n ** BigInt(diff);
	return fromDecimals < toDecimals ? amount * factor : amount / factor;
}

function computeFees(
	direction: SwapDirection,
	input: bigint,
	sourceDecimals: number,
	destDecimals: number
): {
	outputDest: bigint;
	protocolFeeDest: bigint;
	networkFeeDest: bigint;
	totalFeeDest: bigint;
} {
	const protocolFeeSource = (input * 50n) / 10000n; // 0.5%
	const networkFeeBase = direction === 'TRON_TO_EVM' ? 500000n : 100000n; // 6 decimals
	const networkFeeSource =
		direction === 'TRON_TO_EVM'
			? networkFeeBase
			: convertBetweenDecimals(networkFeeBase, 6, sourceDecimals);
	const totalFeeSource = protocolFeeSource + networkFeeSource;
	const outputSource = input > totalFeeSource ? input - totalFeeSource : 0n;

	return {
		outputDest: convertBetweenDecimals(outputSource, sourceDecimals, destDecimals),
		protocolFeeDest: convertBetweenDecimals(protocolFeeSource, sourceDecimals, destDecimals),
		networkFeeDest: convertBetweenDecimals(networkFeeSource, sourceDecimals, destDecimals),
		totalFeeDest: convertBetweenDecimals(totalFeeSource, sourceDecimals, destDecimals)
	};
}

export async function getQuote(params: QuoteParams): Promise<SwapQuote> {
	const token = getTokenOnChain(params.evmChainId, params.evmToken);
	if (!token) {
		throw new SwapDomainError('Unsupported token for this chain', 'UNSUPPORTED_TOKEN');
	}

	const sourceDecimals = params.direction === 'TRON_TO_EVM' ? TRON_USDT.decimals : token.decimals;
	const destDecimals = params.direction === 'TRON_TO_EVM' ? token.decimals : TRON_USDT.decimals;
	const input = BigInt(params.amount);
	if (input <= 0n) {
		throw new SwapDomainError('Amount must be greater than zero', 'INVALID_AMOUNT');
	}

	// Make sure amount is inside the reported capacity (reusing same logic server-side)
	const capacity = await getCapacity(params);
	const min = BigInt(capacity.minAmount);
	const max = BigInt(capacity.maxAmount);
	if (input < min) {
		throw new SwapDomainError('Amount is below minimum', 'AMOUNT_TOO_LOW');
	}
	if (input > max) {
		throw new SwapDomainError('Amount exceeds maximum', 'AMOUNT_TOO_HIGH');
	}

	const { outputDest, protocolFeeDest, networkFeeDest, totalFeeDest } = computeFees(
		params.direction,
		input,
		sourceDecimals,
		destDecimals
	);

	return {
		direction: params.direction,
		inputAmount: params.amount,
		outputAmount: outputDest.toString(),
		effectiveRate: '0.995',
		fees: {
			protocolFeeBps: 50,
			protocolFeeAmount: protocolFeeDest.toString(),
			networkFeeAmount: networkFeeDest.toString(),
			totalFeeAmount: totalFeeDest.toString()
		},
		estimatedTimeSeconds: params.direction === 'TRON_TO_EVM' ? 180 : 60,
		hint: input > 10000_000000n ? 'Large swaps may take a bit longer to process' : undefined,
		expiresAt: Date.now() + 30000
	};
}
