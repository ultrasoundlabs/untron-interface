<script lang="ts">
	import { onMount } from 'svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import {
		getLocale,
		setLocale,
		locales,
		extractLocaleFromNavigator,
		extractLocaleFromCookie,
		type Locale
	} from '$lib/paraglide/runtime';

	// Language metadata: labels in their own language (no translation needed)
	const languageLabels: Record<Locale, string> = {
		en: 'English',
		es: 'Español',
		ru: 'Русский'
	};

	const languageCodes: Record<Locale, string> = {
		en: '🇺🇸',
		es: '🇪🇸',
		ru: '🇷🇺'
	};

	interface Props {
		/** Whether to auto-detect browser language on first visit */
		autoDetect?: boolean;
	}

	let { autoDetect = true }: Props = $props();

	let currentLocale = $state<Locale>(getLocale());

	function handleLocaleChange(locale: Locale) {
		setLocale(locale);
		currentLocale = locale;
		if (typeof document !== 'undefined') {
			document.documentElement.lang = locale;
		}
	}

	onMount(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.lang = currentLocale;
		}

		// Only auto-detect if enabled and no cookie is set (first visit)
		if (autoDetect && typeof window !== 'undefined') {
			const cookieLocale = extractLocaleFromCookie();
			if (!cookieLocale) {
				const browserLocale = extractLocaleFromNavigator();
				if (browserLocale && browserLocale !== currentLocale) {
					handleLocaleChange(browserLocale);
				}
			}
		}
	});
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<button
				{...props}
				class="flex items-center gap-2 rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-base text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white"
			>
				<span class="text-xl leading-none">{languageCodes[currentLocale]}</span>
				<!-- Chevron -->
				<svg class="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.RadioGroup
			value={currentLocale}
			onValueChange={(v) => handleLocaleChange(v as Locale)}
		>
			{#each locales as locale (locale)}
				<DropdownMenu.RadioItem value={locale}>
					{languageLabels[locale]}
				</DropdownMenu.RadioItem>
			{/each}
		</DropdownMenu.RadioGroup>
	</DropdownMenu.Content>
</DropdownMenu.Root>
