<script lang="ts">
	import { connection } from '$lib/wagmi/connectionStore';
	import { connectWallet, disconnectWallet } from '$lib/wagmi/wallet';
	import { Button } from '$lib/components/ui/button';
	import { formatAddress } from '$lib/untron/format';

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

<div class="flex flex-col items-end gap-2">
	<div class="flex items-center justify-end gap-3">
		{#if $connection.isConnected && $connection.address}
			<span class="font-mono text-sm text-muted-foreground">
				{formatAddress(String($connection.address), 6, 4)}
			</span>
		{/if}

		{#if $connection.isConnected}
			<Button variant="outline" onclick={onDisconnect} disabled={pending}>
				{pending ? 'Disconnecting…' : 'Disconnect'}
			</Button>
		{:else}
			<Button onclick={onConnect} disabled={pending}>
				{pending ? 'Connecting…' : 'Connect'}
			</Button>
		{/if}
	</div>

	{#if errorMessage}
		<p class="text-xs text-destructive">{errorMessage}</p>
	{/if}
</div>
