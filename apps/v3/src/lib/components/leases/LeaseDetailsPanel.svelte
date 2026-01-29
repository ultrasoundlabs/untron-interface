<script lang="ts">
	import * as Card from '@untron/ui/card';
	import { Button } from '@untron/ui/button';
	import * as Dialog from '@untron/ui/dialog';
	import AddressWithCopy from '$lib/components/address/AddressWithCopy.svelte';
	import type { SqlRow } from '$lib/untron/types';
	import {
		formatAddress,
		formatFeesPpmAndFlat,
		formatHexShort,
		formatNumberish,
		formatUnixSeconds,
		formatUnixSecondsLocal,
		formatUnixSecondsRelative,
		getBeneficiary,
		getFlatFee,
		getIsActive,
		getIsNukeableYet,
		getLeaseFeePpm,
		getLeaseId,
		getLessee,
		getNukeableAfter,
		getReceiverEvm,
		getReceiverTron,
		getTargetChainId,
		getTargetToken,
		getTokenAlias
	} from '$lib/untron/format';
	import { getChainMeta } from '$lib/untron/routes';
	import FileJsonIcon from '@lucide/svelte/icons/file-json';
	import { Textarea } from '@untron/ui/textarea';
	import CopyableValue from '$lib/components/common/CopyableValue.svelte';
	import CopyButton from '$lib/components/common/CopyButton.svelte';

	type Props = {
		lease: SqlRow;
	};

	let { lease }: Props = $props();

	let rawOpen = $state(false);
	const rawJson = $derived(JSON.stringify(lease, null, 2));

	function getReceiverSalt(row: SqlRow): string | null {
		const v = row.receiver_salt ?? row.receiverSalt;
		return typeof v === 'string' ? v : null;
	}

	function getLeaseNonce(row: SqlRow): string | null {
		const v = row.lease_nonce ?? row.leaseNonce;
		if (typeof v === 'string') return v;
		if (typeof v === 'number') return String(v);
		return null;
	}
</script>

<Card.Root>
	<Card.Header class="flex-row items-start justify-between gap-3">
		<div class="space-y-1">
			<Card.Title class="text-base">Lease details</Card.Title>
			<Card.Description>Extended view for debugging and ops.</Card.Description>
		</div>
		<Button variant="outline" size="sm" onclick={() => (rawOpen = true)}>
			<FileJsonIcon />
			Raw
		</Button>
	</Card.Header>

	<Card.Content class="space-y-4">
		<div class="grid gap-3">
			<div class="grid grid-cols-2 gap-2 text-sm">
				<div class="text-muted-foreground">Lease id</div>
				<div class="font-sans">{getLeaseId(lease) ?? '—'}</div>

				<div class="text-muted-foreground">Receiver salt</div>
				<div class="font-sans">{formatHexShort(getReceiverSalt(lease)) ?? '—'}</div>

				<div class="text-muted-foreground">Start time</div>
				<div class="font-sans">
					{#if lease.start_time !== undefined}
						{@const start = formatUnixSeconds(lease.start_time)}
						<CopyableValue
							value={start}
							display={formatUnixSecondsRelative(lease.start_time) ??
								start ??
								formatNumberish(lease.start_time)}
							title={formatUnixSecondsLocal(lease.start_time) ?? undefined}
							copyValue={start ?? formatNumberish(lease.start_time)}
							label="Copy start time"
						/>
					{:else}
						—
					{/if}
				</div>

				<div class="text-muted-foreground">Nukeable after</div>
				<div class="font-sans">
					<CopyableValue
						value={getNukeableAfter(lease)}
						display={formatUnixSecondsRelative(getNukeableAfter(lease)) ??
							formatNumberish(getNukeableAfter(lease))}
						title={formatUnixSecondsLocal(getNukeableAfter(lease)) ?? undefined}
						copyValue={formatNumberish(getNukeableAfter(lease))}
						label="Copy nukeable after"
					/>
				</div>

				<div class="text-muted-foreground">Lease nonce</div>
				<div class="font-sans">
					<CopyableValue
						value={getLeaseNonce(lease)}
						display={formatNumberish(getLeaseNonce(lease))}
						copyValue={formatNumberish(getLeaseNonce(lease))}
						label="Copy lease nonce"
					/>
				</div>

				<div class="text-muted-foreground">Status</div>
				<div class="font-sans">
					{#if getIsNukeableYet(lease) === true}
						expired
					{:else if getIsActive(lease) === true}
						active
					{:else if getIsActive(lease) === false}
						inactive
					{:else}
						—
					{/if}
				</div>

				<div class="text-muted-foreground">Fees</div>
				<div class="font-sans">
					<CopyableValue
						value={getLeaseFeePpm(lease)}
						display={formatFeesPpmAndFlat(getLeaseFeePpm(lease), getFlatFee(lease))}
						copyValue={getLeaseFeePpm(lease) ?? ''}
						label="Copy lease fee ppm"
					/>
				</div>
			</div>

			<AddressWithCopy label="Receiver (Tron)" value={getReceiverTron(lease)} />
			<AddressWithCopy label="Receiver (EVM)" value={getReceiverEvm(lease)} />
			<AddressWithCopy label="Lessee (EVM)" value={getLessee(lease)} />
			<AddressWithCopy label="Beneficiary (EVM)" value={getBeneficiary(lease)} />
			<AddressWithCopy label="Target token (EVM)" value={getTargetToken(lease)} />
			<div class="space-y-1">
				<div class="text-xs font-medium text-muted-foreground">Target</div>
				<div class="font-sans text-xs">
					{#if getTargetChainId(lease)}
						{@const chainId = getTargetChainId(lease)!}
						{@const meta = getChainMeta(chainId)}
						{meta?.name ?? chainId} ({chainId})
					{:else}
						—
					{/if}
					<span class="mx-2 text-muted-foreground">·</span>
					{#if getTargetToken(lease)}
						{@const token = getTargetToken(lease)!}
						{@const alias = getTokenAlias(token)}
						{alias ?? formatAddress(token)}
					{:else}
						—
					{/if}
				</div>
			</div>
		</div>
	</Card.Content>
</Card.Root>

<Dialog.Root bind:open={rawOpen}>
	<Dialog.Content class="sm:max-w-[720px]">
		<Dialog.Header>
			<Dialog.Title>Lease row</Dialog.Title>
			<Dialog.Description>Realtor lease view response (raw)</Dialog.Description>
		</Dialog.Header>
		<div class="flex justify-end">
			<CopyButton value={rawJson} label="Copy raw JSON" />
		</div>
		<Textarea value={rawJson} readonly class="min-h-[360px] font-sans text-xs" />
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (rawOpen = false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
