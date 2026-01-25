<script lang="ts">
	import { getProtocolInfo, getLeaseNonce, updatePayoutConfigWithSig } from '$lib/untron/api';
	import { getAddress } from 'viem';
	import {
		buildPayoutConfigUpdateTypedData,
		DEFAULT_EIP712_NAME,
		DEFAULT_EIP712_VERSION,
		signPayoutConfigUpdate
	} from '$lib/untron/signing';
	import type { SqlRow } from '$lib/untron/types';
	import { wagmiConfig } from '$lib/wagmi/exports';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Alert from '$lib/components/ui/alert';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import PenLineIcon from '@lucide/svelte/icons/pen-line';
	import SendIcon from '@lucide/svelte/icons/send';
	import {
		formatAddress,
		getBeneficiary,
		getTargetChainId,
		getTargetToken,
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
		leaseId: string;
		lease: SqlRow | null;
		account: `0x${string}` | null;
		disabled?: boolean;
		onUpdated?: () => void;
	};

	let {
		open = $bindable(false),
		leaseId,
		lease,
		account,
		disabled = false,
		onUpdated
	}: Props = $props();

	let protocolInfo = $state<Awaited<ReturnType<typeof getProtocolInfo>> | null>(null);
	let pendingSign = $state(false);
	let pendingSubmit = $state(false);
	let errorMessage = $state<string | null>(null);
	let resultJson = $state<string | null>(null);

	let targetChainId = $state('');
	let targetToken = $state('');
	let beneficiary = $state('');
	let nonce = $state<string>('');
	let deadline = $state('');
	let signature = $state('');

	const chainOptions = $derived.by(() =>
		protocolInfo
			? getTargetChainOptions(protocolInfo.supportedPairs, protocolInfo.deprecatedTargetChains)
			: []
	);

	const tokenOptions = $derived.by(() =>
		protocolInfo && targetChainId
			? getTargetTokenOptions(
					protocolInfo.supportedPairs,
					targetChainId,
					protocolInfo.deprecatedTargetChains
				)
			: []
	);

	function stringifyWithBigInt(value: unknown): string {
		return JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString(10) : v), 2);
	}

	function checksum(value: string, label: string): `0x${string}` {
		try {
			return getAddress(value) as `0x${string}`;
		} catch {
			throw new Error(`Invalid ${label} (expected EVM address)`);
		}
	}

	function setDefaults() {
		targetChainId ||= getTargetChainId(lease ?? {}) ?? '';
		targetToken ||= getTargetToken(lease ?? {}) ?? '';
		beneficiary ||= getBeneficiary(lease ?? {}) ?? account ?? '';
		nonce ||=
			typeof (lease as Record<string, unknown> | null)?.lease_nonce === 'string'
				? ((lease as Record<string, unknown>).lease_nonce as string)
				: '';

		if (!deadline) {
			const now = Math.floor(Date.now() / 1000);
			deadline = String(now + 10 * 60);
		}
	}

	async function refreshNonce() {
		nonce = await getLeaseNonce(leaseId);
	}

	$effect(() => {
		if (!open) return;
		void (async () => {
			protocolInfo ??= await getProtocolInfo();
			setDefaults();
			if (!nonce) await refreshNonce();
		})();
	});

	$effect(() => {
		if (!open || !protocolInfo) return;
		if (!targetChainId) {
			targetChainId =
				getTargetChainOptions(
					protocolInfo.supportedPairs,
					protocolInfo.deprecatedTargetChains
				)[0] ?? '';
		}
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
		targetToken = matched;
	});

	async function sign() {
		if (!protocolInfo) return;
		if (!protocolInfo.hubChainId) {
			errorMessage = 'Missing PUBLIC_UNTRON_HUB_CHAIN_ID (needed for signing).';
			return;
		}
		if (!account) {
			errorMessage = 'Connect a wallet to sign.';
			return;
		}
		if (!targetChainId || !targetToken) {
			errorMessage = 'Select a target chain and token.';
			return;
		}

		try {
			pendingSign = true;
			errorMessage = null;
			resultJson = null;
			if (!nonce) await refreshNonce();

			const beneficiaryChecksum = checksum(beneficiary, 'beneficiary');
			const tokenChecksum = checksum(targetToken, 'target token');
			signature = await signPayoutConfigUpdate({
				wagmiConfig,
				account,
				context: { hubChainId: protocolInfo.hubChainId, untronV3: protocolInfo.untronV3 },
				leaseId,
				targetChainId,
				targetToken: tokenChecksum,
				beneficiary: beneficiaryChecksum,
				nonce,
				deadline
			});
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : String(err);
		} finally {
			pendingSign = false;
		}
	}

	async function submit() {
		if (!signature.trim().length) {
			errorMessage = 'Missing signature.';
			return;
		}
		if (!targetChainId || !targetToken) {
			errorMessage = 'Select a target chain and token.';
			return;
		}
		const leaseIdNum = Number(leaseId);
		if (!Number.isFinite(leaseIdNum) || !Number.isInteger(leaseIdNum) || leaseIdNum < 0) {
			errorMessage = 'Invalid lease id (expected a non-negative integer).';
			return;
		}
		const targetChainIdNum = Number(targetChainId);
		if (
			!Number.isFinite(targetChainIdNum) ||
			!Number.isInteger(targetChainIdNum) ||
			targetChainIdNum <= 0
		) {
			errorMessage = 'Invalid target chain id (expected a positive integer).';
			return;
		}
		const deadlineNum = Number(deadline);
		if (!Number.isFinite(deadlineNum) || !Number.isInteger(deadlineNum) || deadlineNum <= 0) {
			errorMessage = 'Invalid deadline (expected a positive integer unix timestamp).';
			return;
		}

		try {
			pendingSubmit = true;
			errorMessage = null;
			resultJson = null;

			const beneficiaryChecksum = checksum(beneficiary, 'beneficiary');
			const tokenChecksum = checksum(targetToken, 'target token');

			const res = await updatePayoutConfigWithSig({
				lease_id: leaseIdNum,
				target_chain_id: targetChainIdNum,
				target_token: tokenChecksum,
				beneficiary: beneficiaryChecksum,
				deadline: deadlineNum,
				signature: signature as `0x${string}`
			});

			resultJson = stringifyWithBigInt({
				...res,
				typedData: protocolInfo?.hubChainId
					? buildPayoutConfigUpdateTypedData({
							context: { hubChainId: protocolInfo.hubChainId, untronV3: protocolInfo.untronV3 },
							leaseId,
							targetChainId,
							targetToken: tokenChecksum,
							beneficiary: beneficiaryChecksum,
							nonce,
							deadline
						})
					: null
			});

			onUpdated?.();
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : String(err);
		} finally {
			pendingSubmit = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[620px]">
		<Dialog.Header>
			<Dialog.Title>Update payout config</Dialog.Title>
			<Dialog.Description>
				Signs an EIP-712 `PayoutConfigUpdate` as the lessee, then relays via backend (`POST
				/payout_config`).
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-4">
			<div class="grid gap-1">
				<div class="text-sm font-medium">EIP-712 domain</div>
				<div class="font-mono text-xs text-muted-foreground">
					name: {DEFAULT_EIP712_NAME}, version: {DEFAULT_EIP712_VERSION}
				</div>
			</div>

			<div class="grid gap-2">
				<Label for="nonce">Nonce (onchain)</Label>
				<Input id="nonce" value={nonce} disabled />
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label for="targetChainId">Target chain id</Label>
					<Select.Root
						type="single"
						bind:value={targetChainId}
						disabled={disabled || pendingSign || pendingSubmit}
					>
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
							{#each chainOptions as chainId (chainId)}
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
				<div class="grid gap-2">
					<Label for="deadline">Deadline (unix seconds)</Label>
					<div class="flex items-center gap-2">
						<Input
							id="deadline"
							inputmode="numeric"
							bind:value={deadline}
							disabled={disabled || pendingSign || pendingSubmit}
						/>
						<CopyButton
							value={deadline || null}
							label="Copy deadline"
							disabled={disabled || pendingSign || pendingSubmit}
						/>
					</div>
				</div>
			</div>

			<div class="grid gap-2">
				<Label for="targetToken">Target token</Label>
				<Select.Root
					type="single"
					bind:value={targetToken}
					disabled={disabled || pendingSign || pendingSubmit || !targetChainId}
				>
					<Select.Trigger class="w-full" aria-label="Target token">
						{#if targetToken}
							{@const alias = getTokenAlias(targetToken)}
							<span data-slot="select-value" class="flex w-full items-center gap-2">
								<span class="flex-1 truncate">{alias ?? formatAddress(targetToken, 10, 6)}</span>
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
						{#each tokenOptions as token (token)}
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

			<div class="grid gap-2">
				<Label for="beneficiary">Beneficiary</Label>
				<div class="flex items-center gap-2">
					<Input
						id="beneficiary"
						placeholder="0x…"
						bind:value={beneficiary}
						disabled={disabled || pendingSign || pendingSubmit}
					/>
					<CopyButton
						value={beneficiary || null}
						label="Copy beneficiary"
						disabled={disabled || pendingSign || pendingSubmit}
					/>
				</div>
			</div>

			<div class="grid gap-2">
				<div class="flex items-center justify-between">
					<Label for="signature">Signature</Label>
					<CopyButton value={signature || null} label="Copy signature" />
				</div>
				<Textarea
					id="signature"
					placeholder="0x…"
					bind:value={signature}
					class="min-h-[92px] font-mono text-xs"
					disabled={disabled || pendingSign || pendingSubmit}
				/>
			</div>

			{#if errorMessage}
				<Alert.Root variant="destructive">
					<Alert.Title>Update failed</Alert.Title>
					<Alert.Description>{errorMessage}</Alert.Description>
				</Alert.Root>
			{/if}

			{#if resultJson}
				<div class="grid gap-2">
					<div class="flex items-center justify-between">
						<Label>Result</Label>
						<CopyButton value={resultJson} label="Copy result JSON" />
					</div>
					<Textarea value={resultJson} readonly class="min-h-[140px] font-mono text-xs" />
				</div>
			{/if}
		</div>

		<Dialog.Footer class="mt-2">
			<Button
				variant="outline"
				onclick={() => (open = false)}
				disabled={pendingSign || pendingSubmit}
			>
				Close
			</Button>
			<Button
				variant="outline"
				onclick={sign}
				disabled={disabled || pendingSign || pendingSubmit || !account}
			>
				<PenLineIcon />
				{pendingSign ? 'Signing…' : 'Request signature'}
			</Button>
			<Button
				onclick={submit}
				disabled={disabled || pendingSign || pendingSubmit || !signature.trim().length}
			>
				<SendIcon />
				{pendingSubmit ? 'Relaying…' : 'Submit update'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
