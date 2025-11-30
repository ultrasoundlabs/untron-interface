<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { m } from '$lib/paraglide/messages.js';
	import * as swapService from '$lib/services/swapService';
	import type { EvmRelayOrderView, TronToEvmOrderView } from '$lib/types/swap';
	import { getChainById } from '$lib/config/swapConfig';
	import TronDepositView from './TronDepositView.svelte';

	// Get order ID from route
	const orderId = $derived($page.params.id ?? '');

	// Order state
	let order = $state<TronToEvmOrderView | EvmRelayOrderView | null>(null);
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
			if (shouldPoll(order)) {
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

	function isTronOrder(
		value: TronToEvmOrderView | EvmRelayOrderView | null
	): value is TronToEvmOrderView {
		return !!value && value.kind === 'tronDeposit';
	}

	function isEvmRelayOrder(
		value: TronToEvmOrderView | EvmRelayOrderView | null
	): value is EvmRelayOrderView {
		return !!value && value.kind === 'evmRelay';
	}

	function shouldPoll(current: TronToEvmOrderView | EvmRelayOrderView | null): boolean {
		if (!current) return false;
		if (isEvmRelayOrder(current)) {
			return current.status === 'relaying';
		}
		return false;
	}

	function getExplorerUrl(value: EvmRelayOrderView): string | null {
		const chainId = (value.metadata?.evmChainId as number | undefined) ?? undefined;
		if (!chainId || !value.evmTxHash) return null;
		const chain = getChainById(chainId);
		if (!chain?.explorerUrl) return null;
		return `${chain.explorerUrl}/tx/${value.evmTxHash}`;
	}

	function getTronExplorerUrl(value: EvmRelayOrderView): string | null {
		if (!value.tronTxHash) return null;
		// TODO: make Tron explorer base URL configurable if needed
		return `https://tronscan.org/#/transaction/${value.tronTxHash}`;
	}

	function getChainName(value: EvmRelayOrderView): string | null {
		const chainId = (value.metadata?.evmChainId as number | undefined) ?? undefined;
		if (!chainId) return null;
		return getChainById(chainId)?.name ?? null;
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
				{#if isTronOrder(order)}
					<TronDepositView {order} />
				{:else if isEvmRelayOrder(order)}
					{#if order.status === 'relaying'}
						<div class="text-center">
							<div
								class="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-blue-600 dark:bg-blue-900/30"
							>
								<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								<span class="text-sm font-medium">{m.order_status_relaying()}</span>
							</div>
							<p class="text-sm text-zinc-500 dark:text-zinc-400">
								{#if getChainName(order)}
									We submitted your transfer on {getChainName(order)}. Keep this tab open while we
									process the Tron payout.
								{:else}
									We submitted your transfer. Keep this tab open while we process the Tron payout.
								{/if}
							</p>
							{#if order.evmTxHash}
								<p class="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
									{#if getExplorerUrl(order)}
										<a
											href={getExplorerUrl(order) ?? '#'}
											target="_blank"
											rel="noreferrer"
											class="font-mono text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
										>
											{order.evmTxHash}
										</a>
									{:else}
										<span class="font-mono">{order.evmTxHash}</span>
									{/if}
								</p>
							{/if}
						</div>
						<div class="mt-6 space-y-4 py-6 text-center">
							<p class="text-sm text-zinc-500 dark:text-zinc-400">
								Your Tron USDT payout will start as soon as the EVM transfer is finalized.
							</p>
						</div>
					{:else if order.status === 'completed'}
						<div class="text-center">
							<div
								class="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
								<span class="text-sm font-medium">{m.order_status_completed()}</span>
							</div>
							<h2 class="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
								{m.order_success_title()}
							</h2>
							<p class="text-sm text-zinc-500 dark:text-zinc-400">
								{m.order_success_description()}
							</p>

							<div class="mt-6 space-y-3 text-left text-xs text-zinc-500 dark:text-zinc-400">
								{#if order.evmTxHash}
									<div>
										<div class="mb-1 font-semibold tracking-wide uppercase">
											{m.order_source_tx()}
										</div>
										{#if getExplorerUrl(order)}
											<a
												href={getExplorerUrl(order) ?? '#'}
												target="_blank"
												rel="noreferrer"
												class="font-mono break-all text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
											>
												{order.evmTxHash}
											</a>
										{:else}
											<span class="font-mono break-all">{order.evmTxHash}</span>
										{/if}
									</div>
								{/if}

								{#if order.tronTxHash}
									<div class="pt-2">
										<div class="mb-1 font-semibold tracking-wide uppercase">
											{m.order_dest_tx()}
										</div>
										{#if getTronExplorerUrl(order)}
											<a
												href={getTronExplorerUrl(order) ?? '#'}
												target="_blank"
												rel="noreferrer"
												class="font-mono break-all text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
											>
												{order.tronTxHash}
											</a>
										{:else}
											<span class="font-mono break-all">{order.tronTxHash}</span>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					{:else if order.status === 'failed'}
						<div class="text-center">
							<div
								class="mb-4 inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-red-700 dark:bg-red-900/30 dark:text-red-300"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<span class="text-sm font-medium">{m.order_status_failed()}</span>
							</div>
							<p class="text-sm text-zinc-500 dark:text-zinc-400">
								{order.metadata?.errorReason
									? String(order.metadata.errorReason)
									: m.order_error_generic_description()}
							</p>
						</div>
					{/if}
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
