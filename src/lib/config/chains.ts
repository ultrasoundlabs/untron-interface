import type { Chain as WagmiChain } from '@wagmi/core/chains';
import type { Chain as ViemChain } from 'viem/chains';
import type { EvmStablecoin } from '$lib/types/swap';

interface ChainDefinition {
	chainId: number;
	name: string;
	logoUrl: string;
	isTestnet: boolean;
	explorerUrl: string;
	viemChain: ViemChain;
	wagmiChain: WagmiChain;
	tokens: Partial<Record<EvmStablecoin, `0x${string}`>>;
}

interface ChainDescriptor {
	id: number;
	name: string;
	logoUrl: string;
	explorer: {
		name: string;
		url: string;
	};
	currency: {
		symbol: string;
		name?: string;
		decimals?: number;
	};
	isTestnet?: boolean;
	tokens: Partial<Record<EvmStablecoin, `0x${string}`>>;
}

function createViemChain(params: {
	id: number;
	name: string;
	nativeCurrencySymbol: string;
	nativeCurrencyName?: string;
	nativeCurrencyDecimals?: number;
	explorerName: string;
	explorerUrl: string;
	isTestnet?: boolean;
}): ViemChain {
	const {
		id,
		name,
		nativeCurrencySymbol,
		nativeCurrencyName = nativeCurrencySymbol,
		nativeCurrencyDecimals = 18,
		explorerName,
		explorerUrl,
		isTestnet = false
	} = params;

	return {
		id,
		name,
		nativeCurrency: {
			name: nativeCurrencyName,
			symbol: nativeCurrencySymbol,
			decimals: nativeCurrencyDecimals
		},
		rpcUrls: {
			default: { http: [] },
			public: { http: [] }
		},
		blockExplorers: {
			default: {
				name: explorerName,
				url: explorerUrl
			}
		},
		testnet: isTestnet
	} as ViemChain;
}

interface TokenMetadata {
	symbol: EvmStablecoin;
	name: string;
	decimals: number;
	logoUrl: string;
}

export const TOKEN_METADATA: Record<EvmStablecoin, TokenMetadata> = {
	USDT: {
		symbol: 'USDT',
		name: 'Tether USD',
		decimals: 6,
		logoUrl: '/logos/tokens/usdt.svg'
	},
	USDC: {
		symbol: 'USDC',
		name: 'USD Coin',
		decimals: 6,
		logoUrl: '/logos/tokens/usdc.svg'
	}
};

const CHAIN_DESCRIPTORS = [
	{
		id: 1,
		name: 'Ethereum',
		logoUrl: '/logos/chains/ethereum.svg',
		explorer: {
			name: 'Etherscan',
			url: 'https://etherscan.io'
		},
		currency: {
			symbol: 'ETH',
			name: 'Ether'
		},
		tokens: {
			USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
			USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
		}
	},
	{
		id: 42161,
		name: 'Arbitrum One',
		logoUrl: '/logos/chains/arbitrum.svg',
		explorer: {
			name: 'Arbiscan',
			url: 'https://arbiscan.io'
		},
		currency: {
			symbol: 'ETH',
			name: 'Ether'
		},
		tokens: {
			USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
			USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
		}
	},
	{
		id: 8453,
		name: 'Base',
		logoUrl: '/logos/chains/base.svg',
		explorer: {
			name: 'Basescan',
			url: 'https://basescan.org'
		},
		currency: {
			symbol: 'ETH',
			name: 'Ether'
		},
		tokens: {
			USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
		}
	},
	{
		id: 10,
		name: 'OP Mainnet',
		logoUrl: '/logos/chains/opmainnet.svg',
		explorer: {
			name: 'OP Mainnet Explorer',
			url: 'https://optimistic.etherscan.io'
		},
		currency: {
			symbol: 'ETH',
			name: 'Ether'
		},
		tokens: {
			USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
			USDT: '0x01bFF41798a0BcF287b996046Ca68b395DbC1071'
		}
	},
	{
		id: 137,
		name: 'Polygon',
		logoUrl: '/logos/chains/polygon.svg',
		explorer: {
			name: 'Polygonscan',
			url: 'https://polygonscan.com'
		},
		currency: {
			symbol: 'POL',
			name: 'Polygon'
		},
		tokens: {
			USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
			USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
		}
	},
	{
		id: 9745,
		name: 'Plasma',
		logoUrl: '/logos/chains/plasma.svg',
		explorer: {
			name: 'Plasmascan',
			url: 'https://plasmascan.to'
		},
		currency: {
			symbol: 'XPL',
			name: 'Plasma'
		},
		tokens: {
			USDT: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb'
		}
	},
	{
		id: 5000,
		name: 'Mantle',
		logoUrl: '/logos/chains/mantle.svg',
		explorer: {
			name: 'Mantlescan',
			url: 'https://mantlescan.xyz'
		},
		currency: {
			symbol: 'MNT',
			name: 'Mantle'
		},
		tokens: {
			USDT: '0x779Ded0c9e1022225f8E0630b35a9b54bE713736'
		}
	},
	{
		id: 143,
		name: 'Monad',
		logoUrl: '/logos/chains/monad.svg',
		explorer: {
			name: 'Monadscan',
			url: 'https://monadscan.com'
		},
		currency: {
			symbol: 'MON',
			name: 'Monad'
		},
		tokens: {
			USDC: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
			USDT: '0xe7cd86e13AC4309349F30B3435a9d337750fC82D'
		}
	},
	{
		id: 130,
		name: 'Unichain',
		logoUrl: '/logos/chains/unichain.svg',
		explorer: {
			name: 'Uniscan',
			url: 'https://uniscan.xyz'
		},
		currency: {
			symbol: 'ETH',
			name: 'Ether'
		},
		tokens: {
			USDC: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
			USDT: '0x9151434b16b9763660705744891fA906F660EcC5'
		}
	},
	{
		id: 42220,
		name: 'Celo',
		logoUrl: '/logos/chains/celo.svg',
		explorer: {
			name: 'Celoscan',
			url: 'https://celoscan.io'
		},
		currency: {
			symbol: 'CELO',
			name: 'Celo'
		},
		tokens: {
			USDC: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
			USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e'
		}
	},
	{
		id: 480,
		name: 'World Chain',
		logoUrl: '/logos/chains/worldchain.svg',
		explorer: {
			name: 'Worldscan',
			url: 'https://worldscan.org'
		},
		currency: {
			symbol: 'ETH',
			name: 'Ether'
		},
		tokens: {
			USDC: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1'
		}
	}
] as const satisfies readonly ChainDescriptor[];

function buildChainDefinition(descriptor: ChainDescriptor): ChainDefinition {
	const viemChain = createViemChain({
		id: descriptor.id,
		name: descriptor.name,
		nativeCurrencySymbol: descriptor.currency.symbol,
		nativeCurrencyName: descriptor.currency.name,
		nativeCurrencyDecimals: descriptor.currency.decimals,
		explorerName: descriptor.explorer.name,
		explorerUrl: descriptor.explorer.url,
		isTestnet: descriptor.isTestnet
	});

	return {
		chainId: descriptor.id,
		name: descriptor.name,
		logoUrl: descriptor.logoUrl,
		isTestnet: descriptor.isTestnet ?? false,
		explorerUrl: descriptor.explorer.url,
		viemChain,
		wagmiChain: viemChain as WagmiChain,
		tokens: descriptor.tokens
	};
}

const builtChainList = CHAIN_DESCRIPTORS.map(buildChainDefinition);

export const chainList = builtChainList as readonly ChainDefinition[];

export type SupportedChainId = (typeof CHAIN_DESCRIPTORS)[number]['id'];

const chainEntries = chainList.map((chain) => [chain.chainId as SupportedChainId, chain] as const);
export const chainMap = new Map<SupportedChainId, ChainDefinition>(chainEntries);

export const supportedChainIds = chainList.map((chain) => chain.chainId as SupportedChainId);

export function getChainDefinition(chainId: number): ChainDefinition | undefined {
	return chainMap.get(chainId as SupportedChainId);
}

export function getSupportedChains(): readonly ChainDefinition[] {
	return chainList;
}

export function getChainNativeCurrency(chainId: number): ViemChain['nativeCurrency'] | undefined {
	return getChainDefinition(chainId)?.viemChain.nativeCurrency;
}

export function getChainNativeSymbol(chainId: number): string | undefined {
	return getChainNativeCurrency(chainId)?.symbol;
}
