<script lang="ts">
	import * as Card from '@untron/ui/card';
	import { Button } from '@untron/ui/button';
	import * as Alert from '@untron/ui/alert';
	import { Skeleton } from '@untron/ui/skeleton';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import UsersIcon from '@lucide/svelte/icons/users';
	import * as Chart from '@untron/ui/chart';
	import { startPolling } from '$lib/polling';
	import { getUsdtDepositsDaily, type UsdtDepositsDaily } from '$lib/untron/api';
	import { BarChart, LineChart } from 'layerchart';

	type Point = {
		day: string;
		depositsTotal: number;
		amountTotalAtomic: bigint;
		uniqueSenders: number;
		uniqueReceivers: number;
		leasesTouched: number;
	};

	let points = $state<Point[] | null>(null);
	let errorMessage = $state<string | null>(null);
	let loading = $state(false); // initial load only
	let refreshing = $state(false);
	let refreshedPulse = $state(false);
	let lastUpdatedAt = $state<number | null>(null);

	function parseBigIntish(value: unknown): bigint {
		if (typeof value === 'bigint') return value;
		if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value))
			return BigInt(value);
		if (typeof value !== 'string') return 0n;
		const s = value.trim();
		if (!/^-?\d+$/.test(s)) return 0n;
		try {
			return BigInt(s);
		} catch {
			return 0n;
		}
	}

	function toNumberSafe(value: unknown): number {
		if (typeof value === 'number' && Number.isFinite(value)) return value;
		if (typeof value === 'bigint') return Number(value);
		if (typeof value === 'string' && value.trim().length) {
			const n = Number(value);
			return Number.isFinite(n) ? n : 0;
		}
		return 0;
	}

	function normalizeDailyRow(row: UsdtDepositsDaily): Point | null {
		const day = typeof row.day === 'string' ? row.day : null;
		if (!day) return null;
		return {
			day,
			depositsTotal: toNumberSafe(row.deposits_total),
			amountTotalAtomic: parseBigIntish(row.amount_total),
			uniqueSenders: toNumberSafe(row.unique_senders),
			uniqueReceivers: toNumberSafe(row.unique_receivers),
			leasesTouched: toNumberSafe(row.leases_touched)
		};
	}

	function sliceLast<T>(arr: T[], n: number): T[] {
		if (n <= 0) return [];
		return arr.slice(Math.max(0, arr.length - n));
	}

	function sumBigInt(values: bigint[]): bigint {
		let acc = 0n;
		for (const v of values) acc += v;
		return acc;
	}

	function sumNumber(values: number[]): number {
		let acc = 0;
		for (const v of values) acc += v;
		return acc;
	}

	function formatDayShort(day: string): string {
		try {
			const d = new Date(day);
			if (Number.isNaN(d.getTime())) return day;
			return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
		} catch {
			return day;
		}
	}

	function formatUsdtAtomic6Fixed2(atomic: bigint): string {
		const negative = atomic < 0n;
		const abs = negative ? -atomic : atomic;

		// Round atomic (1e6) to cents (1e2): divide by 1e4 with half-up rounding.
		const cents = (abs + 5_000n) / 10_000n;
		const whole = cents / 100n;
		const frac2 = (cents % 100n).toString(10).padStart(2, '0');
		const s = `${whole.toString(10)}.${frac2}`;
		return negative ? `-${s}` : s;
	}

	function usdtFromAtomic6ToNumber2(atomic: bigint): number {
		const negative = atomic < 0n;
		const abs = negative ? -atomic : atomic;

		const cents = (abs + 5_000n) / 10_000n;
		if (cents > BigInt(Number.MAX_SAFE_INTEGER))
			return negative ? -Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;

		const n = Number(cents) / 100;
		return negative ? -n : n;
	}

	async function refresh(mode: 'initial' | 'background' | 'manual' = 'manual') {
		try {
			if (mode === 'initial') loading = true;
			else refreshing = true;
			errorMessage = null;

			const rows = await getUsdtDepositsDaily(30);
			const normalized = rows
				.map(normalizeDailyRow)
				.filter((p): p is Point => p !== null)
				.slice()
				.reverse(); // oldest -> newest

			points = normalized;

			lastUpdatedAt = Date.now();

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
		const stop = startPolling(() => refresh('background'), 15000, {
			immediate: true,
			skipIf: () => loading || refreshing
		});
		return stop;
	});

	const last = () => (points && points.length ? points[points.length - 1] : null);
	const last7 = () => (points ? sliceLast(points, 7) : []);
	const last30 = () => (points ? sliceLast(points, 30) : []);

	const last7VolumeAtomic = () => sumBigInt(last7().map((p) => p.amountTotalAtomic));
	const last7Deposits = () => sumNumber(last7().map((p) => p.depositsTotal));
	const last7UniqueSenders = () => sumNumber(last7().map((p) => p.uniqueSenders));

	type DailyChartRow = { day: string; deposits: number; volumeUsdt: number };
	const dailyChartData = (): DailyChartRow[] =>
		last30().map((p) => ({
			day: formatDayShort(p.day),
			deposits: p.depositsTotal,
			volumeUsdt: usdtFromAtomic6ToNumber2(p.amountTotalAtomic)
		}));

	const chartConfig = {
		deposits: { label: 'Deposits', color: 'var(--chart-2)' },
		volumeUsdt: { label: 'Volume (USDT)', color: 'var(--chart-3)' }
	} satisfies Chart.ChartConfig;
</script>

<div class="space-y-4">
	<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-1">
			<h2 class="text-xl font-semibold tracking-tight">Protocol pulse</h2>
			<p class="text-sm text-muted-foreground">Live-ish rollups from V3 API deposit telemetry.</p>
		</div>
		<div class="flex items-center gap-2">
			{#if lastUpdatedAt}
				<div class="text-xs text-muted-foreground">
					Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
				</div>
			{/if}
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
			<Alert.Title>Failed to load protocol stats</Alert.Title>
			<Alert.Description>{errorMessage}</Alert.Description>
		</Alert.Root>
	{/if}

	{#if points === null}
		<div class="grid gap-4 lg:grid-cols-3">
			<Skeleton class="h-[108px]" />
			<Skeleton class="h-[108px]" />
			<Skeleton class="h-[108px]" />
		</div>
		<div class="grid gap-4 lg:grid-cols-2">
			<Skeleton class="h-[220px]" />
			<Skeleton class="h-[220px]" />
		</div>
	{:else}
		<div class="grid gap-4 lg:grid-cols-3">
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2 text-base">
						<TrendingUpIcon class="text-muted-foreground" />
						7d volume
					</Card.Title>
					<Card.Description>Total USDT deposited (last 7 days).</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-1">
					<div class="text-2xl font-semibold tabular-nums">
						{formatUsdtAtomic6Fixed2(last7VolumeAtomic())} USDT
					</div>
					<div class="text-xs text-muted-foreground">
						{last() ? `Latest day: ${formatDayShort(last()!.day)}` : '—'}
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2 text-base">
						<ActivityIcon class="text-muted-foreground" />
						7d deposits
					</Card.Title>
					<Card.Description>Count of canonical deposit logs (last 7 days).</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-1">
					<div class="text-2xl font-semibold tabular-nums">{last7Deposits()}</div>
					<div class="text-xs text-muted-foreground">
						{last() ? `Today: ${toNumberSafe(last()!.depositsTotal)}` : '—'}
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2 text-base">
						<UsersIcon class="text-muted-foreground" />
						7d unique senders
					</Card.Title>
					<Card.Description>Best-effort count of unique deposit senders.</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-1">
					<div class="text-2xl font-semibold tabular-nums">{last7UniqueSenders()}</div>
					<div class="text-xs text-muted-foreground">
						{last()
							? `Receivers: ${toNumberSafe(last()!.uniqueReceivers)} · Leases: ${toNumberSafe(last()!.leasesTouched)}`
							: '—'}
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="grid gap-4 lg:grid-cols-2">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">Daily deposits (30d)</Card.Title>
					<Card.Description>Canonical deposit logs per day.</Card.Description>
				</Card.Header>
				<Card.Content>
					{@const data = dailyChartData()}
					{#if data.length === 0}
						<div class="text-sm text-muted-foreground">No data.</div>
					{:else}
						<Chart.Container config={chartConfig} class="aspect-[3/1] min-h-[180px] w-full">
							<BarChart
								{data}
								x="day"
								axis="x"
								series={[
									{
										key: 'deposits',
										label: chartConfig.deposits.label,
										color: 'var(--color-deposits)'
									}
								]}
								props={{
									xAxis: {
										format: (d) => String(d).slice(0, 6)
									}
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip />
								{/snippet}
							</BarChart>
						</Chart.Container>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">Daily volume (30d)</Card.Title>
					<Card.Description>Total USDT deposited per day.</Card.Description>
				</Card.Header>
				<Card.Content>
					{@const data = dailyChartData()}
					{#if data.length === 0}
						<div class="text-sm text-muted-foreground">No data.</div>
					{:else}
						<Chart.Container config={chartConfig} class="aspect-[3/1] min-h-[180px] w-full">
							<LineChart
								{data}
								x="day"
								axis="x"
								series={[
									{
										key: 'volumeUsdt',
										label: chartConfig.volumeUsdt.label,
										color: 'var(--color-volumeUsdt)'
									}
								]}
								props={{
									xAxis: {
										format: (d) => String(d).slice(0, 6)
									},
									yAxis: {
										format: (v) =>
											Number(v).toLocaleString(undefined, {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2
											})
									}
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip />
								{/snippet}
							</LineChart>
						</Chart.Container>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	{/if}
</div>
