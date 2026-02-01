<script lang="ts">
	import * as Table from '@untron/ui/table';
	import { Badge } from '@untron/ui/badge';
	import { Button } from '@untron/ui/button';
	import CopyableValue from '$lib/components/common/CopyableValue.svelte';
	import type { UsdtDepositTx } from '$lib/untron/api';
	import {
		formatHexShort,
		formatUnixSecondsLocalMinute,
		formatUnixSecondsRelativeDetailed,
		formatUsdtAtomic6,
		formatAddress,
		parseUnixSeconds
	} from '$lib/untron/format';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import { getBestLinkedClaimStatus, normalizeLinkedClaims } from './linkedClaims';

	type Props = {
		rows: UsdtDepositTx[];
	};

	let { rows }: Props = $props();

	function tronTxUrl(txHash: unknown): string | null {
		if (typeof txHash !== 'string' || !txHash.trim()) return null;
		const hash = txHash.startsWith('0x') ? txHash.slice(2) : txHash;
		if (!/^[0-9a-fA-F]{64}$/.test(hash)) return null;
		return `https://tronscan.org/#/transaction/${hash}`;
	}

	function depositHref(row: UsdtDepositTx): string | null {
		if (typeof row.tx_hash !== 'string' || !row.tx_hash.trim()) return null;
		if (typeof row.log_index !== 'number' || !Number.isFinite(row.log_index)) return null;
		return `/deposits/${encodeURIComponent(row.tx_hash)}/${String(row.log_index)}`;
	}

	function leaseHref(row: UsdtDepositTx): string | null {
		const id = row.expected_lease_id ?? row.claim_lease_id;
		if (typeof id === 'number' && Number.isFinite(id)) return `/leases/${String(id)}`;
		return null;
	}

	function leaseLabel(row: UsdtDepositTx): string {
		const v =
			row.expected_lease_id ??
			row.claim_lease_id ??
			row.expected_lease_number ??
			row.claim_lease_number;
		if (typeof v === 'number' && Number.isFinite(v)) return String(v);
		return '—';
	}

	function senderLabel(sender: unknown): string {
		if (typeof sender !== 'string' || !sender.trim()) return '—';
		return formatAddress(sender, 10, 8);
	}

	function receiverLabel(recipient: unknown): string {
		if (typeof recipient !== 'string' || !recipient.trim()) return '—';
		return formatAddress(recipient, 10, 8);
	}

	function tsLabel(ts: unknown): string {
		return formatUnixSecondsLocalMinute(ts) ?? '—';
	}

	function tsRelative(ts: unknown): string | null {
		const n = parseUnixSeconds(ts);
		if (n === null) return null;
		return formatUnixSecondsRelativeDetailed(n);
	}

	function relativeParts(rel: string): { prefix?: string; core: string; suffix?: string } {
		if (rel.startsWith('in ')) return { prefix: 'in', core: rel.slice(3) };
		if (rel.endsWith(' ago')) return { core: rel.slice(0, -4), suffix: 'ago' };
		return { core: rel };
	}

	function statusForRow(row: UsdtDepositTx): {
		label: string;
		variant: 'default' | 'secondary' | 'outline';
	} {
		if (row.claim_status === 'filled') return { label: 'filled', variant: 'default' };
		if (row.claim_origin === 1 && row.claim_status === 'created')
			return { label: 'finalizing', variant: 'secondary' };

		const linkedStatus = getBestLinkedClaimStatus(normalizeLinkedClaims(row.linked_claims));
		if (linkedStatus === 'filled') return { label: 'filled', variant: 'default' };
		if (linkedStatus === 'created') return { label: 'finalizing', variant: 'secondary' };
		return { label: 'processing', variant: 'outline' };
	}

	function actionabilityLabel(action: unknown): string | null {
		if (action === 'pre_entitle') return 'ready to pre-fill';
		if (action === 'already_accounted') return 'already accounted';
		if (action === 'pull') return 'pulled';
		return null;
	}

	function getRowDetailsTooltip(row: UsdtDepositTx): string | null {
		const parts: string[] = [];
		if (row.recommended_action) {
			const label = actionabilityLabel(row.recommended_action);
			parts.push(label ? `hint: ${label}` : `hint: ${row.recommended_action}`);
		}
		if (typeof row.linked_claims_total === 'number')
			parts.push(`linked claims: ${row.linked_claims_total}`);
		if (typeof row.claim_id === 'number') parts.push(`claim id: ${row.claim_id}`);
		if (typeof row.claim_lease_id === 'number') parts.push(`claim lease id: ${row.claim_lease_id}`);
		return parts.length ? parts.join('\n') : null;
	}
</script>

<Table.Root class="[&_td]:px-2 [&_th]:px-2">
	<Table.Header>
		<Table.Row>
			<Table.Head>Amount</Table.Head>
			<Table.Head>When</Table.Head>
			<Table.Head>Sender</Table.Head>
			<Table.Head>Receiver</Table.Head>
			<Table.Head>Lease</Table.Head>
			<Table.Head>Status</Table.Head>
			<Table.Head>Tx</Table.Head>
			<Table.Head class="text-right">Action</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each rows as row (String(row.tx_hash ?? row.inserted_at ?? JSON.stringify(row)))}
			<Table.Row>
				<Table.Cell class="whitespace-nowrap">
					{@const amount = formatUsdtAtomic6(row.amount)}
					<div class="flex items-center gap-2">
						<img src="/usdt.svg" alt="USDT" class="h-6 w-6 shrink-0" />
						<div class="space-y-0.5">
							<div class="font-sans text-base leading-none font-semibold tabular-nums">
								{amount ?? '—'}
							</div>
							<div class="text-xs text-muted-foreground">USDT</div>
						</div>
					</div>
				</Table.Cell>
				<Table.Cell class="whitespace-nowrap">
					{@const rel = tsRelative(row.block_timestamp ?? row.block_time ?? row.inserted_at)}
					{#if rel}
						{@const parts = relativeParts(rel)}
						<div class="text-sm font-medium">
							{#if parts.prefix}
								<span class="text-muted-foreground">{parts.prefix}</span>
								<span> </span>
							{/if}
							<span>{parts.core}</span>
							{#if parts.suffix}
								<span> </span>
								<span class="text-muted-foreground">{parts.suffix}</span>
							{/if}
						</div>
					{:else}
						<div class="text-sm font-medium">—</div>
					{/if}
					<div class="font-sans text-xs text-muted-foreground">
						{tsLabel(row.block_timestamp ?? row.block_time ?? row.inserted_at)}
					</div>
				</Table.Cell>
				<Table.Cell class="max-w-[14rem] font-sans">
					<CopyableValue
						value={typeof row.sender === 'string' ? row.sender : null}
						display={senderLabel(row.sender)}
						copyValue={typeof row.sender === 'string' ? row.sender : null}
						label="Copy sender"
					/>
				</Table.Cell>
				<Table.Cell class="max-w-[14rem] font-sans">
					<CopyableValue
						value={typeof row.recipient === 'string' ? row.recipient : null}
						display={receiverLabel(row.recipient)}
						copyValue={typeof row.recipient === 'string' ? row.recipient : null}
						label="Copy receiver"
					/>
				</Table.Cell>
				<Table.Cell class="font-sans">
					{@const href = leaseHref(row)}
					{#if href}
						<Button variant="ghost" size="sm" class="tabular-nums" {href}>
							{leaseLabel(row)}
						</Button>
					{:else}
						<span class="tabular-nums">{leaseLabel(row)}</span>
					{/if}
				</Table.Cell>
				<Table.Cell class="space-y-1 whitespace-nowrap">
					{@const status = statusForRow(row)}
					<Badge variant={status.variant}>{status.label}</Badge>
					{@const details = getRowDetailsTooltip(row)}
					{#if details}
						<div>
							<span class="group relative inline-flex items-center">
								<span
									class="cursor-help text-xs text-muted-foreground underline decoration-dotted underline-offset-2"
								>
									details
								</span>
								<span
									class="pointer-events-none absolute top-full left-0 z-50 mt-2 hidden w-[260px] rounded-md border bg-popover px-2 py-1.5 text-xs whitespace-pre-wrap text-popover-foreground shadow-md group-hover:block"
								>
									{details}
								</span>
							</span>
						</div>
					{/if}
				</Table.Cell>
				<Table.Cell class="font-sans">
					<CopyableValue
						value={typeof row.tx_hash === 'string' ? row.tx_hash : null}
						display={formatHexShort(row.tx_hash, 12, 10)}
						copyValue={typeof row.tx_hash === 'string' ? row.tx_hash : null}
						label="Copy tx hash"
					/>
				</Table.Cell>
				<Table.Cell class="text-right">
					<div class="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="sm"
							href={depositHref(row) ?? undefined}
							disabled={!depositHref(row)}
						>
							Details
						</Button>
						<Button
							variant="ghost"
							size="sm"
							href={tronTxUrl(row.tx_hash) ?? undefined}
							disabled={!tronTxUrl(row.tx_hash)}
							target="_blank"
							rel="noreferrer"
						>
							<ExternalLinkIcon />
							View
						</Button>
					</div>
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
