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
		getReceiverTron,
		getTargetChainId,
		getTargetToken,
		getTokenAlias
	} from '$lib/untron/format';
	import { getChainMeta } from '$lib/untron/routes';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import CopyableValue from '$lib/components/common/CopyableValue.svelte';

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
				<Card.Description>
					<CopyableValue
						value={receiverTron}
						display={receiverTron ?? 'Receiver unknown'}
						copyValue={receiverTron}
						label="Copy receiver (Tron)"
						class="font-mono"
					/>
				</Card.Description>
			</div>
			<div class="flex flex-wrap items-center justify-end gap-1.5">
				{#if isNukeableYet === true}
					<Badge variant="secondary">expired</Badge>
				{:else if isActive === true}
					<Badge>active</Badge>
				{:else if isActive === false}
					<Badge variant="secondary">inactive</Badge>
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
					<div class="font-mono">
						<CopyableValue
							value={lessee}
							display={lessee ? formatAddress(lessee) : '—'}
							copyValue={lessee}
							label="Copy lessee"
						/>
					</div>

					<div class="text-muted-foreground">Beneficiary</div>
					<div class="font-mono">
						<CopyableValue
							value={beneficiary}
							display={beneficiary ? formatAddress(beneficiary) : '—'}
							copyValue={beneficiary}
							label="Copy beneficiary"
						/>
					</div>

					<div class="text-muted-foreground">Target</div>
					<div class="space-y-0.5">
						<div class="font-mono">
							{#if targetChainId}
								{@const meta = getChainMeta(targetChainId)}
								<span>{meta?.name ?? targetChainId} ({targetChainId})</span>
							{:else}
								—
							{/if}
							<span class="mx-2 text-muted-foreground">·</span>
							{#if targetToken}
								{@const alias = getTokenAlias(targetToken)}
								<span>{alias ?? formatAddress(targetToken)}</span>
							{:else}
								—
							{/if}
						</div>
						{#if targetToken}
							{@const alias = getTokenAlias(targetToken)}
							{#if alias}
								<div class="font-mono text-xs text-muted-foreground">
									<CopyableValue
										value={targetToken}
										display={formatAddress(targetToken)}
										copyValue={targetToken}
										label="Copy target token address"
									/>
								</div>
							{/if}
						{/if}
					</div>

					<div class="text-muted-foreground">Fees</div>
					<div class="font-mono">
						<CopyableValue
							value={leaseFeePpm}
							display={formatFeesPpmAndFlat(leaseFeePpm, flatFee)}
							copyValue={leaseFeePpm ?? ''}
							label="Copy lease fee ppm"
						/>
					</div>

					<div class="text-muted-foreground">Nukeable after</div>
					<div class="font-mono">
						<CopyableValue
							value={nukeableAfter}
							display={formatUnixSecondsRelative(nukeableAfter) ?? formatNumberish(nukeableAfter)}
							title={formatUnixSecondsLocal(nukeableAfter) ?? undefined}
							copyValue={typeof nukeableAfter === 'string'
								? nukeableAfter
								: formatNumberish(nukeableAfter)}
							label="Copy nukeable after"
						/>
					</div>
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
