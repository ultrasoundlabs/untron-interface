<script lang="ts">
	import { fade } from 'svelte/transition';
	import { m } from '$lib/paraglide/messages.js';
	import { connection } from '$lib/wagmi/connectionStore';
	import { connectWallet } from '$lib/wagmi/wallet';
	import { Button } from '@untron/ui/button';
	import { formatAtomicToDecimal } from '$lib/math/amounts';
	import { config as wagmiConfig } from '$lib/wagmi/config';
	import { getChainById, getTokenOnChain } from '$lib/config/swapConfig';
	import { parseAssetId, parseCaip2 } from '$lib/utils/caip';
	import { erc20Abi } from 'viem';
	import { getChainId, switchChain, waitForTransactionReceipt, writeContract } from '@wagmi/core';
	import type { BridgeOrder } from '$lib/types/swap';

	interface Props {
		order: BridgeOrder;
	}

	let { order }: Props = $props();

	const deposit = $derived(order.depositRequirement ?? null);

	const parsedAsset = $derived.by(() => {
		if (!deposit) return null;
		return parseAssetId(deposit.assetId);
	});

	const evmChainId = $derived.by(() => {
		const chainId = parsedAsset?.chainId;
		if (!chainId) return null;
		const parsed = parseCaip2(chainId);
		if (!parsed || parsed.chainNamespace !== 'eip155') return null;
		const evmChainId = Number.parseInt(parsed.chainReference, 10);
		return Number.isFinite(evmChainId) ? evmChainId : null;
	});

	const chain = $derived((evmChainId ? getChainById(evmChainId) : undefined) ?? null);

	const tokenContract = $derived.by(() => {
		const addr = parsedAsset?.assetReference;
		if (!addr || !addr.startsWith('0x')) return null;
		return addr as `0x${string}`;
	});

	const tokenSymbol = $derived.by(() => {
		if (!tokenContract || !evmChainId) return null;
		const lower = tokenContract.toLowerCase();
		for (const sym of ['USDT', 'USDC'] as const) {
			const token = getTokenOnChain(evmChainId, sym);
			if (token?.address?.toLowerCase() === lower) return sym;
		}
		return null;
	});

	const expectedAmountHuman = $derived.by(() => {
		if (!deposit) return '';
		// Most stablecoins are 6 decimals; API includes decimals in capabilities, but orders don't.
		// We display a best-effort 6-decimal format.
		return formatAtomicToDecimal(deposit.expectedAmount, 6, {
			maxFractionDigits: 6,
			useGrouping: true
		});
	});

	let isSending = $state(false);
	let txHash = $state<`0x${string}` | null>(null);
	let sendError = $state<string | null>(null);
	let copied = $state(false);
	let timeRemaining = $state('');
	let countdownInterval: ReturnType<typeof setInterval> | null = null;

	async function ensureWalletOnChain(targetChainId: number): Promise<void> {
		const current = await getChainId(wagmiConfig);
		if (current === targetChainId) return;
		await switchChain(wagmiConfig, { chainId: targetChainId });
	}

	function explorerTxUrl(hash: string): string | null {
		if (!chain?.explorerUrl) return null;
		return `${chain.explorerUrl.replace(/\/$/, '')}/tx/${hash}`;
	}

	function updateCountdown() {
		const now = Date.now();
		const expiresAtMs = deposit ? Date.parse(deposit.expiresAt) : 0;
		const remaining = expiresAtMs - now;

		if (!deposit || !Number.isFinite(expiresAtMs) || expiresAtMs <= 0) {
			timeRemaining = '';
			return;
		}

		if (remaining <= 0) {
			timeRemaining = m.order_expired();
			if (countdownInterval) clearInterval(countdownInterval);
			return;
		}

		const minutes = Math.floor(remaining / 60000);
		const seconds = Math.floor((remaining % 60000) / 1000);
		timeRemaining = `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	async function copyAddress() {
		if (!deposit) return;
		await navigator.clipboard.writeText(deposit.address);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	$effect(() => {
		// keep countdown synced with whatever deposit requirement we currently have
		if (countdownInterval) {
			clearInterval(countdownInterval);
			countdownInterval = null;
		}

		if (!deposit) {
			timeRemaining = '';
			return;
		}

		updateCountdown();
		countdownInterval = setInterval(updateCountdown, 1000);

		return () => {
			if (countdownInterval) {
				clearInterval(countdownInterval);
				countdownInterval = null;
			}
		};
	});

	async function sendNow() {
		sendError = null;
		txHash = null;

		if (!deposit || !tokenContract || !evmChainId) {
			sendError = m.order_missing_deposit_info();
			return;
		}

		if (!$connection.isConnected) {
			try {
				await connectWallet();
			} catch (err) {
				console.error('Connect wallet failed:', err);
				sendError = m.swap_error_generic();
			}
			return;
		}

		try {
			isSending = true;
			await ensureWalletOnChain(evmChainId);

			const hash = await writeContract(wagmiConfig, {
				abi: erc20Abi,
				address: tokenContract,
				functionName: 'transfer',
				args: [deposit.address as `0x${string}`, BigInt(deposit.expectedAmount)],
				account: $connection.address as `0x${string}`,
				chainId: evmChainId
			});

			txHash = hash;

			await waitForTransactionReceipt(wagmiConfig, { hash, chainId: evmChainId });
		} catch (err) {
			console.error('Send failed:', err);
			sendError = err instanceof Error ? err.message : m.swap_error_generic();
		} finally {
			isSending = false;
		}
	}
</script>

{#if deposit}
	<div class="mt-6 space-y-4" in:fade={{ duration: 150 }}>
		<div class="rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
			<p class="text-sm text-amber-800 dark:text-amber-200">
				{m.order_evm_deposit_instructions()}
			</p>
		</div>

		<div class="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
			<div class="mb-1 text-sm text-zinc-500 dark:text-zinc-400">{m.order_amount_to_send()}</div>
			<div class="flex items-baseline gap-2">
				<span class="text-2xl font-bold text-zinc-900 dark:text-white">{expectedAmountHuman}</span>
				<span class="text-lg text-zinc-500 dark:text-zinc-400">
					{tokenSymbol ?? m.common_token()}
				</span>
			</div>
			{#if chain}
				<div class="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
					{m.common_on_chain({ chain: chain.name })}
				</div>
			{/if}
		</div>

		<div class="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
			<div class="mb-2 text-sm text-zinc-500 dark:text-zinc-400">{m.order_deposit_address()}</div>
			<div class="flex items-center gap-2">
				<code
					class="flex-1 overflow-hidden rounded-lg bg-zinc-100 px-3 py-2 font-sans text-sm text-ellipsis text-zinc-900 dark:bg-zinc-800 dark:text-white"
				>
					{deposit.address}
				</code>
				<button
					onclick={copyAddress}
					class="shrink-0 rounded-lg border border-zinc-200 p-2 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
					aria-label={m.order_copy_value()}
				>
					{#if copied}
						<svg class="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					{:else}
						<svg class="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
						</svg>
					{/if}
				</button>
			</div>
		</div>

		{#if timeRemaining}
			<div class="flex items-center justify-center gap-2 text-sm">
				<svg class="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span class="text-zinc-500 dark:text-zinc-400">{m.order_time_remaining()}:</span>
				<span class="font-sans font-medium text-zinc-900 dark:text-white">{timeRemaining}</span>
			</div>
		{/if}

		<div class="space-y-3">
			<Button
				onclick={sendNow}
				disabled={isSending || !tokenContract || !evmChainId}
				class="w-full"
			>
				{#if isSending}
					{m.order_sending()}
				{:else}
					{m.order_send_from_wallet()}
				{/if}
			</Button>

			{#if txHash}
				<div
					class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
				>
					<div class="flex items-center justify-between gap-3">
						<span class="font-sans text-xs">{txHash}</span>
						{#if explorerTxUrl(txHash)}
							<a
								href={explorerTxUrl(txHash) ?? '#'}
								target="_blank"
								rel="noreferrer"
								class="shrink-0 text-xs underline underline-offset-2"
							>
								{m.common_view()}
							</a>
						{/if}
					</div>
				</div>
			{/if}

			{#if sendError}
				<div
					class="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
				>
					{sendError}
				</div>
			{/if}
		</div>
	</div>
{/if}
