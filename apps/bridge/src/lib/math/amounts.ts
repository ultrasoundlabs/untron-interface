const DECIMAL_REGEX = /^(\d+)(?:\.(\d+))?$/;
const TEN_THOUSAND = 10000n;

export interface ParseDecimalResult {
	value: bigint;
	/** true if the input had <= `decimals` fractional digits */
	exact: boolean;
}

export interface ParseDecimalOptions {
	/**
	 * When true, inputs with more fractional digits than supported will be rejected.
	 * When false, the extra digits are truncated (floor) and `exact` will be false.
	 */
	strict?: boolean;
}

/**
 * Parse a human-friendly decimal string into atomic units.
 * This logic intentionally lives on the client; server endpoints already expect the
 * resulting numeric string expressed in the source token's smallest unit.
 */
export function parseDecimalToAtomic(
	input: string,
	decimals: number,
	options: ParseDecimalOptions = {}
): ParseDecimalResult | null {
	const trimmed = input.trim();
	if (!trimmed) return null;

	const match = trimmed.match(DECIMAL_REGEX);
	if (!match) return null;

	const integerPart = match[1];
	const fractionalRaw = match[2] ?? '';
	const exceedsPrecision = fractionalRaw.length > decimals;

	if (exceedsPrecision && options.strict !== false) {
		return null;
	}

	const fractionalPart = exceedsPrecision
		? fractionalRaw.slice(0, decimals)
		: fractionalRaw.padEnd(decimals, '0');

	const combined = `${integerPart}${fractionalPart}`.replace(/^0+(?=\d)/, '');

	return {
		value: BigInt(combined || '0'),
		exact: !exceedsPrecision
	};
}

export interface FormatDecimalOptions {
	maxFractionDigits?: number;
	trimTrailingZeros?: boolean;
	useGrouping?: boolean;
}

export function formatAtomicToDecimal(
	amount: string | bigint,
	decimals: number,
	options: FormatDecimalOptions = {}
): string {
	const value = typeof amount === 'bigint' ? amount : BigInt(amount || '0');
	if (decimals === 0) {
		return value.toString();
	}

	const divisor = 10n ** BigInt(decimals);
	const whole = value / divisor;
	const fractional = value % divisor;

	const wholeString = options.useGrouping ? whole.toLocaleString() : whole.toString();

	if (fractional === 0n) {
		return wholeString;
	}

	let fractionalStr = fractional.toString().padStart(decimals, '0');

	if (typeof options.maxFractionDigits === 'number') {
		fractionalStr = fractionalStr.slice(0, Math.max(0, options.maxFractionDigits));
	}

	if (options.trimTrailingZeros !== false) {
		fractionalStr = fractionalStr.replace(/0+$/, '');
	}

	if (!fractionalStr) {
		return wholeString;
	}

	return `${wholeString}.${fractionalStr}`;
}

export function isAmountWithinBounds(
	amountAtomic: bigint,
	bounds:
		| {
				min: string;
				max: string;
		  }
		| null
		| undefined
): { ok: boolean; tooLow: boolean; tooHigh: boolean } {
	if (!bounds) return { ok: true, tooLow: false, tooHigh: false };

	const min = BigInt(bounds.min);
	const max = BigInt(bounds.max);
	const tooLow = amountAtomic < min;
	const tooHigh = amountAtomic > max;

	return { ok: !tooLow && !tooHigh, tooLow, tooHigh };
}

export function applyBps(amountAtomic: bigint, bps: number): bigint {
	if (bps <= 0) return 0n;
	return (amountAtomic * BigInt(bps)) / TEN_THOUSAND;
}

export function formatBps(bps: number): string {
	const whole = Math.trunc(bps / 100);
	const fraction = bps % 100;
	if (fraction === 0) {
		return `${whole}%`;
	}
	return `${whole}.${fraction.toString().padStart(2, '0')}%`;
}

export function formatEta(seconds: number): string {
	if (seconds < 60) {
		return `~${seconds}s`;
	}
	const minutes = Math.floor(seconds / 60);
	return `~${minutes} min`;
}
