import type { SqlRow } from './types';

export function formatAddress(address: string, head = 6, tail = 4): string {
	if (!address) return '—';
	if (address.length <= head + tail + 3) return address;
	return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

export function formatHexShort(value: unknown, head = 10, tail = 8): string {
	if (typeof value !== 'string') return '—';
	if (!value.startsWith('0x')) return value;
	if (value.length <= head + tail + 3) return value;
	return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function formatNumberish(value: unknown): string {
	if (value === null || value === undefined) return '—';
	if (typeof value === 'number') return String(value);
	if (typeof value === 'bigint') return value.toString(10);
	if (typeof value === 'string') return value;
	return String(value);
}

function parseBigIntish(value: unknown): bigint | null {
	if (typeof value === 'bigint') return value;
	if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value))
		return BigInt(value);
	if (typeof value !== 'string') return null;
	if (!/^-?\d+$/.test(value)) return null;
	try {
		return BigInt(value);
	} catch {
		return null;
	}
}

export function formatPpmAsPercent(ppm: unknown): string | null {
	const v = parseBigIntish(ppm);
	if (v === null) return null;
	const negative = v < 0n;
	const abs = negative ? -v : v;

	const whole = abs / 10000n;
	const frac = abs % 10000n;
	const fracStr = frac.toString().padStart(4, '0').replace(/0+$/, '');
	const numberStr = fracStr.length ? `${whole.toString()}.${fracStr}` : whole.toString();
	return `${negative ? '-' : ''}${numberStr}%`;
}

export function formatFeesPpmAndFlat(ppm: unknown, flatFee: unknown): string {
	const percent = formatPpmAsPercent(ppm);
	if (!percent) return '—';

	const flat = parseBigIntish(flatFee);
	if (flat === null || flat === 0n) return percent;
	const flatUsdt = formatUsdtAtomic6(flat);
	return `${percent} + ${flatUsdt ?? flat.toString(10)} USDT`;
}

const TOKEN_ALIASES: Record<string, string> = {
	'0xaf88d065e77c8cc2239327c5edb3a432268e5831': 'USDC',
	'0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': 'USDT'
};

export function getTokenAlias(address: string): string | null {
	const key = address.toLowerCase();
	return TOKEN_ALIASES[key] ?? null;
}

function formatAtomic(amountAtomic: bigint, decimals: number): string {
	const negative = amountAtomic < 0n;
	const abs = negative ? -amountAtomic : amountAtomic;
	const base = 10n ** BigInt(decimals);
	const whole = abs / base;
	const frac = abs % base;
	const fracStr = frac.toString(10).padStart(decimals, '0').replace(/0+$/, '');
	const num = fracStr.length ? `${whole.toString(10)}.${fracStr}` : whole.toString(10);
	return negative ? `-${num}` : num;
}

export function formatUsdtAtomic6(value: unknown): string | null {
	try {
		if (typeof value === 'string' && value.length > 0) return formatAtomic(BigInt(value), 6);
		if (typeof value === 'number' && Number.isFinite(value)) return formatAtomic(BigInt(value), 6);
		if (typeof value === 'bigint') return formatAtomic(value, 6);
		return null;
	} catch {
		return null;
	}
}

export function formatUnixSeconds(value: unknown): string | null {
	try {
		const s = typeof value === 'string' ? value : typeof value === 'number' ? String(value) : null;
		if (!s) return null;
		const n = Number(s);
		if (!Number.isFinite(n)) return null;
		return new Date(n * 1000).toISOString().replace('T', ' ').replace('Z', 'Z');
	} catch {
		return null;
	}
}

export function parseUnixSeconds(value: unknown): number | null {
	if (value === null || value === undefined) return null;
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'bigint') return Number(value);
	if (typeof value === 'string' && value.trim().length) {
		const n = Number(value);
		if (Number.isFinite(n)) return n;
	}
	return null;
}

export function formatUnixSecondsLocal(value: unknown): string | null {
	const n = parseUnixSeconds(value);
	if (n === null) return null;
	try {
		return new Date(n * 1000).toLocaleString(undefined, { timeZoneName: 'short' });
	} catch {
		return new Date(n * 1000).toString();
	}
}

function formatRelativeDeltaSeconds(deltaSeconds: number): string {
	const abs = Math.abs(deltaSeconds);
	const suffix = deltaSeconds < 0 ? 'ago' : 'in';

	const units: Array<[number, string]> = [
		[60 * 60 * 24, 'd'],
		[60 * 60, 'h'],
		[60, 'm'],
		[1, 's']
	];

	for (const [unitSeconds, label] of units) {
		if (abs >= unitSeconds) {
			const v = Math.floor(abs / unitSeconds);
			return suffix === 'ago' ? `${v}${label} ago` : `in ${v}${label}`;
		}
	}

	return deltaSeconds < 0 ? 'just now' : 'soon';
}

export function formatUnixSecondsRelative(value: unknown, nowSeconds?: number): string | null {
	const n = parseUnixSeconds(value);
	if (n === null) return null;
	const now = nowSeconds ?? Math.floor(Date.now() / 1000);
	const delta = Math.floor(n - now);
	return formatRelativeDeltaSeconds(delta);
}

export function formatUnixSecondsRelativeDetailed(
	value: unknown,
	nowSeconds?: number
): string | null {
	const n = parseUnixSeconds(value);
	if (n === null) return null;
	const now = nowSeconds ?? Math.floor(Date.now() / 1000);
	let delta = Math.floor(n - now);
	const past = delta < 0;
	delta = Math.abs(delta);

	if (delta < 3) return past ? 'just now' : 'soon';

	const days = Math.floor(delta / (60 * 60 * 24));
	delta -= days * 60 * 60 * 24;
	const hours = Math.floor(delta / (60 * 60));
	delta -= hours * 60 * 60;
	const minutes = Math.floor(delta / 60);
	const seconds = delta - minutes * 60;

	let core = '';
	if (days > 0) core = `${days}d ${hours}h`;
	else if (hours > 0) core = `${hours}h ${minutes}m`;
	else if (minutes > 0) core = `${minutes}m ${seconds}s`;
	else core = `${seconds}s`;

	return past ? `${core} ago` : `in ${core}`;
}

export function formatUnixSecondsLocalMinute(value: unknown): string | null {
	const n = parseUnixSeconds(value);
	if (n === null) return null;
	try {
		return new Date(n * 1000).toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	} catch {
		return new Date(n * 1000).toString();
	}
}

export type FeeFromNetResult = { feeAtomic: bigint; grossAtomic: bigint; exact: boolean };

export function estimateFeeFromNetAndPpm(
	netAtomic: unknown,
	feePpm: unknown
): FeeFromNetResult | null {
	try {
		if (feePpm === null || feePpm === undefined) return null;
		const ppm = typeof feePpm === 'bigint' ? feePpm : BigInt(String(feePpm));
		const net = typeof netAtomic === 'bigint' ? netAtomic : BigInt(String(netAtomic));
		if (ppm <= 0n) return { feeAtomic: 0n, grossAtomic: net, exact: true };
		const scale = 1_000_000n;
		if (ppm >= scale) return null;

		const den = scale - ppm;
		const grossEstimate = (net * scale + den - 1n) / den; // ceil

		let g = grossEstimate;
		let steps = 0;
		while (steps++ < 2000) {
			const fee = (g * ppm) / scale;
			const net2 = g - fee;
			if (net2 === net) return { feeAtomic: fee, grossAtomic: g, exact: true };
			if (net2 > net) {
				g -= 1n;
				continue;
			}
			// net2 < net: we've gone too low, so bump back up.
			g += 1n;
			const feeUp = (g * ppm) / scale;
			const netUp = g - feeUp;
			if (netUp === net) return { feeAtomic: feeUp, grossAtomic: g, exact: true };
			return { feeAtomic: feeUp, grossAtomic: g, exact: false };
		}

		const fee = (grossEstimate * ppm) / scale;
		return { feeAtomic: fee, grossAtomic: grossEstimate, exact: false };
	} catch {
		return null;
	}
}

export function isTronAddress(value: unknown): value is string {
	return typeof value === 'string' && value.startsWith('T') && value.length >= 20;
}

export function isEvmAddress(value: unknown): value is `0x${string}` {
	return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value);
}

export function getLeaseId(row: SqlRow): string | null {
	const v = row.lease_id ?? row.leaseId;
	if (typeof v === 'string') return v;
	if (typeof v === 'number') return String(v);
	return null;
}

export function getLessee(row: SqlRow): `0x${string}` | null {
	const v = row.lessee;
	if (typeof v === 'string' && v.startsWith('0x')) return v as `0x${string}`;
	return null;
}

export function getBeneficiary(row: SqlRow): `0x${string}` | null {
	const v = row.beneficiary;
	if (typeof v === 'string' && v.startsWith('0x')) return v as `0x${string}`;
	return null;
}

export function getReceiverTron(row: SqlRow): string | null {
	const candidates: unknown[] = [
		row.receiver_tron_computed,
		row.receiver_tron,
		row.receiver_tron_address,
		row.receiver_address_tron,
		row.receiver,
		row.receiver_address
	];
	for (const v of candidates) {
		if (isTronAddress(v)) return v;
	}
	for (const [k, v] of Object.entries(row)) {
		if (!k.toLowerCase().includes('receiver')) continue;
		if (isTronAddress(v)) return v;
	}
	return null;
}

export function getReceiverEvm(row: SqlRow): `0x${string}` | null {
	const candidates: unknown[] = [
		row.receiver_address_evm,
		row.receiver_evm,
		row.receiverEvm,
		row.receiverAddressEvm
	];
	for (const v of candidates) {
		if (isEvmAddress(v)) return v;
	}
	for (const [k, v] of Object.entries(row)) {
		if (!k.toLowerCase().includes('receiver')) continue;
		if (isEvmAddress(v)) return v;
	}
	return null;
}

export function getTargetChainId(row: SqlRow): string | null {
	const v = row.target_chain_id ?? row.targetChainId;
	if (typeof v === 'string') return v;
	if (typeof v === 'number') return String(v);
	return null;
}

export function getTargetToken(row: SqlRow): `0x${string}` | null {
	const v = row.target_token ?? row.targetToken;
	if (typeof v === 'string' && v.startsWith('0x')) return v as `0x${string}`;
	return null;
}

export function getLeaseFeePpm(row: SqlRow): string | null {
	const v = row.lease_fee_ppm ?? row.leaseFeePpm;
	if (typeof v === 'string') return v;
	if (typeof v === 'number') return String(v);
	return null;
}

export function getFlatFee(row: SqlRow): string | null {
	const v = row.flat_fee ?? row.flatFee;
	if (typeof v === 'string') return v;
	if (typeof v === 'number') return String(v);
	return null;
}

export function getNukeableAfter(row: SqlRow): string | null {
	const v = row.nukeable_after ?? row.nukeableAfter;
	if (typeof v === 'string') return v;
	if (typeof v === 'number') return String(v);
	return null;
}

export function getIsActive(row: SqlRow): boolean | null {
	const v = row.is_active ?? row.isActive;
	if (typeof v === 'boolean') return v;
	return null;
}

export function getIsNukeableYet(row: SqlRow): boolean | null {
	const v = row.is_nukeable_yet ?? row.isNukeableYet;
	if (typeof v === 'boolean') return v;
	return null;
}
