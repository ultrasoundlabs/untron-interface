<script lang="ts">
	import { onMount } from 'svelte';
	import * as DropdownMenu from '@untron/ui/dropdown-menu';
	import {
		assertIsLocale,
		getLocale,
		isLocale,
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
		pt: 'Português',
		ru: 'Русский',
		uk: 'Українська',
		'zh-CN': '简体中文',
		'zh-HK': '廣東話',
		th: 'ไทย',
		id: 'Bahasa Indonesia',
		vi: 'Tiếng Việt',
		ms: 'Bahasa Melayu',
		fil: 'Filipino'
	};

	const languageCodes: Record<Locale, string> = {
		en: '🇺🇸',
		es: '🇪🇸',
		pt: '🇵🇹',
		ru: '🇷🇺',
		uk: '🇺🇦',
		'zh-CN': '🇨🇳',
		'zh-HK': '🇭🇰',
		th: '🇹🇭',
		id: '🇮🇩',
		vi: '🇻🇳',
		ms: '🇲🇾',
		fil: '🇵🇭'
	};

	interface Props {
		/** Whether to auto-detect browser language on first visit */
		autoDetect?: boolean;
	}

	let { autoDetect = true }: Props = $props();

	let currentLocale = $state<Locale>(getLocale());

	function handleLocaleChange(locale: Locale | string) {
		const normalized = assertIsLocale(locale);
		setLocale(normalized);
		currentLocale = normalized;
		if (typeof document !== 'undefined') {
			document.documentElement.lang = normalized;
		}
	}

	function detectBrowserLocale(): Locale | undefined {
		if (typeof navigator === 'undefined') return undefined;

		// Handles typical cases like `pt-BR -> pt` and also case-insensitive matches.
		const extracted = extractLocaleFromNavigator();
		if (extracted) return assertIsLocale(extracted);

		const languages = navigator.languages ?? [];
		const lower = languages.map((lang) => lang.toLowerCase());
		const has = (tag: string) => lower.some((lang) => lang === tag || lang.startsWith(`${tag}-`));

		// Some browsers still report Tagalog as `tl` instead of `fil`.
		if (has('tl') && isLocale('fil')) return assertIsLocale('fil');

		// Prefer sensible defaults for generic Chinese tags.
		if ((has('zh-hant') || has('zh-hk') || has('zh-mo') || has('zh-tw')) && isLocale('zh-HK')) {
			return assertIsLocale('zh-HK');
		}
		if ((has('zh-hans') || has('zh-cn') || has('zh-sg') || has('zh')) && isLocale('zh-CN')) {
			return assertIsLocale('zh-CN');
		}

		return undefined;
	}

	onMount(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.lang = currentLocale;
		}

		// Only auto-detect if enabled and no cookie is set (first visit)
		if (autoDetect && typeof window !== 'undefined') {
			const cookieLocale = extractLocaleFromCookie();
			if (!cookieLocale) {
				const browserLocale = detectBrowserLocale();
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
				class="flex h-10 min-w-[44px] items-center gap-2 rounded-xl bg-white px-3 text-base text-zinc-900 transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-900"
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
		<DropdownMenu.RadioGroup value={currentLocale} onValueChange={(v) => handleLocaleChange(v)}>
			{#each locales as locale (locale)}
				<DropdownMenu.RadioItem value={locale}>
					<span class="flex items-center gap-2">
						<span class="text-lg leading-none">{languageCodes[locale]}</span>
						<span>{languageLabels[locale]}</span>
					</span>
				</DropdownMenu.RadioItem>
			{/each}
		</DropdownMenu.RadioGroup>
	</DropdownMenu.Content>
</DropdownMenu.Root>
