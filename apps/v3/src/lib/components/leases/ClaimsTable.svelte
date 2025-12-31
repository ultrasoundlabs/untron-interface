<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import type { SqlRow } from '$lib/untron/types';
	import {
		formatAddress,
		formatUnixSeconds,
		formatUsdtAtomic6,
		formatPpmAsPercent,
		estimateFeeFromNetAndPpm,
		getTokenAlias
	} from '$lib/untron/format';
	import { getChainMeta } from '$lib/untron/routes';
	import CopyableValue from '$lib/components/common/CopyableValue.svelte';

	type Props = {
		rows: SqlRow[];
		leaseFeePpm?: string | null;
	};

	let { rows, leaseFeePpm = null }: Props = $props();

	function getClaimIndex(row: SqlRow): string | null {
		const v = row.claim_index ?? row.claimIndex;
		if (typeof v === 'string') return v;
		if (typeof v === 'number') return String(v);
		return null;
	}

	function getClaimId(row: SqlRow): string | null {
		const v = row.id ?? row.claim_id ?? row.claimId;
		if (typeof v === 'string') return v;
		if (typeof v === 'number') return String(v);
		return null;
	}

	function getStatus(row: SqlRow): string | null {
		const v = row.status;
		return typeof v === 'string' ? v : null;
	}

	function getTargetToken(row: SqlRow): string | null {
		const v = row.target_token ?? row.targetToken;
		return typeof v === 'string' ? v : null;
	}

	function getTargetChainId(row: SqlRow): string | null {
		const v = row.target_chain_id ?? row.targetChainId;
		if (typeof v === 'string') return v;
		if (typeof v === 'number') return String(v);
		return null;
	}

	function getBeneficiary(row: SqlRow): string | null {
		const v = row.beneficiary;
		return typeof v === 'string' ? v : null;
	}

	function getAmountUsdtAtomic(row: SqlRow): string | null {
		const v = row.amount_usdt ?? row.amountUsdt ?? row.amount;
		if (typeof v === 'string') return v;
		if (typeof v === 'number') return String(v);
		return null;
	}

	function getCreatedAt(row: SqlRow): string | null {
		return formatUnixSeconds(row.created_at_block_timestamp ?? row.createdAtBlockTimestamp);
	}

	function getFilledAt(row: SqlRow): string | null {
		return formatUnixSeconds(row.filled_at_block_timestamp ?? row.filledAtBlockTimestamp);
	}
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Claim</Table.Head>
			<Table.Head>Target</Table.Head>
			<Table.Head>Amount</Table.Head>
			<Table.Head>Beneficiary</Table.Head>
			<Table.Head>Created</Table.Head>
			<Table.Head>Status</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each rows as row (getClaimId(row) ?? `${getClaimIndex(row) ?? ''}-${JSON.stringify(row)}`)}
			<Table.Row>
				<Table.Cell class="space-y-0.5">
					<div class="font-mono">
						{getClaimIndex(row) ?? '—'}
					</div>
					<div class="font-mono text-xs text-muted-foreground">
						{getClaimId(row) ? formatAddress(getClaimId(row)!, 14, 10) : '—'}
					</div>
				</Table.Cell>
				<Table.Cell class="space-y-0.5">
					{#if getTargetChainId(row)}
						{@const chainId = getTargetChainId(row)!}
						{@const meta = getChainMeta(chainId)}
						<div class="font-mono">
							{meta?.name ?? chainId} ({chainId})
						</div>
					{:else}
						<div class="font-mono">—</div>
					{/if}
					{#if getTargetToken(row)}
						{@const token = getTargetToken(row)!}
						{@const alias = getTokenAlias(token)}
						<div class="font-mono text-xs text-muted-foreground">
							<div class="text-foreground">{alias ?? formatAddress(token)}</div>
							<!-- {#if alias}
								<span class="mt-0.5 block">
									<CopyableValue
										value={token}
										display={formatAddress(token, 8, 6)}
										copyValue={token}
										label="Copy target token address"
									/>
								</span>
							{/if} -->
						</div>
					{/if}
				</Table.Cell>
				<Table.Cell class="font-mono">
					{@const amount = getAmountUsdtAtomic(row)}
					{#if amount}
						{@const net = formatUsdtAtomic6(amount) ?? amount}
						<div>
							<CopyableValue
								value={`${net} USDT`}
								display={`${net} USDT`}
								copyValue={`${net} USDT`}
								label="Copy net amount"
							/>
						</div>
						<div class="text-xs text-muted-foreground">
							<!-- <CopyableValue
								value={amount}
								display={`atomic ${amount}`}
								copyValue={amount}
								label="Copy net amount (atomic)"
							/> -->
						</div>
						{#if leaseFeePpm}
							{@const fee = estimateFeeFromNetAndPpm(amount, leaseFeePpm)}
							{#if fee && fee.feeAtomic > 0n}
								<div class="text-xs text-muted-foreground">
									<CopyableValue
										value={`${formatUsdtAtomic6(fee.feeAtomic) ?? fee.feeAtomic.toString(10)} USDT`}
										display={`fee ${formatUsdtAtomic6(fee.feeAtomic) ?? fee.feeAtomic.toString(10)} USDT (${formatPpmAsPercent(leaseFeePpm)})`}
										copyValue={`${formatUsdtAtomic6(fee.feeAtomic) ?? fee.feeAtomic.toString(10)} USDT`}
										label="Copy fee amount"
									/>
								</div>
							{/if}
						{/if}
					{:else}
						—
					{/if}
				</Table.Cell>
				<Table.Cell class="font-mono">
					{@const b = getBeneficiary(row)}
					<CopyableValue
						value={b}
						display={b ? formatAddress(b) : '—'}
						copyValue={b}
						label="Copy beneficiary"
					/>
				</Table.Cell>
				<Table.Cell class="font-mono">
					{@const created = getCreatedAt(row)}
					{#if created}
						<CopyableValue
							value={created}
							display={created}
							copyValue={created}
							label="Copy created timestamp"
						/>
					{:else}
						—
					{/if}
					{#if getStatus(row) === 'filled'}
						{@const filled = getFilledAt(row)}
						{#if filled}
							<div class="text-xs text-muted-foreground">
								<CopyableValue
									value={filled}
									display={`filled ${filled}`}
									copyValue={filled}
									label="Copy filled timestamp"
								/>
							</div>
						{/if}
					{/if}
				</Table.Cell>
				<Table.Cell>
					{#if getStatus(row) === 'pending'}
						<Badge variant="secondary">pending</Badge>
					{:else if getStatus(row) === 'filled'}
						<Badge>filled</Badge>
					{:else}
						<Badge variant="outline">{getStatus(row) ?? 'unknown'}</Badge>
					{/if}
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
