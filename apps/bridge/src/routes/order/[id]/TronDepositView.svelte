<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import QRCode from '@castlenine/svelte-qrcode';
	import { m } from '$lib/paraglide/messages.js';
	import type { BridgeOrder } from '$lib/types/swap';
	import { formatAtomicToDecimal } from '$lib/math/amounts';

	interface Props {
		order: BridgeOrder;
	}

	let { order }: Props = $props();

	const deposit = $derived(order.depositRequirement ?? null);

	let copied = $state(false);
	let timeRemaining = $state('');
	let countdownInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		if (!deposit) return;
		updateCountdown();
		countdownInterval = setInterval(updateCountdown, 1000);
	});

	onDestroy(() => {
		if (countdownInterval) {
			clearInterval(countdownInterval);
		}
	});

	function updateCountdown() {
		const now = Date.now();
		const expiresAtMs = deposit ? Date.parse(deposit.expiresAt) : 0;
		const remaining = expiresAtMs - now;

		if (remaining <= 0) {
			timeRemaining = m.order_expired();
			if (countdownInterval) {
				clearInterval(countdownInterval);
			}
			return;
		}

		const minutes = Math.floor(remaining / 60000);
		const seconds = Math.floor((remaining % 60000) / 1000);
		timeRemaining = `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	async function copyAddress() {
		if (!deposit) return;
		await navigator.clipboard.writeText(deposit.address);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	const expectedAmount = $derived(
		formatAtomicToDecimal(deposit?.expectedAmount ?? '0', 6, {
			maxFractionDigits: 6,
			useGrouping: true
		})
	);
</script>

{#if deposit}
	<div class="mt-6 space-y-4" in:fade={{ duration: 150 }}>
		<!-- Instructions -->
		<div class="rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
			<p class="text-sm text-amber-800 dark:text-amber-200">
				{m.order_tron_deposit_instructions()}
			</p>
		</div>

		<!-- Amount to send -->
		<div class="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
			<div class="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
				{m.order_amount_to_send()}
			</div>
			<div class="flex items-baseline gap-2">
				<span class="text-2xl font-bold text-zinc-900 dark:text-white">
					{expectedAmount}
				</span>
				<span class="text-lg text-zinc-500 dark:text-zinc-400">USDT</span>
			</div>
		</div>

		<!-- Deposit Address -->
		<div class="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
			<div class="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
				{m.order_deposit_address()}
			</div>

			<!-- QR Code -->
			<div class="mx-auto mb-4 w-fit rounded-xl bg-white p-3 dark:bg-zinc-800">
				<div
					class="flex items-center justify-center rounded-lg bg-zinc-50 px-2 py-2 dark:bg-zinc-900"
					role="img"
					aria-label={m.order_deposit_address()}
				>
					<QRCode data={deposit.address} size={160} errorCorrectionLevel="M" />
				</div>
			</div>

			<!-- Address with copy -->
			<div class="flex items-center gap-2">
				<code
					class="flex-1 overflow-hidden rounded-lg bg-zinc-100 px-3 py-2 font-sans text-sm text-ellipsis text-zinc-900 dark:bg-zinc-800 dark:text-white"
				>
					{deposit.address}
				</code>
				<button
					onclick={copyAddress}
					class="shrink-0 rounded-lg border border-zinc-200 p-2 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
				>
					{#if copied}
						<svg
							class="h-5 w-5 text-emerald-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					{:else}
						<svg
							class="h-5 w-5 text-zinc-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
					{/if}
				</button>
			</div>
		</div>

		<!-- Countdown -->
		<div class="flex items-center justify-center gap-2 text-sm">
			<svg class="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span class="text-zinc-500 dark:text-zinc-400">
				{m.order_time_remaining()}:
			</span>
			<span class="font-sans font-medium text-zinc-900 dark:text-white">
				{timeRemaining}
			</span>
		</div>

		{#if deposit.memo}
			<div class="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
				<div class="mb-2 text-sm text-zinc-500 dark:text-zinc-400">{m.order_memo()}</div>
				<code
					class="block w-full overflow-hidden rounded-lg bg-zinc-100 px-3 py-2 font-sans text-sm text-ellipsis text-zinc-900 dark:bg-zinc-800 dark:text-white"
				>
					{deposit.memo}
				</code>
			</div>
		{/if}

		<!-- Warning -->
		<div class="rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
			<div class="flex items-start gap-2">
				<svg
					class="mt-0.5 h-4 w-4 shrink-0 text-red-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<p class="text-sm text-red-700 dark:text-red-300">
					{m.order_tron_deposit_warning()}
				</p>
			</div>
		</div>
	</div>
{/if}
