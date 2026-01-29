import { createInjectedWagmiConfig } from '@untron/connectkit/wagmi';
import { chainList } from '$lib/config/chains';

const wagmiChainsArray = chainList.map((chain) => chain.wagmiChain);
if (wagmiChainsArray.length === 0) {
	throw new Error('No wagmi chains configured');
}

const wagmiChains = wagmiChainsArray as [
	(typeof wagmiChainsArray)[number],
	...typeof wagmiChainsArray
];

export const config = createInjectedWagmiConfig(wagmiChains);
