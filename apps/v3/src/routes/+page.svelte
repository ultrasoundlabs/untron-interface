<script lang="ts">
	import { fly } from 'svelte/transition';
	import WalletConnect from '$lib/components/WalletConnect.svelte';
</script>

<div class="space-y-6">
	<h1 class="text-3xl font-bold" in:fly={{ y: -12, duration: 220 }}>Untron V3</h1>
	<p class="text-muted-foreground">
		New SvelteKit static app scaffolded under <code>apps/v3</code>.
	</p>

	<WalletConnect />
</div>
