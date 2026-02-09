/**
 * Swap store - manages the state for the swap box UI.
 * Uses Svelte 5 runes for reactivity.
 */

import { getContext, setContext } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import type { components } from '$lib/api/schema';
import { parseAssetId, parseCaip2, toAccountId } from '$lib/utils/caip';
import type {
	BridgeCapabilities,
	BridgeQuote,
	EvmStablecoin,
	SupportedChain,
	SupportedToken,
	SwapDirection,
	SwapValidationError
} from '$lib/types/swap';
import type { SwapServiceErrorCode } from '$lib/types/errors';
import {
	getTronToken,
	getChainById,
	getDefaultEvmSelection,
	getTokenOnChain
} from '$lib/config/swapConfig';
import * as swapService from '$lib/services/swapService';
import {
	formatAtomicToDecimal,
	isAmountWithinBounds,
	parseDecimalToAtomic
} from '$lib/math/amounts';
import { isValidEvmAddress, isValidTronAddress } from '$lib/validation/addresses';
import { getTurnstileToken } from '$lib/services/turnstile';

export interface SwapState {
	direction: SwapDirection;
	evmChain: SupportedChain;
	evmToken: SupportedToken;
	amount: string;
	amountAtomic: string;

	recipientAddress: string;
	recipientLocked: boolean;

	capabilities: BridgeCapabilities | null;
	quote: BridgeQuote | null;

	isLoadingCapabilities: boolean;
	isLoadingQuote: boolean;
	isCreatingOrder: boolean;

	capabilitiesError: string | null;
	quoteError: string | null;
	validationErrors: SwapValidationError[];
}

const SWAP_STORE_KEY = Symbol('swap-store');

const TRON_MAINNET_CAIP2 = 'tron:0x2b6653dc';
const QUOTE_DEBOUNCE_MS = 800;

function toFamilyId(symbol: EvmStablecoin): string {
	return symbol.toLowerCase();
}

function fromFamilyId(familyId: string): EvmStablecoin | null {
	const lower = familyId.toLowerCase();
	if (lower === 'usdt') return 'USDT';
	if (lower === 'usdc') return 'USDC';
	return null;
}

function toEvmCaip2(chainId: number): string {
	return `eip155:${chainId}`;
}

function parseEvmChainIdFromCaip2(chainId: string): number | null {
	const parsed = parseCaip2(chainId);
	if (!parsed || parsed.chainNamespace !== 'eip155') return null;
	const evmChainId = Number.parseInt(parsed.chainReference, 10);
	return Number.isFinite(evmChainId) ? evmChainId : null;
}

function findTronChainId(capabilities: BridgeCapabilities | null): string {
	if (!capabilities) return TRON_MAINNET_CAIP2;
	const tronChainIds = new SvelteSet<string>();
	for (const route of capabilities.routes) {
		if (route.fromChainId.startsWith('tron:')) tronChainIds.add(route.fromChainId);
		if (route.toChainId.startsWith('tron:')) tronChainIds.add(route.toChainId);
	}
	if (tronChainIds.has(TRON_MAINNET_CAIP2)) return TRON_MAINNET_CAIP2;
	return tronChainIds.values().next().value ?? TRON_MAINNET_CAIP2;
}

function getRepresentation(args: {
	capabilities: BridgeCapabilities | null;
	familyId: string;
	chainId: string;
}): { assetId: string; decimals: number } | null {
	const family = args.capabilities?.assetFamilies.find(
		(f) => f.assetFamilyId.toLowerCase() === args.familyId.toLowerCase()
	);
	const rep = family?.representations.find((r) => r.chainId === args.chainId);
	if (!rep) return null;
	return { assetId: rep.assetId, decimals: rep.decimals };
}

function buildSupportedPairs(capabilities: BridgeCapabilities | null): SvelteSet<string> {
	const set = new SvelteSet<string>();
	if (!capabilities) return set;

	for (const route of capabilities.routes) {
		// Tron -> EVM (destination selection is (evmChainId, toFamily))
		if (route.fromChainId.startsWith('tron:') && route.toChainId.startsWith('eip155:')) {
			const evmChainId = parseEvmChainIdFromCaip2(route.toChainId);
			if (!evmChainId) continue;
			if (!getChainById(evmChainId)) continue;
			for (const pair of route.pairs) {
				const token = fromFamilyId(pair.toFamily);
				if (!token) continue;
				if (!getTokenOnChain(evmChainId, token)) continue;
				set.add(`TRON_TO_EVM:${evmChainId}:${token}`);
			}
		}

		// EVM -> Tron (source selection is (evmChainId, fromFamily))
		if (route.fromChainId.startsWith('eip155:') && route.toChainId.startsWith('tron:')) {
			const evmChainId = parseEvmChainIdFromCaip2(route.fromChainId);
			if (!evmChainId) continue;
			if (!getChainById(evmChainId)) continue;
			for (const pair of route.pairs) {
				const token = fromFamilyId(pair.fromFamily);
				if (!token) continue;
				if (!getTokenOnChain(evmChainId, token)) continue;
				set.add(`EVM_TO_TRON:${evmChainId}:${token}`);
			}
		}
	}

	return set;
}

export function createSwapStore() {
	const defaultEvm = getDefaultEvmSelection();

	let direction = $state<SwapDirection>('TRON_TO_EVM');
	let evmChain = $state<SupportedChain>(defaultEvm.chain);
	let evmToken = $state<SupportedToken>(defaultEvm.token);
	let tronToken = $state<EvmStablecoin>('USDT');
	let amount = $state<string>('');
	let amountAtomic = $state<string>('');

	let recipientAddress = $state<string>('');
	let recipientLocked = $state<boolean>(false);
	let recipientLockSource = $state<'wallet' | 'manual' | null>(null);

	let capabilities = $state<BridgeCapabilities | null>(null);
	let quote = $state<BridgeQuote | null>(null);
	let walletBalanceAtomic = $state<string | null>(null);
	// Connected EVM wallet address (used for refundTo on EVM→Tron routes)
	let walletAddress = $state<`0x${string}` | null>(null);
	let submitErrorCode = $state<SwapServiceErrorCode | null>(null);

	let isLoadingCapabilities = $state<boolean>(false);
	let isLoadingQuote = $state<boolean>(false);
	let isCreatingOrder = $state<boolean>(false);

	let capabilitiesError = $state<string | null>(null);
	let quoteError = $state<string | null>(null);

	let walletRecipientAutofillDisabled = $state<boolean>(false);

	let quoteDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	function cancelQuoteDebounce() {
		if (quoteDebounceTimer) {
			clearTimeout(quoteDebounceTimer);
			quoteDebounceTimer = null;
		}
	}

	let quoteRequestId = 0;
	let capabilitiesRequestId = 0;

	const isFromTron = $derived(direction === 'TRON_TO_EVM');
	const isToTron = $derived(direction === 'EVM_TO_TRON');
	const isBusy = $derived(isLoadingCapabilities || isLoadingQuote || isCreatingOrder);

	const tronChainId = $derived(findTronChainId(capabilities));
	const supportedPairs = $derived(buildSupportedPairs(capabilities));

	const isPairSupported = $derived(
		supportedPairs.has(`${direction}:${evmChain.chainId}:${evmToken.symbol}`)
	);

	const tronTokenUi = $derived(getTronToken(tronToken));

	function getSourceDecimals(): number {
		return isFromTron ? tronTokenUi.decimals : evmToken.decimals;
	}

	const amountBounds = $derived.by(() => {
		if (!quote) return null;
		return {
			min: quote.depositDefaults.minAcceptedAmount,
			max: quote.depositDefaults.maxAcceptedAmount
		};
	});

	const validationErrors = $derived.by(() => {
		const errors: SwapValidationError[] = [];

		if (!capabilities) {
			errors.push({ field: 'general', code: 'CAPABILITIES_UNAVAILABLE' });
		}

		if (capabilities && !isPairSupported) {
			errors.push({ field: 'general', code: 'PAIR_UNSUPPORTED' });
		}

		if (!amount) {
			errors.push({ field: 'amount', code: 'AMOUNT_REQUIRED' });
		} else {
			const parsed = parseDecimalToAtomic(amount, getSourceDecimals(), { strict: true });
			if (!parsed) {
				errors.push({ field: 'amount', code: 'AMOUNT_INVALID' });
			} else {
				const amountBigInt = parsed.value;
				if (amountBigInt <= 0n) {
					errors.push({ field: 'amount', code: 'AMOUNT_ZERO' });
				}
				const boundsCheck = isAmountWithinBounds(amountBigInt, amountBounds);
				if (boundsCheck.tooLow) errors.push({ field: 'amount', code: 'AMOUNT_TOO_LOW' });
				if (boundsCheck.tooHigh) errors.push({ field: 'amount', code: 'AMOUNT_TOO_HIGH' });
			}
		}

		if (!recipientAddress) {
			errors.push({ field: 'recipient', code: 'RECIPIENT_REQUIRED' });
		} else {
			if (isFromTron) {
				if (!isValidEvmAddress(recipientAddress)) {
					errors.push({ field: 'recipient', code: 'RECIPIENT_INVALID_EVM' });
				}
			} else {
				if (!isValidTronAddress(recipientAddress)) {
					errors.push({ field: 'recipient', code: 'RECIPIENT_INVALID_TRON' });
				}
			}
		}

		return errors;
	});

	const isValid = $derived(validationErrors.length === 0);

	const canSubmit = $derived(
		isValid && !isBusy && quote !== null && !!amountAtomic && isPairSupported
	);

	const maxAvailableAmount = $derived.by(() => {
		const quoteMax = quote?.depositDefaults.maxAcceptedAmount ?? null;

		if (isFromTron) {
			return quoteMax ?? '0';
		}

		// EVM source: clamp by wallet balance if known
		const walletBal = walletBalanceAtomic;
		if (quoteMax && walletBal) {
			const quoteMaxBig = BigInt(quoteMax);
			const walletBig = BigInt(walletBal);
			return (walletBig < quoteMaxBig ? walletBig : quoteMaxBig).toString();
		}

		return walletBal ?? quoteMax ?? '0';
	});

	function clearQuote() {
		cancelQuoteDebounce();
		quote = null;
		quoteError = null;
		quoteRequestId++;
	}

	function scheduleQuoteFetch() {
		cancelQuoteDebounce();
		quoteDebounceTimer = setTimeout(() => {
			void fetchQuote();
		}, QUOTE_DEBOUNCE_MS);
	}

	function flipSides() {
		direction = isFromTron ? 'EVM_TO_TRON' : 'TRON_TO_EVM';
		clearQuote();
		submitErrorCode = null;
		if (capabilities) {
			ensureSupportedSelection(capabilities, direction);
		}
	}

	function ensureSupportedSelection(caps: BridgeCapabilities, dir: SwapDirection) {
		const pairs = buildSupportedPairs(caps);
		const candidates: string[] = [];

		const current = `${dir}:${evmChain.chainId}:${evmToken.symbol}`;
		candidates.push(current);

		for (const token of ['USDC', 'USDT'] as const) {
			candidates.push(`${dir}:${evmChain.chainId}:${token}`);
		}

		candidates.push(`${dir}:${defaultEvm.chain.chainId}:${defaultEvm.token.symbol}`);

		for (const key of pairs) {
			if (key.startsWith(`${dir}:`)) candidates.push(key);
		}

		const picked = candidates.find((k) => pairs.has(k));
		if (picked) {
			const [, chainIdStr, tokenStr] = picked.split(':');
			const chainId = Number.parseInt(chainIdStr ?? '', 10);
			const token = tokenStr === 'USDT' || tokenStr === 'USDC' ? (tokenStr as EvmStablecoin) : null;
			if (Number.isFinite(chainId) && token) {
				setEvmChainAndToken(chainId, token);
			}
		}

		const supportedTron = getSupportedTronTokens(dir);
		if (supportedTron.length > 0 && !supportedTron.includes(tronToken)) {
			tronToken = supportedTron[0]!;
		}
	}

	function setEvmChainAndToken(chainId: number, tokenSymbol: EvmStablecoin) {
		if (evmChain.chainId === chainId && evmToken.symbol === tokenSymbol) return;

		const nextChain = getChainById(chainId);
		const nextToken = getTokenOnChain(chainId, tokenSymbol);
		if (!nextChain || !nextToken) return;

		evmChain = nextChain;
		evmToken = nextToken;

		clearQuote();
		if (amountAtomic && recipientAddress) scheduleQuoteFetch();
	}

	function setTronTokenSymbol(tokenSymbol: EvmStablecoin) {
		if (tronToken === tokenSymbol) return;
		tronToken = tokenSymbol;
		clearQuote();
		if (amountAtomic && recipientAddress) scheduleQuoteFetch();
	}

	function setAmount(newAmount: string) {
		amount = newAmount;
		submitErrorCode = null;

		const parsed = parseDecimalToAtomic(newAmount, getSourceDecimals(), { strict: false });
		amountAtomic = parsed ? parsed.value.toString() : '';

		clearQuote();
		if (amountAtomic && recipientAddress) scheduleQuoteFetch();
	}

	function setMaxAmount() {
		const maxAtomic = maxAvailableAmount;
		if (!maxAtomic || maxAtomic === '0') return;
		amountAtomic = maxAtomic;
		amount = formatAtomicToDecimal(maxAtomic, getSourceDecimals(), {
			maxFractionDigits: getSourceDecimals(),
			trimTrailingZeros: true,
			useGrouping: false
		});
		clearQuote();
		if (recipientAddress) scheduleQuoteFetch();
	}

	function setRecipient(addr: string) {
		recipientAddress = addr.trim();
		submitErrorCode = null;
		clearQuote();
		if (amountAtomic && recipientAddress) scheduleQuoteFetch();
	}

	function lockRecipient() {
		if (!recipientAddress) return;
		recipientLocked = true;
		recipientLockSource = 'manual';
	}

	function clearRecipient() {
		recipientAddress = '';
		recipientLocked = false;
		recipientLockSource = null;
		walletRecipientAutofillDisabled = true;
		clearQuote();
	}

	function setRecipientToWallet(wallet: string) {
		recipientAddress = wallet;
		recipientLocked = true;
		recipientLockSource = 'wallet';
		walletRecipientAutofillDisabled = false;
		clearQuote();
		if (amountAtomic && recipientAddress) scheduleQuoteFetch();
	}

	function prefillRecipientFromWallet(wallet: string) {
		if (walletRecipientAutofillDisabled) return;
		if (recipientAddress) return;
		if (isToTron) return; // Tron address required; don't prefill with EVM wallet
		setRecipientToWallet(wallet);
	}

	function clearRecipientOnWalletDisconnect() {
		if (recipientLockSource === 'wallet') {
			recipientAddress = '';
			recipientLocked = false;
			recipientLockSource = null;
		}
		walletRecipientAutofillDisabled = false;
		clearQuote();
	}

	function setWalletBalanceAtomic(balance: string | null) {
		walletBalanceAtomic = balance;
	}

	function setWalletAddress(addr: `0x${string}` | null) {
		if (walletAddress === addr) return;
		walletAddress = addr;

		// EVM→Tron quotes require refundTo; when the wallet address changes we should
		// refetch so the backend has the right refund address.
		if (isToTron) {
			clearQuote();
			if (amountAtomic && recipientAddress) scheduleQuoteFetch();
		}
	}

	async function refreshCapabilities() {
		const currentRequestId = ++capabilitiesRequestId;
		isLoadingCapabilities = true;
		capabilitiesError = null;

		try {
			const { capabilities: caps } = await swapService.fetchCapabilities();
			if (currentRequestId !== capabilitiesRequestId) return;
			capabilities = caps;
			ensureSupportedSelection(caps, direction);
		} catch (err) {
			if (currentRequestId !== capabilitiesRequestId) return;
			capabilities = null;
			capabilitiesError = err instanceof Error ? err.message : 'Failed to load capabilities';
		} finally {
			if (currentRequestId === capabilitiesRequestId) {
				isLoadingCapabilities = false;
			}
		}
	}

	function buildQuoteRequest(): components['schemas']['QuoteRequest'] | null {
		if (!capabilities) return null;
		if (!amountAtomic) return null;
		if (!recipientAddress) return null;
		if (!isPairSupported) return null;

		const evmChainCaip2 = toEvmCaip2(evmChain.chainId);

		const tronAsset = getRepresentation({
			capabilities,
			familyId: toFamilyId(tronToken),
			chainId: tronChainId
		});
		if (!tronAsset) return null;

		const evmAsset = getRepresentation({
			capabilities,
			familyId: toFamilyId(evmToken.symbol),
			chainId: evmChainCaip2
		});
		if (!evmAsset) return null;

		if (isFromTron) {
			return {
				fromAssetId: tronAsset.assetId,
				toAssetId: evmAsset.assetId,
				fromAmount: amountAtomic,
				recipient: toAccountId({ chainId: evmChainCaip2, account: recipientAddress })
			};
		}

		// EVM → Tron (one_click / NEAR intents) requires refundTo (origin-chain refund address).
		const refundTo = walletAddress
			? toAccountId({ chainId: evmChainCaip2, account: walletAddress })
			: undefined;

		return {
			fromAssetId: evmAsset.assetId,
			toAssetId: tronAsset.assetId,
			fromAmount: amountAtomic,
			recipient: toAccountId({ chainId: tronChainId, account: recipientAddress }),
			...(refundTo ? { refundTo } : {})
		};
	}

	async function fetchQuote() {
		const request = buildQuoteRequest();
		if (!request) {
			// For EVM→Tron routes, the backend requires refundTo (origin-chain refund address).
			if (isToTron && amountAtomic && recipientAddress && !walletAddress) {
				quote = null;
				quoteError = 'Connect your EVM wallet to get a quote (refund address is required).';
			}
			return;
		}

		try {
			const amt = BigInt(amountAtomic);
			if (amt <= 0n) return;
		} catch {
			return;
		}

		const currentRequestId = ++quoteRequestId;
		isLoadingQuote = true;
		quoteError = null;

		try {
			const result = await swapService.createQuote(request);
			if (currentRequestId !== quoteRequestId) return;
			quote = result;
		} catch (err) {
			if (currentRequestId !== quoteRequestId) return;
			quoteError = err instanceof Error ? err.message : 'Failed to fetch quote';
			quote = null;
		} finally {
			if (currentRequestId === quoteRequestId) {
				isLoadingQuote = false;
			}
		}
	}

	async function createOrder(walletAddress?: `0x${string}`): Promise<string | null> {
		if (!canSubmit || !quote) return null;

		isCreatingOrder = true;
		submitErrorCode = null;

		try {
			const recipientAccountId = buildQuoteRequest()?.recipient;
			if (!recipientAccountId) {
				submitErrorCode = 'INVALID_REQUEST';
				return null;
			}

			const evmChainCaip2 = toEvmCaip2(evmChain.chainId);
			const refundTo =
				isToTron && walletAddress
					? toAccountId({ chainId: evmChainCaip2, account: walletAddress })
					: undefined;

			const idempotencyKey = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
			const clientOrderId = globalThis.crypto?.randomUUID?.() ?? undefined;

			const turnstileToken = await getTurnstileToken();

			const order = await swapService.createOrder({
				quoteId: quote.quoteId,
				recipient: recipientAccountId,
				refundTo,
				idempotencyKey,
				clientOrderId,
				turnstileToken
			});

			// UX reliability: persist last successful order so users can easily resume
			// after refresh/navigation.
			try {
				localStorage.setItem('bridge:lastOrderId', order.orderId);
				localStorage.setItem('bridge:lastOrderCreatedAt', new Date().toISOString());
			} catch {
				// ignore (private mode, disabled storage, etc.)
			}

			return order.orderId;
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

	function getSupportedTokenSymbols(): EvmStablecoin[] {
		const tokens: EvmStablecoin[] = [];
		for (const key of supportedPairs) {
			if (!key.startsWith(`${direction}:`)) continue;
			const tokenStr = key.split(':')[2];
			if (tokenStr === 'USDT' || tokenStr === 'USDC') {
				const token = tokenStr as EvmStablecoin;
				if (!tokens.includes(token)) tokens.push(token);
			}
		}
		return tokens;
	}

	function getSupportedTronTokens(dir: SwapDirection): EvmStablecoin[] {
		if (!capabilities) return [];

		const tokens = new SvelteSet<EvmStablecoin>();

		for (const route of capabilities.routes) {
			if (dir === 'TRON_TO_EVM') {
				if (!route.fromChainId.startsWith('tron:') || !route.toChainId.startsWith('eip155:'))
					continue;
				for (const pair of route.pairs) {
					const token = fromFamilyId(pair.fromFamily);
					if (token) tokens.add(token);
				}
			} else {
				if (!route.fromChainId.startsWith('eip155:') || !route.toChainId.startsWith('tron:'))
					continue;
				for (const pair of route.pairs) {
					const token = fromFamilyId(pair.toFamily);
					if (token) tokens.add(token);
				}
			}
		}

		const ordered: EvmStablecoin[] = [];
		for (const sym of ['USDT', 'USDC'] as const) {
			if (tokens.has(sym)) ordered.push(sym);
		}
		return ordered;
	}

	function getSupportedChainsForToken(token: EvmStablecoin, dir: SwapDirection): SupportedChain[] {
		const ids: number[] = [];
		for (const key of supportedPairs) {
			if (!key.startsWith(`${dir}:`)) continue;
			const [, chainIdStr, tokenStr] = key.split(':');
			if (tokenStr !== token) continue;
			const parsed = Number.parseInt(chainIdStr ?? '', 10);
			if (!Number.isFinite(parsed)) continue;
			ids.push(parsed);
		}
		const uniqueIds: number[] = [];
		for (const id of ids) {
			if (!uniqueIds.includes(id)) uniqueIds.push(id);
		}
		return uniqueIds
			.map((id) => getChainById(id))
			.filter((c): c is SupportedChain => c !== undefined);
	}

	function getSupportedEvmSourcePairs(): Array<{
		chainId: number;
		token: EvmStablecoin;
		assetId: string;
		contractAddress: `0x${string}`;
		decimals: number;
	}> {
		if (!capabilities) return [];

		const pairs: Array<{
			chainId: number;
			token: EvmStablecoin;
			assetId: string;
			contractAddress: `0x${string}`;
			decimals: number;
		}> = [];

		for (const key of supportedPairs) {
			if (!key.startsWith('EVM_TO_TRON:')) continue;
			const [, chainIdStr, tokenStr] = key.split(':');
			const chainId = Number.parseInt(chainIdStr ?? '', 10);
			const token = tokenStr === 'USDT' || tokenStr === 'USDC' ? (tokenStr as EvmStablecoin) : null;
			if (!Number.isFinite(chainId) || !token) continue;
			if (!getChainById(chainId)) continue;

			const rep = getRepresentation({
				capabilities,
				familyId: toFamilyId(token),
				chainId: toEvmCaip2(chainId)
			});
			if (!rep) continue;

			const parsed = parseAssetId(rep.assetId);
			if (!parsed || parsed.chainNamespace !== 'eip155' || parsed.assetNamespace !== 'erc20')
				continue;
			const contractAddress = parsed.assetReference as `0x${string}`;
			pairs.push({ chainId, token, assetId: rep.assetId, contractAddress, decimals: rep.decimals });
		}

		return pairs;
	}

	// Initial capabilities fetch
	void refreshCapabilities();

	return {
		get direction() {
			return direction;
		},
		get evmChain() {
			return evmChain;
		},
		get evmToken() {
			return evmToken;
		},
		get tronToken() {
			return tronTokenUi;
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
		get capabilities() {
			return capabilities;
		},
		get capabilitiesError() {
			return capabilitiesError;
		},
		get quote() {
			return quote;
		},
		get quoteError() {
			return quoteError;
		},
		get submitErrorCode() {
			return submitErrorCode;
		},
		get isLoadingCapabilities() {
			return isLoadingCapabilities;
		},
		get isLoadingQuote() {
			return isLoadingQuote;
		},
		get isCreatingOrder() {
			return isCreatingOrder;
		},
		get isBusy() {
			return isBusy;
		},
		get isFromTron() {
			return isFromTron;
		},
		get isToTron() {
			return isToTron;
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

		flipSides,
		setEvmChainAndToken,
		setTronTokenSymbol,
		setAmount,
		setMaxAmount,
		setRecipient,
		lockRecipient,
		clearRecipient,
		setRecipientToWallet,
		prefillRecipientFromWallet,
		clearRecipientOnWalletDisconnect,
		setWalletBalanceAtomic,
		setWalletAddress,
		refreshCapabilities,
		createOrder,

		// Helpers for UI
		getSupportedTokenSymbols,
		getSupportedChainsForToken,
		getSupportedTronTokens: () => getSupportedTronTokens(direction),
		getSupportedEvmSourcePairs
	};
}

export type SwapStore = ReturnType<typeof createSwapStore>;

export function setSwapStoreContext(store: SwapStore) {
	setContext(SWAP_STORE_KEY, store);
}

export function getSwapStoreContext(): SwapStore {
	const store = getContext<SwapStore>(SWAP_STORE_KEY);
	if (!store) {
		throw new Error('SwapStore context not found');
	}
	return store;
}
