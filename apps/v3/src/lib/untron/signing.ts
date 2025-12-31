import { getChainId, signTypedData, switchChain } from '@wagmi/core';
import type { Config } from '@wagmi/core';
import type { ProtocolResponse } from './api';

export const DEFAULT_EIP712_NAME = 'Untron';
export const DEFAULT_EIP712_VERSION = '1';

function toUint256(value: string, label: string): bigint {
	try {
		const v = BigInt(value);
		if (v < 0n) throw new Error('negative');
		return v;
	} catch {
		throw new Error(`Invalid ${label} (expected uint256 decimal string)`);
	}
}

export async function ensureWalletChainForSigning(wagmiConfig: Config, targetChainId: number) {
	try {
		const currentChainId = await getChainId(wagmiConfig);
		if (currentChainId === targetChainId) return;
	} catch {
		// ignore and fall through to switchChain
	}
	await switchChain(wagmiConfig, { chainId: targetChainId });
}

export function buildPayoutConfigUpdateTypedData(args: {
	protocol: ProtocolResponse;
	leaseId: string;
	targetChainId: string;
	targetToken: `0x${string}`;
	beneficiary: `0x${string}`;
	nonce: string;
	deadline: string;
}) {
	const domain = {
		name: DEFAULT_EIP712_NAME,
		version: DEFAULT_EIP712_VERSION,
		chainId: args.protocol.hub.chainId,
		verifyingContract: args.protocol.hub.contractAddress
	} as const;

	const types = {
		PayoutConfigUpdate: [
			{ name: 'leaseId', type: 'uint256' },
			{ name: 'targetChainId', type: 'uint256' },
			{ name: 'targetToken', type: 'address' },
			{ name: 'beneficiary', type: 'address' },
			{ name: 'nonce', type: 'uint256' },
			{ name: 'deadline', type: 'uint256' }
		]
	} as const;

	const message = {
		leaseId: toUint256(args.leaseId, 'leaseId'),
		targetChainId: toUint256(args.targetChainId, 'targetChainId'),
		targetToken: args.targetToken,
		beneficiary: args.beneficiary,
		nonce: toUint256(args.nonce, 'nonce'),
		deadline: toUint256(args.deadline, 'deadline')
	} as const;

	return { domain, types, primaryType: 'PayoutConfigUpdate' as const, message };
}

export async function signPayoutConfigUpdate(args: {
	wagmiConfig: Config;
	account: `0x${string}`;
	protocol: ProtocolResponse;
	leaseId: string;
	targetChainId: string;
	targetToken: `0x${string}`;
	beneficiary: `0x${string}`;
	nonce: string;
	deadline: string;
}): Promise<`0x${string}`> {
	await ensureWalletChainForSigning(args.wagmiConfig, args.protocol.hub.chainId);
	const typed = buildPayoutConfigUpdateTypedData(args);
	return (await signTypedData(args.wagmiConfig, {
		account: args.account,
		domain: typed.domain as Record<string, unknown>,
		types: typed.types as unknown as Record<string, Array<{ name: string; type: string }>>,
		primaryType: typed.primaryType,
		message: typed.message as Record<string, unknown>
	})) as `0x${string}`;
}
