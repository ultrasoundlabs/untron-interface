<script lang="ts">
	import { slide, fade } from 'svelte/transition';
	import { m } from '$lib/paraglide/messages.js';
	import type { BridgeFeeComponent, BridgeQuote } from '$lib/types/swap';
	import { formatAtomicToDecimal, formatBps } from '$lib/math/amounts';

	interface Props {
		/** The quote to display */
		quote: BridgeQuote | null;
		/** Whether the quote is loading */
		isLoading?: boolean;
		/** Source token decimals */
		sourceDecimals: number;
		/** Destination token decimals */
		destDecimals: number;
		/** Source token symbol */
		sourceSymbol: string;
		/** Destination token symbol */
		destSymbol: string;
	}

	let {
		quote,
		isLoading = false,
		sourceDecimals,
		destDecimals,
		sourceSymbol,
		destSymbol
	}: Props = $props();

	let isExpanded = $state(false);

	function formatAmount(amount: string): string {
		return formatAtomicToDecimal(amount, destDecimals, {
			maxFractionDigits: 6,
			useGrouping: true
		});
	}

	function isFlatFee(
		fee: BridgeFeeComponent
	): fee is Extract<BridgeFeeComponent, { type: 'FlatFee' }> {
		return fee.type === 'FlatFee';
	}

	function estimateFeeAtomic(fee: BridgeFeeComponent): {
		amount: string;
		chargedIn: 'from' | 'to' | 'other';
	} {
		if (!quote) return { amount: '0', chargedIn: 'other' };

		if (isFlatFee(fee)) return { amount: fee.amount, chargedIn: 'other' };

		const base =
			fee.chargedIn === 'fromAsset'
				? BigInt(quote.fromAmount)
				: fee.chargedIn === 'toAsset'
					? BigInt(quote.estimatedToAmount)
					: 0n;

		const ppm = BigInt(fee.ppm);
		const amount = (base * ppm) / 1_000_000n;
		const chargedIn =
			fee.chargedIn === 'fromAsset' ? 'from' : fee.chargedIn === 'toAsset' ? 'to' : 'other';
		return { amount: amount.toString(), chargedIn };
	}

	function getFeeDenomination(fee: BridgeFeeComponent): {
		symbol: string;
		decimals: number;
		kind: 'from' | 'to' | 'unknown';
	} {
		if (!quote) return { symbol: '', decimals: 0, kind: 'unknown' };

		if (isFlatFee(fee)) {
			if (fee.assetId === quote.fromAssetId) {
				return { symbol: sourceSymbol, decimals: sourceDecimals, kind: 'from' };
			}
			if (fee.assetId === quote.toAssetId) {
				return { symbol: destSymbol, decimals: destDecimals, kind: 'to' };
			}
			return { symbol: '', decimals: 0, kind: 'unknown' };
		}

		if (fee.chargedIn === 'fromAsset')
			return { symbol: sourceSymbol, decimals: sourceDecimals, kind: 'from' };
		if (fee.chargedIn === 'toAsset')
			return { symbol: destSymbol, decimals: destDecimals, kind: 'to' };
		return { symbol: '', decimals: 0, kind: 'unknown' };
	}

	function formatFeeLine(fee: BridgeFeeComponent): { label: string; value: string } | null {
		if (!quote) return null;

		if (isFlatFee(fee)) {
			const denom = getFeeDenomination(fee);
			const value =
				denom.kind === 'unknown'
					? fee.amount
					: `${formatAtomicToDecimal(fee.amount, denom.decimals, {
							maxFractionDigits: 6,
							useGrouping: true,
							trimTrailingZeros: true
						})} ${denom.symbol}`;
			return { label: m.swap_fee_gas(), value };
		}

		// PPM -> bps: 100 ppm = 1 bps
		const bps = Math.round(fee.ppm / 100);
		const denom = getFeeDenomination(fee);
		const est = estimateFeeAtomic(fee);

		const amountText =
			denom.kind === 'unknown'
				? est.amount
				: `${formatAtomicToDecimal(est.amount, denom.decimals, {
						maxFractionDigits: 6,
						useGrouping: true,
						trimTrailingZeros: true
					})} ${denom.symbol}`;

		return { label: m.swap_fee_swap(), value: `${amountText} (${formatBps(bps)})` };
	}

	const effectiveRate = $derived.by(() => {
		if (!quote) return null;
		try {
			const from = Number(
				formatAtomicToDecimal(quote.fromAmount, sourceDecimals, { maxFractionDigits: 6 })
			);
			const to = Number(
				formatAtomicToDecimal(quote.estimatedToAmount, destDecimals, { maxFractionDigits: 6 })
			);
			if (!Number.isFinite(from) || !Number.isFinite(to) || from <= 0) return null;
			return (to / from).toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
		} catch {
			return null;
		}
	});
</script>

{#if quote || isLoading}
	<div class="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
		<!-- Header / Toggle -->
		<button
			type="button"
			onclick={() => (isExpanded = !isExpanded)}
			class="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
		>
			<span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
				{m.swap_details()}
			</span>

			<div class="flex items-center gap-2">
				{#if isLoading}
					<div class="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
				{:else if quote}
					<span class="text-sm text-zinc-500 dark:text-zinc-400">
						{#if effectiveRate}
							1 {sourceSymbol} ≈ {effectiveRate}
							{destSymbol}
						{:else}
							{m.swap_details()}
						{/if}
					</span>
				{/if}

				<svg
					class="h-4 w-4 text-zinc-400 transition-transform duration-200"
					class:rotate-180={isExpanded}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</div>
		</button>

		<!-- Expanded Details -->
		{#if isExpanded}
			<div
				class="border-t border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/30"
				transition:slide={{ duration: 200 }}
			>
				{#if isLoading}
					<div class="space-y-3">
						<div class="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
						<div class="h-4 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
						<div class="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
					</div>
				{:else if quote}
					<div class="space-y-2 text-sm" in:fade={{ duration: 150 }}>
						<!-- Expected Output -->
						<div class="flex items-center justify-between">
							<span class="text-zinc-500 dark:text-zinc-400">{m.swap_expected_output()}</span>
							<span class="font-medium text-zinc-900 dark:text-white">
								{formatAmount(quote.estimatedToAmount)}
								{destSymbol}
							</span>
						</div>

						<!-- Fees (best-effort preview) -->
						{#if quote.fees.length > 0}
							<div class="pt-2">
								<div
									class="mb-2 text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400"
								>
									{m.swap_fees_title()}
								</div>
								<div class="space-y-2">
									{#each quote.fees as fee (fee.type + JSON.stringify(fee))}
										{@const line = formatFeeLine(fee)}
										{#if line}
											<div class="flex items-center justify-between">
												<span class="text-zinc-500 dark:text-zinc-400">{line.label}</span>
												<span class="text-zinc-700 dark:text-zinc-300">{line.value}</span>
											</div>
										{/if}
									{/each}
								</div>
							</div>
						{/if}

						<!-- Hint (if any) -->
						{#if false}
							<div
								class="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20"
								in:fade={{ duration: 150 }}
							>
								<svg
									class="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<span class="text-sm text-amber-800 dark:text-amber-200">
									<!-- reserved for future quote warnings -->
								</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
