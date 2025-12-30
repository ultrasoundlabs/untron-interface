import type { Chain as WagmiChain } from '@wagmi/core/chains';
import type { Chain as ViemChain } from 'viem/chains';
import { arbitrum, base, mainnet, optimism, polygon } from 'viem/chains';

export type ChainKey = 'ethereum' | 'arbitrum' | 'base' | 'optimism' | 'polygon';

export interface ChainDefinition {
	key: ChainKey;
	chainId: number;
	name: string;
	logoUrl?: string;
	explorerUrl?: string;
	viemChain: ViemChain;
	wagmiChain: WagmiChain;
}

const CHAINS: ChainDefinition[] = [
	{
		key: 'ethereum',
		chainId: mainnet.id,
		name: 'Ethereum',
		logoUrl: '/logos/chains/ethereum.svg',
		explorerUrl: 'https://etherscan.io',
		viemChain: mainnet,
		wagmiChain: mainnet
	},
	{
		key: 'arbitrum',
		chainId: arbitrum.id,
		name: 'Arbitrum One',
		logoUrl: '/logos/chains/arbitrum.svg',
		explorerUrl: 'https://arbiscan.io',
		viemChain: arbitrum,
		wagmiChain: arbitrum
	},
	{
		key: 'base',
		chainId: base.id,
		name: 'Base',
		logoUrl: '/logos/chains/base.svg',
		explorerUrl: 'https://basescan.org',
		viemChain: base,
		wagmiChain: base
	},
	{
		key: 'optimism',
		chainId: optimism.id,
		name: 'OP Mainnet',
		logoUrl: '/logos/chains/opmainnet.svg',
		explorerUrl: 'https://optimistic.etherscan.io',
		viemChain: optimism,
		wagmiChain: optimism
	},
	{
		key: 'polygon',
		chainId: polygon.id,
		name: 'Polygon',
		logoUrl: '/logos/chains/polygon.svg',
		explorerUrl: 'https://polygonscan.com',
		viemChain: polygon,
		wagmiChain: polygon
	}
];

export const chainList = CHAINS;
