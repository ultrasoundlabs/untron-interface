<script lang="ts">
	import { onMount } from 'svelte';
	import type { ThemePreference } from '../theme';
	import { initTheme, resolveTheme, setThemePreference } from '../theme';

	type Props = {
		defaultPreference?: ThemePreference;
	};

	const props: Props = $props();
	const defaultPreference = $derived.by(() => props.defaultPreference ?? 'light');

	let preference = $state<ThemePreference>('light');

	const triggerClass = [
		'flex h-10 min-w-[44px] items-center justify-center gap-2 rounded-xl bg-white px-3 text-zinc-900 transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none',
		'dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-900'
	].join(' ');

	const isDark = $derived.by(() => resolveTheme(preference) === 'dark');

	function toggleTheme() {
		// Treat `system` as whichever the system currently resolves to, then flip.
		const next: Exclude<ThemePreference, 'system'> = isDark ? 'light' : 'dark';
		preference = next;
		setThemePreference(next);
	}

	onMount(() => {
		preference = initTheme(defaultPreference);

		const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
		if (!mql) return;

		const onChange = () => {
			if (preference === 'system') setThemePreference('system');
		};

		mql.addEventListener('change', onChange);
		return () => mql.removeEventListener('change', onChange);
	});
</script>

<button
	onclick={toggleTheme}
	class={triggerClass}
	aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
	title={isDark ? 'Light' : 'Dark'}
>
	{#if isDark}
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
			/>
		</svg>
	{:else}
		<svg class="h-5 w-5 text-zinc-500 dark:text-white/60" viewBox="0 0 24 24" fill="currentColor">
			<path
				d="M21.752 15.002a.75.75 0 00-.906-.97 8.218 8.218 0 01-2.846.486c-4.694 0-8.5-3.806-8.5-8.5 0-1.021.183-2.003.518-2.913a.75.75 0 00-.889-.986A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
			/>
		</svg>
	{/if}
</button>
