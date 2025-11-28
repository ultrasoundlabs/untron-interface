<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { Order, OrderStatusType } from '$lib/types/swap';
	import { formatAtomicToDecimal } from '$lib/math/amounts';

	interface Props {
		order: Order;
	}

	let { order }: Props = $props();

	function getStatusConfig(status: OrderStatusType): {
		label: string;
		color: string;
		bgColor: string;
		icon: 'clock' | 'check' | 'x' | 'loader';
	} {
		switch (status) {
			case 'created':
				return {
					label: m.order_status_created(),
					color: 'text-blue-600',
					bgColor: 'bg-blue-100 dark:bg-blue-900/30',
					icon: 'clock'
				};
			case 'awaiting_payment':
				return {
					label: m.order_status_awaiting_payment(),
					color: 'text-amber-600',
					bgColor: 'bg-amber-100 dark:bg-amber-900/30',
					icon: 'clock'
				};
			case 'awaiting_signatures':
				return {
					label: m.order_status_awaiting_signatures(),
					color: 'text-amber-600',
					bgColor: 'bg-amber-100 dark:bg-amber-900/30',
					icon: 'clock'
				};
			case 'signatures_submitted':
				return {
					label: m.order_status_signatures_submitted(),
					color: 'text-blue-600',
					bgColor: 'bg-blue-100 dark:bg-blue-900/30',
					icon: 'loader'
				};
			case 'relaying':
				return {
					label: m.order_status_relaying(),
					color: 'text-blue-600',
					bgColor: 'bg-blue-100 dark:bg-blue-900/30',
					icon: 'loader'
				};
			case 'completed':
				return {
					label: m.order_status_completed(),
					color: 'text-emerald-600',
					bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
					icon: 'check'
				};
			case 'failed':
				return {
					label: m.order_status_failed(),
					color: 'text-red-600',
					bgColor: 'bg-red-100 dark:bg-red-900/30',
					icon: 'x'
				};
			case 'expired':
				return {
					label: m.order_status_expired(),
					color: 'text-zinc-600',
					bgColor: 'bg-zinc-100 dark:bg-zinc-800',
					icon: 'x'
				};
			case 'cancelled':
				return {
					label: m.order_status_cancelled(),
					color: 'text-zinc-600',
					bgColor: 'bg-zinc-100 dark:bg-zinc-800',
					icon: 'x'
				};
			default:
				return {
					label: status,
					color: 'text-zinc-600',
					bgColor: 'bg-zinc-100 dark:bg-zinc-800',
					icon: 'clock'
				};
		}
	}

	const statusConfig = $derived(getStatusConfig(order.status));

	function formatAmount(amount: string, decimals: number): string {
		return formatAtomicToDecimal(amount, decimals, {
			maxFractionDigits: 6,
			useGrouping: true
		});
	}

	const sourceAmount = $derived(formatAmount(order.source.amount, order.source.token.decimals));
	const destAmount = $derived(
		formatAmount(order.destination.amount, order.destination.token.decimals)
	);
</script>

<div class="text-center">
	<!-- Status Badge -->
	<div class="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 {statusConfig.bgColor}">
		{#if statusConfig.icon === 'loader'}
			<svg class="h-4 w-4 animate-spin {statusConfig.color}" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		{:else if statusConfig.icon === 'check'}
			<svg
				class="h-4 w-4 {statusConfig.color}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		{:else if statusConfig.icon === 'x'}
			<svg
				class="h-4 w-4 {statusConfig.color}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		{:else}
			<svg
				class="h-4 w-4 {statusConfig.color}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		{/if}
		<span class="text-sm font-medium {statusConfig.color}">{statusConfig.label}</span>
	</div>

	<!-- Swap Summary -->
	<div class="flex items-center justify-center gap-3">
		<!-- Source -->
		<div class="flex items-center gap-2">
			<div class="h-8 w-8 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
				<img
					src={order.source.token.logoUrl}
					alt={order.source.token.symbol}
					class="h-full w-full object-cover"
				/>
			</div>
			<div class="text-left">
				<div class="text-lg font-semibold text-zinc-900 dark:text-white">
					{sourceAmount}
				</div>
				<div class="text-xs text-zinc-500 dark:text-zinc-400">
					{order.source.token.symbol}
					{#if order.source.type === 'evm'}
						<span class="text-zinc-400 dark:text-zinc-500">on {order.source.chain.shortName}</span>
					{:else}
						<span class="text-zinc-400 dark:text-zinc-500">on Tron</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Arrow -->
		<svg
			class="h-5 w-5 shrink-0 text-zinc-400"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M14 5l7 7m0 0l-7 7m7-7H3"
			/>
		</svg>

		<!-- Destination -->
		<div class="flex items-center gap-2">
			<div class="h-8 w-8 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
				<img
					src={order.destination.token.logoUrl}
					alt={order.destination.token.symbol}
					class="h-full w-full object-cover"
				/>
			</div>
			<div class="text-left">
				<div class="text-lg font-semibold text-zinc-900 dark:text-white">
					{destAmount}
				</div>
				<div class="text-xs text-zinc-500 dark:text-zinc-400">
					{order.destination.token.symbol}
					{#if order.destination.type === 'evm'}
						<span class="text-zinc-400 dark:text-zinc-500"
							>on {order.destination.chain.shortName}</span
						>
					{:else}
						<span class="text-zinc-400 dark:text-zinc-500">on Tron</span>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
