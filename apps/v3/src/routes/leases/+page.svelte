<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import * as Card from '@untron/ui/card';
	import { Button } from '@untron/ui/button';
	import { Input } from '@untron/ui/input';
	import * as Alert from '@untron/ui/alert';
	import { Skeleton } from '@untron/ui/skeleton';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import LeasesTable from '$lib/components/leases/LeasesTable.svelte';
	import NewLeaseDialog from '$lib/components/leases/NewLeaseDialog.svelte';
	import { getLeasesPage } from '$lib/untron/api';
	import type { SqlRow } from '$lib/untron/types';
	import { connection } from '$lib/wagmi/connectionStore';
	import { startPolling } from '$lib/polling';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	const PAGE_SIZE = 50;

	function parsePageIndexFromSearchParams(sp: URLSearchParams): number {
		const raw = sp.get('page');
		if (!raw) return 0;
		const n = Number(raw);
		if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return 0;
		return n - 1;
	}

	let rows = $state<SqlRow[] | null>(null);
	let total = $state<number | null>(null);
	let loading = $state(false); // initial load only
	let refreshing = $state(false);
	let refreshedPulse = $state(false);
	let errorMessage = $state<string | null>(null);
	let query = $state('');
	let newLeaseOpen = $state(false);
	let pageIndex = $state(parsePageIndexFromSearchParams($page.url.searchParams)); // 0-based

	$effect(() => {
		const next = parsePageIndexFromSearchParams($page.url.searchParams);
		if (next !== pageIndex) pageIndex = next;
	});

	async function refresh(mode: 'initial' | 'background' | 'manual' = 'manual') {
		try {
			if (mode === 'initial') loading = true;
			else refreshing = true;
			errorMessage = null;
			const { rows: nextRows, total: nextTotal } = await getLeasesPage(
				PAGE_SIZE,
				pageIndex * PAGE_SIZE
			);
			rows = nextRows;
			total = nextTotal;
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
			skipIf: () => loading || refreshing
		});
		return stop;
	});

	const filtered = $derived.by(() => {
		if (!rows) return [];
		const q = query.trim().toLowerCase();
		if (!q) return rows;
		return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
	});

	const totalPages = $derived.by(() => {
		if (total === null) return null;
		return Math.max(1, Math.ceil(total / PAGE_SIZE));
	});

	const pageStart = $derived.by(() => pageIndex * PAGE_SIZE + 1);
	const pageEnd = $derived.by(() => pageIndex * PAGE_SIZE + (rows?.length ?? 0));

	function getPaginationItems(current: number, pages: number): Array<number | '…'> {
		if (pages <= 7) return Array.from({ length: pages }, (_, i) => i);
		const items: Array<number | '…'> = [];

		const push = (v: number | '…') => {
			if (items[items.length - 1] === v) return;
			items.push(v);
		};

		push(0);

		const start = Math.max(1, current - 1);
		const end = Math.min(pages - 2, current + 1);

		if (start > 1) push('…');
		for (let i = start; i <= end; i++) push(i);
		if (end < pages - 2) push('…');

		push(pages - 1);
		return items;
	}

	function goToPage(nextIndex: number) {
		const pages = totalPages;
		const clamped =
			pages === null ? Math.max(0, nextIndex) : Math.min(Math.max(0, nextIndex), pages - 1);
		if (clamped === pageIndex) return;
		pageIndex = clamped;

		const sp = new SvelteURLSearchParams($page.url.searchParams);
		if (clamped === 0) sp.delete('page');
		else sp.set('page', String(clamped + 1));
		const search = sp.toString();
		void goto(`${$page.url.pathname}${search.length ? `?${search}` : ''}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});

		void refresh('manual');
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="space-y-1">
			<h2 class="text-xl font-semibold tracking-tight">All leases</h2>
			<p class="text-sm text-muted-foreground">
				Read-only list from the indexer (`GET /lease_view`).
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
					Showing {filtered.length}{rows ? ` / ${rows.length}` : ''}
					{#if total !== null}
						· total {total}
					{/if}
				</Card.Description>
			</div>
			<div class="w-full sm:max-w-sm">
				<Input placeholder="Filter (lease id, address, receiver…)" bind:value={query} />
			</div>
		</Card.Header>
		<Card.Content>
			{#if rows === null}
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
		<Card.Content class="pt-0">
			{#if rows !== null}
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div class="text-sm text-muted-foreground">
						Showing {rows.length === 0 ? 0 : pageStart}–{pageEnd}
						{#if total !== null}
							of {total}
						{/if}
					</div>

					<div class="flex flex-wrap items-center justify-end gap-1.5">
						<Button
							variant="outline"
							size="sm"
							onclick={() => goToPage(0)}
							disabled={pageIndex === 0}
						>
							First
						</Button>
						<Button
							variant="outline"
							size="sm"
							onclick={() => goToPage(pageIndex - 1)}
							disabled={pageIndex === 0}
						>
							Prev
						</Button>

						{#if totalPages !== null}
							{@const items = getPaginationItems(pageIndex, totalPages)}
							{#each items as it (String(it))}
								{#if it === '…'}
									<span class="px-2 text-sm text-muted-foreground">…</span>
								{:else}
									<Button
										variant={it === pageIndex ? 'secondary' : 'outline'}
										size="sm"
										onclick={() => goToPage(it)}
									>
										{it + 1}
									</Button>
								{/if}
							{/each}
						{:else}
							<span class="px-2 text-sm text-muted-foreground">Page {pageIndex + 1}</span>
						{/if}

						<Button
							variant="outline"
							size="sm"
							onclick={() => goToPage(pageIndex + 1)}
							disabled={totalPages !== null
								? pageIndex >= totalPages - 1
								: (rows?.length ?? 0) < PAGE_SIZE}
						>
							Next
						</Button>
						<Button
							variant="outline"
							size="sm"
							onclick={() => (totalPages !== null ? goToPage(totalPages - 1) : undefined)}
							disabled={totalPages === null || pageIndex >= totalPages - 1}
						>
							Last
						</Button>
					</div>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<NewLeaseDialog bind:open={newLeaseOpen} lessee={$connection.address as `0x${string}` | null} />
