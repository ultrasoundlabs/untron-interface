<script lang="ts">
	import './layout.css';
	import Footer from '$lib/components/Footer.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import InterHead from '@untron/stylekit/head/inter.svelte';

	let { children } = $props();
</script>

<InterHead />

<svelte:head>
	<title>{m.app_title()}</title>
	<link rel="icon" href="/logos/untron/icon.svg" />
</svelte:head>

<Navbar />

<main class="mx-auto max-w-5xl px-4">
	{@render children()}
</main>

<Footer />
