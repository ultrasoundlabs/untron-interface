<script lang="ts">
	import { page } from '$app/stores';
	import * as Card from '@untron/ui/card';
	import { Button } from '@untron/ui/button';
	import * as Alert from '@untron/ui/alert';
	import { Badge } from '@untron/ui/badge';
	import { Skeleton } from '@untron/ui/skeleton';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import HourglassIcon from '@lucide/svelte/icons/hourglass';
	import LeaseCard from '$lib/components/leases/LeaseCard.svelte';
	import ClaimsTable from '$lib/components/leases/ClaimsTable.svelte';
	import LeaseDetailsPanel from '$lib/components/leases/LeaseDetailsPanel.svelte';
	import { getLeaseById } from '$lib/untron/api';
	import type { SqlRow } from '$lib/untron/types';
	import { getLeaseFeePpm } from '$lib/untron/format';
	import { startPolling } from '$lib/polling';

	let lease = $state<SqlRow | null>(null);
	let pendingDeposits = $state<SqlRow[] | null>(null);
	let loading = $state(false); // initial load only
	let refreshing = $state(false);
	let refreshedPulse = $state(false);
	let errorMessage = $state<string | null>(null);

	const leaseId = $derived($page.params.leaseId ?? '');

	async function refresh(mode: 'initial' | 'background' | 'manual' = 'manual') {
		if (!leaseId) return;
		try {
			if (mode === 'initial') loading = true;
			else refreshing = true;
			errorMessage = null;
			const nextLease = await getLeaseById(leaseId);

			let nextPending: SqlRow[] | null = pendingDeposits;
			const deposits = nextLease?.pending_usdt_deposits;
			if (Array.isArray(deposits)) {
				nextPending = deposits.map((d) => ({
					claim_id: null,
					amount_usdt: typeof d?.amount === 'string' ? d.amount : null,
					beneficiary: typeof nextLease?.beneficiary === 'string' ? nextLease.beneficiary : null,
					target_chain_id:
						typeof nextLease?.target_chain_id === 'string' ? nextLease.target_chain_id : null,
					target_token: typeof nextLease?.target_token === 'string' ? nextLease.target_token : null,
					origin_timestamp: typeof d?.block_timestamp === 'number' ? d.block_timestamp : null,
					status: 'pending',
					usdt_deposit_attribution: [d]
				}));
			} else if (nextLease) {
				nextPending = [];
			}
			lease = nextLease;
			pendingDeposits = nextPending;
			refreshedPulse = true;
			setTimeout(() => (refreshedPulse = false), 600);
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : String(err);
		} finally {
			if (mode === 'initial') loading = false;
			else refreshing = false;
		}
	}

	$effect(() => {
		const stop = startPolling(() => refresh('background'), 3000, {
			immediate: true,
			skipIf: () => loading || refreshing || !leaseId
		});
		return stop;
	});
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="space-y-1">
			<h2 class="text-xl font-semibold tracking-tight">Lease {leaseId}</h2>
			<p class="text-sm text-muted-foreground">Details and claims.</p>
		</div>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				onclick={() => refresh('manual')}
				disabled={loading || refreshing}
				title={refreshing ? 'Refreshing…' : 'Refresh'}
			>
				<RefreshCwIcon
					class={loading || refreshing ? 'animate-spin' : refreshedPulse ? 'animate-pulse' : ''}
				/>
				Refresh
			</Button>
		</div>
	</div>

	{#if errorMessage}
		<Alert.Root variant="destructive">
			<Alert.Title>Failed to load lease</Alert.Title>
			<Alert.Description>{errorMessage}</Alert.Description>
		</Alert.Root>
	{/if}

	<div class="grid gap-6 lg:grid-cols-2">
		<div class="space-y-6">
			{#if lease === null}
				<Skeleton class="h-[280px]" />
			{:else if lease}
				<LeaseCard {lease} />
				<LeaseDetailsPanel {lease} />
			{:else}
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-base">Lease not found</Card.Title>
						<Card.Description>
							The indexer may be behind or the lease id is invalid.
						</Card.Description>
					</Card.Header>
				</Card.Root>
			{/if}
		</div>

		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Claims</Card.Title>
				<Card.Description>Current claim states emitted by this lease.</Card.Description>
			</Card.Header>
			<Card.Content>
				{@const claimRows = (lease?.claims as SqlRow[] | undefined) ?? []}
				{@const finalizingRows = pendingDeposits ?? []}
				{@const allRows = [...finalizingRows, ...claimRows]}
				{#if finalizingRows.length > 0}
					<Alert.Root class="mb-4">
						<HourglassIcon />
						<Alert.Title class="flex items-center gap-2">
							Pending deposits
							<Badge variant="secondary">{finalizingRows.length}</Badge>
						</Alert.Title>
						<Alert.Description>
							{finalizingRows.length === 1
								? "A USDT deposit was detected into this receiver but hasn't been accounted for by a claim yet."
								: `${finalizingRows.length} USDT deposits were detected into this receiver but haven't been accounted for by claims yet.`}
							This usually means that the transaction hasn't yet been finalized on Tron.
							<br />
							<br />
							Finality on Tron is about 54 seconds. If your deposit is much older than that and still
							pending, please contact us.
						</Alert.Description>
					</Alert.Root>
				{/if}
				{#if lease === null}
					<div class="space-y-2">
						<Skeleton class="h-10" />
						<Skeleton class="h-10" />
						<Skeleton class="h-10" />
					</div>
				{:else if allRows.length === 0}
					<div class="text-sm text-muted-foreground">No claims for this lease.</div>
				{:else}
					<ClaimsTable rows={allRows} leaseFeePpm={lease ? getLeaseFeePpm(lease) : null} />
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
