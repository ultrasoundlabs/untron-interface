<script lang="ts">
	import QRCode from '@castlenine/svelte-qrcode';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { SqlRow } from '$lib/untron/types';
	import {
		formatAddress,
		formatFeesPpmAndFlat,
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
		getTargetToken
	} from '$lib/untron/format';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	type Props = {
		lease: SqlRow;
	};

	let { lease }: Props = $props();

	const leaseId = $derived(getLeaseId(lease));
	const receiverTron = $derived(getReceiverTron(lease));
	const lessee = $derived(getLessee(lease));
	const beneficiary = $derived(getBeneficiary(lease));
	const targetChainId = $derived(getTargetChainId(lease));
	const targetToken = $derived(getTargetToken(lease));
	const isActive = $derived(getIsActive(lease));
	const isNukeableYet = $derived(getIsNukeableYet(lease));
	const leaseFeePpm = $derived(getLeaseFeePpm(lease));
	const flatFee = $derived(getFlatFee(lease));
	const nukeableAfter = $derived(getNukeableAfter(lease));
</script>

<Card.Root>
	<Card.Header class="pb-4">
		<div class="flex items-start justify-between gap-3">
			<div class="space-y-1">
				<Card.Title class="text-base font-semibold">
					Lease {leaseId ?? '—'}
				</Card.Title>
				<Card.Description class="font-mono">{receiverTron ?? 'Receiver unknown'}</Card.Description>
			</div>
			<div class="flex flex-wrap items-center justify-end gap-1.5">
				{#if isActive === true}
					<Badge>active</Badge>
				{:else if isActive === false}
					<Badge variant="secondary">inactive</Badge>
				{/if}
				{#if isNukeableYet === true}
					<Badge variant="outline">nukeable</Badge>
				{/if}
			</div>
		</div>
	</Card.Header>

	<Card.Content class="space-y-4">
		<div class="grid gap-4 sm:grid-cols-[176px,1fr]">
			<div class="rounded-lg border bg-muted/20 p-3">
				{#if receiverTron}
					<div class="flex items-center justify-center">
						<QRCode data={receiverTron} size={140} errorCorrectionLevel="M" />
					</div>
				{:else}
					<div class="flex h-[140px] items-center justify-center text-xs text-muted-foreground">
						No receiver
					</div>
				{/if}
			</div>

			<div class="grid gap-3">
				<div class="grid grid-cols-2 gap-2 text-sm">
					<div class="text-muted-foreground">Lessee</div>
					<div class="font-mono">{lessee ? formatAddress(lessee) : '—'}</div>

					<div class="text-muted-foreground">Beneficiary</div>
					<div class="font-mono">{beneficiary ? formatAddress(beneficiary) : '—'}</div>

					<div class="text-muted-foreground">Target</div>
					<div class="font-mono">
						{targetChainId ?? '—'} / {targetToken ? formatAddress(targetToken) : '—'}
					</div>

					<div class="text-muted-foreground">Fees</div>
					<div class="font-mono">
						{formatFeesPpmAndFlat(leaseFeePpm, flatFee)}
					</div>

					<div class="text-muted-foreground">Nukeable after</div>
					<div class="font-mono">{formatNumberish(nukeableAfter)}</div>
				</div>

				<div class="flex items-center justify-end">
					<Button
						href={leaseId ? `/leases/${leaseId}` : undefined}
						variant="outline"
						disabled={!leaseId}
					>
						<ExternalLinkIcon />
						Open
					</Button>
				</div>
			</div>
		</div>
	</Card.Content>
</Card.Root>
