export type Caip2 = `${string}:${string}`;

export function parseCaip2(
	chainId: string
): { chainNamespace: string; chainReference: string } | null {
	const idx = chainId.indexOf(':');
	if (idx <= 0 || idx === chainId.length - 1) return null;
	return {
		chainNamespace: chainId.slice(0, idx),
		chainReference: chainId.slice(idx + 1)
	};
}

/**
 * Format a CAIP-10 account id (`<caip2>:<account>`).
 * EVM accounts are lowercased by convention.
 */
export function toAccountId(args: { chainId: string; account: string }): string {
	const parsed = parseCaip2(args.chainId);
	const account = parsed?.chainNamespace === 'eip155' ? args.account.toLowerCase() : args.account;
	return `${args.chainId}:${account}`;
}

export function parseAccountId(accountId: string): {
	chainId: string;
	chainNamespace: string;
	chainReference: string;
	account: string;
} | null {
	const parts = accountId.split(':');
	if (parts.length !== 3) return null;
	const chainNamespace = parts[0] ?? '';
	const chainReference = parts[1] ?? '';
	const account = parts[2] ?? '';
	if (!chainNamespace || !chainReference || !account) return null;
	return {
		chainId: `${chainNamespace}:${chainReference}`,
		chainNamespace,
		chainReference,
		account: chainNamespace === 'eip155' ? account.toLowerCase() : account
	};
}

/**
 * Parse a CAIP-19 asset id (`<caip2>/<namespace>:<reference>`).
 * Example: `eip155:1/erc20:0xa0b8...`
 */
export function parseAssetId(assetId: string): {
	chainId: string;
	chainNamespace: string;
	chainReference: string;
	assetNamespace: string;
	assetReference: string;
} | null {
	const [chainId, assetPart] = assetId.split('/');
	if (!chainId || !assetPart) return null;
	const chain = parseCaip2(chainId);
	if (!chain) return null;

	const idx = assetPart.indexOf(':');
	if (idx <= 0 || idx === assetPart.length - 1) return null;
	return {
		chainId,
		chainNamespace: chain.chainNamespace,
		chainReference: chain.chainReference,
		assetNamespace: assetPart.slice(0, idx),
		assetReference: assetPart.slice(idx + 1)
	};
}
