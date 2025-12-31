import type { SqlRow } from './types';

export function formatAddress(address: string, head = 6, tail = 4): string {
	if (!address) return '—';
	if (address.length <= head + tail + 3) return address;
	return `${address.slice(0, head)}…${address.slice(-tail)}`;
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
	return `${percent} {flat: ${flat.toString(10)}}`;
}

export function isTronAddress(value: unknown): value is string {
	return typeof value === 'string' && value.startsWith('T') && value.length >= 20;
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
