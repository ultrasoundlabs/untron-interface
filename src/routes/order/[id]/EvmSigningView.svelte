<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button/index.js';
	import { m } from '$lib/paraglide/messages.js';
	import { connection } from '$lib/wagmi/connectionStore';
	import { connectWallet } from '$lib/wagmi/wallet';
	import type { Order } from '$lib/types/swap';
	import * as swapService from '$lib/services/swapService';

	interface Props {
		order: Order;
	}

	let { order }: Props = $props();

	let currentPayloadIndex = $state(0);
	let isSigning = $state(false);
	let signError = $state<string | null>(null);

	const totalPayloads = $derived(order.eip712Payloads?.length ?? 0);
	const currentPayload = $derived(order.eip712Payloads?.[currentPayloadIndex]);
	const signaturesReceived = $derived(order.signaturesReceived ?? 0);
	const allSigned = $derived(signaturesReceived >= totalPayloads);

	async function handleSign() {
		if (!currentPayload || !$connection.isConnected) return;

		isSigning = true;
		signError = null;

		try {
			const payloadId = currentPayload.id;

			// In a real implementation, this would use wagmi's signTypedData
			await new Promise((resolve) => setTimeout(resolve, 1500));

			await swapService.submitSignatures(order.id, [
				{
					payloadId,
					signature: generateMockSignature()
				}
			]);

			if (currentPayloadIndex < totalPayloads - 1) {
				currentPayloadIndex++;
			}
		} catch (err) {
			signError = err instanceof Error ? err.message : 'Failed to sign';
		} finally {
			isSigning = false;
		}
	}

	async function handleConnect() {
		try {
			await connectWallet();
		} catch (err) {
			console.error('Connect failed:', err);
		}
	}

	function generateMockSignature(): string {
		if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
			return `0x${crypto.randomUUID().replace(/-/g, '')}`;
		}
		return `0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
	}
</script>

{#if order.eip712Payloads && order.eip712Payloads.length > 0}
	<div class="mt-6 space-y-4" in:fade={{ duration: 150 }}>
		<!-- Instructions -->
		<div class="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
			<p class="text-sm text-blue-800 dark:text-blue-200">
				{m.order_evm_signing_instructions()}
			</p>
		</div>

		<!-- Progress -->
		<div class="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
			<div class="mb-3 flex items-center justify-between text-sm">
				<span class="text-zinc-500 dark:text-zinc-400">{m.order_signatures_progress()}</span>
				<span class="font-medium text-zinc-900 dark:text-white">
					{signaturesReceived} / {totalPayloads}
				</span>
			</div>

			<!-- Progress bar -->
			<div class="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
				<div
					class="h-full rounded-full bg-emerald-500 transition-all duration-300"
					style="width: {(signaturesReceived / totalPayloads) * 100}%"
				></div>
			</div>
		</div>

		<!-- Current Payload Info -->
		{#if currentPayload && !allSigned}
			<div class="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
				<div class="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
					{m.order_current_signature()}
				</div>
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
						<span class="font-mono text-sm text-zinc-900 dark:text-white">
							{currentPayload.primaryType}
						</span>
					</div>
					<span class="text-sm text-zinc-500 dark:text-zinc-400">
						on chain {currentPayload.domain.chainId}
					</span>
				</div>
			</div>
		{/if}

		<!-- Sign Button or Connect -->
		<div class="pt-2">
			{#if !$connection.isConnected}
				<Button onclick={handleConnect} class="w-full" size="lg">
					{m.wallet_connect_wallet()}
				</Button>
			{:else if allSigned}
				<div class="flex flex-col items-center gap-2 py-4">
					<svg
						class="h-10 w-10 text-emerald-500"
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
					<p class="text-sm text-zinc-500 dark:text-zinc-400">
						{m.order_all_signatures_complete()}
					</p>
				</div>
			{:else}
				<Button onclick={handleSign} disabled={isSigning} class="w-full" size="lg">
					{#if isSigning}
						<span class="flex items-center gap-2">
							<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							{m.order_signing()}
						</span>
					{:else}
						{m.order_sign_button({ current: currentPayloadIndex + 1, total: totalPayloads })}
					{/if}
				</Button>
			{/if}
		</div>

		<!-- Error -->
		{#if signError}
			<div class="rounded-xl bg-red-50 p-4 dark:bg-red-900/20" in:fade={{ duration: 150 }}>
				<p class="text-sm text-red-600 dark:text-red-400">{signError}</p>
			</div>
		{/if}
	</div>
{/if}
