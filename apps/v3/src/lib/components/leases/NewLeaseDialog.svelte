<script lang="ts">
	import { goto } from '$app/navigation';
	import { getAddress } from 'viem';
	import {
		createLease,
		findLeaseIdByReceiverSalt,
		getProtocolInfo,
		type CreateLeaseRequest
	} from '$lib/untron/api';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Alert from '$lib/components/ui/alert';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import {
		formatAddress,
		formatPpmAsPercent,
		formatUsdtAtomic6,
		getTokenAlias
	} from '$lib/untron/format';
	import {
		getChainLabel,
		getChainMeta,
		getTargetChainOptions,
		getTargetTokenOptions
	} from '$lib/untron/routes';
	import CopyButton from '$lib/components/common/CopyButton.svelte';

	type Props = {
		open?: boolean;
		disabled?: boolean;
		lessee?: `0x${string}` | null;
		onCreated?: (leaseId: string | null) => void;
	};

	let { open = $bindable(false), disabled = false, lessee = null, onCreated }: Props = $props();

	let protocolInfo = $state<Awaited<ReturnType<typeof getProtocolInfo>> | null>(null);
	let pending = $state(false);
	let errorMessage = $state<string | null>(null);
	let resultJson = $state<string | null>(null);
	let initializedDefaults = $state(false);

	let payoutConfigMode = $state<'fixed' | 'changeable'>('fixed');

	let receiverSalt = $state('');
	let durationSeconds = $state('');
	let targetChainId = $state('');
	let targetToken = $state('');
	let beneficiary = $state('');

	function getSelectedPair() {
		if (!protocolInfo || !targetChainId || !targetToken) return null;
		const chainId = Number(targetChainId);
		if (!Number.isFinite(chainId)) return null;
		return (
			protocolInfo.supportedPairs.find(
				(p) =>
					p.target_chain_id === chainId &&
					p.target_token.toLowerCase() === targetToken.toLowerCase()
			) ?? null
		);
	}

	function setDefaultsFromWallet() {
		if (!lessee) return;
		beneficiary ||= lessee;
	}

	function checksum(value: string, label: string): `0x${string}` {
		try {
			return getAddress(value) as `0x${string}`;
		} catch {
			throw new Error(`Invalid ${label} (expected EVM address)`);
		}
	}

	function defaultDurationSecondsForUi(maxDurationSeconds: number): number {
		const base = 600;
		if (maxDurationSeconds === 0) return base;
		return Math.max(1, Math.min(base, maxDurationSeconds));
	}

	$effect(() => {
		if (!open) {
			initializedDefaults = false;
			return;
		}
		if (!open) return;
		void (async () => {
			protocolInfo ??= await getProtocolInfo();
			setDefaultsFromWallet();
			if (!initializedDefaults) {
				durationSeconds = String(defaultDurationSecondsForUi(protocolInfo.maxDurationSeconds));
				initializedDefaults = true;
			}

			const chains = getTargetChainOptions(
				protocolInfo.supportedPairs,
				protocolInfo.deprecatedTargetChains
			);
			if (!targetChainId) targetChainId = chains[0] ?? '';
			const tokens = getTargetTokenOptions(
				protocolInfo.supportedPairs,
				targetChainId,
				protocolInfo.deprecatedTargetChains
			);
			if (!targetToken) targetToken = tokens[0] ?? '';
		})();
	});

	$effect(() => {
		if (!open || !protocolInfo) return;
		const tokens = getTargetTokenOptions(
			protocolInfo.supportedPairs,
			targetChainId,
			protocolInfo.deprecatedTargetChains
		);
		if (tokens.length === 0) {
			targetToken = '';
			return;
		}
		const current = targetToken;
		const matched = current
			? (tokens.find((t) => t.toLowerCase() === current.toLowerCase()) ?? null)
			: null;
		if (!matched) {
			targetToken = tokens[0];
			return;
		}
		// Normalize casing to match an actual option value.
		targetToken = matched;
	});

	async function submit() {
		if (!lessee) {
			errorMessage = 'Connect a wallet to create a lease.';
			return;
		}
		if (!protocolInfo) {
			errorMessage = 'Protocol config is not loaded yet.';
			return;
		}
		if (!targetChainId || !targetToken) {
			errorMessage = 'Select a target chain and token.';
			return;
		}
		const duration = Number(durationSeconds.trim());
		if (!Number.isFinite(duration) || !Number.isInteger(duration) || duration <= 0) {
			errorMessage = 'Invalid duration_seconds (expected a positive integer).';
			return;
		}
		if (protocolInfo.maxDurationSeconds !== 0 && duration > protocolInfo.maxDurationSeconds) {
			errorMessage = `Duration exceeds max_duration_seconds (${protocolInfo.maxDurationSeconds}).`;
			return;
		}
		const chainIdNum = Number(targetChainId);
		if (!Number.isFinite(chainIdNum) || !Number.isInteger(chainIdNum) || chainIdNum <= 0) {
			errorMessage = 'Invalid target_chain_id (expected a positive integer).';
			return;
		}

		try {
			pending = true;
			errorMessage = null;
			resultJson = null;

			const beneficiaryChecksum = checksum(beneficiary.trim(), 'beneficiary');
			const tokenChecksum = checksum(targetToken, 'target token');
			const lesseeChecksum = checksum(lessee, 'connected wallet');

			const body: CreateLeaseRequest = {
				duration_seconds: duration,
				target_chain_id: chainIdNum,
				target_token: tokenChecksum,
				beneficiary: beneficiaryChecksum
			};

			if (payoutConfigMode === 'changeable') body.lessee = lesseeChecksum;

			if (receiverSalt.trim().length) body.receiver_salt = receiverSalt.trim() as `0x${string}`;

			const res = await createLease(body);

			let foundLeaseId: string | null = null;
			for (let i = 0; i < 10; i++) {
				foundLeaseId = await findLeaseIdByReceiverSalt({
					receiverSalt: res.receiver_salt,
					lessee: payoutConfigMode === 'changeable' ? lesseeChecksum : null
				});
				if (foundLeaseId) break;
				await new Promise((r) => setTimeout(r, 1000));
			}

			resultJson = JSON.stringify({ ...res, lease_id: foundLeaseId }, null, 2);
			onCreated?.(foundLeaseId);

			if (foundLeaseId) {
				open = false;
				await goto(`/leases/${foundLeaseId}`);
			}
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : String(err);
		} finally {
			pending = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[560px]">
		<Dialog.Header>
			<Dialog.Title>New lease</Dialog.Title>
			<Dialog.Description>Creates a lease via backend realtor (`POST /realtor`).</Dialog.Description
			>
		</Dialog.Header>

		<div class="grid gap-4">
			<div class="grid gap-2">
				<Label>Payout config</Label>
				<div class="flex flex-col gap-2">
					<div class="inline-flex w-full rounded-md border p-1">
						<Button
							variant={payoutConfigMode === 'fixed' ? 'secondary' : 'ghost'}
							size="sm"
							class="flex-1"
							onclick={() => (payoutConfigMode = 'fixed')}
							disabled={disabled || pending}
						>
							Fixed
						</Button>
						<Button
							variant={payoutConfigMode === 'changeable' ? 'secondary' : 'ghost'}
							size="sm"
							class="flex-1"
							onclick={() => (payoutConfigMode = 'changeable')}
							disabled={disabled || pending}
						>
							Changeable
						</Button>
					</div>
					<div class="text-xs text-muted-foreground">
						{#if payoutConfigMode === 'fixed'}
							The lease’s payout settings (target chain/token + beneficiary) are frozen at creation
							and cannot be updated later.
						{:else}
							The connected wallet becomes the lessee and can update payout settings later using an
							EIP-712 signature.
							{#if protocolInfo && protocolInfo.arbitraryLesseeFlatFee > 0}
								This incurs an additional flat fee of {formatUsdtAtomic6(
									protocolInfo.arbitraryLesseeFlatFee
								) ?? protocolInfo.arbitraryLesseeFlatFee} USDT.
							{/if}
						{/if}
					</div>
				</div>
			</div>

			<div class="grid gap-2">
				<Label for="lessee">Lessee</Label>
				<div class="flex items-center gap-2">
					<Input
						id="lessee"
						value={payoutConfigMode === 'changeable'
							? (lessee ?? '')
							: '0x0000000000000000000000000000000000000000'}
						disabled
					/>
					<CopyButton
						value={payoutConfigMode === 'changeable'
							? (lessee ?? null)
							: '0x0000000000000000000000000000000000000000'}
						label="Copy lessee"
					/>
				</div>
			</div>

			<div class="grid gap-2">
				<Label for="beneficiary">Beneficiary</Label>
				<div class="flex items-center gap-2">
					<Input
						id="beneficiary"
						placeholder="0x…"
						bind:value={beneficiary}
						disabled={disabled || pending}
					/>
					<CopyButton value={beneficiary} label="Copy beneficiary" disabled={disabled || pending} />
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label for="durationSeconds">Duration (seconds)</Label>
					<div class="flex items-center gap-2">
						<Input
							id="durationSeconds"
							inputmode="numeric"
							placeholder="600"
							bind:value={durationSeconds}
							disabled={disabled || pending}
						/>
						<CopyButton
							value={durationSeconds}
							label="Copy duration seconds"
							disabled={disabled || pending}
						/>
					</div>
				</div>
				<div class="grid gap-2">
					<Label for="targetChainId">Target chain id</Label>
					<div class="flex items-center gap-2">
						<Select.Root type="single" bind:value={targetChainId} disabled={disabled || pending}>
							<Select.Trigger class="w-full" aria-label="Target chain id">
								{#if targetChainId}
									{@const meta = getChainMeta(targetChainId)}
									<span data-slot="select-value" class="flex w-full items-center gap-2">
										<span class="flex-1 truncate">{meta?.name ?? targetChainId}</span>
										<span class="font-mono text-xs text-muted-foreground">{targetChainId}</span>
									</span>
								{:else}
									<span data-slot="select-value" class="text-muted-foreground">Select chain…</span>
								{/if}
							</Select.Trigger>
							<Select.Content>
								{#each protocolInfo ? getTargetChainOptions(protocolInfo.supportedPairs, protocolInfo.deprecatedTargetChains) : [] as chainId (chainId)}
									{@const meta = getChainMeta(chainId)}
									<Select.Item value={chainId} label={getChainLabel(chainId)}>
										<span class="inline-flex w-full items-center gap-2">
											<span class="flex-1 truncate">{meta?.name ?? chainId}</span>
											<span class="font-mono text-xs text-muted-foreground">{chainId}</span>
										</span>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				<div class="grid gap-2">
					<Label for="targetToken">Target token</Label>
					<div class="flex items-center gap-2">
						<Select.Root
							type="single"
							bind:value={targetToken}
							disabled={disabled || pending || !targetChainId}
						>
							<Select.Trigger class="w-full" aria-label="Target token">
								{#if targetToken}
									{@const alias = getTokenAlias(targetToken)}
									<span data-slot="select-value" class="flex w-full items-center gap-2">
										<span class="flex-1 truncate">{alias ?? formatAddress(targetToken, 10, 6)}</span
										>
										{#if alias}
											<span class="font-mono text-xs text-muted-foreground">
												{formatAddress(targetToken, 8, 6)}
											</span>
										{/if}
									</span>
								{:else}
									<span data-slot="select-value" class="text-muted-foreground">Select token…</span>
								{/if}
							</Select.Trigger>
							<Select.Content>
								{#each protocolInfo ? getTargetTokenOptions(protocolInfo.supportedPairs, targetChainId, protocolInfo.deprecatedTargetChains) : [] as token (token)}
									{@const alias = getTokenAlias(token)}
									<Select.Item
										value={token}
										label={alias
											? `${alias} (${formatAddress(token, 10, 6)})`
											: formatAddress(token, 10, 6)}
									>
										<span class="inline-flex w-full items-center gap-2">
											<span class="flex-1 truncate">{alias ?? formatAddress(token, 10, 6)}</span>
											<span class="font-mono text-xs text-muted-foreground">
												{formatAddress(token, 8, 6)}
											</span>
										</span>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label for="receiverSalt">Receiver salt (optional)</Label>
					<div class="flex items-center gap-2">
						<Input
							id="receiverSalt"
							placeholder="0x… (32 bytes)"
							bind:value={receiverSalt}
							disabled={disabled || pending}
						/>
					</div>
				</div>
			</div>

			{#if protocolInfo && targetChainId && targetToken}
				{@const pair = getSelectedPair()}
				{#if pair}
					{@const extraFlat =
						payoutConfigMode === 'changeable' ? protocolInfo.arbitraryLesseeFlatFee : 0}
					{@const totalFlat = pair.effective_flat_fee + extraFlat}
					<div class="rounded-lg border bg-muted/20 p-3 text-xs">
						<div class="font-medium">Effective fees</div>
						<div class="mt-1 grid gap-0.5">
							<div class="font-mono text-muted-foreground">
								fee: {formatPpmAsPercent(pair.effective_fee_ppm) ?? `${pair.effective_fee_ppm} ppm`}
							</div>
							<div class="font-mono text-muted-foreground">
								flat: {formatUsdtAtomic6(totalFlat) ?? totalFlat} USDT
							</div>
							{#if extraFlat > 0}
								<div class="font-mono text-muted-foreground/80">
									includes +{formatUsdtAtomic6(extraFlat) ?? extraFlat} USDT (changeable payout config)
								</div>
							{/if}
						</div>
					</div>
				{/if}
			{/if}

			{#if errorMessage}
				<Alert.Root variant="destructive">
					<Alert.Title>Lease creation failed</Alert.Title>
					<Alert.Description>{errorMessage}</Alert.Description>
				</Alert.Root>
			{/if}

			{#if resultJson}
				<div class="grid gap-2">
					<div class="flex items-center justify-between">
						<Label>Result</Label>
						<CopyButton value={resultJson} label="Copy result JSON" />
					</div>
					<Textarea value={resultJson} readonly class="min-h-[120px] font-mono text-xs" />
				</div>
			{/if}
		</div>

		<Dialog.Footer class="mt-2">
			<Button variant="outline" onclick={() => (open = false)} disabled={pending}>Cancel</Button>
			<Button onclick={submit} disabled={disabled || pending || !lessee}>
				<PlusIcon />
				{pending ? 'Creating…' : 'Create lease'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
