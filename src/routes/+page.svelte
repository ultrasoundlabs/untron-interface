<script lang="ts">
	import { fly } from 'svelte/transition';
	import { m } from '$lib/paraglide/messages.js';
	import SwapBox from '$lib/components/swap/SwapBox.svelte';
	import FAQ from '$lib/components/FAQ.svelte';

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
