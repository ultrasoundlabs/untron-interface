<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { m } from '$lib/paraglide/messages.js';
	import { truncateAddress } from '$lib/utils';

	interface Props {
		/** Current recipient address */
		address: string;
		/** Whether the address is locked (shown as a bubble) */
		isLocked: boolean;
		/** Placeholder text */
		placeholder?: string;
		/** Whether this is a Tron address (affects validation display) */
		isTronAddress: boolean;
		/** Validation error message */
		error?: string;
		/** Connected wallet address for "My Wallet" button */
		connectedWallet?: string | null;
		/** Callback when address changes */
		onAddressChange?: (address: string) => void;
		/** Callback when address is locked (on valid entry) */
		onLock?: () => void;
		/** Callback when locked address is cleared */
		onClear?: () => void;
		/** Callback when "My Wallet" button is clicked */
		onUseConnectedWallet?: () => void;
	}

	let {
		address,
		isLocked,
		placeholder,
		isTronAddress,
		error,
		connectedWallet,
		onAddressChange,
		onLock,
		onClear,
		onUseConnectedWallet
	}: Props = $props();

	let inputElement: HTMLInputElement | undefined = $state();
	let isFocused = $state(false);

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		onAddressChange?.(target.value);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && address && !error) {
			onLock?.();
			inputElement?.blur();
		}
	}

	function handleBlur() {
		isFocused = false;
	}

	function handleClear(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		onClear?.();
		// Focus input after clearing
		setTimeout(() => inputElement?.focus(), 50);
	}

	const defaultPlaceholder = $derived(
		isTronAddress ? m.swap_enter_tron_address() : m.swap_enter_evm_address()
	);
</script>

<div class="space-y-2">
	<span class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
		{m.swap_recipient()}
	</span>

	<div
		class="relative rounded-xl border-2 bg-white transition-all duration-150 dark:bg-zinc-800"
		class:border-zinc-200={!isFocused && !error}
		class:dark:border-zinc-700={!isFocused && !error}
		class:border-emerald-500={isFocused && !error}
		class:dark:border-emerald-400={isFocused && !error}
		class:border-red-400={error}
		class:dark:border-red-500={error}
	>
		{#if isLocked && address}
			<!-- Locked Address Bubble -->
			<div
				class="flex items-center gap-2 p-3"
				in:scale={{ duration: 150, start: 0.95 }}
				out:fade={{ duration: 100 }}
			>
				<div
					class="flex flex-1 items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-900/30"
				>
					<!-- Checkmark icon -->
					<svg
						class="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
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

					<!-- Address -->
					<span class="font-mono text-sm text-emerald-800 dark:text-emerald-200" title={address}>
						{truncateAddress(address, isTronAddress ? 8 : 6, isTronAddress ? 6 : 4)}
					</span>

					<!-- Full address on hover tooltip could go here -->
				</div>

				<!-- Clear button -->
				<button
					type="button"
					onclick={handleClear}
					class="shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
					title={m.swap_clear_recipient()}
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		{:else}
			<!-- Input Mode -->
			<div class="relative w-full">
				<input
					bind:this={inputElement}
					type="text"
					value={address}
					placeholder={placeholder ?? defaultPlaceholder}
					oninput={handleInput}
					onkeydown={handleKeyDown}
					onfocus={() => (isFocused = true)}
					onblur={handleBlur}
					class="w-full rounded-xl bg-transparent py-3 pr-28 pl-4 font-mono text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:text-white dark:placeholder-zinc-500"
					in:fade={{ duration: 100 }}
				/>
				{#if connectedWallet && (!address || address !== connectedWallet) && onUseConnectedWallet}
					<div class="absolute top-1/2 right-2 -translate-y-1/2" in:fade={{ duration: 150 }}>
						<button
							type="button"
							onclick={onUseConnectedWallet}
							class="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
						>
							<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
							{m.swap_use_my_wallet()}
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Error Message -->
	{#if error && !isLocked}
		<p
			class="flex items-center gap-1 text-sm text-red-500 dark:text-red-400"
			in:fade={{ duration: 150 }}
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			{error}
		</p>
	{/if}
</div>
