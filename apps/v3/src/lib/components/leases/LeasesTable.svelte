<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import type { SqlRow } from '$lib/untron/types';
	import {
		formatAddress,
		getTokenAlias,
		getIsActive,
		getLeaseId,
		getLessee,
		getBeneficiary,
		getReceiverTron,
		getTargetChainId,
		getTargetToken
	} from '$lib/untron/format';
	import { getChainMeta } from '$lib/untron/routes';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import CopyableValue from '$lib/components/common/CopyableValue.svelte';

	type Props = {
		rows: SqlRow[];
	};

	let { rows }: Props = $props();
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Lease</Table.Head>
			<Table.Head>Receiver (Tron)</Table.Head>
			<Table.Head>Lessee</Table.Head>
			<Table.Head>Beneficiary</Table.Head>
			<Table.Head>Target</Table.Head>
			<Table.Head>Status</Table.Head>
			<Table.Head class="text-right">Action</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each rows as row (getLeaseId(row) ?? JSON.stringify(row))}
			<Table.Row>
				<Table.Cell class="font-mono">
					{getLeaseId(row) ?? '—'}
				</Table.Cell>
				<Table.Cell class="font-mono">
					<CopyableValue
						value={getReceiverTron(row)}
						display={getReceiverTron(row) ?? '—'}
						copyValue={getReceiverTron(row)}
						label="Copy receiver (Tron)"
					/>
				</Table.Cell>
				<Table.Cell class="font-mono">
					{@const lessee = getLessee(row)}
					<CopyableValue
						value={lessee}
						display={lessee ? formatAddress(lessee) : '—'}
						copyValue={lessee}
						label="Copy lessee"
					/>
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
							{#if alias}
								<span class="mt-0.5 block">
									<CopyableValue
										value={token}
										display={formatAddress(token, 8, 6)}
										copyValue={token}
										label="Copy target token address"
									/>
								</span>
							{/if}
						</div>
					{/if}
				</Table.Cell>
				<Table.Cell>
					{#if getIsActive(row) === true}
						<Badge>active</Badge>
					{:else if getIsActive(row) === false}
						<Badge variant="secondary">inactive</Badge>
					{:else}
						<Badge variant="outline">unknown</Badge>
					{/if}
				</Table.Cell>
				<Table.Cell class="text-right">
					<Button
						variant="ghost"
						size="sm"
						href={getLeaseId(row) ? `/leases/${getLeaseId(row)}` : undefined}
						disabled={!getLeaseId(row)}
					>
						<ExternalLinkIcon />
						Open
					</Button>
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
