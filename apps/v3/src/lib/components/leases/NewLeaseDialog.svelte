<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		createLease,
		getProtocol,
		type CreateLeaseBody,
		type ProtocolResponse
	} from '$lib/untron/api';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Alert from '$lib/components/ui/alert';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import PlusIcon from '@lucide/svelte/icons/plus';

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

	let receiverSalt = $state('');
	let nukeableAfter = $state('');
	let leaseFeePpm = $state('1000');
	let flatFee = $state('0');
	let targetChainId = $state('');
	let targetToken = $state('');
	let beneficiary = $state('');

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
		})();
	});

	async function submit() {
		if (!lessee) {
			errorMessage = 'Connect a wallet to use it as the lessee.';
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
				<Input id="lessee" value={lessee ?? ''} disabled />
			</div>

			<div class="grid gap-2">
				<Label for="beneficiary">Beneficiary</Label>
				<Input
					id="beneficiary"
					placeholder="0x…"
					bind:value={beneficiary}
					disabled={disabled || pending}
				/>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label for="targetChainId">Target chain id</Label>
					<Input
						id="targetChainId"
						inputmode="numeric"
						placeholder="137"
						bind:value={targetChainId}
						disabled={disabled || pending}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="targetToken">Target token</Label>
					<Input
						id="targetToken"
						placeholder="0x…"
						bind:value={targetToken}
						disabled={disabled || pending}
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label for="leaseFeePpm">Lease fee (ppm)</Label>
					<Input
						id="leaseFeePpm"
						inputmode="numeric"
						placeholder="1000"
						bind:value={leaseFeePpm}
						disabled={disabled || pending}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="flatFee">Flat fee</Label>
					<Input
						id="flatFee"
						inputmode="numeric"
						placeholder="0"
						bind:value={flatFee}
						disabled={disabled || pending}
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="grid gap-2">
					<Label for="nukeableAfter">Nukeable after (unix seconds)</Label>
					<Input
						id="nukeableAfter"
						inputmode="numeric"
						placeholder="1735689600"
						bind:value={nukeableAfter}
						disabled={disabled || pending}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="receiverSalt">Receiver salt (optional)</Label>
					<Input
						id="receiverSalt"
						placeholder="0x… (32 bytes)"
						bind:value={receiverSalt}
						disabled={disabled || pending}
					/>
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
					<Label>Result</Label>
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
