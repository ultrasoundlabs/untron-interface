<script lang="ts">
	import { page } from '$app/stores';
	import * as Alert from '@untron/ui/alert';
	import { Button } from '@untron/ui/button';
	import * as Card from '@untron/ui/card';
	import { Skeleton } from '@untron/ui/skeleton';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import DepositDetails from '$lib/components/deposits/DepositDetails.svelte';
	import { getDepositById } from '$lib/untron/api';
	import { startPolling } from '$lib/polling';

	let deposit = $state<Awaited<ReturnType<typeof getDepositById>>>(null);
	let loading = $state(false); // initial load only
	let refreshing = $state(false);
	let refreshedPulse = $state(false);
	let errorMessage = $state<string | null>(null);

	const txHash = $derived($page.params.txHash ?? '');
	const logIndexRaw = $derived($page.params.logIndex ?? '');

	function parseLogIndex(value: string): number | null {
		const n = Number(value);
		if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
		return n;
	}

	const logIndex = $derived.by(() => parseLogIndex(logIndexRaw));

	async function refresh(mode: 'initial' | 'background' | 'manual' = 'manual') {
		if (!txHash || logIndex === null) return;
		try {
			if (mode === 'initial') loading = true;
			else refreshing = true;
			errorMessage = null;
			deposit = await getDepositById(txHash, logIndex);
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
		void refresh('initial');
	});

	$effect(() => {
		const stop = startPolling(() => refresh('background'), 5000, {
			immediate: false,
			skipIf: () => loading || refreshing || !txHash || logIndex === null
		});
		return stop;
	});
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<Button variant="ghost" size="sm" href="/deposits">
					<ArrowLeftIcon />
					Deposits
				</Button>
			</div>
			<h2 class="text-xl font-semibold tracking-tight">Deposit</h2>
			<p class="text-sm text-muted-foreground">
				{#if txHash && logIndex !== null}
					<span class="font-sans tabular-nums">{txHash}</span>
					<span class="opacity-70">·</span>
					<span class="font-sans tabular-nums">log {logIndex}</span>
				{:else}
					Invalid deposit id.
				{/if}
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				onclick={() => refresh('manual')}
				disabled={loading || refreshing || !txHash || logIndex === null}
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
			<Alert.Title>Failed to load deposit</Alert.Title>
			<Alert.Description>{errorMessage}</Alert.Description>
		</Alert.Root>
	{/if}

	{#if !txHash || logIndex === null}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Invalid deposit id</Card.Title>
				<Card.Description>Expected a tx hash and log index.</Card.Description>
			</Card.Header>
		</Card.Root>
	{:else if loading && deposit === null}
		<div class="space-y-4">
			<Skeleton class="h-[160px]" />
			<Skeleton class="h-[260px]" />
			<Skeleton class="h-[220px]" />
		</div>
	{:else if deposit}
		<DepositDetails {deposit} />
	{:else}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Deposit not found</Card.Title>
				<Card.Description>
					The indexer may be behind, or this tx/log index does not correspond to a tracked receiver
					deposit.
				</Card.Description>
			</Card.Header>
		</Card.Root>
	{/if}
</div>

