<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import type { SqlRow } from '$lib/untron/types';
	import {
		formatAddress,
		getIsActive,
		getLeaseId,
		getLessee,
		getBeneficiary,
		getReceiverTron,
		getTargetChainId,
		getTargetToken
	} from '$lib/untron/format';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

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
				<Table.Cell class="font-mono">{getLeaseId(row) ?? '—'}</Table.Cell>
				<Table.Cell class="font-mono">{getReceiverTron(row) ?? '—'}</Table.Cell>
				<Table.Cell class="font-mono"
					>{getLessee(row) ? formatAddress(getLessee(row)!) : '—'}</Table.Cell
				>
				<Table.Cell class="font-mono">
					{getBeneficiary(row) ? formatAddress(getBeneficiary(row)!) : '—'}
				</Table.Cell>
				<Table.Cell class="font-mono">
					{getTargetChainId(row) ?? '—'} / {getTargetToken(row)
						? formatAddress(getTargetToken(row)!)
						: '—'}
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
