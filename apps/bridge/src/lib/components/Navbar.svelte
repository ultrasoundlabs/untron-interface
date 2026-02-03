<script lang="ts">
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import AppHeader from '@untron/stylekit/components/AppHeader.svelte';
	import ThemePicker from '@untron/stylekit/components/ThemePicker.svelte';
	import UntronLogo from '@untron/stylekit/components/UntronLogo.svelte';
	import ProductNav from '@untron/stylekit/components/ProductNav.svelte';
	import WalletStatus from '@untron/stylekit/components/WalletStatus.svelte';
	import { PUBLIC_BRIDGE_URL, PUBLIC_DOCS_URL, PUBLIC_V3_URL } from '$env/static/public';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { connection } from '$lib/wagmi/connectionStore';
	import { connectWallet, disconnectWallet } from '$lib/wagmi/wallet';
	import { WALLETS } from '@untron/connectkit/wallets';
	import { m } from '$lib/paraglide/messages.js';

	const bridgeUrl = PUBLIC_BRIDGE_URL || '/';
	const v3Url = PUBLIC_V3_URL || '';
	const docsUrl = PUBLIC_DOCS_URL || '';

	type AccountsSession = { userId: string; principalId: string };
	let accountsSession: AccountsSession | null = null;

	async function loadAccountsSession() {
		try {
			const res = await fetch('https://api.untron.finance/accounts/session', {
				method: 'GET',
				credentials: 'include',
				headers: { accept: 'application/json' }
			});
			if (!res.ok) return;
			accountsSession = (await res.json()) as AccountsSession;
		} catch {
			// ignore
		}
	}

	onMount(loadAccountsSession);

	const navItems = [
		{ id: 'bridge', label: 'Bridge', href: bridgeUrl },
		{ id: 'v3', label: 'V3', href: v3Url || '#', disabled: !v3Url },
		{
			id: 'integrate',
			label: 'Integrate',
			href: docsUrl || '#',
			disabled: !docsUrl
		}
	] as const;
</script>

<AppHeader maxWidthClass="max-w-[1082px]">
	{#snippet left()}
		<div class="flex items-center gap-3">
			<UntronLogo />
			<ProductNav items={navItems} activeId="bridge" />
		</div>
	{/snippet}

	{#snippet right()}
		<a
			href="/orders"
			class="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
		>
			{m.orders_title()}
		</a>
		<ThemePicker />
		<LanguageSwitcher />
		<a
			href={`https://accounts.untron.finance/login?return_to=${encodeURIComponent($page.url.href)}`}
			rel="noopener"
			class="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
		>
			{accountsSession ? m.common_account() : m.common_sign_in()}
		</a>
		<WalletStatus
			connection={$connection}
			{connectWallet}
			{disconnectWallet}
			wallets={WALLETS}
			currentUrl={$page.url.href}
			strings={{
				connectWallet: m.wallet_connect_wallet(),
				disconnect: m.wallet_disconnect(),
				copyAddress: m.wallet_copy_address(),
				copied: m.wallet_copied(),
				connectOptionsTitle: m.wallet_connect_options_title(),
				connectOptionsDesc: m.wallet_connect_options_desc(),
				copyLink: m.wallet_copy_link()
			}}
		/>
	{/snippet}
</AppHeader>
