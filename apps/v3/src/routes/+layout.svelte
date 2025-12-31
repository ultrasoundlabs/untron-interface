<script lang="ts">
	import './layout.css';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import WalletConnect from '$lib/components/WalletConnect.svelte';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import ListIcon from '@lucide/svelte/icons/list';

	let { children } = $props();
</script>

<svelte:head>
	<title>Untron V3</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-10">
	<header class="flex flex-col gap-6">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
			<div class="space-y-1">
				<h1 class="text-2xl font-semibold tracking-tight">Untron V3 dashboard</h1>
				<p class="text-sm text-muted-foreground">
					Developer UI for the next-generation Untron V3 protocol.
				</p>
			</div>
			<div class="w-full lg:max-w-md">
				<WalletConnect />
			</div>
		</div>

		<nav class="flex flex-wrap items-center gap-2">
			<Button href="/" variant={$page.url.pathname === '/' ? 'default' : 'ghost'}>
				<LayoutDashboardIcon />
				Dashboard
			</Button>
			<Button
				href="/leases"
				variant={$page.url.pathname.startsWith('/leases') ? 'default' : 'ghost'}
			>
				<ListIcon />
				All leases
			</Button>
		</nav>
	</header>

	<Separator class="my-8" />

	<main>{@render children()}</main>
</div>
