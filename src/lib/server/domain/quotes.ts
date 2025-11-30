import { TRON_USDT, getTokenOnChain } from '$lib/config/swapConfig';
import type { EvmStablecoin, SwapDirection, SwapQuote } from '$lib/types/swap';
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

const TRON_TO_EVM_NETWORK_FEE_SUN = 0n; // 0 USDT for from-Tron swaps
export const EVM_TO_TRON_NETWORK_FEE_SUN = 2_000_000n; // flat 2 USDT for to-Tron swaps
const PROTOCOL_FEE_BPS = 10n; // 0.1% for from-Tron swaps
const EFFECTIVE_RATE_PRECISION = 6;

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
	const protocolFeeSource = direction === 'EVM_TO_TRON' ? 0n : (input * PROTOCOL_FEE_BPS) / 10000n;

	const networkFeeSource =
		direction === 'EVM_TO_TRON'
			? convertBetweenDecimals(EVM_TO_TRON_NETWORK_FEE_SUN, TRON_USDT.decimals, sourceDecimals)
			: TRON_TO_EVM_NETWORK_FEE_SUN;

	const totalFeeSource = protocolFeeSource + networkFeeSource;
	const outputSource = input > totalFeeSource ? input - totalFeeSource : 0n;

	return {
		outputDest: convertBetweenDecimals(outputSource, sourceDecimals, destDecimals),
		protocolFeeDest: convertBetweenDecimals(protocolFeeSource, sourceDecimals, destDecimals),
		networkFeeDest: convertBetweenDecimals(networkFeeSource, sourceDecimals, destDecimals),
		totalFeeDest: convertBetweenDecimals(totalFeeSource, sourceDecimals, destDecimals)
	};
}

function formatEffectiveRate(
	outputDest: bigint,
	inputSource: bigint,
	sourceDecimals: number,
	destDecimals: number
): string {
	if (inputSource <= 0n) return '0';

	const sourceFactor = 10n ** BigInt(sourceDecimals);
	const destFactor = 10n ** BigInt(destDecimals);
	const scale = 10n ** BigInt(EFFECTIVE_RATE_PRECISION);

	const scaledRatio = (outputDest * sourceFactor * scale) / (inputSource * destFactor);
	const whole = scaledRatio / scale;
	const fractional = scaledRatio % scale;

	if (fractional === 0n) {
		return whole.toString();
	}

	const fractionalStr = fractional
		.toString()
		.padStart(EFFECTIVE_RATE_PRECISION, '0')
		.replace(/0+$/, '');

	return fractionalStr ? `${whole}.${fractionalStr}` : whole.toString();
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
	const protocolFeeBps = params.direction === 'EVM_TO_TRON' ? 0 : Number(PROTOCOL_FEE_BPS);
	const effectiveRate = formatEffectiveRate(outputDest, input, sourceDecimals, destDecimals);

	return {
		direction: params.direction,
		inputAmount: params.amount,
		outputAmount: outputDest.toString(),
		effectiveRate,
		fees: {
			protocolFeeBps,
			protocolFeeAmount: protocolFeeDest.toString(),
			networkFeeAmount: networkFeeDest.toString(),
			totalFeeAmount: totalFeeDest.toString()
		},
		estimatedTimeSeconds: params.direction === 'TRON_TO_EVM' ? 60 : 3,
		hint: input > 10000_000000n ? 'Large swaps may take a bit longer to process' : undefined,
		expiresAt: Date.now() + 30000
	};
}

/**
 * Project the expected Tron-side payout (after fees) for an EVM→Tron swap.
 *
 * This mirrors the EVM_TO_TRON branch of fee computation used in getQuote,
 * but is exposed as a small helper for settlement workflows that only need
 * the final Tron amount and must stay perfectly in sync with quoting logic.
 */
export function projectEvmToTronPayoutAmount(
	evmChainId: number,
	evmToken: EvmStablecoin,
	amount: string
): bigint {
	const token = getTokenOnChain(evmChainId, evmToken);
	if (!token) {
		throw new SwapDomainError('Unsupported token for this chain', 'UNSUPPORTED_TOKEN');
	}

	const input = BigInt(amount);
	if (input <= 0n) {
		throw new SwapDomainError('Amount must be greater than zero', 'INVALID_AMOUNT');
	}

	const sourceDecimals = token.decimals;
	const destDecimals = TRON_USDT.decimals;

	const { outputDest } = computeFees('EVM_TO_TRON', input, sourceDecimals, destDecimals);

	return outputDest;
}
