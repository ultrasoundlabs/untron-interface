/**
 * Swap store - manages the state for the swap box UI.
 * Uses Svelte 5 runes for reactivity.
 */

import { getContext, setContext } from 'svelte';
import type {
	SwapDirection,
	SwapQuote,
	CapacityInfo,
	SupportedChain,
	SupportedToken,
	EvmStablecoin,
	SwapValidationError,
	Order
} from '$lib/types/swap';
import type { SwapServiceErrorCode } from '$lib/types/errors';
import {
	TRON_USDT,
	getDefaultEvmSelection,
	getChainById,
	getTokenOnChain,
	isTokenAvailableForDirection
} from '$lib/config/swapConfig';
import { signTypedData } from '@wagmi/core';
import { config as wagmiConfig } from '$lib/wagmi/config';
import * as swapService from '$lib/services/swapService';
import {
	parseDecimalToAtomic,
	formatAtomicToDecimal,
	isAmountWithinCapacity
} from '$lib/math/amounts';
import { isValidEvmAddress, isValidTronAddress } from '$lib/validation/addresses';

// ============================================================================
// Types
// ============================================================================

export interface SwapState {
	// Core swap parameters
	direction: SwapDirection;
	evmChain: SupportedChain;
	evmToken: SupportedToken;
	amount: string; // Human-readable decimal string
	amountAtomic: string; // Source token amount in smallest unit

	// Recipient
	recipientAddress: string;
	recipientLocked: boolean;

	// Quote & capacity
	quote: SwapQuote | null;
	capacity: CapacityInfo | null;

	// Loading states
	isLoadingQuote: boolean;
	isLoadingCapacity: boolean;
	isCreatingOrder: boolean;

	// Errors
	quoteError: string | null;
	capacityError: string | null;
	validationErrors: SwapValidationError[];

	// Created order (for navigation)
	createdOrder: Order | null;
}

const SWAP_STORE_KEY = Symbol('swap-store');

// ============================================================================
// Store Implementation
// ============================================================================

export function createSwapStore() {
	const defaultEvm = getDefaultEvmSelection();

	// Core state using $state rune
	let direction = $state<SwapDirection>('TRON_TO_EVM');
	let evmChain = $state<SupportedChain>(defaultEvm.chain);
	let evmToken = $state<SupportedToken>(defaultEvm.token);
	let amount = $state<string>('');
	let amountAtomic = $state<string>('');

	let recipientAddress = $state<string>('');
	let recipientLocked = $state<boolean>(false);

	let quote = $state<SwapQuote | null>(null);
	let capacity = $state<CapacityInfo | null>(null);
	let walletBalanceAtomic = $state<string | null>(null);
	let submitErrorCode = $state<SwapServiceErrorCode | null>(null);

	let isLoadingQuote = $state<boolean>(false);
	let isLoadingCapacity = $state<boolean>(false);
	let isCreatingOrder = $state<boolean>(false);

	let quoteError = $state<string | null>(null);
	let capacityError = $state<string | null>(null);

	let createdOrder = $state<Order | null>(null);

	// Whether we should avoid auto-prefilling the recipient from the connected wallet
	// (e.g. after the user manually cleared the prefilled bubble)
	let walletRecipientAutofillDisabled = $state<boolean>(false);

	// Debounce timer for quote fetching
	let quoteDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Request IDs for guarding against stale async responses
	let quoteRequestId = 0;
	let capacityRequestId = 0;

	// ============================================================================
	// Derived Values
	// ============================================================================

	const isFromTron = $derived(direction === 'TRON_TO_EVM');
	const isToTron = $derived(direction === 'EVM_TO_TRON');

	const isBusy = $derived(isLoadingQuote || isLoadingCapacity || isCreatingOrder);

	// Source and destination info for display
	const sourceInfo = $derived(
		isFromTron
			? { type: 'tron' as const, token: TRON_USDT }
			: { type: 'evm' as const, chain: evmChain, token: evmToken }
	);

	const destinationInfo = $derived(
		isFromTron
			? { type: 'evm' as const, chain: evmChain, token: evmToken }
			: { type: 'tron' as const, token: TRON_USDT }
	);

	function getSourceDecimals(): number {
		return isFromTron ? TRON_USDT.decimals : evmToken.decimals;
	}

	// Validation
	const validationErrors = $derived.by(() => {
		const errors: SwapValidationError[] = [];

		// Amount validation
		if (!amount) {
			errors.push({
				field: 'amount',
				code: 'AMOUNT_REQUIRED'
			});
		} else {
			const parsed = parseDecimalToAtomic(amount, getSourceDecimals(), { strict: true });
			if (!parsed) {
				errors.push({
					field: 'amount',
					code: 'AMOUNT_INVALID'
				});
			} else {
				const amountBigInt = parsed.value;
				if (amountBigInt <= 0n) {
					errors.push({
						field: 'amount',
						code: 'AMOUNT_ZERO'
					});
				}
				const capacityCheck = isAmountWithinCapacity(amountBigInt, capacity);
				if (capacityCheck.tooLow) {
					errors.push({
						field: 'amount',
						code: 'AMOUNT_TOO_LOW'
					});
				}
				if (capacityCheck.tooHigh) {
					errors.push({
						field: 'amount',
						code: 'AMOUNT_TOO_HIGH'
					});
				}
			}
		}

		// Recipient validation
		if (!recipientAddress) {
			errors.push({
				field: 'recipient',
				code: 'RECIPIENT_REQUIRED'
			});
		} else {
			if (isFromTron) {
				// EVM address validation (basic)
				if (!isValidEvmAddress(recipientAddress)) {
					errors.push({
						field: 'recipient',
						code: 'RECIPIENT_INVALID_EVM'
					});
				}
			} else {
				// Tron address validation (basic - starts with T, 34 chars)
				if (!isValidTronAddress(recipientAddress)) {
					errors.push({
						field: 'recipient',
						code: 'RECIPIENT_INVALID_TRON'
					});
				}
			}
		}

		return errors;
	});

	const isValid = $derived(validationErrors.length === 0);

	const canSubmit = $derived(isValid && !isBusy && quote !== null && !!amountAtomic);

	// Max available amount (min of capacity and user balance if applicable)
	const maxAvailableAmount = $derived.by(() => {
		if (isFromTron) {
			return capacity?.maxAmount ?? '0';
		}

		const capacityMax = capacity?.maxAmount ?? null;
		const walletBalance = walletBalanceAtomic;

		if (capacityMax && walletBalance) {
			const capacityBig = BigInt(capacityMax);
			const walletBig = BigInt(walletBalance);
			return (walletBig < capacityBig ? walletBig : capacityBig).toString();
		}

		if (walletBalance) {
			return walletBalance;
		}

		return capacityMax ?? '0';
	});

	// ============================================================================
	// Actions
	// ============================================================================

	function setWalletBalanceAtomic(balance: string | null) {
		walletBalanceAtomic = balance;
	}

	function setDirection(newDirection: SwapDirection) {
		if (direction === newDirection) return;

		direction = newDirection;
		submitErrorCode = null;

		// Reset state on direction change
		amount = '';
		amountAtomic = '';
		recipientAddress = '';
		recipientLocked = false;
		walletRecipientAutofillDisabled = false;
		walletBalanceAtomic = null;
		quote = null;
		capacity = null;
		quoteError = null;
		capacityError = null;
		createdOrder = null;

		if (quoteDebounceTimer) {
			clearTimeout(quoteDebounceTimer);
			quoteDebounceTimer = null;
		}

		// Refresh capacity for the new direction/pair
		refreshCapacity();

		// For Tron→EVM, we might want to prefill recipient with connected wallet
		// This is handled externally by the component watching wallet state
	}

	function flipSides() {
		setDirection(isFromTron ? 'EVM_TO_TRON' : 'TRON_TO_EVM');
	}

	function setEvmChainAndToken(chainId: number, tokenSymbol: EvmStablecoin) {
		const chain = getChainById(chainId);
		const token = getTokenOnChain(chainId, tokenSymbol);

		if (!chain || !token) {
			console.error('Invalid chain or token selection:', chainId, tokenSymbol);
			return;
		}

		if (!isTokenAvailableForDirection(chainId, tokenSymbol, direction)) {
			console.error('Token not available for this direction:', tokenSymbol, direction);
			return;
		}

		submitErrorCode = null;
		evmChain = chain;
		evmToken = token;

		// Reset state on pair change
		amount = '';
		amountAtomic = '';
		recipientAddress = '';
		recipientLocked = false;
		walletRecipientAutofillDisabled = false;
		walletBalanceAtomic = null;
		quote = null;
		capacity = null;
		quoteError = null;
		capacityError = null;
		createdOrder = null;

		if (quoteDebounceTimer) {
			clearTimeout(quoteDebounceTimer);
			quoteDebounceTimer = null;
		}

		// Refresh capacity for new pair
		refreshCapacity();
	}

	function scheduleQuoteFetch() {
		if (quoteDebounceTimer) {
			clearTimeout(quoteDebounceTimer);
		}

		if (amountAtomic && recipientAddress) {
			quoteDebounceTimer = setTimeout(() => {
				fetchQuote();
			}, 500);
		} else {
			quote = null;
			quoteError = null;
		}
	}

	function setAmount(newAmount: string) {
		submitErrorCode = null;
		amount = newAmount;
		const parsed = newAmount
			? parseDecimalToAtomic(newAmount, getSourceDecimals(), { strict: true })
			: null;
		amountAtomic = parsed ? parsed.value.toString() : '';

		scheduleQuoteFetch();
	}

	function setMaxAmount() {
		if (!maxAvailableAmount || maxAvailableAmount === '0') return;

		submitErrorCode = null;
		amountAtomic = maxAvailableAmount;
		amount = formatAtomicToDecimal(maxAvailableAmount, getSourceDecimals(), {
			maxFractionDigits: getSourceDecimals(),
			useGrouping: false
		});
		scheduleQuoteFetch();
	}

	function setRecipient(address: string) {
		submitErrorCode = null;
		recipientAddress = address;
		// Run lightweight local validation on every change so the UI can
		// immediately reflect whether the address looks valid, without the
		// user needing to press Enter.
		if (!recipientAddress) {
			recipientLocked = false;
		} else if (isFromTron) {
			// Tron → EVM flow expects an EVM address
			recipientLocked = isValidEvmAddress(recipientAddress);
		} else {
			// EVM → Tron flow expects a Tron address
			recipientLocked = isValidTronAddress(recipientAddress);
		}
	}

	function lockRecipient() {
		if (recipientAddress) {
			recipientLocked = true;

			// If we have an amount, fetch quote
			if (amount) {
				fetchQuote();
			}
		}
	}

	function clearRecipient() {
		submitErrorCode = null;
		recipientAddress = '';
		recipientLocked = false;
		quote = null;
		// User explicitly cleared the recipient bubble; don't immediately auto-prefill it again
		walletRecipientAutofillDisabled = true;
	}

	function prefillRecipientFromWallet(walletAddress: string) {
		// Only prefill for Tron→EVM direction
		if (isFromTron && !recipientLocked && !recipientAddress && !walletRecipientAutofillDisabled) {
			recipientAddress = walletAddress;
			recipientLocked = true;
		}
	}

	/**
	 * Explicitly set the recipient to the connected wallet from a user action
	 * (e.g. clicking "My Wallet"). This should work even if auto-prefill was
	 * previously disabled.
	 */
	function setRecipientToWallet(walletAddress: string) {
		submitErrorCode = null;
		recipientAddress = walletAddress;
		recipientLocked = true;
		walletRecipientAutofillDisabled = false;
	}

	function clearRecipientOnWalletDisconnect() {
		// Only clear if it was prefilled (for Tron→EVM)
		if (isFromTron && recipientLocked) {
			recipientAddress = '';
			recipientLocked = false;
			walletRecipientAutofillDisabled = false;
		}
	}

	// ============================================================================
	// Async Actions
	// ============================================================================

	async function fetchQuote() {
		if (!amountAtomic || !recipientAddress) return;

		try {
			const amountBigInt = BigInt(amountAtomic);
			if (amountBigInt <= 0n) return;
		} catch {
			return;
		}

		const currentRequestId = ++quoteRequestId;
		isLoadingQuote = true;
		quoteError = null;

		try {
			const result = await swapService.fetchQuote({
				direction,
				evmChainId: evmChain.chainId,
				evmToken: evmToken.symbol as EvmStablecoin,
				amount: amountAtomic,
				recipientAddress
			});
			if (currentRequestId !== quoteRequestId) {
				return;
			}
			quote = result;
		} catch (err) {
			if (currentRequestId !== quoteRequestId) {
				return;
			}
			quoteError = err instanceof Error ? err.message : 'Failed to fetch quote';
			quote = null;
		} finally {
			if (currentRequestId === quoteRequestId) {
				isLoadingQuote = false;
			}
		}
	}

	async function refreshCapacity() {
		const currentRequestId = ++capacityRequestId;
		isLoadingCapacity = true;
		capacityError = null;

		try {
			const result = await swapService.fetchCapacity({
				direction,
				evmChainId: evmChain.chainId,
				evmToken: evmToken.symbol as EvmStablecoin
			});
			if (currentRequestId !== capacityRequestId) {
				return;
			}
			capacity = result;
		} catch (err) {
			if (currentRequestId !== capacityRequestId) {
				return;
			}
			capacityError = err instanceof Error ? err.message : 'Failed to fetch capacity';
		} finally {
			if (currentRequestId === capacityRequestId) {
				isLoadingCapacity = false;
			}
		}
	}

	async function createOrder(walletAddress?: `0x${string}`): Promise<Order | null> {
		if (!canSubmit) return null;

		isCreatingOrder = true;
		submitErrorCode = null;

		try {
			let order: Order;
			if (isToTron) {
				if (!walletAddress) {
					throw new Error('Missing wallet address for EVM→Tron signing');
				}
				order = await createEvmToTronOrderViaSigning(walletAddress);
			} else {
				const result = await swapService.createOrder({
					direction,
					evmChainId: evmChain.chainId,
					evmToken: evmToken.symbol as EvmStablecoin,
					amount: amountAtomic,
					recipientAddress
				});
				order = result.order;
			}

			createdOrder = order;
			return order;
		} catch (err) {
			if (err instanceof swapService.SwapServiceError) {
				submitErrorCode = err.code;
			} else {
				submitErrorCode = 'UNKNOWN_ERROR';
			}
			console.error('Failed to create order:', err);
			return null;
		} finally {
			isCreatingOrder = false;
		}
	}

	async function createEvmToTronOrderViaSigning(walletAddress: `0x${string}`): Promise<Order> {
		const sessionResponse = await swapService.createSigningSession({
			direction,
			evmChainId: evmChain.chainId,
			evmToken: evmToken.symbol as EvmStablecoin,
			amount: amountAtomic,
			recipientAddress,
			evmSignerAddress: walletAddress
		});

		let session = sessionResponse.session;
		const payloads = session.eip712Payloads ?? [];

		if (payloads.length === 0 || session.signaturesReceived >= payloads.length) {
			const finalized = await swapService.finalizeSigningSession(session.id);
			return finalized.order;
		}

		for (let i = session.signaturesReceived; i < payloads.length; i++) {
			const payload = payloads[i];

			const signature = await signTypedData(wagmiConfig, {
				account: walletAddress,
				domain: payload.domain as Record<string, unknown>,
				types: payload.types as Record<string, Array<{ name: string; type: string }>>,
				primaryType: payload.primaryType as keyof typeof payload.types,
				message: payload.message as Record<string, unknown>
			});

			const submitResult = await swapService.submitSigningSessionSignatures(session.id, [
				{
					payloadId: payload.id,
					signature
				}
			]);

			session = submitResult.session;
		}

		const finalizeResult = await swapService.finalizeSigningSession(session.id);
		return finalizeResult.order;
	}

	function clearCreatedOrder() {
		createdOrder = null;
	}

	function reset() {
		const defaultEvm = getDefaultEvmSelection();
		direction = 'TRON_TO_EVM';
		evmChain = defaultEvm.chain;
		evmToken = defaultEvm.token;
		amount = '';
		amountAtomic = '';
		recipientAddress = '';
		recipientLocked = false;
		walletRecipientAutofillDisabled = false;
		walletBalanceAtomic = null;
		quote = null;
		capacity = null;
		quoteError = null;
		capacityError = null;
		createdOrder = null;

		if (quoteDebounceTimer) {
			clearTimeout(quoteDebounceTimer);
			quoteDebounceTimer = null;
		}
	}

	// Initial capacity fetch
	refreshCapacity();

	// Return the store interface
	return {
		// State getters (using getters for reactivity)
		get direction() {
			return direction;
		},
		get evmChain() {
			return evmChain;
		},
		get evmToken() {
			return evmToken;
		},
		get amount() {
			return amount;
		},
		get amountAtomic() {
			return amountAtomic;
		},
		get recipientAddress() {
			return recipientAddress;
		},
		get recipientLocked() {
			return recipientLocked;
		},
		get quote() {
			return quote;
		},
		get capacity() {
			return capacity;
		},
		get isLoadingQuote() {
			return isLoadingQuote;
		},
		get isLoadingCapacity() {
			return isLoadingCapacity;
		},
		get isCreatingOrder() {
			return isCreatingOrder;
		},
		get quoteError() {
			return quoteError;
		},
		get capacityError() {
			return capacityError;
		},
		get createdOrder() {
			return createdOrder;
		},

		// Derived getters
		get isFromTron() {
			return isFromTron;
		},
		get isToTron() {
			return isToTron;
		},
		get isBusy() {
			return isBusy;
		},
		get sourceInfo() {
			return sourceInfo;
		},
		get destinationInfo() {
			return destinationInfo;
		},
		get validationErrors() {
			return validationErrors;
		},
		get isValid() {
			return isValid;
		},
		get canSubmit() {
			return canSubmit;
		},
		get maxAvailableAmount() {
			return maxAvailableAmount;
		},
		get submitErrorCode() {
			return submitErrorCode;
		},

		// Actions
		setDirection,
		flipSides,
		setEvmChainAndToken,
		setAmount,
		setMaxAmount,
		setRecipient,
		lockRecipient,
		clearRecipient,
		setRecipientToWallet,
		setWalletBalanceAtomic,
		prefillRecipientFromWallet,
		clearRecipientOnWalletDisconnect,
		fetchQuote,
		refreshCapacity,
		createOrder,
		clearCreatedOrder,
		reset
	};
}

export type SwapStore = ReturnType<typeof createSwapStore>;

// ============================================================================
// Context Helpers
// ============================================================================

export function setSwapStoreContext(store: SwapStore) {
	setContext(SWAP_STORE_KEY, store);
}

export function getSwapStoreContext(): SwapStore {
	return getContext<SwapStore>(SWAP_STORE_KEY);
}
