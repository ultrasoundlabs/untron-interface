<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { m } from '$lib/paraglide/messages.js';
	import type {
		SwapDirection,
		EvmStablecoin,
		TokenChainBalance,
		SupportedChain
	} from '$lib/types/swap';
	import { TOKEN_METADATA } from '$lib/config/swapConfig';
	import { connection } from '$lib/wagmi/connectionStore';
	import { formatAtomicToDecimal } from '$lib/math/amounts';
	import TokenNetworkIcon from './TokenNetworkIcon.svelte';

	interface Props {
		open: boolean;
		mode: 'evm' | 'tron';
		direction: SwapDirection;
		currentChainId: number;
		currentToken: string;
		currentTronToken?: string;
		availableTokens: EvmStablecoin[];
		getChainsForToken: (token: EvmStablecoin, direction: SwapDirection) => SupportedChain[];
		/** User's token balances (for EVM→Tron flow) */
		balances?: TokenChainBalance[];
		onSelect: (chainId: number, tokenSymbol: string) => void;
		onSelectTron?: (tokenSymbol: string) => void;
	}

	let {
		open = $bindable(),
		mode = 'evm',
		direction,
		currentChainId,
		currentToken,
		currentTronToken,
		availableTokens,
		getChainsForToken,
		balances = [],
		onSelect,
		onSelectTron
	}: Props = $props();

	// Selection state
	let selectedToken = $state<EvmStablecoin | null>(null);
	let step = $state<'balances' | 'token' | 'chain'>('token');

	const isTronMode = $derived(mode === 'tron');
	const isEvmToTron = $derived(direction === 'EVM_TO_TRON');

	// Reset state when dialog opens
	$effect(() => {
		if (open) {
			selectedToken = null;
			if (isTronMode) {
				step = 'token';
				return;
			}
			// For EVM→Tron, start with balances view if wallet connected and has balances
			if (direction === 'EVM_TO_TRON' && $connection.isConnected && balances.length > 0) {
				step = 'balances';
			} else {
				step = 'token';
			}
		}
	});

	const availableChains = $derived(
		!isTronMode && selectedToken ? getChainsForToken(selectedToken, direction) : []
	);

	// Sort balances by amount (descending)
	const sortedBalances = $derived(
		[...balances].sort((a, b) => {
			const aVal = BigInt(a.balance || '0');
			const bVal = BigInt(b.balance || '0');
			if (bVal > aVal) return 1;
			if (bVal < aVal) return -1;
			return 0;
		})
	);

	function handleBalanceClick(item: TokenChainBalance) {
		onSelect(item.chain.chainId, item.token.symbol);
		open = false;
	}

	function handleTokenClick(symbol: EvmStablecoin) {
		if (isTronMode) {
			onSelectTron?.(symbol);
			open = false;
			return;
		}
		selectedToken = symbol;
		step = 'chain';
	}

	function handleChainClick(chainId: number) {
		if (selectedToken) {
			onSelect(chainId, selectedToken);
			open = false;
		}
	}

	function handleBack() {
		if (isTronMode) return;
		if (step === 'chain') {
			step = 'token';
			selectedToken = null;
		} else if (step === 'token' && isEvmToTron && balances.length > 0) {
			step = 'balances';
		}
	}

	function showHypotheticalSelection() {
		if (isTronMode) return;
		step = 'token';
	}

	function formatBalance(balance: string, decimals: number): string {
		return formatAtomicToDecimal(balance, decimals, {
			maxFractionDigits: 6,
			useGrouping: true
		});
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[85vh] overflow-hidden sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>
				{#if step === 'balances'}
					{m.swap_select_from_wallet()}
				{:else if step === 'token'}
					{m.swap_select_token()}
				{:else}
					{m.swap_select_chain()}
				{/if}
			</Dialog.Title>
			<Dialog.Description>
				{#if step === 'balances'}
					{m.swap_select_from_wallet_desc()}
				{:else if step === 'token'}
					{m.swap_select_token_desc()}
				{:else}
					{m.swap_select_chain_desc({ token: selectedToken ?? '' })}
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="max-h-[55vh] overflow-y-auto py-4">
			{#if step === 'balances'}
				<!-- EVM→Tron: Show user's balances first -->
				<div in:fade={{ duration: 150 }}>
					{#if sortedBalances.length > 0}
						<div class="space-y-2">
							{#each sortedBalances as item (item.chain.chainId + '-' + item.token.symbol)}
								{@const isSelected =
									currentChainId === item.chain.chainId && currentToken === item.token.symbol}
								<button
									type="button"
									onclick={() => handleBalanceClick(item)}
									class="flex w-full items-center gap-3 rounded-xl border-2 p-3 transition-all duration-150 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20
									{isSelected
										? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
										: 'border-zinc-200 dark:border-zinc-700'}"
								>
									<!-- Token icon -->
									<TokenNetworkIcon
										className="shrink-0"
										size={40}
										tokenLogoUrl={item.token.logoUrl}
										tokenSymbol={item.token.symbol}
									/>

									<!-- Token & Chain info -->
									<div class="flex flex-1 flex-col items-start">
										<span class="font-medium text-zinc-900 dark:text-white">
											{item.token.symbol}
										</span>
										<span class="text-sm text-zinc-500 dark:text-zinc-400">
											{item.chain.name}
										</span>
									</div>

									<!-- Balance -->
									<div class="text-right">
										<span class="font-medium text-zinc-900 dark:text-white">
											{formatBalance(item.balance, item.token.decimals)}
										</span>
									</div>

									{#if currentChainId === item.chain.chainId && currentToken === item.token.symbol}
										<svg
											class="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
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
									{/if}
								</button>
							{/each}
						</div>
					{/if}

					<!-- Hypothetical selection link -->
					<div class="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
						<button
							type="button"
							onclick={showHypotheticalSelection}
							class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 p-4 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 6v6m0 0v6m0-6h6m-6 0H6"
								/>
							</svg>
							{m.swap_try_hypothetical()}
						</button>
					</div>
				</div>
			{:else if step === 'token'}
				<!-- Token Selection -->
				<div in:fade={{ duration: 150 }}>
					{#if !isTronMode && isEvmToTron && balances.length > 0}
						<!-- Back button for EVM→Tron -->
						<button
							type="button"
							onclick={handleBack}
							class="mb-4 flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 19l-7-7 7-7"
								/>
							</svg>
							{m.swap_back_to_balances()}
						</button>
					{/if}

					<div class="grid grid-cols-3 gap-3">
						{#each availableTokens as symbol (symbol)}
							{@const meta = TOKEN_METADATA[symbol]}
							{@const isTokenSelected = isTronMode
								? currentTronToken === symbol
								: currentToken === symbol}
							<button
								type="button"
								onclick={() => handleTokenClick(symbol)}
								class="flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-150 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20
									{isTokenSelected
									? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
									: 'border-zinc-200 dark:border-zinc-700'}"
							>
								<TokenNetworkIcon
									className="shrink-0"
									size={40}
									tokenLogoUrl={meta.logoUrl}
									tokenSymbol={symbol}
								/>
								<span class="text-sm font-semibold text-zinc-900 dark:text-white">
									{symbol}
								</span>
							</button>
						{/each}
					</div>
				</div>
			{:else if !isTronMode}
				<!-- Chain Selection -->
				<div in:fly={{ x: 20, duration: 200 }}>
					<!-- Back button -->
					<button
						type="button"
						onclick={handleBack}
						class="mb-4 flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7"
							/>
						</svg>
						{m.swap_back_to_tokens()}
					</button>

					<!-- Selected token indicator -->
					<div class="mb-4 flex items-center gap-2 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
						<TokenNetworkIcon
							className="shrink-0"
							size={24}
							tokenLogoUrl={TOKEN_METADATA[selectedToken!].logoUrl}
							tokenSymbol={selectedToken ?? ''}
						/>
						<span class="font-medium text-zinc-900 dark:text-white">{selectedToken}</span>
					</div>

					<!-- Chain list -->
					<div class="space-y-2">
						{#each availableChains as chain (chain.chainId)}
							{@const isChainSelected =
								currentChainId === chain.chainId && currentToken === selectedToken}
							<button
								type="button"
								onclick={() => handleChainClick(chain.chainId)}
								class="flex w-full items-center gap-3 rounded-xl border-2 p-3 transition-all duration-150 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20
									{isChainSelected
									? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
									: 'border-zinc-200 dark:border-zinc-700'}"
							>
								<TokenNetworkIcon
									className="shrink-0"
									size={32}
									tokenLogoUrl={chain.logoUrl}
									tokenSymbol={chain.name}
								/>
								<div class="flex flex-col items-start">
									<span class="font-medium text-zinc-900 dark:text-white">{chain.name}</span>
									{#if chain.isTestnet}
										<span class="text-xs text-amber-600 dark:text-amber-400">
											{m.common_testnet()}
										</span>
									{/if}
								</div>
								{#if isChainSelected}
									<svg
										class="ml-auto h-5 w-5 text-emerald-600 dark:text-emerald-400"
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
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
