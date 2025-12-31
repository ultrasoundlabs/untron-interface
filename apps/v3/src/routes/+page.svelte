<script lang="ts">
	import { connection } from '$lib/wagmi/connectionStore';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Alert from '$lib/components/ui/alert';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import { getOwnedLeases, type ProtocolResponse, getProtocol } from '$lib/untron/api';
	import type { SqlRow } from '$lib/untron/types';
	import LeaseCard from '$lib/components/leases/LeaseCard.svelte';
	import NewLeaseDialog from '$lib/components/leases/NewLeaseDialog.svelte';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';

	let protocol = $state<ProtocolResponse | null>(null);
	let leases = $state<SqlRow[] | null>(null);
	let errorMessage = $state<string | null>(null);
	let loading = $state(false);
	let newLeaseOpen = $state(false);

	async function refresh() {
		if (!$connection.isConnected || !$connection.address) {
			leases = [];
			return;
		}

		try {
			loading = true;
			errorMessage = null;
			protocol ??= await getProtocol();
			leases = await getOwnedLeases($connection.address as `0x${string}`);
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : String(err);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if ($connection.isConnected && $connection.address) {
			void refresh();
		} else {
			leases = null;
		}
	});
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="space-y-1">
			<h2 class="flex items-center gap-2 text-xl font-semibold tracking-tight">
				<KeyRoundIcon class="text-muted-foreground" />
				Leases
			</h2>
			<p class="text-sm text-muted-foreground">
				Tron deposit address leases where the connected wallet is the lessee.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" onclick={refresh} disabled={loading}>
				<RefreshCwIcon />
				Refresh
			</Button>
			<Button onclick={() => (newLeaseOpen = true)} disabled={!$connection.isConnected}>
				<PlusIcon />
				New lease
			</Button>
		</div>
	</div>

	{#if errorMessage}
		<Alert.Root variant="destructive">
			<Alert.Title>Failed to load leases</Alert.Title>
			<Alert.Description>{errorMessage}</Alert.Description>
		</Alert.Root>
	{/if}

	{#if !$connection.isConnected}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Connect a wallet</Card.Title>
				<Card.Description>This view filters leases by `lessee`.</Card.Description>
			</Card.Header>
		</Card.Root>
	{:else if leases === null || loading}
		<div class="grid gap-4 lg:grid-cols-2">
			<Skeleton class="h-[248px]" />
			<Skeleton class="h-[248px]" />
		</div>
	{:else if leases.length === 0}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">No leases found</Card.Title>
				<Card.Description>
					Create a new lease or check `apps/backend` indexing status.
				</Card.Description>
			</Card.Header>
		</Card.Root>
	{:else}
		<div class="grid gap-4 lg:grid-cols-2">
			{#each leases as lease (lease.lease_id ?? JSON.stringify(lease))}
				<LeaseCard {lease} />
			{/each}
		</div>
	{/if}
</div>

<NewLeaseDialog bind:open={newLeaseOpen} lessee={$connection.address as `0x${string}` | null} />
