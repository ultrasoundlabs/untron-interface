<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { m } from '$lib/paraglide/messages.js';
	import * as swapService from '$lib/services/swapService';
	import type { Order, OrderStatusType } from '$lib/types/swap';
	import OrderStatusDisplay from './OrderStatusDisplay.svelte';
	import TronDepositView from './TronDepositView.svelte';
	import EvmSigningView from './EvmSigningView.svelte';
	import OrderSuccess from './OrderSuccess.svelte';

	// Get order ID from route
	const orderId = $derived($page.params.id ?? '');

	// Order state
	let order = $state<Order | null>(null);
	let isLoading = $state(true);
	let errorTitle = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	// Check if we came from the swap page (for modal-like behavior)
	let isModal = $state(false);

	onMount(async () => {
		// TODO: replace referrer-based detection with navigation state to avoid false positives.
		isModal =
			document.referrer.includes(window.location.origin) && !document.referrer.includes('/order/');

		await loadOrder();

		// Start polling for status updates
		pollInterval = setInterval(async () => {
			if (order && !isTerminalStatus(order.status)) {
				await loadOrder();
			}
		}, 3000);
	});

	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
		}
	});

	async function loadOrder() {
		try {
			order = await swapService.getOrder(orderId);
			errorTitle = null;
			errorMessage = null;
		} catch (err) {
			console.error('Failed to load order:', err);
			if (err instanceof swapService.SwapServiceError && err.statusCode === 404) {
				errorTitle = m.order_error_title();
				errorMessage = m.order_error_not_found_description();
			} else {
				errorTitle = m.order_error_generic_title();
				errorMessage = m.order_error_generic_description();
			}
		} finally {
			isLoading = false;
		}
	}

	function isTerminalStatus(status: OrderStatusType): boolean {
		return ['completed', 'failed', 'expired', 'cancelled'].includes(status);
	}

	function handleClose() {
		if (isModal) {
			history.back();
		} else {
			goto('/');
		}
	}

	function handleNewSwap() {
		goto('/');
	}
</script>

<svelte:head>
	<title>{m.order_page_title({ orderId: orderId.slice(0, 8) })}</title>
</svelte:head>

<div
	class="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-8"
	in:fade={{ duration: 200 }}
>
	{#if isLoading}
		<!-- Loading State -->
		<div class="flex flex-col items-center gap-4" in:fade={{ duration: 150 }}>
			<div
				class="h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-emerald-500 dark:border-zinc-700 dark:border-t-emerald-400"
			></div>
			<p class="text-zinc-500 dark:text-zinc-400">{m.order_loading()}</p>
		</div>
	{:else if errorMessage}
		<!-- Error State -->
		<div
			class="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20"
			in:scale={{ duration: 200, start: 0.95 }}
		>
			<svg
				class="mx-auto mb-4 h-12 w-12 text-red-500"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<h2 class="mb-2 text-lg font-semibold text-red-700 dark:text-red-400">
				{errorTitle ?? m.order_error_generic_title()}
			</h2>
			<p class="mb-4 text-sm text-red-600 dark:text-red-300">{errorMessage}</p>
			<Button onclick={handleNewSwap} variant="outline">
				{m.order_back_to_swap()}
			</Button>
		</div>
	{:else if order}
		<!-- Order Content -->
		<div class="mx-auto w-full max-w-lg" in:fly={{ y: 20, duration: 300 }}>
			<!-- Close button (if modal) -->
			{#if isModal}
				<div class="mb-4 flex justify-end">
					<button
						onclick={handleClose}
						aria-label="Close"
						class="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			{/if}

			<!-- Order Card -->
			<div
				class="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-200/50 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/20"
			>
				<!-- Status Header -->
				<OrderStatusDisplay {order} />

				<!-- Direction-specific content -->
				{#if order.status === 'completed'}
					<OrderSuccess {order} onNewSwap={handleNewSwap} />
				{:else if order.direction === 'TRON_TO_EVM' && order.tronDeposit}
					<TronDepositView {order} />
				{:else if order.direction === 'EVM_TO_TRON' && order.status === 'awaiting_signatures' && order.eip712Payloads}
					<EvmSigningView {order} />
				{:else}
					<!-- Generic processing view -->
					<div class="mt-6 flex flex-col items-center gap-4 py-8">
						<div
							class="h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-emerald-500 dark:border-zinc-700 dark:border-t-emerald-400"
						></div>
						<p class="text-center text-zinc-500 dark:text-zinc-400">
							{m.order_processing()}
						</p>
					</div>
				{/if}
			</div>

			<!-- Back to swap link -->
			<div class="mt-6 text-center">
				<button
					onclick={handleNewSwap}
					class="text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
				>
					{m.order_start_new_swap()}
				</button>
			</div>
		</div>
	{/if}
</div>
