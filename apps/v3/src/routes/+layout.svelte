<script lang="ts">
	import './layout.css';
	import { page } from '$app/stores';
	import { env } from '$env/dynamic/public';
	import { Button } from '@untron/ui/button';
	import { Separator } from '@untron/ui/separator';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import ListIcon from '@lucide/svelte/icons/list';
	import ArrowDownToLineIcon from '@lucide/svelte/icons/arrow-down-to-line';
	import AppHeader from '@untron/stylekit/components/AppHeader.svelte';
	import ThemePicker from '@untron/stylekit/components/ThemePicker.svelte';
	import UntronFooter from '@untron/stylekit/components/UntronFooter.svelte';
	import InterHead from '@untron/stylekit/head/inter.svelte';
	import ProductNav from '@untron/stylekit/components/ProductNav.svelte';
	import UntronLogo from '@untron/stylekit/components/UntronLogo.svelte';
	import WalletStatus from '@untron/stylekit/components/WalletStatus.svelte';
	import { connection } from '$lib/wagmi/connectionStore';
	import { connectWallet, disconnectWallet } from '$lib/wagmi/wallet';
	import { WALLETS } from '@untron/connectkit/wallets';

	let { children } = $props();

	const navItems = [
		{
			id: 'bridge',
			label: 'Bridge',
			href: env.PUBLIC_BRIDGE_URL ?? '#',
			disabled: !env.PUBLIC_BRIDGE_URL
		},
		{ id: 'v3', label: 'V3', href: env.PUBLIC_V3_URL ?? '/', disabled: false },
		{
			id: 'integrate',
			label: 'Integrate',
			href: env.PUBLIC_DOCS_URL ?? '#',
			disabled: !env.PUBLIC_DOCS_URL
		}
	] as const;

	const footerNavGroups = [
		{
			id: 'project',
			title: 'Project',
			links: [
				{ id: 'x', label: 'X / Twitter', href: 'https://x.com/untronfi', external: true },
				{
					id: 'brand',
					label: 'Brand assets',
					href: 'https://github.com/ultrasoundlabs/brandkit',
					external: true
				}
			]
		},
		{
			id: 'socials',
			title: 'Socials',
			links: [
				{ id: 'telegram', label: 'Telegram', href: 'https://t.me/untronchat', external: true },
				{ id: 'github', label: 'GitHub', href: 'https://github.com/ultrasoundlabs', external: true }
			]
		}
	] as const;

	const footerContacts = [
		{ label: 'Ultrasound Labs LLC' },
		{ label: 'contact@untron.finance', href: 'mailto:contact@untron.finance' }
	] as const;
</script>

<InterHead />

<svelte:head>
	<title>Untron V3</title>
</svelte:head>

<AppHeader sticky={true}>
	{#snippet left()}
		<div class="flex items-center gap-3">
			<UntronLogo />
			<ProductNav items={navItems} activeId="v3" />
		</div>
	{/snippet}

	{#snippet right()}
		<ThemePicker />
		<div class="w-full max-w-[320px]">
			<WalletStatus
				connection={$connection}
				{connectWallet}
				{disconnectWallet}
				wallets={WALLETS}
				currentUrl={$page.url.href}
				strings={{
					connectWallet: 'Connect wallet',
					disconnect: 'Disconnect',
					copyAddress: 'Copy address',
					copied: 'Copied',
					connectOptionsTitle: 'Get a wallet',
					connectOptionsDesc:
						'Open this page in your wallet app, or install a wallet extension to connect.',
					copyLink: 'Copy link to this page'
				}}
			/>
		</div>
	{/snippet}
</AppHeader>

<div class="mx-auto max-w-7xl px-4 py-10">
	<div class="space-y-1">
		<h1 class="text-2xl font-semibold tracking-tight">Untron V3 dashboard</h1>
		<p class="text-sm text-muted-foreground">
			Developer UI for the next-generation Untron V3 protocol.
		</p>
	</div>

	<Separator class="my-6" />

	<nav class="flex flex-wrap items-center gap-2 pb-6">
		<Button href="/" variant={$page.url.pathname === '/' ? 'default' : 'ghost'}>
			<LayoutDashboardIcon />
			Dashboard
		</Button>
		<Button href="/leases" variant={$page.url.pathname.startsWith('/leases') ? 'default' : 'ghost'}>
			<ListIcon />
			All leases
		</Button>
		<Button
			href="/deposits"
			variant={$page.url.pathname.startsWith('/deposits') ? 'default' : 'ghost'}
		>
			<ArrowDownToLineIcon />
			All deposits
		</Button>
	</nav>

	<main>{@render children()}</main>
</div>

<UntronFooter
	navGroups={footerNavGroups}
	contacts={footerContacts}
	contactsTitle="Contacts"
	tagline="Built for humans who just want Tron USDT to work on actually good chains."
>
	{#snippet copyrightMeta()}
		<span>All rights reserved.</span>
		<span>Developer dashboard</span>
	{/snippet}
</UntronFooter>
