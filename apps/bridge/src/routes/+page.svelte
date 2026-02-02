<script lang="ts">
	import { fly } from 'svelte/transition';
	import { m } from '$lib/paraglide/messages.js';
	import { onMount } from 'svelte';
	import SwapBox from '$lib/components/swap/SwapBox.svelte';
	import FAQ from '$lib/components/FAQ.svelte';
	import { goto } from '$app/navigation';
	import { Button } from '@untron/ui/button';

	let lastOrderId: string | null = null;

	onMount(() => {
		try {
			const id = localStorage.getItem('bridge:lastOrderId');
			const createdAt = localStorage.getItem('bridge:lastOrderCreatedAt');

			// Don't keep a stale "resume" banner around forever.
			// We want recovery from accidental refresh/back/close; not long-term nags.
			const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours
			const createdMs = createdAt ? Date.parse(createdAt) : NaN;
			const isFresh = Number.isFinite(createdMs) ? Date.now() - createdMs <= MAX_AGE_MS : true;

			lastOrderId = id && isFresh ? id : null;
			if (!lastOrderId) {
				localStorage.removeItem('bridge:lastOrderId');
				localStorage.removeItem('bridge:lastOrderCreatedAt');
			}
		} catch {
			lastOrderId = null;
		}
	});

	function resumeLastOrder() {
		if (!lastOrderId) return;
		goto(`/order/${lastOrderId}`);
	}

	function clearLastOrder() {
		try {
			localStorage.removeItem('bridge:lastOrderId');
			localStorage.removeItem('bridge:lastOrderCreatedAt');
		} catch {
			// ignore
		}
		lastOrderId = null;
	}

	// Get time-appropriate greeting
	function getGreeting(): string {
		const hour = new Date().getHours();
		if (hour >= 5 && hour < 12) {
			return m.home_greeting_morning();
		} else if (hour >= 12 && hour < 18) {
			return m.home_greeting();
		} else {
			return m.home_greeting_evening();
		}
	}

	const greeting = getGreeting();
</script>

<div class="flex min-h-[calc(100vh-8rem)] flex-col items-center pt-8 md:pt-16">
	<!-- Hero Section -->
	<div class="mb-8 text-center" in:fly={{ y: -20, duration: 300 }}>
		<h1 class="text-3xl font-bold text-zinc-900 md:text-4xl dark:text-white">
			{greeting}
		</h1>
	</div>

	<!-- Resume last order (UX reliability) -->
	{#if lastOrderId}
		<div class="mb-4 w-full max-w-md" in:fly={{ y: 8, duration: 180 }}>
			<div class="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm shadow-zinc-200/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-black/20">
				<div class="min-w-0">
					<div class="font-medium">Resume your last swap</div>
					<div class="mt-0.5 truncate font-sans text-xs text-zinc-500 dark:text-zinc-400">
						/order/{lastOrderId}
					</div>
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<Button onclick={resumeLastOrder} size="sm">Resume</Button>
					<Button onclick={clearLastOrder} size="sm" variant="outline">Clear</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Swap Box -->
	<SwapBox />

	<!-- Scroll hint arrow between Swap and FAQ -->
	<div class="mt-8 flex items-center justify-center" in:fly={{ y: 10, duration: 220 }}>
		<div
			class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-500 shadow-sm shadow-zinc-200/60 transition-transform duration-200 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-black/30"
			aria-hidden="true"
		>
			<svg
				class="animate-bounce-slow h-5 w-5"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 9l6 6 6-6" />
			</svg>
		</div>
	</div>

	<!-- FAQ Section -->
	<FAQ />
</div>
