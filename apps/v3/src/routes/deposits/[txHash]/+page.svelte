<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import * as Alert from '@untron/ui/alert';
	import { Button } from '@untron/ui/button';
	import * as Card from '@untron/ui/card';
	import { Skeleton } from '@untron/ui/skeleton';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import * as Table from '@untron/ui/table';
	import CopyableValue from '$lib/components/common/CopyableValue.svelte';
	import { getDepositsByTxHash, type UsdtDepositTx } from '$lib/untron/api';
	import { startPolling } from '$lib/polling';
	import {
		formatHexShort,
		formatUnixSecondsLocalMinute,
		formatUnixSecondsRelativeDetailed,
		formatUsdtAtomic6,
		parseUnixSeconds
	} from '$lib/untron/format';

	let rows = $state<UsdtDepositTx[] | null>(null);
	let loading = $state(false); // initial load only
	let refreshing = $state(false);
	let refreshedPulse = $state(false);
	let errorMessage = $state<string | null>(null);

	const txHash = $derived($page.params.txHash ?? '');

	function formatRelative(ts: unknown): string | null {
		const n = parseUnixSeconds(ts);
		if (n === null) return null;
		return formatUnixSecondsRelativeDetailed(n);
	}

	function depositHref(row: UsdtDepositTx): string | null {
		if (typeof row.tx_hash !== 'string' || !row.tx_hash.trim()) return null;
		if (typeof row.log_index !== 'number' || !Number.isFinite(row.log_index)) return null;
		return `/deposits/${encodeURIComponent(row.tx_hash)}/${String(row.log_index)}`;
	}

	async function refresh(mode: 'initial' | 'background' | 'manual' = 'manual') {
		if (!txHash) return;
		try {
			if (mode === 'initial') loading = true;
			else refreshing = true;
			errorMessage = null;

			const next = await getDepositsByTxHash(txHash, 25);
			rows = next;

			if (mode !== 'background' && next.length === 1) {
				const href = depositHref(next[0] ?? null);
				if (href) {
					void goto(href, { replaceState: true, keepFocus: true, noScroll: true });
					return;
				}
			}

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
			skipIf: () => loading || refreshing || !txHash
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
			<h2 class="text-xl font-semibold tracking-tight">Deposit tx</h2>
			<p class="text-sm text-muted-foreground">
				<CopyableValue
					value={txHash}
					display={formatHexShort(txHash, 18, 14)}
					copyValue={txHash}
					label="Copy tx hash"
					class="font-sans tabular-nums"
				/>
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				onclick={() => refresh('manual')}
				disabled={loading || refreshing || !txHash}
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

	{#if loading && rows === null}
		<div class="space-y-4">
			<Skeleton class="h-[220px]" />
		</div>
	{:else if (rows?.length ?? 0) === 0}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">No deposit logs found for this tx</Card.Title>
				<Card.Description>
					This tx hash may not correspond to a tracked receiver deposit, or the indexer may be behind.
				</Card.Description>
			</Card.Header>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Select a log</Card.Title>
				<Card.Description>
					Some transactions can emit multiple transfer logs. Pick the one you want.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<Table.Root class="[&_td]:px-2 [&_th]:px-2">
					<Table.Header>
						<Table.Row>
							<Table.Head>Log</Table.Head>
							<Table.Head>Amount</Table.Head>
							<Table.Head>When</Table.Head>
							<Table.Head class="text-right">Action</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each rows ?? [] as row (String(row.log_index ?? JSON.stringify(row)))}
							<Table.Row>
								<Table.Cell class="font-sans tabular-nums">
									{typeof row.log_index === 'number' ? String(row.log_index) : '—'}
								</Table.Cell>
								<Table.Cell class="font-sans tabular-nums">
									{formatUsdtAtomic6(row.amount) ?? '—'} USDT
								</Table.Cell>
								<Table.Cell class="whitespace-nowrap">
									{@const rel = formatRelative(row.block_timestamp ?? row.block_time ?? row.inserted_at)}
									<div class="text-sm font-medium">{rel ?? '—'}</div>
									<div class="font-sans text-xs text-muted-foreground">
										{formatUnixSecondsLocalMinute(
											row.block_timestamp ?? row.block_time ?? row.inserted_at
										) ?? '—'}
									</div>
								</Table.Cell>
								<Table.Cell class="text-right">
									<Button
										variant="ghost"
										size="sm"
										href={depositHref(row) ?? undefined}
										disabled={!depositHref(row)}
									>
										Open
									</Button>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	{/if}
</div>

