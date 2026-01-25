<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import type { SqlRow } from '$lib/untron/types';
	import {
		formatAddress,
		formatHexShort,
		parseUnixSeconds,
		formatUnixSeconds,
		formatUnixSecondsLocal,
		formatUnixSecondsRelative,
		formatUsdtAtomic6,
		formatPpmAsPercent,
		estimateFeeFromNetAndPpm,
		getTokenAlias
	} from '$lib/untron/format';
	import { getChainMeta } from '$lib/untron/routes';
	import CopyableValue from '$lib/components/common/CopyableValue.svelte';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	type Props = {
		rows: SqlRow[];
		leaseFeePpm?: string | null;
	};

	let { rows, leaseFeePpm = null }: Props = $props();

	type DepositEntry = {
		tx_hash?: unknown;
		sender?: unknown;
		amount?: unknown;
		block_timestamp?: unknown;
		log_index?: unknown;
	};

	const ARBITRUM_CHAIN_ID = 42161;
	const ARBITRUM_USDT = '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9';
	const ARBITRUM_USDC = '0xaf88d065e77c8cc2239327c5edb3a432268e5831';

	function getClaimSortKey(row: SqlRow): bigint | null {
		const v = row.claim_id ?? row.claimId ?? row.claim_index ?? row.claimIndex;
		if (typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v)) return BigInt(v);
		if (typeof v === 'string' && /^\d+$/.test(v)) {
			try {
				return BigInt(v);
			} catch {
				return null;
			}
		}
		return null;
	}

	function getStatus(row: SqlRow): string | null {
		const v = row.status;
		return typeof v === 'string' ? v : null;
	}

	function getOriginTimestampSeconds(row: SqlRow): number | null {
		return parseUnixSeconds(row.origin_timestamp ?? row.originTimestamp);
	}

	const sortedRows = $derived.by(() => {
		const copy = [...rows];
		copy.sort((a, b) => {
			const aStatus = getStatus(a);
			const bStatus = getStatus(b);
			const aFinalizing = aStatus === 'finalizing' || aStatus === 'pending';
			const bFinalizing = bStatus === 'finalizing' || bStatus === 'pending';
			if (aFinalizing && !bFinalizing) return -1;
			if (!aFinalizing && bFinalizing) return 1;
			if (aFinalizing && bFinalizing) {
				const at = getOriginTimestampSeconds(a) ?? -Infinity;
				const bt = getOriginTimestampSeconds(b) ?? -Infinity;
				if (at === bt) return 0;
				return at > bt ? -1 : 1;
			}

			const ak = getClaimSortKey(a);
			const bk = getClaimSortKey(b);
			if (ak === null && bk === null) return 0;
			if (ak === null) return 1;
			if (bk === null) return -1;
			if (ak === bk) return 0;
			return ak > bk ? -1 : 1;
		});
		return copy;
	});

	function getClaimId(row: SqlRow): string | null {
		const v = row.claim_id ?? row.claimId ?? row.claim_index ?? row.claimIndex;
		if (typeof v === 'string') return v;
		if (typeof v === 'number') return String(v);
		return null;
	}

	function getOriginId(row: SqlRow): string | null {
		const v = row.origin_id ?? row.originId ?? row.id;
		return typeof v === 'string' ? v : null;
	}

	function getDepositEntries(row: SqlRow): DepositEntry[] {
		const v = row.usdt_deposit_attribution ?? row.usdtDepositAttribution;
		return Array.isArray(v) ? (v as DepositEntry[]) : [];
	}

	function getDepositTxHash(entry: DepositEntry): string | null {
		return typeof entry.tx_hash === 'string' ? entry.tx_hash : null;
	}

	function tronScanTxUrl(txHash: string): string | null {
		const raw = txHash.startsWith('0x') ? txHash.slice(2) : txHash;
		if (!/^[0-9a-fA-F]{64}$/.test(raw)) return null;
		return `https://tronscan.org/#/transaction/${raw}`;
	}

	function getFillTxHash(row: SqlRow): string | null {
		const v = row.fill_tx_hash ?? row.fillTxHash;
		return typeof v === 'string' ? v : null;
	}

	function evmTxHashToUrl(
		txHash: string,
		chainId: number,
		targetToken: string | null
	): string | null {
		if (!txHash.startsWith('0x') || !/^[0-9a-fA-F]{64}$/.test(txHash.slice(2))) return null;

		if (chainId === ARBITRUM_CHAIN_ID) return `https://arbiscan.io/tx/${txHash}`;

		if (targetToken && targetToken.toLowerCase() === ARBITRUM_USDT) {
			return `https://layerzeroscan.com/tx/${txHash}`;
		}

		if (targetToken && targetToken.toLowerCase() === ARBITRUM_USDC) {
			// TODO: switch to a CCTP explorer; placeholder for now.
			return `https://arbiscan.io/tx/${txHash}`;
		}

		return null;
	}

	function getDepositBlockTimestamp(entry: DepositEntry): number | null {
		return typeof entry.block_timestamp === 'number' ? entry.block_timestamp : null;
	}

	function getDepositSender(entry: DepositEntry): string | null {
		return typeof entry.sender === 'string' ? entry.sender : null;
	}

	function getRowKey(row: SqlRow): string {
		const claimId = getClaimId(row);
		if (claimId) return `claim-${claimId}`;
		const deposits = getDepositEntries(row);
		const first = deposits[0] ?? null;
		const txHash = first ? getDepositTxHash(first) : null;
		if (txHash) {
			const logIndex = first && typeof first.log_index === 'number' ? String(first.log_index) : '';
			return `deposit-${txHash}-${logIndex}`;
		}
		const originId = getOriginId(row);
		if (originId) return `origin-${originId}`;
		return `row-${JSON.stringify(row)}`;
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

	function getTargetChainIdNumber(row: SqlRow): number | null {
		const s = getTargetChainId(row);
		if (!s) return null;
		const n = Number(s);
		return Number.isFinite(n) && Number.isInteger(n) ? n : null;
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

	function getOriginTimestamp(row: SqlRow): string | null {
		return formatUnixSeconds(row.origin_timestamp ?? row.originTimestamp);
	}
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Claim</Table.Head>
			<Table.Head>Target</Table.Head>
			<Table.Head>Amount</Table.Head>
			<Table.Head>Beneficiary</Table.Head>
			<Table.Head>Origin</Table.Head>
			<Table.Head>Status</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each sortedRows as row (getRowKey(row))}
			{@const deposits = getDepositEntries(row)}
			<Table.Row>
				<Table.Cell class="space-y-0.5">
					<div class="font-mono">
						{getClaimId(row) ?? '—'}
					</div>
					<div class="font-mono text-xs text-muted-foreground">
						{#if deposits.length > 0}
							{@const shown = deposits.slice(0, 2)}
							<div class="space-y-0.5">
								{#each shown as d (getDepositTxHash(d) ?? JSON.stringify(d))}
									{@const txHash = getDepositTxHash(d)}
									{@const tronUrl = txHash ? tronScanTxUrl(txHash) : null}
									{@const ts = getDepositBlockTimestamp(d)}
									{@const sender = getDepositSender(d)}
									<span class="inline-flex flex-wrap items-center gap-1">
										{#if txHash && tronUrl}
											<a
												href={tronUrl}
												target="_blank"
												rel="noreferrer"
												class="inline-flex items-center gap-1 hover:underline"
												title="Open on Tronscan"
											>
												deposit {formatHexShort(txHash, 14, 10)}
												<ExternalLinkIcon class="h-3 w-3 opacity-70" />
											</a>
										{:else if txHash}
											deposit {formatHexShort(txHash, 14, 10)}
										{:else}
											deposit —
										{/if}
										{#if ts}
											<span class="opacity-70">·</span>
											<span title={formatUnixSecondsLocal(ts) ?? undefined} class="opacity-70">
												{formatUnixSecondsRelative(ts) ?? formatUnixSeconds(ts) ?? ts}
											</span>
										{/if}
										{#if sender}
											<span class="opacity-70">·</span>
											<span title={sender} class="opacity-70"
												>from {formatAddress(sender, 8, 6)}</span
											>
										{/if}
									</span>
								{/each}
								{#if deposits.length > shown.length}
									<div class="opacity-70">+{deposits.length - shown.length} more deposits</div>
								{/if}
							</div>
						{:else if getOriginId(row)}
							{@const oid = getOriginId(row)!}
							{@const tronUrl = tronScanTxUrl(oid)}
							<span class="inline-flex items-center gap-1">
								{#if tronUrl}
									<a
										href={tronUrl}
										target="_blank"
										rel="noreferrer"
										class="inline-flex items-center gap-1 hover:underline"
										title="Open on Tronscan"
									>
										origin {formatHexShort(oid, 14, 10)}
										<ExternalLinkIcon class="h-3 w-3 opacity-70" />
									</a>
								{:else}
									origin {formatHexShort(oid, 14, 10)}
								{/if}
							</span>
						{:else}
							—
						{/if}
						{#if getStatus(row) === 'filled'}
							{@const fillTxHash = getFillTxHash(row)}
							{@const chainId = getTargetChainIdNumber(row)}
							{@const token = getTargetToken(row)}
							{@const payoutUrl =
								fillTxHash && chainId ? evmTxHashToUrl(fillTxHash, chainId, token) : null}
							{#if fillTxHash}
								<span class="mt-1 inline-flex items-center gap-1">
									{#if payoutUrl}
										<a
											href={payoutUrl}
											target="_blank"
											rel="noreferrer"
											class="inline-flex items-center gap-1 hover:underline"
											title="Open payout tx"
										>
											payout {formatHexShort(fillTxHash, 14, 10)}
											<ExternalLinkIcon class="h-3 w-3 opacity-70" />
										</a>
									{:else}
										payout {formatHexShort(fillTxHash, 14, 10)}
									{/if}
								</span>
							{/if}
						{/if}
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
					{@const origin = getOriginTimestamp(row)}
					{#if origin}
						<CopyableValue
							value={origin}
							display={formatUnixSecondsRelative(row.origin_timestamp ?? row.originTimestamp) ??
								origin}
							title={formatUnixSecondsLocal(row.origin_timestamp ?? row.originTimestamp) ??
								undefined}
							copyValue={origin}
							label="Copy origin timestamp"
						/>
					{:else}
						—
					{/if}
				</Table.Cell>
				<Table.Cell>
					{#if getStatus(row) === 'pending'}
						<Badge variant="secondary">pending</Badge>
					{:else if getStatus(row) === 'finalizing'}
						<Badge variant="secondary">finalizing</Badge>
					{:else if getStatus(row) === 'created'}
						<Badge variant="secondary">created</Badge>
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
