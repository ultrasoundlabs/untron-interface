<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button/index.js';
	import { m } from '$lib/paraglide/messages.js';
	import { connection } from '$lib/wagmi/connectionStore';
	import { connectWallet } from '$lib/wagmi/wallet';
	import { TOKEN_METADATA, getChainById } from '$lib/config/swapConfig';
	import { createSwapStore, setSwapStoreContext } from '$lib/stores/swapStore.svelte';
	import type { EvmStablecoin, SwapValidationError, TokenChainBalance } from '$lib/types/swap';
	import { formatAtomicToDecimal } from '$lib/math/amounts';
	import type { SwapServiceErrorCode } from '$lib/types/errors';
	import { config as wagmiConfig } from '$lib/wagmi/config';
	import { readContracts } from '@wagmi/core';
	import { erc20Abi } from 'viem';
	import AmountRow from './AmountRow.svelte';
	import RecipientField from './RecipientField.svelte';
	import SwapDetails from './SwapDetails.svelte';
	import TokenChainDialog from './TokenChainDialog.svelte';
	import { goto } from '$app/navigation';

	// Create and provide the swap store
	const swapStore = createSwapStore();
	setSwapStoreContext(swapStore);

	// Dialog state
	let showTokenDialog = $state(false);
	let recipientTouched = $state(false);
	let tokenDialogMode = $state<'evm' | 'tron'>('evm');

	// User balances for EVM→Tron flow
	let userBalances = $state<TokenChainBalance[]>([]);
	let userPickedPairManually = $state(false);
	let lastCapabilitiesVersion = $state<string | null>(null);

	// Keep swap store informed about the current wallet balance for the selected source token
	$effect(() => {
		if (swapStore.isFromTron) {
			swapStore.setWalletBalanceAtomic(null);
			return;
		}

		const currentBalance = userBalances.find(
			(item) =>
				item.chain.chainId === swapStore.evmChain.chainId &&
				item.token.symbol === swapStore.evmToken.symbol
		);

		swapStore.setWalletBalanceAtomic(currentBalance?.balance ?? null);
	});

	// Track wallet connection changes
	$effect(() => {
		if ($connection.isConnected && $connection.address) {
			swapStore.prefillRecipientFromWallet($connection.address);
			// Fetch balances when wallet connects
			loadBalances();
			userPickedPairManually = false;
		} else {
			swapStore.clearRecipientOnWalletDisconnect();
			userBalances = [];
			userPickedPairManually = false;
			recipientTouched = false;
		}
	});

	// Reload balances once capabilities arrive (wallet may already be connected)
	$effect(() => {
		const version = swapStore.capabilities?.capabilitiesVersion ?? null;
		if (!version || version === lastCapabilitiesVersion) return;
		lastCapabilitiesVersion = version;
		if ($connection.isConnected && $connection.address) {
			loadBalances();
		}
	});

	// Auto-select the (chain, token) pair with the highest balance for EVM→Tron
	$effect(() => {
		if (
			!swapStore.isToTron ||
			!$connection.isConnected ||
			userPickedPairManually ||
			userBalances.length === 0
		) {
			return;
		}

		const [firstBalance] = userBalances;
		if (!firstBalance) return;

		const bestBalance = userBalances.reduce((top, candidate) =>
			BigInt(candidate.balance) > BigInt(top.balance) ? candidate : top
		);

		const alreadySelected =
			swapStore.evmChain.chainId === bestBalance.chain.chainId &&
			swapStore.evmToken.symbol === bestBalance.token.symbol;

		if (!alreadySelected) {
			swapStore.setEvmChainAndToken(bestBalance.chain.chainId, bestBalance.token.symbol);
		}
	});

	async function loadBalances() {
		if (!$connection.address) return;

		try {
			const pairs = swapStore.getSupportedEvmSourcePairs();
			if (pairs.length === 0) {
				userBalances = [];
				return;
			}

			const contracts = pairs.map((p) => ({
				abi: erc20Abi,
				address: p.contractAddress,
				functionName: 'balanceOf' as const,
				args: [$connection.address as `0x${string}`],
				chainId: p.chainId
			}));

			const results = await readContracts(wagmiConfig, {
				contracts,
				allowFailure: true
			});

			const balances: TokenChainBalance[] = [];

			for (let i = 0; i < pairs.length; i++) {
				const pair = pairs[i]!;
				const chain = getChainById(pair.chainId);
				if (!chain) continue;

				const tokenMeta = TOKEN_METADATA[pair.token];

				const raw = results[i];
				const value = raw?.status === 'success' ? raw.result : 0n;
				const balanceAtomic = value.toString();

				balances.push({
					chain,
					token: {
						...tokenMeta,
						address: pair.contractAddress,
						decimals: pair.decimals
					},
					balance: balanceAtomic,
					formattedBalance: formatAtomicToDecimal(balanceAtomic, pair.decimals, {
						maxFractionDigits: 6,
						useGrouping: true,
						trimTrailingZeros: true
					})
				});
			}

			userBalances = balances;
		} catch (error) {
			console.error('Failed to load balances:', error);
			userBalances = [];
		}
	}

	// Computed values for the UI
	const sourceToken = $derived(swapStore.isFromTron ? swapStore.tronToken : swapStore.evmToken);
	const sourceChain = $derived(swapStore.isFromTron ? undefined : swapStore.evmChain);
	const destToken = $derived(swapStore.isFromTron ? swapStore.evmToken : swapStore.tronToken);
	const destChain = $derived(swapStore.isFromTron ? swapStore.evmChain : undefined);
	const destDisplayAmount = $derived(
		swapStore.quote?.estimatedToAmount
			? formatAtomicToDecimal(swapStore.quote.estimatedToAmount, destToken.decimals, {
					maxFractionDigits: 6,
					trimTrailingZeros: true,
					useGrouping: false
				})
			: ''
	);

	function mapValidationErrorToMessage(error: SwapValidationError | undefined): string | null {
		if (!error) return null;

		switch (error.code) {
			case 'AMOUNT_REQUIRED':
				return m.swap_enter_amount();
			case 'AMOUNT_INVALID':
				return m.swap_invalid_input();
			case 'AMOUNT_ZERO':
				return m.swap_amount_must_be_positive();
			case 'AMOUNT_TOO_LOW':
				return m.swap_amount_too_low();
			case 'AMOUNT_TOO_HIGH':
				return m.swap_amount_too_high();
			case 'RECIPIENT_REQUIRED':
				return m.swap_enter_recipient();
			case 'RECIPIENT_INVALID_EVM':
				return m.swap_recipient_invalid_evm();
			case 'RECIPIENT_INVALID_TRON':
				return m.swap_recipient_invalid_tron();
			default:
				return m.swap_invalid_input();
		}
	}

	// Validation errors
	const amountError = $derived(
		mapValidationErrorToMessage(swapStore.validationErrors.find((e) => e.field === 'amount'))
	);

	const recipientError = $derived(
		mapValidationErrorToMessage(swapStore.validationErrors.find((e) => e.field === 'recipient'))
	);

	const recipientErrorToShow = $derived(
		recipientError && (recipientTouched || !!swapStore.recipientAddress) ? recipientError : null
	);

	function mapSubmitErrorCodeToMessage(code: SwapServiceErrorCode | null): string | null {
		if (!code) return null;

		switch (code) {
			case 'UNSUPPORTED_CHAIN':
				return m.swap_error_unsupported_chain();
			case 'UNSUPPORTED_TOKEN':
				return m.swap_error_unsupported_token();
			case 'INVALID_AMOUNT':
				return m.swap_error_invalid_amount();
			case 'AMOUNT_TOO_LOW':
				return m.swap_amount_too_low();
			case 'AMOUNT_TOO_HIGH':
				return m.swap_amount_too_high();
			case 'SIGNING_SESSION_UNSUPPORTED':
			case 'SESSION_NOT_FOUND':
			case 'SIGNING_SESSION_INCOMPLETE':
				return m.swap_error_generic();
			default:
				return m.swap_error_generic();
		}
	}

	const submitErrorMessage = $derived(mapSubmitErrorCodeToMessage(swapStore.submitErrorCode));

	// Button state
	const buttonLabel = $derived.by(() => {
		if (!$connection.isConnected) return m.wallet_connect_wallet();
		if (swapStore.isCreatingOrder) {
			return m.swap_creating_order();
		}
		if (!swapStore.amount) return m.swap_enter_amount();
		if (!swapStore.recipientAddress) return m.swap_enter_recipient();
		if (!swapStore.isValid) return m.swap_invalid_input();
		if (swapStore.isLoadingQuote) return m.swap_getting_quote();
		return m.swap_button();
	});

	const isButtonDisabled = $derived(
		swapStore.isBusy || (!$connection.isConnected ? false : !swapStore.canSubmit)
	);

	async function handleSwap() {
		if (!$connection.isConnected) {
			try {
				await connectWallet();
			} catch (err) {
				console.error('Connect wallet failed:', err);
			}
			return;
		}

		recipientTouched = true;

		const walletAddress = $connection.address as `0x${string}` | undefined;
		const orderId = await swapStore.createOrder(walletAddress);
		if (orderId) {
			goto(`/order/${orderId}`);
		}
	}

	function handleFlip() {
		swapStore.flipSides();
		recipientTouched = false;
	}

	function openTokenDialog(mode: 'evm' | 'tron') {
		tokenDialogMode = mode;
		showTokenDialog = true;
	}

	function handleTokenSelect(chainId: number, tokenSymbol: string) {
		userPickedPairManually = true;
		swapStore.setEvmChainAndToken(chainId, tokenSymbol as EvmStablecoin);
		recipientTouched = false;
		showTokenDialog = false;
	}

	function handleTronTokenSelect(tokenSymbol: string) {
		swapStore.setTronTokenSymbol(tokenSymbol as EvmStablecoin);
		recipientTouched = false;
		showTokenDialog = false;
	}

	// Placeholder for the amount input
	function getPlaceholder(): string {
		return '0.00';
	}
</script>

<div class="mx-auto w-full max-w-md" in:fly={{ y: 20, duration: 300, delay: 100 }}>
	<!-- Swap Card -->
	<div class="rounded-3xl p-4">
		{#if swapStore.isLoadingCapabilities && !swapStore.capabilities}
			<!-- Capabilities Skeleton (prevents flashing unsupported defaults) -->
			<div class="space-y-4">
				<div class="rounded-4xl bg-white p-6 dark:bg-zinc-900">
					<div class="mb-2 flex items-center justify-between">
						<div class="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
						<div class="h-7 w-14 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
					</div>
					<div class="flex items-center gap-3">
						<div class="h-10 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
						<div
							class="ml-auto h-10 w-36 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700"
						></div>
					</div>
				</div>

				<div class="flex justify-center">
					<div class="h-10 w-10 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"></div>
				</div>

				<div class="rounded-4xl bg-white p-6 dark:bg-zinc-900/90">
					<div class="mb-2 flex items-center justify-between">
						<div class="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
					</div>
					<div class="flex items-center gap-3">
						<div class="h-10 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
						<div
							class="ml-auto h-10 w-36 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700"
						></div>
					</div>
				</div>

				<div class="rounded-xl bg-white p-4 dark:bg-zinc-800">
					<div class="mb-2 h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
					<div class="h-12 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700"></div>
				</div>

				<div class="h-12 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"></div>
			</div>
		{:else}
			<!-- Source Row -->
			<AmountRow
				isSource={true}
				isTron={swapStore.isFromTron}
				amount={swapStore.amount}
				placeholder={getPlaceholder()}
				token={sourceToken}
				chain={sourceChain}
				onAmountChange={(amt: string) => swapStore.setAmount(amt)}
				onMaxClick={() => swapStore.setMaxAmount()}
				onTokenSelect={() => openTokenDialog(swapStore.isFromTron ? 'tron' : 'evm')}
			/>
			{#if amountError && swapStore.amount}
				<p class="mt-2 text-sm text-red-500 dark:text-red-400">{amountError}</p>
			{/if}

			<!-- Flip Button -->
			<div class="relative z-10 -my-4 flex justify-center">
				<button
					type="button"
					onclick={handleFlip}
					class="group rounded-xl border-4 border-white bg-zinc-100 p-2 transition-all duration-150 hover:bg-zinc-200 active:scale-95 dark:border-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700"
					title={m.swap_flip_direction()}
				>
					<svg
						class="h-5 w-5 text-zinc-500 transition-transform duration-200 group-hover:rotate-180 dark:text-zinc-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
						/>
					</svg>
				</button>
			</div>

			<!-- Destination Row -->
			<AmountRow
				isSource={false}
				isTron={swapStore.isToTron}
				amount={destDisplayAmount}
				token={destToken}
				chain={destChain}
				isLoading={swapStore.isLoadingQuote}
				onTokenSelect={() => openTokenDialog(swapStore.isToTron ? 'tron' : 'evm')}
			/>

			<!-- Recipient Field -->
			<div class="mt-4">
				<RecipientField
					address={swapStore.recipientAddress}
					isLocked={swapStore.recipientLocked}
					isTronAddress={swapStore.isToTron}
					error={recipientErrorToShow ?? undefined}
					connectedWallet={!swapStore.isToTron ? $connection.address : undefined}
					onAddressChange={(addr) => {
						recipientTouched = true;
						swapStore.setRecipient(addr);
					}}
					onLock={() => {
						recipientTouched = true;
						swapStore.lockRecipient();
					}}
					onClear={() => {
						recipientTouched = true;
						swapStore.clearRecipient();
					}}
					onUseConnectedWallet={() => {
						recipientTouched = true;
						if ($connection.address) {
							swapStore.setRecipientToWallet($connection.address);
						}
					}}
					onBlur={() => {
						recipientTouched = true;
					}}
				/>
			</div>

			<!-- Swap Details -->
			<div class="mt-4">
				<SwapDetails
					quote={swapStore.quote}
					isLoading={swapStore.isLoadingQuote}
					sourceDecimals={sourceToken.decimals}
					destDecimals={destToken.decimals}
					sourceSymbol={sourceToken.symbol}
					destSymbol={destToken.symbol}
				/>
			</div>

			<!-- Swap Button -->
			<div class="mt-4">
				<Button
					onclick={handleSwap}
					disabled={isButtonDisabled}
					class="h-12 w-full rounded-xl text-base font-semibold transition-all duration-150"
					size="lg"
				>
					{#if swapStore.isCreatingOrder}
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
							{buttonLabel}
						</span>
					{:else}
						{buttonLabel}
					{/if}
				</Button>
			</div>

			<!-- Submission Error -->
			{#if submitErrorMessage}
				<div
					class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
					in:fade={{ duration: 150 }}
				>
					{submitErrorMessage}
				</div>
			{/if}

			<!-- Error Display -->
			{#if swapStore.quoteError}
				<div
					class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
					in:fade={{ duration: 150 }}
				>
					{swapStore.quoteError}
				</div>
			{/if}

			{#if swapStore.capabilitiesError}
				<div
					class="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-200"
					in:fade={{ duration: 150 }}
				>
					{swapStore.capabilitiesError}
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Token/Chain Selection Dialog -->
<TokenChainDialog
	bind:open={showTokenDialog}
	mode={tokenDialogMode}
	direction={swapStore.direction}
	currentChainId={swapStore.evmChain.chainId}
	currentToken={swapStore.evmToken.symbol}
	currentTronToken={swapStore.tronToken.symbol}
	availableTokens={tokenDialogMode === 'tron'
		? swapStore.getSupportedTronTokens()
		: swapStore.getSupportedTokenSymbols()}
	getChainsForToken={(token, dir) => swapStore.getSupportedChainsForToken(token, dir)}
	balances={userBalances}
	onSelect={handleTokenSelect}
	onSelectTron={handleTronTokenSelect}
/>
