import { createConfig, http } from '@wagmi/core';
import { injected } from '@wagmi/connectors';
import { chainsConfig } from '$lib/config/chains';

const wagmiChainsArray = Object.values(chainsConfig).map((chain) => chain.wagmiChain);
if (wagmiChainsArray.length === 0) {
	throw new Error('No wagmi chains configured');
}
const wagmiChains = wagmiChainsArray as [
	(typeof wagmiChainsArray)[number],
	...typeof wagmiChainsArray
];
const transports = Object.fromEntries(wagmiChains.map((chain) => [chain.id, http()]));

export const config = createConfig({
	chains: wagmiChains,
	connectors: [injected()],
	transports,
	ssr: false
});
