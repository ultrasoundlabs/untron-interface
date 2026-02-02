<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fly, fade } from 'svelte/transition';
	import { Button } from '@untron/ui/button';
	import { m } from '$lib/paraglide/messages.js';
	import * as swapService from '$lib/services/swapService';
	import type { BridgeOrder } from '$lib/types/swap';

	let orders = $state<BridgeOrder[] | null>(null);
	let error = $state<string | null>(null);
	let isLoading = $state(true);

	onMount(async () => {
		try {
			orders = await swapService.listOrders({ limit: 20 });
			error = null;
		} catch (e) {
			console.error('Failed to load orders:', e);
			error = e instanceof Error ? e.message : 'Failed to load orders';
			orders = null;
		} finally {
			isLoading = false;
		}
	});

	function openOrder(orderId: string) {
		goto(`/order/${orderId}`);
	}

	function backToSwap() {
		goto('/');
	}

	function statusLabel(status: string): string {
		switch (status) {
			case 'requires_funding':
				return m.order_status_requires_funding();
			case 'funding_incomplete':
				return m.order_status_funding_incomplete();
			case 'funding_detected':
				return m.order_status_funding_detected();
			case 'executing':
				return m.order_status_executing();
			case 'settling':
				return m.order_status_settling();
			case 'completed':
				return m.order_status_completed();
			case 'expired':
				return m.order_status_expired();
			case 'canceled':
				return m.order_status_canceled();
			case 'failed':
				return m.order_status_failed();
			case 'action_required':
				return m.order_status_action_required();
			default:
				return status;
		}
	}
</script>

<div class="mx-auto w-full max-w-[1082px] px-4 py-8" in:fade={{ duration: 180 }}>
	<div class="mb-6 flex items-center justify-between gap-3" in:fly={{ y: -8, duration: 220 }}>
		<div>
			<h1 class="text-2xl font-bold text-zinc-900 dark:text-white">My Orders</h1>
			<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
				Recent swaps for this device/account.
			</p>
		</div>
		<Button onclick={backToSwap} variant="outline">{m.order_back_to_swap()}</Button>
	</div>

	{#if isLoading}
		<div class="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400" in:fade={{ duration: 150 }}>
			<div class="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-emerald-500 dark:border-zinc-700 dark:border-t-emerald-400"></div>
			Loading…
		</div>
	{:else if error}
		<div class="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300" in:fade={{ duration: 150 }}>
			{error}
		</div>
	{:else if orders && orders.length === 0}
		<div class="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300" in:fade={{ duration: 150 }}>
			No orders yet.
		</div>
	{:else if orders}
		<div class="space-y-3" in:fade={{ duration: 150 }}>
			{#each orders as o (o.orderId)}
				<button
					type="button"
					onclick={() => openOrder(o.orderId)}
					class="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
				>
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="truncate text-sm font-semibold text-zinc-900 dark:text-white">
								{o.orderId}
							</div>
							<div class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
								{statusLabel(o.status)}
							</div>
						</div>
						<div class="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
							{new Date(o.createdAt).toLocaleString()}
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
