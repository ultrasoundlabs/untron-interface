<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		createLease,
		getProtocol,
		getRealtors,
		type CreateLeaseBody,
		type ProtocolResponse
	} from '$lib/untron/api';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Alert from '$lib/components/ui/alert';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { formatAddress, formatFeesPpmAndFlat, getTokenAlias } from '$lib/untron/format';
	import {
		getChainLabel,
		getChainMeta,
		getTargetChainOptions,
		getTargetTokenOptions
	} from '$lib/untron/routes';
	import CopyButton from '$lib/components/common/CopyButton.svelte';

	type Props = {
		open?: boolean;
		disabled?: boolean;
		lessee?: `0x${string}` | null;
		onCreated?: (leaseId: string | null) => void;
	};

	let { open = $bindable(false), disabled = false, lessee = null, onCreated }: Props = $props();

	let protocol = $state<ProtocolResponse | null>(null);
	let pending = $state(false);
	let errorMessage = $state<string | null>(null);
	let resultJson = $state<string | null>(null);
	let fixedFeeSource = $state<'realtor' | 'protocol_floor' | 'default'>('default');

	let receiverSalt = $state('');
	let nukeableAfter = $state('');
	let leaseFeePpm = $state('1000');
	let flatFee = $state('0');
	let targetChainId = $state('');
	let targetToken = $state('');
	let beneficiary = $state('');

	function protocolFloorPpm(p: ProtocolResponse): string | null {
		const v = (p.hub.protocol as Record<string, unknown> | undefined)?.protocol_floor_ppm;
		return typeof v === 'string' ? v : null;
	}

	function parseFeeFromRealtor(row: unknown): string | null {
		if (typeof row !== 'object' || row === null) return null;
		const r = row as Record<string, unknown>;
		const v = r.effective_min_fee_ppm ?? r.min_fee_ppm;
		return typeof v === 'string' ? v : null;
	}

	function setDefaultsFromProtocol(p: ProtocolResponse) {
		targetChainId ||= String(p.hub.chainId);
	}

	function setDefaultsFromWallet() {
		if (!lessee) return;
		beneficiary ||= lessee;
	}

	function setDefaultNukeableAfter() {
		if (nukeableAfter) return;
		const now = Math.floor(Date.now() / 1000);
		nukeableAfter = String(now + 24 * 60 * 60);
	}

	$effect(() => {
		if (!open) return;
		void (async () => {
			protocol ??= await getProtocol();
			setDefaultsFromProtocol(protocol);
			setDefaultsFromWallet();
			setDefaultNukeableAfter();

			// Fees are not user-configurable; pick the backend relayer's effective minimum fee when available.
			try {
				const realtors = await getRealtors();
				const ppm = parseFeeFromRealtor(realtors.realtor);
				if (ppm) {
					leaseFeePpm = ppm;
					flatFee = '0';
					fixedFeeSource = 'realtor';
				} else {
					const floor = protocolFloorPpm(protocol);
					if (floor) {
						leaseFeePpm = floor;
						flatFee = '0';
						fixedFeeSource = 'protocol_floor';
					}
				}
			} catch {
				const floor = protocolFloorPpm(protocol);
				if (floor) {
					leaseFeePpm = floor;
					flatFee = '0';
					fixedFeeSource = 'protocol_floor';
				}
			}

			const chains = getTargetChainOptions(protocol);
			if (!targetChainId) targetChainId = chains[0] ?? String(protocol.hub.chainId);
			const tokens = getTargetTokenOptions(protocol, targetChainId);
			if (!targetToken) targetToken = tokens[0] ?? '';
		})();
	});

	$effect(() => {
		if (!open || !protocol) return;
		const tokens = getTargetTokenOptions(protocol, targetChainId);
		if (tokens.length === 0) {
			targetToken = '';
			return;
		}
		const current = targetToken;
		const matched = current
			? (tokens.find((t) => t.toLowerCase() === current.toLowerCase()) ?? null)
			: null;
		if (!matched) {
			targetToken = tokens[0];
			return;
		}
		// Normalize casing to match an actual option value.
		targetToken = matched;
	});

	async function submit() {
		if (!lessee) {
			errorMessage = 'Connect a wallet to use it as the lessee.';
			return;
		}
		if (!protocol) {
			errorMessage = 'Protocol config is not loaded yet.';
			return;
		}
		if (!targetChainId || !targetToken) {
			errorMessage = 'Select a target chain and token.';
			return;
		}

		try {
			pending = true;
			errorMessage = null;
			resultJson = null;

			const body: CreateLeaseBody = {
				lessee,
				nukeableAfter,
				leaseFeePpm,
				flatFee,
				targetChainId,
				targetToken: targetToken as `0x${string}`,
				beneficiary: beneficiary as `0x${string}`
			};

			if (receiverSalt.trim().length) body.receiverSalt = receiverSalt.trim() as `0x${string}`;

			const res = await createLease(body);
			resultJson = JSON.stringify(res, null, 2);
			onCreated?.(res.leaseId);

			if (res.leaseId) {
				open = false;
				await goto(`/leases/${res.leaseId}`);
			}
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : String(err);
		} finally {
			pending = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[560px]">
		<Dialog.Header>
			<Dialog.Title>New lease</Dialog.Title>
			<Dialog.Description>Creates a lease via backend relayer (`POST /leases`).</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-4">
			<div class="grid gap-2">
				<Label for="lessee">Lessee</Label>
				<div class="flex items-center gap-2">
					<Input id="lessee" value={lessee ?? ''} disabled />
					<CopyButton value={lessee ?? null} label="Copy lessee" />
				</div>
			</div>

			<div class="grid gap-2">
				<Label for="beneficiary">Beneficiary</Label>
				<div class="flex items-center gap-2">
					<Input
						id="beneficiary"
						placeholder="0x…"
						bind:value={beneficiary}
						disabled={disabled || pending}
					/>
					<CopyButton value={beneficiary} label="Copy beneficiary" disabled={disabled || pending} />
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label for="targetChainId">Target chain id</Label>
					<div class="flex items-center gap-2">
						<Select.Root type="single" bind:value={targetChainId} disabled={disabled || pending}>
							<Select.Trigger class="w-full" aria-label="Target chain id">
								{#if targetChainId}
									{@const meta = getChainMeta(targetChainId)}
									<span data-slot="select-value" class="flex w-full items-center gap-2">
										<span class="flex-1 truncate">{meta?.name ?? targetChainId}</span>
										<span class="font-mono text-xs text-muted-foreground">{targetChainId}</span>
									</span>
								{:else}
									<span data-slot="select-value" class="text-muted-foreground">Select chain…</span>
								{/if}
							</Select.Trigger>
							<Select.Content>
								{#each protocol ? getTargetChainOptions(protocol) : [] as chainId (chainId)}
									{@const meta = getChainMeta(chainId)}
									<Select.Item value={chainId} label={getChainLabel(chainId)}>
										{#snippet children()}
											<span class="inline-flex w-full items-center gap-2">
												<span class="flex-1 truncate">{meta?.name ?? chainId}</span>
												<span class="font-mono text-xs text-muted-foreground">{chainId}</span>
											</span>
										{/snippet}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				<div class="grid gap-2">
					<Label for="targetToken">Target token</Label>
					<div class="flex items-center gap-2">
						<Select.Root
							type="single"
							bind:value={targetToken}
							disabled={disabled || pending || !targetChainId}
						>
							<Select.Trigger class="w-full" aria-label="Target token">
								{#if targetToken}
									{@const alias = getTokenAlias(targetToken)}
									<span data-slot="select-value" class="flex w-full items-center gap-2">
										<span class="flex-1 truncate">{alias ?? formatAddress(targetToken, 10, 6)}</span
										>
										{#if alias}
											<span class="font-mono text-xs text-muted-foreground">
												{formatAddress(targetToken, 8, 6)}
											</span>
										{/if}
									</span>
								{:else}
									<span data-slot="select-value" class="text-muted-foreground">Select token…</span>
								{/if}
							</Select.Trigger>
							<Select.Content>
								{#each protocol ? getTargetTokenOptions(protocol, targetChainId) : [] as token (token)}
									{@const alias = getTokenAlias(token)}
									<Select.Item
										value={token}
										label={alias
											? `${alias} (${formatAddress(token, 10, 6)})`
											: formatAddress(token, 10, 6)}
									>
										{#snippet children()}
											<span class="inline-flex w-full items-center gap-2">
												<span class="flex-1 truncate">{alias ?? formatAddress(token, 10, 6)}</span>
												<span class="font-mono text-xs text-muted-foreground">
													{formatAddress(token, 8, 6)}
												</span>
											</span>
										{/snippet}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label>Fees (fixed)</Label>
					<Input value={formatFeesPpmAndFlat(leaseFeePpm, flatFee)} disabled />
					<div class="text-xs text-muted-foreground">
						{#if fixedFeeSource === 'realtor'}
							Uses backend relayer effective minimum fee.
						{:else if fixedFeeSource === 'protocol_floor'}
							Uses protocol floor fee.
						{:else}
							Uses default fee.
						{/if}
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label for="nukeableAfter">Nukeable after (unix seconds)</Label>
					<div class="flex items-center gap-2">
						<Input
							id="nukeableAfter"
							inputmode="numeric"
							placeholder="1735689600"
							bind:value={nukeableAfter}
							disabled={disabled || pending}
						/>
						<CopyButton
							value={nukeableAfter}
							label="Copy nukeable after"
							disabled={disabled || pending}
						/>
					</div>
				</div>
				<div class="grid gap-2">
					<Label for="receiverSalt">Receiver salt (optional)</Label>
					<div class="flex items-center gap-2">
						<Input
							id="receiverSalt"
							placeholder="0x… (32 bytes)"
							bind:value={receiverSalt}
							disabled={disabled || pending}
						/>
					</div>
				</div>
			</div>

			{#if errorMessage}
				<Alert.Root variant="destructive">
					<Alert.Title>Lease creation failed</Alert.Title>
					<Alert.Description>{errorMessage}</Alert.Description>
				</Alert.Root>
			{/if}

			{#if resultJson}
				<div class="grid gap-2">
					<div class="flex items-center justify-between">
						<Label>Result</Label>
						<CopyButton value={resultJson} label="Copy result JSON" />
					</div>
					<Textarea value={resultJson} readonly class="min-h-[120px] font-mono text-xs" />
				</div>
			{/if}
		</div>

		<Dialog.Footer class="mt-2">
			<Button variant="outline" onclick={() => (open = false)} disabled={pending}>Cancel</Button>
			<Button onclick={submit} disabled={disabled || pending || !lessee}>
				<PlusIcon />
				{pending ? 'Creating…' : 'Create lease'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
