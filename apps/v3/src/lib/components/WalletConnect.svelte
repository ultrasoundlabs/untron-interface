<script lang="ts">
	import { derived } from 'svelte/store';
	import { connection } from '$lib/wagmi/connectionStore';
	import { connectWallet, disconnectWallet } from '$lib/wagmi/wallet';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import PlugIcon from '@lucide/svelte/icons/plug';
	import LogOutIcon from '@lucide/svelte/icons/log-out';

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

<Card.Root>
	<Card.Header class="pb-4">
		<div class="flex items-start justify-between gap-4">
			<div class="space-y-1">
				<Card.Title class="text-base">Wallet</Card.Title>
				{#if $isConnected}
					<Card.Description>
						<span class="font-mono">{String($accountAddress)}</span>
					</Card.Description>
				{:else}
					<Card.Description>Not connected</Card.Description>
				{/if}
			</div>

			{#if $isConnected}
				<Button variant="outline" onclick={onDisconnect} disabled={pending}>
					<LogOutIcon />
					{pending ? 'Disconnecting…' : 'Disconnect'}
				</Button>
			{:else}
				<Button onclick={onConnect} disabled={pending}>
					<PlugIcon />
					{pending ? 'Connecting…' : 'Connect'}
				</Button>
			{/if}
		</div>
	</Card.Header>

	<Card.Content class="space-y-3">
		<div class="flex flex-wrap items-center gap-2 text-sm">
			<Badge variant="secondary">chainId: {$chainId ?? 'unknown'}</Badge>
			{#if $isConnected}
				<Badge variant="outline">connected</Badge>
			{:else}
				<Badge variant="outline">disconnected</Badge>
			{/if}
		</div>

		<Separator />

		{#if errorMessage}
			<Alert.Root variant="destructive">
				<Alert.Title>Wallet error</Alert.Title>
				<Alert.Description>{errorMessage}</Alert.Description>
			</Alert.Root>
		{/if}
	</Card.Content>
</Card.Root>
