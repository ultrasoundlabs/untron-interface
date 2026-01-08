import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { api as createApiClient } from '$lib/api/client';
import type { components } from '$lib/api/schema';
import { getAddress } from 'viem';
import type { SqlRow } from './types';

export class UntronApiError extends Error {
	details: unknown;
	constructor(message: string, details: unknown = null) {
		super(message);
		this.name = 'UntronApiError';
		this.details = details;
	}
}

function checksumEvmAddress(address: string): `0x${string}` {
	return getAddress(address) as `0x${string}`;
}

function requireBrowser() {
	if (!browser) throw new Error('Untron API helpers must run in the browser (ssr is disabled)');
}

function getHubChainId(): number | null {
	const raw = env.PUBLIC_UNTRON_HUB_CHAIN_ID;
	if (!raw) return null;
	const parsed = Number(raw);
	if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
		throw new Error('Invalid PUBLIC_UNTRON_HUB_CHAIN_ID (expected a positive integer)');
	}
	return parsed;
}

function requireHubChainId(): number {
	const chainId = getHubChainId();
	if (chainId === null) {
		throw new Error('Missing PUBLIC_UNTRON_HUB_CHAIN_ID (needed for EIP-712 signing)');
	}
	return chainId;
}

type RealtorInfoResponse = components['schemas']['RealtorInfoResponse'];
type RealtorTargetPairResponse = components['schemas']['RealtorTargetPairResponse'];
type HubProtocolConfig = components['schemas']['hub_protocol_config'];
type HubChains = components['schemas']['hub_chains'];
export type LeaseViewResponse = components['schemas']['LeaseViewResponse'];
export type LeaseClaimView = components['schemas']['LeaseClaimView'];
export type CreateLeaseRequest = components['schemas']['CreateLeaseRequest'];
export type CreateLeaseResponse = components['schemas']['CreateLeaseResponse'];
export type SetPayoutConfigRequest = components['schemas']['SetPayoutConfigRequest'];
export type SetPayoutConfigResponse = components['schemas']['SetPayoutConfigResponse'];

export type ProtocolInfo = {
	hubChainId: number | null;
	untronV3: `0x${string}`;
	realtorAddress: `0x${string}`;
	allowed: boolean;
	defaultDurationSeconds: number;
	effectiveDurationSeconds: number;
	maxDurationSeconds: number;
	minFeePpm: number;
	minFlatFee: number;
	arbitraryLesseeFlatFee: number;
	supportedPairs: RealtorTargetPairResponse[];
	deprecatedTargetChains: Set<string>;
	floorFeePpm: number | null;
	floorFlatFee: number | null;
};

function toInt(value: unknown, label: string): number {
	const n = typeof value === 'number' ? value : Number(String(value));
	if (!Number.isFinite(n) || !Number.isInteger(n)) throw new Error(`Invalid ${label}`);
	return n;
}

function toEq(value: string): string {
	return `eq.${value}`;
}

function toIn(values: string[]): string {
	// PostgREST in.(...) filter; values must not contain commas.
	return `in.(${values.join(',')})`;
}

function mapErrorMessage(error: unknown, response: Response): string {
	if (error && typeof error === 'object' && 'error' in error) {
		const maybe = (error as { error?: unknown }).error;
		if (typeof maybe === 'string' && maybe.trim().length) return maybe;
	}
	return response.statusText || `Request failed (${response.status})`;
}

async function unwrap<T>(
	result: Promise<{ data?: T; error?: unknown; response: Response }>
): Promise<T> {
	const { data, error, response } = await result;
	if (data !== undefined) return data;
	throw new UntronApiError(mapErrorMessage(error, response), error ?? null);
}

let protocolInfoPromise: Promise<ProtocolInfo> | null = null;

export async function getProtocolInfo(): Promise<ProtocolInfo> {
	requireBrowser();
	if (!protocolInfoPromise) {
		protocolInfoPromise = (async () => {
			const client = createApiClient();
			const [realtorInfo, protocolConfigRows, deprecatedChains] = await Promise.all([
				unwrap<RealtorInfoResponse>(client.GET('/realtor')),
				unwrap<HubProtocolConfig[]>(
					client.GET('/hub_protocol_config', { params: { query: { limit: '1' } } })
				),
				unwrap<HubChains[]>(
					client.GET('/hub_chains', { params: { query: { deprecated: 'eq.true' } } })
				)
			]);

			const deprecatedTargetChains = new Set<string>();
			for (const row of deprecatedChains) {
				if (row.deprecated !== true) continue;
				if (typeof row.target_chain_id === 'number')
					deprecatedTargetChains.add(String(row.target_chain_id));
			}

			const cfg = protocolConfigRows[0] ?? null;

			const untronV3 = checksumEvmAddress(realtorInfo.untron_v3);
			const realtorAddress = checksumEvmAddress(realtorInfo.realtor_address);

			return {
				hubChainId: getHubChainId(),
				untronV3,
				realtorAddress,
				allowed: realtorInfo.allowed,
				defaultDurationSeconds: realtorInfo.default_duration_seconds,
				effectiveDurationSeconds: realtorInfo.effective_duration_seconds,
				maxDurationSeconds: realtorInfo.max_duration_seconds,
				minFeePpm: realtorInfo.min_fee_ppm,
				minFlatFee: realtorInfo.min_flat_fee,
				arbitraryLesseeFlatFee: realtorInfo.arbitrary_lessee_flat_fee,
				supportedPairs: realtorInfo.supported_pairs ?? [],
				deprecatedTargetChains,
				floorFeePpm: typeof cfg?.floor_ppm === 'number' ? cfg.floor_ppm : null,
				floorFlatFee: typeof cfg?.floor_flat_fee === 'number' ? cfg.floor_flat_fee : null
			};
		})();
	}
	return await protocolInfoPromise;
}

type LeaseViewRow = components['schemas']['lease_view'];
type ReceiverSaltCandidate = components['schemas']['receiver_salt_candidates'];
export type UnaccountedReceiverUsdtTransfer =
	components['schemas']['unaccounted_receiver_usdt_transfers'];

function normalizeLeaseViewRow(row: LeaseViewRow, receiverBySalt: Map<string, string>): SqlRow {
	const leaseId = row.lease_id === undefined ? null : String(row.lease_id);
	const receiverSalt = typeof row.receiver_salt === 'string' ? row.receiver_salt : null;
	const receiverTron = receiverSalt ? (receiverBySalt.get(receiverSalt) ?? null) : null;
	const now = Math.floor(Date.now() / 1000);

	return {
		lease_id: leaseId,
		receiver_salt: receiverSalt,
		receiver_address_tron: receiverTron,
		realtor: row.realtor ?? null,
		lessee: row.lessee ?? null,
		start_time: row.start_time ?? null,
		nukeable_after: row.nukeable_after ?? null,
		is_active: true,
		is_nukeable_yet: typeof row.nukeable_after === 'number' ? row.nukeable_after <= now : null,
		lease_fee_ppm: row.lease_fee_ppm ?? null,
		flat_fee: row.flat_fee === undefined ? null : String(row.flat_fee),
		target_chain_id:
			row.payout_target_chain_id === undefined ? null : String(row.payout_target_chain_id),
		target_token: row.payout_target_token ?? null,
		beneficiary: row.payout_beneficiary ?? null,
		claims_total: row.claims_total ?? null,
		claims_filled: row.claims_filled ?? null
	};
}

async function getReceiverBySalt(salts: string[]): Promise<Map<string, string>> {
	if (salts.length === 0) return new Map();
	const client = createApiClient();
	const rows = await unwrap<ReceiverSaltCandidate[]>(
		client.GET('/receiver_salt_candidates', {
			params: {
				query: {
					receiver_salt: toIn([...new Set(salts)])
				}
			}
		})
	);
	const map = new Map<string, string>();
	for (const r of rows) {
		if (typeof r.receiver_salt !== 'string') continue;
		if (typeof r.receiver !== 'string') continue;
		map.set(r.receiver_salt, r.receiver);
	}
	return map;
}

export async function getAllLeases(limit = 100, offset = 0): Promise<SqlRow[]> {
	requireBrowser();
	const client = createApiClient();
	const rows = await unwrap<LeaseViewRow[]>(
		client.GET('/lease_view', {
			params: {
				query: {
					order: 'lease_id.desc',
					limit: String(limit),
					offset: String(offset)
				}
			}
		})
	);
	const salts = rows.map((r) => r.receiver_salt).filter((v): v is string => typeof v === 'string');
	const receiverBySalt = await getReceiverBySalt(salts);
	return rows.map((r) => normalizeLeaseViewRow(r, receiverBySalt));
}

export async function getOwnedLeases(
	owner: `0x${string}`,
	limit = 50,
	offset = 0
): Promise<SqlRow[]> {
	requireBrowser();
	const client = createApiClient();
	const rows = await unwrap<LeaseViewRow[]>(
		client.GET('/lease_view', {
			params: {
				query: {
					lessee: toEq(checksumEvmAddress(owner)),
					order: 'lease_id.desc',
					limit: String(limit),
					offset: String(offset)
				}
			}
		})
	);
	const salts = rows.map((r) => r.receiver_salt).filter((v): v is string => typeof v === 'string');
	const receiverBySalt = await getReceiverBySalt(salts);
	return rows.map((r) => normalizeLeaseViewRow(r, receiverBySalt));
}

function normalizeLeaseDetails(view: LeaseViewResponse): SqlRow {
	const payout = view.payout_config_current ?? null;
	const now = Math.floor(Date.now() / 1000);

	return {
		lease_id: view.lease_id,
		receiver_salt: view.receiver_salt,
		receiver_address_tron: view.receiver_address_tron ?? null,
		receiver_address_evm: view.receiver_address_evm ?? null,
		realtor: view.realtor,
		lessee: view.lessee,
		start_time: view.start_time,
		nukeable_after: view.nukeable_after,
		lease_fee_ppm: view.lease_fee_ppm,
		flat_fee: view.flat_fee,
		lease_nonce: view.lease_nonce,
		target_chain_id: payout ? String(payout.target_chain_id) : null,
		target_token: payout?.target_token ?? null,
		beneficiary: payout?.beneficiary ?? null,
		is_active: true,
		is_nukeable_yet: view.nukeable_after <= now,
		claims_total: view.claims_total,
		claims_filled: view.claims_filled,
		payout_config_history: view.payout_config_history,
		claims: view.claims
	};
}

export async function getLeaseById(leaseId: string): Promise<SqlRow | null> {
	requireBrowser();
	const id = toInt(leaseId, 'lease id');
	const client = createApiClient();
	const view = await unwrap<LeaseViewResponse>(
		client.GET('/leases/{lease_id}', { params: { path: { lease_id: id } } })
	);
	return view ? normalizeLeaseDetails(view) : null;
}

export async function getRealtor(): Promise<RealtorInfoResponse> {
	requireBrowser();
	const client = createApiClient();
	return await unwrap<RealtorInfoResponse>(client.GET('/realtor'));
}

export async function createLease(body: CreateLeaseRequest): Promise<CreateLeaseResponse> {
	requireBrowser();
	const client = createApiClient();
	return await unwrap<CreateLeaseResponse>(
		client.POST('/realtor', {
			body
		})
	);
}

export async function updatePayoutConfigWithSig(
	body: SetPayoutConfigRequest
): Promise<SetPayoutConfigResponse> {
	requireBrowser();
	const client = createApiClient();
	return await unwrap<SetPayoutConfigResponse>(
		client.POST('/payout_config', {
			body
		})
	);
}

export async function findLeaseIdByReceiverSalt(args: {
	receiverSalt: string;
	lessee?: `0x${string}` | null;
}): Promise<string | null> {
	requireBrowser();
	const client = createApiClient();
	const rows = await unwrap<LeaseViewRow[]>(
		client.GET('/lease_view', {
			params: {
				query: {
					receiver_salt: toEq(args.receiverSalt),
					...(args.lessee ? { lessee: toEq(checksumEvmAddress(args.lessee)) } : {}),
					order: 'lease_id.desc',
					limit: '1'
				}
			}
		})
	);
	const leaseId = rows[0]?.lease_id;
	return leaseId === undefined ? null : String(leaseId);
}

export async function getLeaseNonce(leaseId: string): Promise<string> {
	requireBrowser();
	const client = createApiClient();
	const rows = await unwrap<Array<components['schemas']['hub_lease_nonces']>>(
		client.GET('/hub_lease_nonces', { params: { query: { lease_id: toEq(leaseId), limit: '1' } } })
	);
	const nonce = rows[0]?.nonce;
	return nonce === undefined ? '0' : String(nonce);
}

export async function getUnaccountedReceiverUsdtTransfers(args: {
	receiverSalt: string;
	expectedLeaseId?: string | null;
	limit?: number;
}): Promise<UnaccountedReceiverUsdtTransfer[]> {
	requireBrowser();
	const client = createApiClient();
	return await unwrap<UnaccountedReceiverUsdtTransfer[]>(
		client.GET('/unaccounted_receiver_usdt_transfers', {
			params: {
				query: {
					receiver_salt: toEq(args.receiverSalt),
					...(args.expectedLeaseId ? { expected_lease_id: toEq(args.expectedLeaseId) } : {}),
					order: 'block_timestamp.desc',
					limit: String(args.limit ?? 50)
				}
			}
		})
	);
}
