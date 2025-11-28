<script lang="ts">
	import { scale, fade } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button/index.js';
	import { m } from '$lib/paraglide/messages.js';
	import type { Order } from '$lib/types/swap';
	import { formatAtomicToDecimal } from '$lib/math/amounts';

	interface Props {
		order: Order;
		onNewSwap: () => void;
	}

	let { order, onNewSwap }: Props = $props();

	function formatAmount(amount: string, decimals: number): string {
		return formatAtomicToDecimal(amount, decimals, {
			maxFractionDigits: 6,
			useGrouping: true
		});
	}

	function truncateHash(hash: string): string {
		if (hash.length <= 16) return hash;
		return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
	}

	const destAmount = $derived(
		formatAmount(order.destination.amount, order.destination.token.decimals)
	);
	const feeAmount = $derived(
		formatAmount(order.quote.fees.totalFeeAmount, order.destination.token.decimals)
	);
</script>

<div class="mt-6 space-y-6" in:fade={{ duration: 200 }}>
	<!-- Success Icon -->
	<div class="flex justify-center" in:scale={{ duration: 300, delay: 100, start: 0.5 }}>
		<div class="rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/30">
			<svg class="h-12 w-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		</div>
	</div>

	<!-- Success Message -->
	<div class="text-center">
		<h2 class="text-xl font-bold text-zinc-900 dark:text-white">
			{m.order_success_title()}
		</h2>
		<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
			{m.order_success_description()}
		</p>
	</div>

	<!-- Summary Card -->
	<div class="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
		<div class="space-y-3">
			<!-- Received -->
			<div class="flex items-center justify-between">
				<span class="text-sm text-zinc-500 dark:text-zinc-400">{m.order_received()}</span>
				<span class="font-medium text-zinc-900 dark:text-white">
					{destAmount}
					{order.destination.token.symbol}
				</span>
			</div>

			<!-- Fees -->
			<div class="flex items-center justify-between">
				<span class="text-sm text-zinc-500 dark:text-zinc-400">{m.order_total_fees()}</span>
				<span class="text-sm text-zinc-700 dark:text-zinc-300">
					{feeAmount}
					{order.destination.token.symbol}
				</span>
			</div>

			<!-- Recipient -->
			<div class="flex items-center justify-between">
				<span class="text-sm text-zinc-500 dark:text-zinc-400">{m.order_sent_to()}</span>
				<code
					class="rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
				>
					{truncateHash(order.recipientAddress)}
				</code>
			</div>

			<!-- Time -->
			<div class="flex items-center justify-between">
				<span class="text-sm text-zinc-500 dark:text-zinc-400">{m.order_completed_at()}</span>
				<span class="text-sm text-zinc-700 dark:text-zinc-300">
					{new Date(order.updatedAt).toLocaleTimeString()}
				</span>
			</div>
		</div>
	</div>

	<!-- Transaction Links -->
	{#if order.finalTxHashes}
		<div class="space-y-2">
			{#if order.finalTxHashes.source}
				<a
					href={order.source.type === 'tron'
						? `https://tronscan.org/#/transaction/${order.finalTxHashes.source}`
						: `${order.source.chain.explorerUrl}/tx/${order.finalTxHashes.source}`}
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center justify-between rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
				>
					<span class="text-sm text-zinc-700 dark:text-zinc-300">{m.order_source_tx()}</span>
					<span class="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
						{truncateHash(order.finalTxHashes.source)}
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							/>
						</svg>
					</span>
				</a>
			{/if}

			{#if order.finalTxHashes.destination}
				<a
					href={order.destination.type === 'tron'
						? `https://tronscan.org/#/transaction/${order.finalTxHashes.destination}`
						: `${order.destination.chain.explorerUrl}/tx/${order.finalTxHashes.destination}`}
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center justify-between rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
				>
					<span class="text-sm text-zinc-700 dark:text-zinc-300">{m.order_dest_tx()}</span>
					<span class="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
						{truncateHash(order.finalTxHashes.destination)}
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							/>
						</svg>
					</span>
				</a>
			{/if}
		</div>
	{/if}

	<!-- New Swap Button -->
	<Button onclick={onNewSwap} class="w-full" size="lg">
		{m.order_new_swap()}
	</Button>
</div>
