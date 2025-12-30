<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Untron V3</title>
</svelte:head>

<main class="mx-auto max-w-5xl px-4 py-10">
	{@render children()}
</main>
