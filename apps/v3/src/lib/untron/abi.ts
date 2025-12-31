export const untronV3Abi = [
	{
		type: 'function',
		name: 'leaseNonces',
		stateMutability: 'view',
		inputs: [{ name: 'leaseId', type: 'uint256' }],
		outputs: [{ name: '', type: 'uint256' }]
	}
] as const;
