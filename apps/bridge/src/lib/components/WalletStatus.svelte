<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { connection } from '$lib/wagmi/connectionStore';
	import { connectWallet, disconnectWallet } from '$lib/wagmi/wallet';
	import { m } from '$lib/paraglide/messages.js';
	import { WALLETS } from '$lib/config/wallets';
	import { page } from '$app/stores';
	import { truncateAddress } from '$lib/utils';

	let copied = $state(false);
	let linkCopied = $state(false);
	let showWalletModal = $state(false);

	async function copyAddress() {
		if ($connection.address) {
			await navigator.clipboard.writeText($connection.address);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		}
	}

	async function copyLink() {
		await navigator.clipboard.writeText($page.url.href);
		linkCopied = true;
		setTimeout(() => (linkCopied = false), 1500);
	}

	async function handleConnect() {
		try {
			await connectWallet();
		} catch (err: unknown) {
			console.error('Connect wallet failed:', err);

			const error = err as { name?: string; message?: string };

			if (typeof window !== 'undefined' && !('ethereum' in window)) {
				showWalletModal = true;
			} else if (error.name === 'ConnectorNotFoundError' || error.message?.includes('not found')) {
				showWalletModal = true;
			}
		}
	}
</script>

{#if $connection.isConnected && $connection.address}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<button
					{...props}
					class="flex items-center gap-2 rounded-xl border-none bg-zinc-50 px-4 py-2 font-mono text-base text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-none dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
				>
					<!-- Green dot indicator -->
					<span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
					{truncateAddress($connection.address ?? '')}
				</button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-48">
			<DropdownMenu.Item onclick={copyAddress}>
				<span class="flex items-center gap-2">
					{#if copied}
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						{m.wallet_copied()}
					{:else}
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
						{m.wallet_copy_address()}
					{/if}
				</span>
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item
				onclick={disconnectWallet}
				class="text-red-500 focus:text-red-500 dark:text-red-400 dark:focus:text-red-400"
			>
				<span class="flex items-center gap-2">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
						/>
					</svg>
					{m.wallet_disconnect()}
				</span>
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<Button
		onclick={handleConnect}
		size="lg"
		variant="secondary"
		class="rounded-xl border-none bg-black text-white shadow-none hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
	>
		{m.wallet_connect_wallet()}
	</Button>

	<Dialog.Root bind:open={showWalletModal}>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>{m.wallet_connect_options_title()}</Dialog.Title>
				<Dialog.Description>
					{m.wallet_connect_options_desc()}
				</Dialog.Description>
			</Dialog.Header>
			<div class="grid gap-4 py-4">
				{#each WALLETS as wallet (wallet.id)}
					<a
						href={wallet.getLink($page.url.href)}
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
					>
						<span class="flex items-center gap-3">
							{#if wallet.icon}
								<img src={wallet.icon} alt={`${wallet.name} icon`} class="h-6 w-6" loading="lazy" />
							{/if}
							<span class="font-medium">{wallet.name}</span>
						</span>
						<svg
							class="h-5 w-5 text-zinc-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							/>
						</svg>
					</a>
				{/each}
				<button
					onclick={copyLink}
					class="flex w-full items-center justify-between rounded-lg border p-4 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
				>
					<span class="flex items-center gap-3">
						<div class="flex h-6 w-6 items-center justify-center">
							<svg
								class="h-5 w-5 text-zinc-900 dark:text-zinc-100"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
								/>
							</svg>
						</div>
						<span class="font-medium">{linkCopied ? m.wallet_copied() : m.wallet_copy_link()}</span>
					</span>
					{#if linkCopied}
						<svg
							class="h-5 w-5 text-emerald-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					{:else}
						<svg
							class="h-5 w-5 text-zinc-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
					{/if}
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}
