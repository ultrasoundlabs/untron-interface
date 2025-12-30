<script lang="ts">
	import { derived } from 'svelte/store';
	import { connection } from '$lib/wagmi/connectionStore';
	import { connectWallet, disconnectWallet } from '$lib/wagmi/wallet';

	const accountAddress = derived(connection, ($connection) => $connection.address);
	const chainId = derived(connection, ($connection) => $connection.chainId);
	const isConnected = derived(connection, ($connection) => $connection.isConnected);

	let pending = $state(false);
	let errorMessage = $state<string | null>(null);

	async function onConnect() {
		try {
			pending = true;
			errorMessage = null;
			await connectWallet();
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : String(err);
		} finally {
			pending = false;
		}
	}

	async function onDisconnect() {
		try {
			pending = true;
			errorMessage = null;
			await disconnectWallet();
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : String(err);
		} finally {
			pending = false;
		}
	}
</script>

<section
	class="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950"
>
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="space-y-1">
			<div class="text-sm font-medium">Wallet</div>
			{#if $isConnected}
				<div class="text-sm text-muted-foreground">
					<span class="font-mono">{String($accountAddress)}</span>
					<span class="mx-2 opacity-50">·</span>
					<span>chainId: {$chainId ?? 'unknown'}</span>
				</div>
			{:else}
				<div class="text-sm text-muted-foreground">Not connected</div>
			{/if}
		</div>

		{#if $isConnected}
			<button
				class="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
				onclick={onDisconnect}
				disabled={pending}
			>
				{pending ? 'Disconnecting…' : 'Disconnect'}
			</button>
		{:else}
			<button
				class="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
				onclick={onConnect}
				disabled={pending}
			>
				{pending ? 'Connecting…' : 'Connect wallet'}
			</button>
		{/if}
	</div>

	{#if errorMessage}
		<p class="mt-3 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
	{/if}
</section>
