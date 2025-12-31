<script lang="ts">
	import { page } from '$app/stores';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Alert from '$lib/components/ui/alert';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import Settings2Icon from '@lucide/svelte/icons/settings-2';
	import LeaseCard from '$lib/components/leases/LeaseCard.svelte';
	import ClaimsTable from '$lib/components/leases/ClaimsTable.svelte';
	import LeaseDetailsPanel from '$lib/components/leases/LeaseDetailsPanel.svelte';
	import { connection } from '$lib/wagmi/connectionStore';
	import { getClaimsByLeaseId, getLeaseById } from '$lib/untron/api';
	import type { SqlRow } from '$lib/untron/types';
	import { getLessee } from '$lib/untron/format';
	import UpdatePayoutConfigDialog from '$lib/components/leases/UpdatePayoutConfigDialog.svelte';

	let lease = $state<SqlRow | null>(null);
	let claims = $state<SqlRow[] | null>(null);
	let loading = $state(false);
	let errorMessage = $state<string | null>(null);
	let updateOpen = $state(false);

	const leaseId = $derived($page.params.leaseId ?? '');

	async function refresh() {
		if (!leaseId) return;
		try {
			loading = true;
			errorMessage = null;
			lease = await getLeaseById(leaseId);
			claims = await getClaimsByLeaseId(leaseId);
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : String(err);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void refresh();
	});

	const canUpdatePayoutConfig = $derived.by(() => {
		if (!lease) return false;
		if (!$connection.isConnected || !$connection.address) return false;
		const lessee = getLessee(lease);
		if (!lessee) return false;
		return lessee.toLowerCase() === $connection.address.toLowerCase();
	});
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="space-y-1">
			<h2 class="text-xl font-semibold tracking-tight">Lease {leaseId}</h2>
			<p class="text-sm text-muted-foreground">Details and claims.</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" onclick={refresh} disabled={loading}>
				<RefreshCwIcon />
				Refresh
			</Button>
			{#if canUpdatePayoutConfig}
				<Button variant="outline" onclick={() => (updateOpen = true)}>
					<Settings2Icon />
					Update payout config
				</Button>
			{/if}
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
			{#if lease === null || loading}
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
				<Card.Description>From `untron_v3_claim_full`.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if claims === null || loading}
					<div class="space-y-2">
						<Skeleton class="h-10" />
						<Skeleton class="h-10" />
						<Skeleton class="h-10" />
					</div>
				{:else if claims.length === 0}
					<div class="text-sm text-muted-foreground">No claims for this lease.</div>
				{:else}
					<ClaimsTable rows={claims} />
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>

<UpdatePayoutConfigDialog
	bind:open={updateOpen}
	{leaseId}
	{lease}
	account={$connection.address as `0x${string}` | null}
	disabled={!canUpdatePayoutConfig}
	onUpdated={refresh}
/>
