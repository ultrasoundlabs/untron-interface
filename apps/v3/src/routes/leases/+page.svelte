<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Alert from '$lib/components/ui/alert';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import LeasesTable from '$lib/components/leases/LeasesTable.svelte';
	import NewLeaseDialog from '$lib/components/leases/NewLeaseDialog.svelte';
	import { getAllLeases } from '$lib/untron/api';
	import type { SqlRow } from '$lib/untron/types';
	import { connection } from '$lib/wagmi/connectionStore';

	let rows = $state<SqlRow[] | null>(null);
	let loading = $state(false);
	let errorMessage = $state<string | null>(null);
	let query = $state('');
	let newLeaseOpen = $state(false);

	async function refresh() {
		try {
			loading = true;
			errorMessage = null;
			rows = await getAllLeases(200, 0);
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : String(err);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void refresh();
	});

	const filtered = $derived.by(() => {
		if (!rows) return [];
		const q = query.trim().toLowerCase();
		if (!q) return rows;
		return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
	});
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="space-y-1">
			<h2 class="text-xl font-semibold tracking-tight">All leases</h2>
			<p class="text-sm text-muted-foreground">
				Read-only list from `untron_v3_lease_full` via Ponder SQL.
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

	<Card.Root>
		<Card.Header class="gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="space-y-1">
				<Card.Title class="text-base">Leases</Card.Title>
				<Card.Description>
					Showing {filtered.length}{rows ? ` / ${rows.length}` : ''}.
				</Card.Description>
			</div>
			<div class="w-full sm:max-w-sm">
				<Input placeholder="Filter (lease id, address, receiver…)" bind:value={query} />
			</div>
		</Card.Header>
		<Card.Content>
			{#if rows === null || loading}
				<div class="space-y-2">
					<Skeleton class="h-10" />
					<Skeleton class="h-10" />
					<Skeleton class="h-10" />
				</div>
			{:else if filtered.length === 0}
				<div class="text-sm text-muted-foreground">No matching leases.</div>
			{:else}
				<LeasesTable rows={filtered} />
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<NewLeaseDialog bind:open={newLeaseOpen} lessee={$connection.address as `0x${string}` | null} />
