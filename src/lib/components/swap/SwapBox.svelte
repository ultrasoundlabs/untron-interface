<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { m } from '$lib/paraglide/messages.js';
	import { connection } from '$lib/wagmi/connectionStore';
	import { connectWallet } from '$lib/wagmi/wallet';
	import { TRON_USDT } from '$lib/config/swapConfig';
	import { createSwapStore, setSwapStoreContext } from '$lib/stores/swapStore.svelte';
	import type { EvmStablecoin, SwapValidationError, TokenChainBalance } from '$lib/types/swap';
	import { formatAtomicToDecimal } from '$lib/math/amounts';
	import type { SwapServiceErrorCode } from '$lib/types/errors';
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

	// User balances for EVM→Tron flow
	let userBalances = $state<TokenChainBalance[]>([]);
	let userPickedPairManually = $state(false);

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

	// Capacity refresh scheduling
	let capacityTimeout: ReturnType<typeof setTimeout> | null = null;

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

	// Refresh capacity based on server-provided refreshAt, with sensible bounds
	function scheduleCapacityRefresh() {
		if (capacityTimeout) {
			clearTimeout(capacityTimeout);
			capacityTimeout = null;
		}

		const currentCapacity = swapStore.capacity;
		const now = Date.now();

		// Default to 10s if we don't yet have capacity info
		let delay = 10_000;
		if (currentCapacity?.refreshAt && currentCapacity.refreshAt > now) {
			delay = currentCapacity.refreshAt - now;
		}

		// Clamp delay to avoid overly aggressive or extremely slow polling
		const minDelay = 3_000;
		const maxDelay = 60_000;
		delay = Math.min(Math.max(delay, minDelay), maxDelay);

		capacityTimeout = setTimeout(async () => {
			await swapStore.refreshCapacity();
			scheduleCapacityRefresh();
		}, delay);
	}

	// Watch capacity changes and reschedule refresh
	$effect(() => {
		// Accessing capacity here makes this effect depend on it
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		swapStore.capacity;
		scheduleCapacityRefresh();
	});

	// Cleanup on unmount
	onMount(() => {
		return () => {
			if (capacityTimeout) {
				clearTimeout(capacityTimeout);
				capacityTimeout = null;
			}
		};
	});

	async function loadBalances() {
		if (!$connection.address) return;

		try {
			const res = await fetch('/api/balances', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ address: $connection.address })
			});

			if (!res.ok) {
				console.error('Failed to load balances: server returned error', res.status);
				userBalances = [];
				return;
			}

			const data = (await res.json()) as { balances: TokenChainBalance[] };
			userBalances = data.balances ?? [];
		} catch (error) {
			console.error('Failed to load balances:', error);
			userBalances = [];
		}
	}

	// Computed values for the UI
	const sourceToken = $derived(swapStore.isFromTron ? TRON_USDT : swapStore.evmToken);
	const sourceChain = $derived(swapStore.isFromTron ? undefined : swapStore.evmChain);
	const destToken = $derived(swapStore.isFromTron ? swapStore.evmToken : TRON_USDT);
	const destChain = $derived(swapStore.isFromTron ? swapStore.evmChain : undefined);
	const destDisplayAmount = $derived(
		swapStore.quote?.outputAmount
			? formatAtomicToDecimal(swapStore.quote.outputAmount, destToken.decimals, {
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
			return swapStore.isToTron ? m.order_signing() : m.swap_creating_order();
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

		const walletAddress = $connection.address as `0x${string}` | undefined;
		const orderId = await swapStore.createOrder(walletAddress);
		if (orderId) {
			goto(`/order/${orderId}`);
		}
	}

	function handleFlip() {
		swapStore.flipSides();
	}

	function openTokenDialog() {
		showTokenDialog = true;
	}

	function handleTokenSelect(chainId: number, tokenSymbol: string) {
		userPickedPairManually = true;
		swapStore.setEvmChainAndToken(chainId, tokenSymbol as EvmStablecoin);
		showTokenDialog = false;
	}

	// Format placeholder based on capacity
	function getPlaceholder(): string {
		const max = swapStore.maxAvailableAmount;
		if (!max || max === '0') return '0.00';
		const maxFractionDigits = sourceToken.decimals === 0 ? 0 : Math.min(6, sourceToken.decimals);
		return `Max: ${formatAtomicToDecimal(max, sourceToken.decimals, {
			maxFractionDigits,
			trimTrailingZeros: true,
			useGrouping: true
		})}`;
	}
</script>

<div class="mx-auto w-full max-w-md" in:fly={{ y: 20, duration: 300, delay: 100 }}>
	<!-- Swap Card -->
	<div
		class="rounded-3xl border border-zinc-200 bg-white p-4 shadow-xl shadow-zinc-200/50 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/20"
	>
		<!-- Source Row -->
		<AmountRow
			isSource={true}
			isTron={swapStore.isFromTron}
			amount={swapStore.amount}
			placeholder={getPlaceholder()}
			token={sourceToken}
			chain={sourceChain}
			selectorDisabled={swapStore.isFromTron}
			onAmountChange={(amt: string) => swapStore.setAmount(amt)}
			onMaxClick={() => swapStore.setMaxAmount()}
			onTokenSelect={openTokenDialog}
		/>
		{#if amountError && swapStore.amount}
			<p class="mt-2 text-sm text-red-500 dark:text-red-400">{amountError}</p>
		{/if}

		<!-- Flip Button -->
		<div class="relative z-10 -my-2 flex justify-center">
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
			selectorDisabled={swapStore.isToTron}
			isLoading={swapStore.isLoadingQuote}
			onTokenSelect={openTokenDialog}
		/>

		<!-- Recipient Field -->
		<div class="mt-4">
			<RecipientField
				address={swapStore.recipientAddress}
				isLocked={swapStore.recipientLocked}
				isTronAddress={swapStore.isToTron}
				error={recipientError ?? undefined}
				connectedWallet={!swapStore.isToTron ? $connection.address : undefined}
				onAddressChange={(addr) => swapStore.setRecipient(addr)}
				onLock={() => swapStore.lockRecipient()}
				onClear={() => swapStore.clearRecipient()}
				onUseConnectedWallet={() => {
					if ($connection.address) {
						swapStore.setRecipientToWallet($connection.address);
					}
				}}
			/>
		</div>

		<!-- Swap Details -->
		<div class="mt-4">
			<SwapDetails
				quote={swapStore.quote}
				isLoading={swapStore.isLoadingQuote}
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
				class="w-full rounded-xl py-6 text-lg font-semibold transition-all duration-150"
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

		{#if swapStore.capacityError}
			<div
				class="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-200"
				in:fade={{ duration: 150 }}
			>
				{swapStore.capacityError}
			</div>
		{/if}
	</div>
</div>

<!-- Token/Chain Selection Dialog -->
<TokenChainDialog
	bind:open={showTokenDialog}
	direction={swapStore.direction}
	currentChainId={swapStore.evmChain.chainId}
	currentToken={swapStore.evmToken.symbol}
	balances={userBalances}
	onSelect={handleTokenSelect}
/>
