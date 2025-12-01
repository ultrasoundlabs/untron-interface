<script lang="ts">
	import './layout.css';
	import Footer from '$lib/components/Footer.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { children } = $props();
</script>

<svelte:head>
	<title>{m.app_title()}</title>
	<link rel="icon" href="/logos/untron/icon.svg" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
	/>
</svelte:head>

<Navbar />

<main class="mx-auto max-w-5xl px-4">
	{@render children()}
</main>

<Footer />
