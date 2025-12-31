<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import type { SqlRow } from '$lib/untron/types';
	import { formatAddress, formatNumberish } from '$lib/untron/format';

	type Props = {
		rows: SqlRow[];
	};

	let { rows }: Props = $props();

	function getClaimIndex(row: SqlRow): string | null {
		const v = row.claim_index ?? row.claimIndex;
		if (typeof v === 'string') return v;
		if (typeof v === 'number') return String(v);
		return null;
	}

	function getClaimId(row: SqlRow): string | null {
		const v = row.claim_id ?? row.claimId;
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

	function getAmount(row: SqlRow): string | null {
		const v = row.amount ?? row.amount_atomic ?? row.amountAtomic;
		if (typeof v === 'string') return v;
		if (typeof v === 'number') return String(v);
		return null;
	}
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Claim</Table.Head>
			<Table.Head>Index</Table.Head>
			<Table.Head>Token</Table.Head>
			<Table.Head>Amount</Table.Head>
			<Table.Head>Status</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each rows as row (getClaimId(row) ?? `${getClaimIndex(row) ?? ''}-${JSON.stringify(row)}`)}
			<Table.Row>
				<Table.Cell class="font-mono">{getClaimId(row) ?? '—'}</Table.Cell>
				<Table.Cell class="font-mono">{getClaimIndex(row) ?? '—'}</Table.Cell>
				<Table.Cell class="font-mono">
					{getTargetToken(row) ? formatAddress(getTargetToken(row)!) : '—'}
				</Table.Cell>
				<Table.Cell class="font-mono">{formatNumberish(getAmount(row))}</Table.Cell>
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
