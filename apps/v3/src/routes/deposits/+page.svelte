<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import * as Alert from '@untron/ui/alert';
	import { Button } from '@untron/ui/button';
	import * as Card from '@untron/ui/card';
	import { Input } from '@untron/ui/input';
	import { Skeleton } from '@untron/ui/skeleton';
	import * as Select from '@untron/ui/select';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import DepositsTable from '$lib/components/deposits/DepositsTable.svelte';
	import {
		getDepositsPage,
		getUsdtDepositsDaily,
		type UsdtDepositTx,
		type UsdtDepositsDaily
	} from '$lib/untron/api';
	import { startPolling } from '$lib/polling';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	const PAGE_SIZE = 50;

	type Stage = 'all' | 'ready' | 'proved' | 'finalizing' | 'filled';
	const STAGE_OPTIONS: Array<{ value: Stage; label: string; hint?: string }> = [
		{ value: 'all', label: 'All deposits' },
		{
			value: 'ready',
			label: 'Ready to pre-fill',
			hint: 'Pre-entitle is still allowed'
		},
		{
			value: 'proved',
			label: 'Proved (accounted / pulled)',
			hint: 'Already accounted on hub or receiver was pulled'
		},
		{
			value: 'finalizing',
			label: 'Finalizing',
			hint: 'Subjective pre-entitle claim created'
		},
		{ value: 'filled', label: 'Filled', hint: 'Claim filled' }
	];

	function parsePageIndexFromSearchParams(sp: URLSearchParams): number {
		const raw = sp.get('page');
		if (!raw) return 0;
		const n = Number(raw);
		if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return 0;
		return n - 1;
	}

	function parseStageFromSearchParams(sp: URLSearchParams): Stage {
		const raw = sp.get('stage');
		if (
			raw === 'all' ||
			raw === 'ready' ||
			raw === 'proved' ||
			raw === 'finalizing' ||
			raw === 'filled'
		)
			return raw;

		// Back-compat: old `action=` param (recommended_action values).
		const legacy = sp.get('action');
		if (legacy === 'pre_entitle') return 'ready';
		if (legacy === 'already_accounted' || legacy === 'pull') return 'proved';
		return 'all';
	}

	function parseUsdtAtomic6(value: unknown): bigint | null {
		if (typeof value === 'bigint') return value;
		if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value))
			return BigInt(value);
		if (typeof value !== 'string') return null;

		const s = value.trim();
		if (!s.length) return null;

		// Atomic integer string.
		if (/^-?\d+$/.test(s)) {
			try {
				return BigInt(s);
			} catch {
				return null;
			}
		}

		// Decimal string (USDT 6 decimals).
		if (!/^-?\d+(?:\.\d+)?$/.test(s)) return null;
		const negative = s.startsWith('-');
		const unsigned = negative ? s.slice(1) : s;
		const [wholeRaw, fracRaw = ''] = unsigned.split('.');
		const whole = wholeRaw.length ? wholeRaw : '0';
		const frac = fracRaw.slice(0, 6).padEnd(6, '0'); // truncate extra precision
		try {
			const atomic = BigInt(whole) * 1_000_000n + BigInt(frac || '0');
			return negative ? -atomic : atomic;
		} catch {
			return null;
		}
	}

	function formatUsdtSumFixed2(value: bigint | null): string {
		if (value === null) return '—';
		const negative = value < 0n;
		const abs = negative ? -value : value;
		// Round atomic-6 to 2 decimals.
		const cents = (abs + 5_000n) / 10_000n; // 1e6 -> 1e2
		const whole = cents / 100n;
		const frac2 = (cents % 100n).toString(10).padStart(2, '0');
		return `${negative ? '-' : ''}${whole.toString(10)}.${frac2}`;
	}

	function formatUsdtFromDaily(value: unknown): string {
		const atomic = parseUsdtAtomic6(value);
		return atomic === null ? '—' : formatUsdtSumFixed2(atomic);
	}

	let rows = $state<UsdtDepositTx[] | null>(null);
	let total = $state<number | null>(null);
	let daily = $state<UsdtDepositsDaily[] | null>(null);
	let loading = $state(false); // initial load only
	let refreshing = $state(false);
	let refreshedPulse = $state(false);
	let errorMessage = $state<string | null>(null);

	let query = $state('');
	let pageIndex = $state(parsePageIndexFromSearchParams($page.url.searchParams)); // 0-based
	let stage = $state<Stage>(parseStageFromSearchParams($page.url.searchParams));
	let initialized = $state(false);

	$effect(() => {
		const sp = $page.url.searchParams;
		const nextPage = parsePageIndexFromSearchParams(sp);
		const nextStage = parseStageFromSearchParams(sp);
		if (nextPage !== pageIndex) pageIndex = nextPage;
		if (nextStage !== stage) stage = nextStage;
	});

	function syncUrl(next: { pageIndex?: number; stage?: Stage }) {
		const sp = new SvelteURLSearchParams($page.url.searchParams);
		const nextPageIndex = next.pageIndex ?? pageIndex;
		const nextStage = next.stage ?? stage;

		if (nextPageIndex === 0) sp.delete('page');
		else sp.set('page', String(nextPageIndex + 1));

		if (nextStage === 'all') sp.delete('stage');
		else sp.set('stage', nextStage);

		// Kill legacy param if present.
		sp.delete('action');

		const search = sp.toString();
		void goto(`${$page.url.pathname}${search.length ? `?${search}` : ''}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	async function refresh(mode: 'initial' | 'background' | 'manual' = 'manual') {
		try {
			if (mode === 'initial') loading = true;
			else refreshing = true;

			errorMessage = null;
			const stageFilter = stage;
			const stageArgs =
				stageFilter === 'ready'
					? { recommendedAction: 'pre_entitle' as const }
					: stageFilter === 'proved'
						? { recommendedActions: ['already_accounted', 'pull'] }
						: stageFilter === 'finalizing'
							? { claimStatus: 'created' as const, claimOrigin: 1 as const }
							: stageFilter === 'filled'
								? { claimStatus: 'filled' as const }
								: {};
			const { rows: nextRows, total: nextTotal } = await getDepositsPage({
				limit: PAGE_SIZE,
				offset: pageIndex * PAGE_SIZE,
				...stageArgs
			});
			rows = nextRows;
			total = nextTotal;

			if (mode !== 'background') {
				daily = await getUsdtDepositsDaily(30);
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
		if (initialized) return;
		initialized = true;
		void refresh('initial');
	});

	$effect(() => {
		const stop = startPolling(() => refresh('background'), 4000, {
			immediate: false,
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
		syncUrl({ pageIndex: clamped });
		void refresh('manual');
	}

	function setStage(next: Stage) {
		stage = next;
		pageIndex = 0;
		syncUrl({ stage: next, pageIndex: 0 });
		void refresh('manual');
	}

	function getUtcDayKeyFromBucket(day: unknown): string | null {
		if (typeof day !== 'string' || !day.trim()) return null;
		const d = new Date(day);
		if (Number.isNaN(d.valueOf())) return null;
		return d.toISOString().slice(0, 10);
	}

	const utcTodayKey = $derived.by(() => new Date().toISOString().slice(0, 10));
	const latestDaily = $derived.by(() => (daily && daily.length ? daily[0] : null));

	const dailyByKey = $derived.by(() => {
		const map = new Map<string, UsdtDepositsDaily>();
		if (!daily) return map;
		for (const r of daily) {
			const key = getUtcDayKeyFromBucket(r.day);
			if (key) map.set(key, r);
		}
		return map;
	});

	const todayDaily = $derived.by(() => dailyByKey.get(utcTodayKey) ?? null);

	const last7Keys = $derived.by(() => {
		const base = Date.parse(`${utcTodayKey}T00:00:00.000Z`);
		const keys: string[] = [];
		for (let i = 0; i < 7; i++) {
			keys.push(new Date(base - i * 86_400_000).toISOString().slice(0, 10));
		}
		return keys;
	});
	const last7Daily = $derived.by(() => last7Keys.map((k) => dailyByKey.get(k) ?? null));

	const todayDepositsTotal = $derived.by(() => {
		if (daily === null) return null;
		const raw = todayDaily?.deposits_total ?? 0;
		const n = typeof raw === 'number' ? raw : Number(String(raw ?? '0'));
		return Number.isFinite(n) ? n : 0;
	});
	const todayAmountAtomic = $derived.by(() => {
		if (daily === null) return null;
		if (!todayDaily) return 0n;
		return parseUsdtAtomic6(todayDaily.amount_total) ?? 0n;
	});

	const last7DepositsTotal = $derived.by(() => {
		let sum = 0;
		for (const r of last7Daily) {
			if (!r) continue;
			const raw = r.deposits_total;
			const n = typeof raw === 'number' ? raw : Number(String(raw ?? '0'));
			sum += Number.isFinite(n) ? n : 0;
		}
		return sum;
	});
	const last7AmountTotal = $derived.by(() => {
		let sum = 0n;
		for (const r of last7Daily) {
			if (!r) continue;
			const v = parseUsdtAtomic6(r.amount_total);
			if (v !== null) sum += v;
		}
		return sum;
	});

	function formatDayBucketUtc(day: unknown): string {
		if (typeof day !== 'string' || !day.trim()) return '—';
		const d = new Date(day);
		if (Number.isNaN(d.valueOf())) return day;
		return d.toLocaleDateString(undefined, {
			timeZone: 'UTC',
			year: 'numeric',
			month: 'short',
			day: '2-digit'
		});
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="space-y-1">
			<h2 class="text-xl font-semibold tracking-tight">All deposits</h2>
			<p class="text-sm text-muted-foreground">
				Recent USDT deposits across the network, linked to leases and claim activity when possible.
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
			<Alert.Title>Failed to load deposits</Alert.Title>
			<Alert.Description>{errorMessage}</Alert.Description>
		</Alert.Root>
	{/if}

	<div class="grid gap-4 lg:grid-cols-3">
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Today</Card.Title>
				<Card.Description>
					{formatDayBucketUtc(utcTodayKey)} (UTC)
					{#if latestDaily && getUtcDayKeyFromBucket(latestDaily.day) !== utcTodayKey}
						· Latest: {formatDayBucketUtc(latestDaily.day)}
					{/if}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if daily === null}
					<Skeleton class="h-10" />
				{:else}
					<div class="space-y-1">
						<div class="font-sans text-lg">{todayDepositsTotal ?? '—'}</div>
						<div class="text-sm text-muted-foreground">
							{formatUsdtSumFixed2(todayAmountAtomic)} USDT
						</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Last 7 days</Card.Title>
				<Card.Description>Rollup of canonical deposits</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if daily === null}
					<Skeleton class="h-10" />
				{:else}
					<div class="space-y-1">
						<div class="font-sans text-lg">{last7DepositsTotal}</div>
						<div class="text-sm text-muted-foreground">
							{formatUsdtSumFixed2(last7AmountTotal)} USDT
						</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">This page</Card.Title>
				<Card.Description>Counts from the current fetch</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if rows === null}
					<Skeleton class="h-10" />
				{:else}
					<div class="space-y-1">
						<div class="font-sans text-lg">{rows.length}</div>
						<div class="text-sm text-muted-foreground">
							{#if total !== null}
								total {total}
							{:else}
								total —
							{/if}
						</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<Card.Root>
		<Card.Header class="gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="space-y-1">
				<Card.Title class="text-base">Deposits</Card.Title>
				<Card.Description>
					Showing {filtered.length}{rows ? ` / ${rows.length}` : ''}
					{#if total !== null}
						· total {total}
					{/if}
				</Card.Description>
			</div>

			<div
				class="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row sm:items-center sm:justify-end"
			>
				<div class="w-full sm:max-w-xs">
					<Input placeholder="Filter (tx, sender, receiver, lease…)" bind:value={query} />
				</div>

				<Select.Root type="single" value={stage} onValueChange={(v) => setStage(v as Stage)}>
					<Select.Trigger class="w-full sm:w-[220px]" aria-label="Stage filter">
						<span data-slot="select-value">
							{STAGE_OPTIONS.find((o) => o.value === stage)?.label ?? 'All deposits'}
						</span>
					</Select.Trigger>
					<Select.Content>
						{#each STAGE_OPTIONS as opt (opt.value)}
							<Select.Item value={opt.value} label={opt.label}>
								<div class="space-y-0.5">
									<div>{opt.label}</div>
									{#if opt.hint}
										<div class="text-xs text-muted-foreground">{opt.hint}</div>
									{/if}
								</div>
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
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
				<div class="text-sm text-muted-foreground">No matching deposits.</div>
			{:else}
				<DepositsTable rows={filtered} />
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
