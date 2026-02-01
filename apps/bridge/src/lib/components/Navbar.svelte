<script lang="ts">
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import AppHeader from '@untron/stylekit/components/AppHeader.svelte';
	import ThemePicker from '@untron/stylekit/components/ThemePicker.svelte';
	import UntronLogo from '@untron/stylekit/components/UntronLogo.svelte';
	import ProductNav from '@untron/stylekit/components/ProductNav.svelte';
	import WalletStatus from '@untron/stylekit/components/WalletStatus.svelte';
	import { PUBLIC_BRIDGE_URL, PUBLIC_DOCS_URL, PUBLIC_V3_URL } from '$env/static/public';
	import { page } from '$app/stores';
	import { connection } from '$lib/wagmi/connectionStore';
	import { connectWallet, disconnectWallet } from '$lib/wagmi/wallet';
	import { WALLETS } from '@untron/connectkit/wallets';
	import { m } from '$lib/paraglide/messages.js';

	const bridgeUrl = PUBLIC_BRIDGE_URL || '/';
	const v3Url = PUBLIC_V3_URL || '';
	const docsUrl = PUBLIC_DOCS_URL || '';

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
		<ThemePicker />
		<LanguageSwitcher />
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
