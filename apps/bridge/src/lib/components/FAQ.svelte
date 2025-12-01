<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';

	type FaqItem = {
		id: string;
		question: () => string;
		emoji: string;
		answer: () => string;
	};

	const faqs: FaqItem[] = [
		{
			id: 'usdt',
			question: () => m.faq_usdt_question(),
			emoji: '💵',
			answer: () => m.faq_usdt_answer()
		},
		{
			id: 'tron',
			question: () => m.faq_tron_question(),
			emoji: '🚀',
			answer: () => m.faq_tron_answer()
		},
		{
			id: 'ethereum',
			question: () => m.faq_ethereum_question(),
			emoji: '🌐',
			answer: () => m.faq_ethereum_answer()
		},
		{
			id: 'untron',
			question: () => m.faq_untron_question(),
			emoji: '🔄',
			answer: () => m.faq_untron_answer()
		},
		{
			id: 'from-tron',
			question: () => m.faq_from_tron_question(),
			emoji: '📤',
			answer: () => m.faq_from_tron_answer()
		},
		{
			id: 'into-tron',
			question: () => m.faq_into_tron_question(),
			emoji: '📥',
			answer: () => m.faq_into_tron_answer()
		},
		{
			id: 'help',
			question: () => m.faq_help_question(),
			emoji: '🤝',
			answer: () => m.faq_help_answer()
		}
	];

	let openId = $state<string | null>('usdt');
	let prefersReducedMotion = $state(false);

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const handleChange = () => {
			prefersReducedMotion = mediaQuery.matches;
		};

		handleChange();
		mediaQuery.addEventListener('change', handleChange);

		return () => {
			mediaQuery.removeEventListener('change', handleChange);
		};
	});

	const getIsOpen = (id: string) => openId === id;

	function toggle(id: string) {
		openId = openId === id ? null : id;
	}

	const transitionDuration = $derived(prefersReducedMotion ? 0 : 220);
</script>

<section class="mt-16 w-full max-w-2xl px-4 pb-16">
	<div class="mb-4 text-left md:mb-6">
		<h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
			{m.faq_title()}
		</h2>
		<p class="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
			{m.faq_subtitle()}
		</p>
	</div>

	<div class="space-y-4">
		{#each faqs as item (item.id)}
			<div
				class="overflow-hidden rounded-2xl bg-[#f2f2f2] transition-all duration-200 dark:bg-[#f2f2f2]"
				in:fade={{ duration: transitionDuration }}
			>
				<button
					type="button"
					class="flex w-full items-center justify-between gap-3 px-4 py-4 text-left md:px-5 md:py-4"
					onclick={() => toggle(item.id)}
				>
					<div class="flex items-center gap-3">
						<div
							class="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xl dark:bg-zinc-800"
						>
							<span aria-hidden="true">{item.emoji}</span>
						</div>
						<div>
							<p class="text-[18px] font-medium text-zinc-900 dark:text-zinc-50">
								{item.question()}
							</p>
						</div>
					</div>

					<div
						class="ml-2 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-transform duration-200 dark:border-zinc-700 dark:text-zinc-400"
						aria-hidden="true"
						style={`transform: rotate(${getIsOpen(item.id) ? 90 : 0}deg);`}
					>
						<svg
							class="h-3.5 w-3.5"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M6.293 3.293a1 1 0 011.414 0L14.414 10l-6.707 6.707a1 1 0 01-1.414-1.414L11.586 10 6.293 4.707a1 1 0 010-1.414z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
				</button>

				{#if getIsOpen(item.id)}
					<div
						class="px-4 pt-0 pb-4 text-[16px] text-zinc-700 md:px-5 md:pb-5 dark:text-zinc-300"
						in:slide={{ duration: transitionDuration }}
						out:slide={{ duration: transitionDuration }}
					>
						<p>{item.answer()}</p>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</section>
