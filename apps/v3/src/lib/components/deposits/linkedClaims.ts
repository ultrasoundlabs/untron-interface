export type LinkedClaim = {
	claim_id?: unknown;
	lease_id?: unknown;
	claim_origin?: unknown;
	claim_status?: unknown;
	lease_number?: unknown;
	attributed_amount?: unknown;
	claim_amount_usdt?: unknown;
	lessee?: unknown;
	realtor?: unknown;
};

export function getClaimOriginLabel(origin: unknown): string | null {
	// Matches `UntronV3Index.ClaimOrigin` used by the hub.
	if (origin === 0) return 'pre-entitle';
	if (origin === 1) return 'subjective pre-entitle';
	if (origin === 2) return 'pull';
	return null;
}

export function normalizeLinkedClaims(value: unknown): LinkedClaim[] {
	if (!value) return [];
	if (Array.isArray(value)) return value as LinkedClaim[];
	if (typeof value === 'object') {
		const maybe = value as { linked_claims?: unknown; items?: unknown };
		if (Array.isArray(maybe.linked_claims)) return maybe.linked_claims as LinkedClaim[];
		if (Array.isArray(maybe.items)) return maybe.items as LinkedClaim[];
	}
	return [];
}

export function getBestLinkedClaimStatus(
	linkedClaims: LinkedClaim[]
): 'filled' | 'created' | null {
	for (const c of linkedClaims) {
		if (c?.claim_status === 'filled') return 'filled';
	}
	for (const c of linkedClaims) {
		if (c?.claim_status === 'created') return 'created';
	}
	return null;
}

export function getBestLinkedClaim(linkedClaims: LinkedClaim[]): LinkedClaim | null {
	for (const c of linkedClaims) {
		if (c?.claim_status === 'filled') return c;
	}
	for (const c of linkedClaims) {
		if (c?.claim_status === 'created') return c;
	}
	return linkedClaims[0] ?? null;
}
