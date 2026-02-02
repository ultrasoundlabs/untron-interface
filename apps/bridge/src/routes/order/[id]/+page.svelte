<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '@untron/ui/button';
	import { m } from '$lib/paraglide/messages.js';
	import * as swapService from '$lib/services/swapService';
	import type { BridgeOrder } from '$lib/types/swap';
	import { parseAccountId } from '$lib/utils/caip';
	import TronDepositView from './TronDepositView.svelte';
	import EvmDepositView from './EvmDepositView.svelte';

	const orderId = $derived($page.params.id ?? '');

	let order = $state<BridgeOrder | null>(null);
	let isLoading = $state(true);
	let errorTitle = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	let pollTimeout: ReturnType<typeof setTimeout> | null = null;

	// "soft" polling errors: keep rendering the last known order state.
	let pollError = $state<string | null>(null);
	let lastUpdatedAt = $state<number | null>(null);
	let nowTick = $state(Date.now());
	let nowInterval: ReturnType<typeof setInterval> | null = null;

	let isModal = $state(false);

	function shouldPoll(current: BridgeOrder | null): boolean {
		if (!current) return false;
		return !['completed', 'failed', 'expired', 'canceled'].includes(current.status);
	}

	function pollDelayMs(current: BridgeOrder | null): number {
		const seconds = current?.pollAfterSeconds ?? 3;
		return Math.min(Math.max(seconds * 1000, 1500), 15_000);
	}

	function schedulePoll() {
		if (pollTimeout) clearTimeout(pollTimeout);
		if (!shouldPoll(order)) return;
		pollTimeout = setTimeout(async () => {
			await loadOrder({ isPoll: true });
			schedulePoll();
		}, pollDelayMs(order));
	}

	onMount(async () => {
		// TODO: replace referrer-based detection with navigation state to avoid false positives.
		isModal =
			document.referrer.includes(window.location.origin) && !document.referrer.includes('/order/');

		nowInterval = setInterval(() => {
			nowTick = Date.now();
		}, 1000);

		await loadOrder({ isPoll: false });
		schedulePoll();
	});

	onDestroy(() => {
		if (pollTimeout) clearTimeout(pollTimeout);
		if (nowInterval) clearInterval(nowInterval);
	});

	async function loadOrder(opts: { isPoll: boolean }) {
		try {
			const fresh = await swapService.getOrder(orderId);
			order = fresh;
			lastUpdatedAt = Date.now();
			pollError = null;

			// If this order is terminal, clear the "resume" hint so the home page doesn't
			// keep suggesting a completed/failed swap.
			try {
				if (['completed', 'failed', 'expired', 'canceled'].includes(fresh.status)) {
					localStorage.removeItem('bridge:lastOrderId');
					localStorage.removeItem('bridge:lastOrderCreatedAt');
				}
			} catch {
				// ignore
			}
			errorTitle = null;
			errorMessage = null;
		} catch (err) {
			console.error('Failed to load order:', err);

			// If this is a background poll and we already have *some* order state,
			// keep rendering it and show a soft warning instead of a hard error.
			if (opts.isPoll && order) {
				pollError = err instanceof Error ? err.message : m.order_error_generic_description();
				return;
			}

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

	const destinationNamespace = $derived.by(() => {
		if (!order) return null;
		return parseAccountId(order.recipient)?.chainNamespace ?? null;
	});

	const isTronToEvm = $derived(destinationNamespace === 'eip155');

	function handleClose() {
		if (isModal) history.back();
		else goto('/');
	}

	function handleNewSwap() {
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

<svelte:head>
	<title>{m.order_page_title({ orderId: orderId.slice(0, 8) })}</title>
</svelte:head>

<div
	class="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-8"
	in:fade={{ duration: 200 }}
>
	{#if isLoading}
		<div class="flex flex-col items-center gap-4" in:fade={{ duration: 150 }}>
			<div
				class="h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-emerald-500 dark:border-zinc-700 dark:border-t-emerald-400"
			></div>
			<p class="text-zinc-500 dark:text-zinc-400">{m.order_loading()}</p>
		</div>
	{:else if errorMessage}
		<div
			class="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20"
			in:scale={{ duration: 200, start: 0.95 }}
		>
			<h2 class="mb-2 text-lg font-semibold text-red-700 dark:text-red-400">
				{errorTitle ?? m.order_error_generic_title()}
			</h2>
			<p class="mb-4 text-sm text-red-600 dark:text-red-300">{errorMessage}</p>
			<Button onclick={handleNewSwap} variant="outline">
				{m.order_back_to_swap()}
			</Button>
		</div>
	{:else if order}
		<div class="mx-auto w-full max-w-lg" in:fly={{ y: 20, duration: 300 }}>
			{#if isModal}
				<div class="mb-4 flex justify-end">
					<button
						onclick={handleClose}
						aria-label={m.common_close()}
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

			<div
				class="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-200/50 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/20"
			>
				{#if pollError}
					<div class="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
						{pollError}
					</div>
				{/if}

				{#if order.depositRequirement && ['requires_funding', 'funding_incomplete'].includes(order.status) && Date.parse(order.depositRequirement.expiresAt) <= Date.now()}
					<div class="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-100">
						<div class="font-medium">Deposit window expired</div>
						<div class="mt-1 text-amber-800 dark:text-amber-200">
							If you already sent the transfer, it may still be detected. Contact support with your Order ID:
							<span class="font-sans">{order.orderId}</span>
						</div>
						<div class="mt-2 flex flex-wrap items-center gap-3 text-amber-900 dark:text-amber-100">
							<a
								href="mailto:contact@untron.finance"
								class="underline underline-offset-2"
							>
								contact@untron.finance
							</a>
							<a
								href="https://t.me/untronsupport"
								target="_blank"
								rel="noreferrer"
								class="underline underline-offset-2"
							>
								@untronsupport
							</a>
						</div>
					</div>
				{/if}

				{#if lastUpdatedAt}
					<div class="mb-4 text-center font-sans text-[11px] text-zinc-500 dark:text-zinc-400">
						Updated {Math.max(0, Math.round((nowTick - lastUpdatedAt) / 1000))}s ago
					</div>
				{/if}
				<div class="text-center">
					<div
						class="mb-4 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
					>
						<span class="text-sm font-medium">{statusLabel(order.status)}</span>
					</div>
					<p class="text-xs text-zinc-500 dark:text-zinc-400">
						{m.order_id_label({ orderId: order.orderId })}
					</p>
				</div>

				{#if order.nextAction?.message}
					<div
						class="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
					>
						{order.nextAction.message}
					</div>
				{/if}

				{#if ['requires_funding', 'funding_incomplete', 'funding_detected'].includes(order.status) && order.depositRequirement}
					{#if isTronToEvm}
						<TronDepositView {order} />
					{:else}
						<EvmDepositView {order} />
					{/if}
				{:else if ['executing', 'settling'].includes(order.status)}
					<div class="mt-6 text-center">
						<div
							class="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-emerald-500 dark:border-zinc-700 dark:border-t-emerald-400"
						></div>
						<p class="text-sm text-zinc-500 dark:text-zinc-400">
							{m.order_processing_keep_open()}
						</p>
					</div>
				{:else if order.status === 'completed'}
					<div class="mt-6 text-center">
						<div
							class="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
						>
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<h2 class="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
							{m.order_success_title()}
						</h2>
						<p class="text-sm text-zinc-500 dark:text-zinc-400">{m.order_success_description()}</p>
					</div>
				{:else if ['failed', 'expired', 'canceled', 'action_required'].includes(order.status)}
					<div
						class="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20"
					>
						<h2 class="mb-2 text-lg font-semibold text-red-700 dark:text-red-400">
							{m.order_error_generic_title()}
						</h2>
						<p class="text-sm text-red-600 dark:text-red-300">
							{order.resolution?.message ?? m.order_error_generic_description()}
						</p>
					</div>
				{/if}

				<div class="mt-8 flex justify-center">
					<Button onclick={handleNewSwap} variant="outline">{m.order_back_to_swap()}</Button>
				</div>
			</div>
		</div>
	{/if}
</div>
