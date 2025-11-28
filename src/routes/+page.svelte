<script lang="ts">
	import { fly } from 'svelte/transition';
	import { m } from '$lib/paraglide/messages.js';
	import SwapBox from '$lib/components/swap/SwapBox.svelte';

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

	<!-- FAQ Section (placeholder for future) -->
	<div class="mt-16 w-full max-w-2xl px-4 pb-16">
		<!-- FAQ content will go here -->
	</div>
</div>
