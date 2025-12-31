<script lang="ts">
	import { updatePayoutConfigWithSig, getProtocol, type ProtocolResponse } from '$lib/untron/api';
	import { readContract } from '@wagmi/core';
	import {
		buildPayoutConfigUpdateTypedData,
		DEFAULT_EIP712_NAME,
		DEFAULT_EIP712_VERSION,
		signPayoutConfigUpdate
	} from '$lib/untron/signing';
	import { untronV3Abi } from '$lib/untron/abi';
	import type { SqlRow } from '$lib/untron/types';
	import { wagmiConfig } from '$lib/wagmi/exports';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Alert from '$lib/components/ui/alert';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import PenLineIcon from '@lucide/svelte/icons/pen-line';
	import SendIcon from '@lucide/svelte/icons/send';
	import { getBeneficiary, getTargetChainId, getTargetToken } from '$lib/untron/format';

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

	let protocol = $state<ProtocolResponse | null>(null);
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

	function stringifyWithBigInt(value: unknown): string {
		return JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString(10) : v), 2);
	}

	function setDefaults(p: ProtocolResponse) {
		targetChainId ||= getTargetChainId(lease ?? {}) ?? String(p.hub.chainId);
		targetToken ||= getTargetToken(lease ?? {}) ?? '';
		beneficiary ||= getBeneficiary(lease ?? {}) ?? account ?? '';

		if (!deadline) {
			const now = Math.floor(Date.now() / 1000);
			deadline = String(now + 10 * 60);
		}
	}

	async function refreshNonce() {
		if (!protocol) return;
		try {
			const nonceValue = await readContract(wagmiConfig, {
				chainId: protocol.hub.chainId,
				address: protocol.hub.contractAddress,
				abi: untronV3Abi,
				functionName: 'leaseNonces',
				args: [BigInt(leaseId)]
			});
			nonce = (nonceValue as bigint).toString(10);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			throw new Error(`Failed to fetch onchain nonce: ${msg}`);
		}
	}

	$effect(() => {
		if (!open) return;
		void (async () => {
			protocol ??= await getProtocol();
			setDefaults(protocol);
			if (!nonce) await refreshNonce();
		})();
	});

	async function sign() {
		if (!protocol) return;
		if (!account) {
			errorMessage = 'Connect a wallet to sign.';
			return;
		}

		try {
			pendingSign = true;
			errorMessage = null;
			resultJson = null;
			if (!nonce) await refreshNonce();
			signature = await signPayoutConfigUpdate({
				wagmiConfig,
				account,
				protocol,
				leaseId,
				targetChainId,
				targetToken: targetToken as `0x${string}`,
				beneficiary: beneficiary as `0x${string}`,
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

		try {
			pendingSubmit = true;
			errorMessage = null;
			resultJson = null;

			const res = await updatePayoutConfigWithSig(leaseId, {
				targetChainId,
				targetToken: targetToken as `0x${string}`,
				beneficiary: beneficiary as `0x${string}`,
				deadline,
				signature: signature as `0x${string}`
			});

			resultJson = stringifyWithBigInt({
				...res,
				typedData: protocol
					? buildPayoutConfigUpdateTypedData({
							protocol,
							leaseId,
							targetChainId,
							targetToken: targetToken as `0x${string}`,
							beneficiary: beneficiary as `0x${string}`,
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
				Signs an EIP-712 `PayoutConfigUpdate` as the lessee, then relays via backend (`PUT
				/leases/:id`).
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
					<Input
						id="targetChainId"
						inputmode="numeric"
						bind:value={targetChainId}
						disabled={disabled || pendingSign || pendingSubmit}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="deadline">Deadline (unix seconds)</Label>
					<Input
						id="deadline"
						inputmode="numeric"
						bind:value={deadline}
						disabled={disabled || pendingSign || pendingSubmit}
					/>
				</div>
			</div>

			<div class="grid gap-2">
				<Label for="targetToken">Target token</Label>
				<Input
					id="targetToken"
					placeholder="0x…"
					bind:value={targetToken}
					disabled={disabled || pendingSign || pendingSubmit}
				/>
			</div>

			<div class="grid gap-2">
				<Label for="beneficiary">Beneficiary</Label>
				<Input
					id="beneficiary"
					placeholder="0x…"
					bind:value={beneficiary}
					disabled={disabled || pendingSign || pendingSubmit}
				/>
			</div>

			<div class="grid gap-2">
				<Label for="signature">Signature</Label>
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
					<Label>Result</Label>
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
