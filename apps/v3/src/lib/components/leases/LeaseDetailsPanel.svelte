<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import AddressWithCopy from '$lib/components/address/AddressWithCopy.svelte';
	import type { SqlRow } from '$lib/untron/types';
	import {
		formatAddress,
		formatFeesPpmAndFlat,
		formatHexShort,
		formatNumberish,
		getBeneficiary,
		getFlatFee,
		getIsActive,
		getIsNukeableYet,
		getLeaseFeePpm,
		getLeaseId,
		getLessee,
		getNukeableAfter,
		getReceiverTron,
		getTargetChainId,
		getTargetToken,
		getTokenAlias
	} from '$lib/untron/format';
	import { getChainMeta } from '$lib/untron/routes';
	import FileJsonIcon from '@lucide/svelte/icons/file-json';
	import { Textarea } from '$lib/components/ui/textarea';
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

	function getCreatedAt(row: SqlRow): string | null {
		const v = row.created_at_block_timestamp ?? row.createdAtBlockTimestamp ?? row.created_at;
		if (typeof v === 'string') return v;
		if (typeof v === 'number') return String(v);
		return null;
	}

	function getUpdatedAt(row: SqlRow): string | null {
		const v = row.updated_at_block_timestamp ?? row.updatedAtBlockTimestamp ?? row.updated_at;
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
				<div class="font-mono">{getLeaseId(lease) ?? '—'}</div>

				<div class="text-muted-foreground">Receiver salt</div>
				<div class="font-mono">{formatHexShort(getReceiverSalt(lease)) ?? '—'}</div>

				<div class="text-muted-foreground">Nukeable after</div>
				<div class="font-mono">
					<CopyableValue
						value={getNukeableAfter(lease)}
						display={formatNumberish(getNukeableAfter(lease))}
						copyValue={formatNumberish(getNukeableAfter(lease))}
						label="Copy nukeable after"
					/>
				</div>

				<div class="text-muted-foreground">Created at</div>
				<div class="font-mono">
					<CopyableValue
						value={getCreatedAt(lease)}
						display={formatNumberish(getCreatedAt(lease))}
						copyValue={formatNumberish(getCreatedAt(lease))}
						label="Copy created at"
					/>
				</div>

				<div class="text-muted-foreground">Updated at</div>
				<div class="font-mono">
					<CopyableValue
						value={getUpdatedAt(lease)}
						display={formatNumberish(getUpdatedAt(lease))}
						copyValue={formatNumberish(getUpdatedAt(lease))}
						label="Copy updated at"
					/>
				</div>

				<div class="text-muted-foreground">Active</div>
				<div class="font-mono">
					{getIsActive(lease) === null ? '—' : String(getIsActive(lease))}
				</div>

				<div class="text-muted-foreground">Nukeable</div>
				<div class="font-mono">
					{getIsNukeableYet(lease) === null ? '—' : String(getIsNukeableYet(lease))}
				</div>

				<div class="text-muted-foreground">Fees</div>
				<div class="font-mono">
					<CopyableValue
						value={getLeaseFeePpm(lease)}
						display={formatFeesPpmAndFlat(getLeaseFeePpm(lease), getFlatFee(lease))}
						copyValue={getLeaseFeePpm(lease) ?? ''}
						label="Copy lease fee ppm"
					/>
				</div>
			</div>

			<AddressWithCopy label="Receiver (Tron)" value={getReceiverTron(lease)} />
			<AddressWithCopy label="Lessee (EVM)" value={getLessee(lease)} />
			<AddressWithCopy label="Beneficiary (EVM)" value={getBeneficiary(lease)} />
			<AddressWithCopy label="Target token (EVM)" value={getTargetToken(lease)} />
			<div class="space-y-1">
				<div class="text-xs font-medium text-muted-foreground">Target</div>
				<div class="font-mono text-xs">
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
			<Dialog.Description>`untron_v3_lease_full` (raw)</Dialog.Description>
		</Dialog.Header>
		<div class="flex justify-end">
			<CopyButton value={rawJson} label="Copy raw JSON" />
		</div>
		<Textarea value={rawJson} readonly class="min-h-[360px] font-mono text-xs" />
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (rawOpen = false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
