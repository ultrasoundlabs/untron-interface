import { createConfig, http } from '@wagmi/core';
import { mainnet, sepolia } from '@wagmi/core/chains';
import { injected } from '@wagmi/connectors';

export const config = createConfig({
	// Chains your app supports
	chains: [mainnet, sepolia],

	// Which wallet connectors you want (MetaMask / injected in this case)
	connectors: [injected()],

	// RPC transports per chain
	transports: {
		[mainnet.id]: http(), // prod: pass your own RPC URL here
		[sepolia.id]: http()
	},

	ssr: false
});
