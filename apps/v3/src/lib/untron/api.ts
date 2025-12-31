import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { SqlRow } from './types';
import { tronCreate2AddressBase58 } from '$lib/tron/create2';

export class UntronApiError extends Error {
	details: unknown;
	constructor(message: string, details: unknown = null) {
		super(message);
		this.name = 'UntronApiError';
		this.details = details;
	}
}

function getApiBaseUrl(): string {
	const envUrl = env.PUBLIC_UNTRON_API_URL;
	if (envUrl && envUrl.trim().length > 0) return envUrl.replace(/\/$/, '');
	return 'http://localhost:42069';
}

function lowerHexAddress(address: string): string {
	// We intentionally lowercase for SQL comparisons (DB stores lowercase).
	return address.toLowerCase();
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, init);
	const text = await res.text();

	let data: unknown = null;
	try {
		data = text.length ? JSON.parse(text) : null;
	} catch {
		// ignore; treat as raw text
	}

	if (!res.ok) {
		throw new UntronApiError(typeof data === 'string' ? data : res.statusText, data);
	}

	if (
		typeof data === 'object' &&
		data !== null &&
		'ok' in data &&
		(data as { ok?: unknown }).ok === false
	) {
		const err = (data as { error?: { message?: unknown; details?: unknown } }).error;
		throw new UntronApiError(
			typeof err?.message === 'string' ? err.message : 'Request failed',
			err?.details ?? null
		);
	}

	return data as T;
}

export type ProtocolResponse = {
	ok: true;
	hub: {
		chainId: number;
		contractAddress: `0x${string}`;
		protocol: Record<string, unknown>;
		deprecatedChains?: unknown[];
		swapRates?: unknown[];
		bridgerRoutes?: unknown[];
	};
	controller: { chainId: number; address: string; receiverBytecodeHash?: `0x${string}` };
};

let protocolPromise: Promise<ProtocolResponse> | null = null;

export async function getProtocol(): Promise<ProtocolResponse> {
	if (!browser) throw new Error('getProtocol must run in the browser (ssr is disabled)');
	if (!protocolPromise) {
		const url = `${getApiBaseUrl()}/protocol`;
		protocolPromise = fetchJson<ProtocolResponse>(url);
	}
	return await protocolPromise;
}

export async function ponderSqlDb<T extends SqlRow = SqlRow>(
	sql: string,
	params: unknown[] = []
): Promise<T[]> {
	const url = new URL(`${getApiBaseUrl()}/sql/db`);
	url.searchParams.set('sql', JSON.stringify({ json: { sql, params } }));
	const data = await fetchJson<{ rows: T[] }>(url.toString());
	return data.rows ?? [];
}

function getReceiverSalt(row: SqlRow): `0x${string}` | null {
	const v = row.receiver_salt ?? row.receiverSalt;
	if (typeof v === 'string' && v.startsWith('0x')) return v as `0x${string}`;
	return null;
}

function hasTronReceiver(row: SqlRow): boolean {
	for (const [k, v] of Object.entries(row)) {
		if (!k.toLowerCase().includes('receiver')) continue;
		if (typeof v === 'string' && v.startsWith('T')) return true;
	}
	return false;
}

function attachComputedReceiverTron(rows: SqlRow[], protocol: ProtocolResponse): SqlRow[] {
	const bytecodeHash = protocol.controller.receiverBytecodeHash;
	if (!bytecodeHash) return rows;

	return rows.map((row) => {
		if (hasTronReceiver(row)) return row;
		const receiverSalt = getReceiverSalt(row);
		if (!receiverSalt) return row;

		try {
			const receiver = tronCreate2AddressBase58({
				deployerBase58: protocol.controller.address,
				saltHex: receiverSalt,
				bytecodeHashHex: bytecodeHash
			});
			return { ...row, receiver_tron_computed: receiver };
		} catch {
			return row;
		}
	});
}

export async function getAllLeases(limit = 100, offset = 0): Promise<SqlRow[]> {
	const protocol = await getProtocol();
	const rows = await ponderSqlDb(
		`SELECT *
FROM untron_v3_lease_full
WHERE chain_id = $1
  AND contract_address = $2
ORDER BY lease_id DESC
LIMIT $3 OFFSET $4;`,
		[protocol.hub.chainId, lowerHexAddress(protocol.hub.contractAddress), limit, offset]
	);
	return attachComputedReceiverTron(rows, protocol);
}

export async function getOwnedLeases(
	owner: `0x${string}`,
	limit = 50,
	offset = 0
): Promise<SqlRow[]> {
	const protocol = await getProtocol();
	const rows = await ponderSqlDb(
		`SELECT *
FROM untron_v3_lease_full
WHERE chain_id = $1
  AND contract_address = $2
  AND lessee = $3
ORDER BY lease_id DESC
LIMIT $4 OFFSET $5;`,
		[
			protocol.hub.chainId,
			lowerHexAddress(protocol.hub.contractAddress),
			lowerHexAddress(owner),
			limit,
			offset
		]
	);
	return attachComputedReceiverTron(rows, protocol);
}

export async function getLeaseById(leaseId: string): Promise<SqlRow | null> {
	const protocol = await getProtocol();
	const rows = await ponderSqlDb(
		`SELECT *
FROM untron_v3_lease_full
WHERE chain_id = $1
  AND contract_address = $2
  AND lease_id = $3
LIMIT 1;`,
		[protocol.hub.chainId, lowerHexAddress(protocol.hub.contractAddress), leaseId]
	);
	return attachComputedReceiverTron(rows, protocol)[0] ?? null;
}

export async function getClaimsByLeaseId(leaseId: string, limit = 100): Promise<SqlRow[]> {
	const protocol = await getProtocol();
	return await ponderSqlDb(
		`SELECT *
FROM untron_v3_claim_full
WHERE chain_id = $1
  AND contract_address = $2
  AND lease_id = $3
ORDER BY claim_index DESC
LIMIT $4;`,
		[protocol.hub.chainId, lowerHexAddress(protocol.hub.contractAddress), leaseId, limit]
	);
}

export type CreateLeaseBody = {
	receiverSalt?: `0x${string}`;
	lessee: `0x${string}`;
	nukeableAfter: string;
	leaseFeePpm: string;
	flatFee: string;
	targetChainId: string;
	targetToken: `0x${string}`;
	beneficiary: `0x${string}`;
};

export type CreateLeaseResponse = {
	ok: true;
	chainId: number;
	contractAddress: `0x${string}`;
	receiverSalt: `0x${string}`;
	leaseId: string | null;
	userOperation: {
		bundlerUrl: string;
		userOpHash: `0x${string}`;
		transactionHash: `0x${string}`;
		blockNumber: string;
		success: boolean;
	};
};

export async function createLease(body: CreateLeaseBody): Promise<CreateLeaseResponse> {
	const url = `${getApiBaseUrl()}/leases`;
	return await fetchJson<CreateLeaseResponse>(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
}

export type UpdatePayoutConfigBody = {
	targetChainId: string;
	targetToken: `0x${string}`;
	beneficiary: `0x${string}`;
	deadline: string;
	signature: `0x${string}`;
};

export type UpdatePayoutConfigResponse = {
	ok: true;
	chainId: number;
	contractAddress: `0x${string}`;
	leaseId: string;
	updated: boolean;
	userOperation: {
		bundlerUrl: string;
		userOpHash: `0x${string}`;
		transactionHash: `0x${string}`;
		blockNumber: string;
		success: boolean;
	};
};

export async function updatePayoutConfigWithSig(
	leaseId: string,
	body: UpdatePayoutConfigBody
): Promise<UpdatePayoutConfigResponse> {
	const url = `${getApiBaseUrl()}/leases/${encodeURIComponent(leaseId)}`;
	return await fetchJson<UpdatePayoutConfigResponse>(url, {
		method: 'PUT',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
}
