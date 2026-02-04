<script lang="ts">
	import { connection } from '$lib/wagmi/connectionStore';
	import * as Card from '@untron/ui/card';
	import { Button } from '@untron/ui/button';
	import * as Alert from '@untron/ui/alert';
	import { Skeleton } from '@untron/ui/skeleton';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import { getOwnedLeases } from '$lib/untron/api';
	import type { SqlRow } from '$lib/untron/types';
	import LeaseCard from '$lib/components/leases/LeaseCard.svelte';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import { startPolling } from '$lib/polling';
	import ProtocolStats from '$lib/components/dashboard/ProtocolStats.svelte';

	let leases = $state<SqlRow[] | null>(null);
	let errorMessage = $state<string | null>(null);
	let loading = $state(false); // initial load only
	let refreshing = $state(false);
	let refreshedPulse = $state(false);

	async function refresh(mode: 'initial' | 'background' | 'manual' = 'manual') {
		if (!$connection.isConnected || !$connection.address) {
			leases = [];
			return;
		}

		try {
			if (mode === 'initial') loading = true;
			else refreshing = true;
			errorMessage = null;
			leases = await getOwnedLeases($connection.address as `0x${string}`);
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
		if (!$connection.isConnected || !$connection.address) {
			leases = null;
			return;
		}
		const stop = startPolling(() => refresh('background'), 3000, {
			immediate: true,
			skipIf: () => loading || refreshing || !$connection.isConnected || !$connection.address
		});
		return stop;
	});
</script>

<div class="space-y-6">
	<ProtocolStats />

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
	{:else if leases === null}
		<div class="grid gap-4 lg:grid-cols-2">
			<Skeleton class="h-[248px]" />
			<Skeleton class="h-[248px]" />
		</div>
	{:else if leases.length === 0}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">No leases found</Card.Title>
				<Card.Description>Check `apps/backend` indexing status.</Card.Description>
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
