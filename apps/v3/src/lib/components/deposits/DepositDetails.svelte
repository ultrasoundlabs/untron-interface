<script lang="ts">
	import * as Card from '@untron/ui/card';
	import { Badge } from '@untron/ui/badge';
	import { Button } from '@untron/ui/button';
	import * as Table from '@untron/ui/table';
	import CopyableValue from '$lib/components/common/CopyableValue.svelte';
	import type { UsdtDepositTx } from '$lib/untron/api';
	import {
		formatAddress,
		formatHexShort,
		formatUnixSecondsLocal,
		formatUnixSecondsLocalMinute,
		formatUnixSecondsRelativeDetailed,
		formatUsdtAtomic6,
		parseUnixSeconds
	} from '$lib/untron/format';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import { getBestLinkedClaim, getBestLinkedClaimStatus, getClaimOriginLabel, normalizeLinkedClaims } from './linkedClaims';

	type Props = {
		deposit: UsdtDepositTx;
	};

	let { deposit }: Props = $props();

	function tronTxUrl(txHash: unknown): string | null {
		if (typeof txHash !== 'string' || !txHash.trim()) return null;
		const hash = txHash.startsWith('0x') ? txHash.slice(2) : txHash;
		if (!/^[0-9a-fA-F]{64}$/.test(hash)) return null;
		return `https://tronscan.org/#/transaction/${hash}`;
	}

	function statusForDeposit(d: UsdtDepositTx): {
		label: string;
		variant: 'default' | 'secondary' | 'outline';
	} {
		const linked = normalizeLinkedClaims(d.linked_claims);
		const linkedStatus = getBestLinkedClaimStatus(linked);
		if (linkedStatus === 'filled') return { label: 'filled', variant: 'default' };
		if (linkedStatus === 'created') return { label: 'finalizing', variant: 'secondary' };
		if (linked.length > 0) return { label: 'accounted', variant: 'secondary' };

		// Fallback (older indexer rows / incomplete attribution).
		if (d.claim_status === 'filled') return { label: 'filled', variant: 'default' };
		if (d.claim_origin === 1 && d.claim_status === 'created')
			return { label: 'finalizing', variant: 'secondary' };
		return { label: 'processing', variant: 'outline' };
	}

	function actionabilityLabel(action: unknown): string | null {
		if (action === 'pre_entitle') return 'ready to pre-fill';
		if (action === 'already_accounted') return 'already accounted';
		if (action === 'pull') return 'pulled';
		return null;
	}

	function formatRelative(ts: unknown): string | null {
		const n = parseUnixSeconds(ts);
		if (n === null) return null;
		return formatUnixSecondsRelativeDetailed(n);
	}

	const status = $derived.by(() => statusForDeposit(deposit));
	const linkedClaims = $derived.by(() => normalizeLinkedClaims(deposit.linked_claims));
	const bestLinkedClaim = $derived.by(() => getBestLinkedClaim(linkedClaims));

	function getLeaseIdFromLinkedClaim(c: unknown): number | null {
		if (!c || typeof c !== 'object') return null;
		const v = (c as { lease_id?: unknown }).lease_id;
		if (typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v)) return v;
		if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
		return null;
	}

	const leaseId = $derived.by(() => {
		const linked = bestLinkedClaim ? getLeaseIdFromLinkedClaim(bestLinkedClaim) : null;
		if (linked !== null) return linked;
		const expected = deposit.expected_lease_id;
		if (typeof expected === 'number' && Number.isFinite(expected)) return expected;
		const claimLeaseId = deposit.claim_lease_id;
		if (typeof claimLeaseId === 'number' && Number.isFinite(claimLeaseId)) return claimLeaseId;
		return null;
	});

	const leaseHref = $derived.by(() => (leaseId === null ? null : `/leases/${String(leaseId)}`));

	function formatUsdtFromAtomicString(value: unknown): string | null {
		const s = typeof value === 'string' ? value : typeof value === 'number' ? String(value) : null;
		if (!s) return null;
		return formatUsdtAtomic6(s);
	}
</script>

<div class="space-y-6">
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Summary</Card.Title>
			<Card.Description>Canonical USDT deposit into a deterministic receiver.</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div class="flex items-center gap-3">
					<img src="/usdt.svg" alt="USDT" class="h-9 w-9 shrink-0" />
					<div class="space-y-0.5">
						<div class="font-sans text-xl leading-none font-semibold tabular-nums">
							{formatUsdtAtomic6(deposit.amount) ?? '—'} USDT
						</div>
						<div class="text-xs text-muted-foreground">
							{formatRelative(deposit.block_timestamp ?? deposit.block_time ?? deposit.inserted_at) ??
								'—'}
							<span class="opacity-70">·</span>
							{formatUnixSecondsLocalMinute(
								deposit.block_timestamp ?? deposit.block_time ?? deposit.inserted_at
							) ?? '—'}
						</div>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<Badge variant={status.variant}>{status.label}</Badge>
					{#if deposit.recommended_action}
						<Badge variant="secondary">
							{actionabilityLabel(deposit.recommended_action) ?? String(deposit.recommended_action)}
						</Badge>
					{/if}
				</div>
			</div>

			{#if leaseHref}
				<div class="flex flex-wrap items-center gap-2">
					<span class="text-sm text-muted-foreground">Lease</span>
					<Button variant="outline" size="sm" href={leaseHref ?? undefined} class="tabular-nums">
						{String(leaseId)}
					</Button>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Transfer</Card.Title>
			<Card.Description>On-chain identifiers and addresses.</Card.Description>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Body>
					<Table.Row>
						<Table.Cell class="w-[180px] text-xs text-muted-foreground">Tx hash</Table.Cell>
						<Table.Cell class="font-sans">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<CopyableValue
									value={typeof deposit.tx_hash === 'string' ? deposit.tx_hash : null}
									display={formatHexShort(deposit.tx_hash, 18, 14)}
									copyValue={typeof deposit.tx_hash === 'string' ? deposit.tx_hash : null}
									label="Copy tx hash"
									class="tabular-nums"
								/>
								<Button
									variant="ghost"
									size="sm"
									href={tronTxUrl(deposit.tx_hash) ?? undefined}
									disabled={!tronTxUrl(deposit.tx_hash)}
									target="_blank"
									rel="noreferrer"
									class="h-8"
								>
									<ExternalLinkIcon />
									View
								</Button>
							</div>
						</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell class="w-[180px] text-xs text-muted-foreground">Log index</Table.Cell>
						<Table.Cell class="font-sans tabular-nums">
							{typeof deposit.log_index === 'number' ? String(deposit.log_index) : '—'}
						</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell class="w-[180px] text-xs text-muted-foreground">Sender</Table.Cell>
						<Table.Cell class="font-sans">
							<CopyableValue
								value={typeof deposit.sender === 'string' ? deposit.sender : null}
								display={typeof deposit.sender === 'string' ? formatAddress(deposit.sender, 10, 8) : '—'}
								copyValue={typeof deposit.sender === 'string' ? deposit.sender : null}
								label="Copy sender"
								class="tabular-nums"
							/>
						</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell class="w-[180px] text-xs text-muted-foreground">Receiver</Table.Cell>
						<Table.Cell class="font-sans">
							<CopyableValue
								value={typeof deposit.recipient === 'string' ? deposit.recipient : null}
								display={typeof deposit.recipient === 'string'
									? formatAddress(deposit.recipient, 10, 8)
									: '—'}
								copyValue={typeof deposit.recipient === 'string' ? deposit.recipient : null}
								label="Copy receiver"
								class="tabular-nums"
							/>
						</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell class="w-[180px] text-xs text-muted-foreground">Block</Table.Cell>
						<Table.Cell class="font-sans tabular-nums">
							{typeof deposit.block_number === 'number' ? String(deposit.block_number) : '—'}
						</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell class="w-[180px] text-xs text-muted-foreground">Timestamp</Table.Cell>
						<Table.Cell class="font-sans">
							{#if deposit.block_timestamp ?? deposit.block_time}
								{@const ts = deposit.block_timestamp ?? deposit.block_time}
								<div class="text-sm font-medium">
									{formatRelative(ts) ?? '—'}
								</div>
								<div class="text-xs text-muted-foreground">{formatUnixSecondsLocal(ts) ?? '—'}</div>
							{:else}
								—
							{/if}
						</Table.Cell>
					</Table.Row>
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Accounting</Card.Title>
			<Card.Description>Status and how this deposit was accounted for.</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			{#if bestLinkedClaim}
				<div class="rounded-md border bg-muted/30 px-3 py-2">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<div class="text-sm font-medium">Accounted by claim activity</div>
						{#if bestLinkedClaim.claim_status === 'filled'}
							<Badge>filled</Badge>
						{:else if bestLinkedClaim.claim_status === 'created'}
							<Badge variant="secondary">finalizing</Badge>
						{:else}
							<Badge variant="outline">linked</Badge>
						{/if}
					</div>
					<div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
						<span class="font-sans tabular-nums">
							claim {typeof bestLinkedClaim.claim_id === 'number' || typeof bestLinkedClaim.claim_id === 'string'
								? String(bestLinkedClaim.claim_id)
								: '—'}
						</span>
						<span class="opacity-70">·</span>
						<span>
							{getClaimOriginLabel(bestLinkedClaim.claim_origin) ??
								(typeof bestLinkedClaim.claim_origin === 'number' || typeof bestLinkedClaim.claim_origin === 'string'
									? `origin ${String(bestLinkedClaim.claim_origin)}`
									: 'unknown origin')}
						</span>
						{#if bestLinkedClaim.attributed_amount}
							<span class="opacity-70">·</span>
							<span class="font-sans tabular-nums">
								attributed {formatUsdtFromAtomicString(bestLinkedClaim.attributed_amount) ??
									String(bestLinkedClaim.attributed_amount)} USDT
							</span>
						{/if}
						{#if bestLinkedClaim.claim_amount_usdt}
							<span class="opacity-70">·</span>
							<span class="font-sans tabular-nums">
								claimed {formatUsdtFromAtomicString(bestLinkedClaim.claim_amount_usdt) ??
									String(bestLinkedClaim.claim_amount_usdt)} USDT
							</span>
						{/if}
					</div>
				</div>
			{:else}
				<div class="rounded-md border bg-muted/30 px-3 py-2">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<div class="text-sm font-medium">Not yet accounted</div>
						<Badge variant="outline">processing</Badge>
					</div>
					<div class="mt-1 text-xs text-muted-foreground">
						We haven’t attributed this deposit to any claim yet.
					</div>
				</div>
			{/if}

			<details class="rounded-md border bg-muted/20 px-3 py-2">
				<summary class="cursor-pointer text-sm font-medium">Attribution (best-effort)</summary>
				<div class="mt-3 space-y-3">
					<div class="grid gap-3 sm:grid-cols-2">
						<div class="space-y-1">
							<div class="text-xs text-muted-foreground">Expected lease id</div>
							<div class="font-sans tabular-nums">
								{typeof deposit.expected_lease_id === 'number' ? String(deposit.expected_lease_id) : '—'}
							</div>
							<div class="text-xs text-muted-foreground">
								Heuristic attribution based on receiver salt and timing.
							</div>
						</div>
						<div class="space-y-1">
							<div class="text-xs text-muted-foreground">Expected lessee</div>
							<div class="font-sans tabular-nums">
								{typeof deposit.expected_lessee === 'string'
									? formatAddress(deposit.expected_lessee, 10, 8)
									: '—'}
							</div>
							<div class="text-xs text-muted-foreground">Non-authoritative hint for filtering.</div>
						</div>
					</div>
				</div>
			</details>

			{#if typeof deposit.claim_id === 'number' || typeof deposit.claim_status === 'string'}
				<details class="rounded-md border bg-muted/20 px-3 py-2">
					<summary class="cursor-pointer text-sm font-medium">Direct hub match (pre-entitle only)</summary>
					<div class="mt-3 space-y-3">
						<div class="grid gap-3 sm:grid-cols-2">
							<div class="space-y-1">
								<div class="text-xs text-muted-foreground">Claim id</div>
								<div class="font-sans tabular-nums">
									{typeof deposit.claim_id === 'number' ? String(deposit.claim_id) : '—'}
								</div>
							</div>
							<div class="space-y-1">
								<div class="text-xs text-muted-foreground">Status</div>
								<div class="font-sans tabular-nums">
									{typeof deposit.claim_status === 'string' ? deposit.claim_status : '—'}
								</div>
							</div>
						</div>
						<div class="text-xs text-muted-foreground">
							This linkage is only populated when the deposit tx hash directly matches a hub claim origin.
						</div>
					</div>
				</details>
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Raw record</Card.Title>
			<Card.Description>Debug view of the exact row returned by the indexer.</Card.Description>
		</Card.Header>
		<Card.Content>
			<details class="rounded-md border bg-muted/30 px-3 py-2">
				<summary class="cursor-pointer text-sm font-medium">Show JSON</summary>
				<pre
					class="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap break-words font-sans text-xs tabular-nums"
				>
{JSON.stringify(deposit, null, 2)}</pre
				>
			</details>
		</Card.Content>
	</Card.Root>
</div>
