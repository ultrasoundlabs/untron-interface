<script lang="ts">
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import ThemeSwitcher from './ThemeSwitcher.svelte';
	import WalletStatus from './WalletStatus.svelte';
</script>

<nav class="sticky top-0 z-50 flex w-full items-center justify-between px-10 py-6">
	<!-- Logo / Wordmark -->
	<a href="/" class="group flex items-center">
		<img
			src="/logos/untron/full.svg"
			alt="Untron"
			class="hidden h-[48px] w-auto md:block dark:invert"
		/>
		<img
			src="/logos/untron/icon.svg"
			alt="Untron"
			class="block h-[48px] w-auto md:hidden dark:invert"
		/>
	</a>

	<!-- Right side controls -->
	<div class="flex items-center gap-2">
		<ThemeSwitcher />
		<LanguageSwitcher />
		<WalletStatus />
	</div>
</nav>
