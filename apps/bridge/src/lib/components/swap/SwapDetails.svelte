<script lang="ts">
	import { slide, fade } from 'svelte/transition';
	import { m } from '$lib/paraglide/messages.js';
	import type { SwapQuote } from '$lib/types/swap';
	import { formatAtomicToDecimal, formatBps, formatEta } from '$lib/math/amounts';

	interface Props {
		/** The quote to display */
		quote: SwapQuote | null;
		/** Whether the quote is loading */
		isLoading?: boolean;
		/** Destination token decimals */
		destDecimals: number;
		/** Source token symbol */
		sourceSymbol: string;
		/** Destination token symbol */
		destSymbol: string;
	}

	let { quote, isLoading = false, destDecimals, sourceSymbol, destSymbol }: Props = $props();

	let isExpanded = $state(false);

	function formatAmount(amount: string): string {
		return formatAtomicToDecimal(amount, destDecimals, {
			maxFractionDigits: 6,
			useGrouping: true
		});
	}
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
						1 {sourceSymbol} ≈ {quote.effectiveRate}
						{destSymbol}
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
								{formatAmount(quote.outputAmount)}
								{destSymbol}
							</span>
						</div>

						<!-- Protocol Fee -->
						<div class="flex items-center justify-between">
							<span class="text-zinc-500 dark:text-zinc-400">{m.swap_protocol_fee()}</span>
							<span class="text-zinc-700 dark:text-zinc-300">
								{formatAmount(quote.fees.protocolFeeAmount)}
								{destSymbol}
								<span class="text-zinc-400">({formatBps(quote.fees.protocolFeeBps)})</span>
							</span>
						</div>

						<!-- Network Fee -->
						<div class="flex items-center justify-between">
							<span class="text-zinc-500 dark:text-zinc-400">{m.swap_network_fee()}</span>
							<span class="text-zinc-700 dark:text-zinc-300">
								{formatAmount(quote.fees.networkFeeAmount)}
								{destSymbol}
							</span>
						</div>

						<!-- Estimated Time -->
						<div class="flex items-center justify-between">
							<span class="text-zinc-500 dark:text-zinc-400">{m.swap_estimated_time()}</span>
							<span class="text-zinc-700 dark:text-zinc-300">
								{formatEta(quote.estimatedTimeSeconds)}
							</span>
						</div>

						<!-- Hint (if any) -->
						{#if quote.hint}
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
									{quote.hint}
								</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
