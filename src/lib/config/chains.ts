import type { Chain as WagmiChain } from '@wagmi/core/chains';
import type { Chain as ViemChain } from 'viem/chains';
import type { EvmStablecoin } from '$lib/types/swap';

interface ChainDefinition {
	chainId: number;
	name: string;
	shortName: string;
	logoUrl: string;
	isTestnet: boolean;
	nativeCurrency: string;
	explorerUrl: string;
	wagmiChain: WagmiChain;
	viemChain: ViemChain;
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

const CHAINS_CONFIG = {
	1: {
		chainId: 1,
		name: 'Ethereum',
		shortName: 'ETH',
		logoUrl: '/logos/chains/ethereum.svg',
		isTestnet: false,
		nativeCurrency: 'ETH',
		explorerUrl: 'https://etherscan.io',
		viemChain: createViemChain({
			id: 1,
			name: 'Ethereum',
			nativeCurrencySymbol: 'ETH',
			nativeCurrencyName: 'Ether',
			explorerName: 'Etherscan',
			explorerUrl: 'https://etherscan.io'
		}),
		wagmiChain: createViemChain({
			id: 1,
			name: 'Ethereum',
			nativeCurrencySymbol: 'ETH',
			nativeCurrencyName: 'Ether',
			explorerName: 'Etherscan',
			explorerUrl: 'https://etherscan.io'
		}) as WagmiChain,
		tokens: {
			USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
			USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
		}
	},
	42161: {
		chainId: 42161,
		name: 'Arbitrum One',
		shortName: 'Arb',
		logoUrl: '/logos/chains/arbitrum.svg',
		isTestnet: false,
		nativeCurrency: 'ETH',
		explorerUrl: 'https://arbiscan.io',
		viemChain: createViemChain({
			id: 42161,
			name: 'Arbitrum One',
			nativeCurrencySymbol: 'ETH',
			nativeCurrencyName: 'Ether',
			explorerName: 'Arbiscan',
			explorerUrl: 'https://arbiscan.io'
		}),
		wagmiChain: createViemChain({
			id: 42161,
			name: 'Arbitrum One',
			nativeCurrencySymbol: 'ETH',
			nativeCurrencyName: 'Ether',
			explorerName: 'Arbiscan',
			explorerUrl: 'https://arbiscan.io'
		}) as WagmiChain,
		tokens: {
			USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
			USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
		}
	},
	8453: {
		chainId: 8453,
		name: 'Base',
		shortName: 'Base',
		logoUrl: '/logos/chains/base.svg',
		isTestnet: false,
		nativeCurrency: 'ETH',
		explorerUrl: 'https://basescan.org',
		viemChain: createViemChain({
			id: 8453,
			name: 'Base',
			nativeCurrencySymbol: 'ETH',
			nativeCurrencyName: 'Ether',
			explorerName: 'Basescan',
			explorerUrl: 'https://basescan.org'
		}),
		wagmiChain: createViemChain({
			id: 8453,
			name: 'Base',
			nativeCurrencySymbol: 'ETH',
			nativeCurrencyName: 'Ether',
			explorerName: 'Basescan',
			explorerUrl: 'https://basescan.org'
		}) as WagmiChain,
		tokens: {
			USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
		}
	},
	10: {
		chainId: 10,
		name: 'OP Mainnet',
		shortName: 'OP',
		logoUrl: '/logos/chains/opmainnet.svg',
		isTestnet: false,
		nativeCurrency: 'ETH',
		explorerUrl: 'https://optimistic.etherscan.io',
		viemChain: createViemChain({
			id: 10,
			name: 'OP Mainnet',
			nativeCurrencySymbol: 'ETH',
			nativeCurrencyName: 'Ether',
			explorerName: 'OP Mainnet Explorer',
			explorerUrl: 'https://optimistic.etherscan.io'
		}),
		wagmiChain: createViemChain({
			id: 10,
			name: 'OP Mainnet',
			nativeCurrencySymbol: 'ETH',
			nativeCurrencyName: 'Ether',
			explorerName: 'OP Mainnet Explorer',
			explorerUrl: 'https://optimistic.etherscan.io'
		}) as WagmiChain,
		tokens: {
			USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
			USDT: '0x01bFF41798a0BcF287b996046Ca68b395DbC1071'
		}
	},
	137: {
		chainId: 137,
		name: 'Polygon',
		shortName: 'Polygon',
		logoUrl: '/logos/chains/polygon.svg',
		isTestnet: false,
		nativeCurrency: 'POL',
		explorerUrl: 'https://polygonscan.com',
		viemChain: createViemChain({
			id: 137,
			name: 'Polygon PoS',
			nativeCurrencySymbol: 'POL',
			nativeCurrencyName: 'Polygon',
			explorerName: 'Polygonscan',
			explorerUrl: 'https://polygonscan.com'
		}),
		wagmiChain: createViemChain({
			id: 137,
			name: 'Polygon PoS',
			nativeCurrencySymbol: 'POL',
			nativeCurrencyName: 'Polygon',
			explorerName: 'Polygonscan',
			explorerUrl: 'https://polygonscan.com'
		}) as WagmiChain,
		tokens: {
			USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
			USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
		}
	},
	9745: {
		chainId: 9745,
		name: 'Plasma',
		shortName: 'Plasma',
		logoUrl: '/logos/chains/plasma.svg',
		isTestnet: false,
		nativeCurrency: 'XPL',
		explorerUrl: 'https://plasmascan.to',
		viemChain: createViemChain({
			id: 9745,
			name: 'Plasma',
			nativeCurrencySymbol: 'XPL',
			nativeCurrencyName: 'Plasma',
			explorerName: 'Plasmascan',
			explorerUrl: 'https://plasmascan.to'
		}),
		wagmiChain: createViemChain({
			id: 9745,
			name: 'Plasma',
			nativeCurrencySymbol: 'XPL',
			nativeCurrencyName: 'Plasma',
			explorerName: 'Plasmascan',
			explorerUrl: 'https://plasmascan.to'
		}) as WagmiChain,
		tokens: {
			USDT: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb'
		}
	},
	5000: {
		chainId: 5000,
		name: 'Mantle',
		shortName: 'MNT',
		logoUrl: '/logos/chains/mantle.svg',
		isTestnet: false,
		nativeCurrency: 'MNT',
		explorerUrl: 'https://mantlescan.xyz',
		viemChain: createViemChain({
			id: 5000,
			name: 'Mantle',
			nativeCurrencySymbol: 'MNT',
			nativeCurrencyName: 'Mantle',
			explorerName: 'Mantlescan',
			explorerUrl: 'https://mantlescan.xyz'
		}),
		wagmiChain: createViemChain({
			id: 5000,
			name: 'Mantle',
			nativeCurrencySymbol: 'MNT',
			nativeCurrencyName: 'Mantle',
			explorerName: 'Mantlescan',
			explorerUrl: 'https://mantlescan.xyz'
		}) as WagmiChain,
		tokens: {
			USDT: '0x779Ded0c9e1022225f8E0630b35a9b54bE713736'
		}
	},
	143: {
		chainId: 143,
		name: 'Monad',
		shortName: 'Monad',
		logoUrl: '/logos/chains/monad.svg',
		isTestnet: false,
		nativeCurrency: 'MON',
		explorerUrl: 'https://monadscan.com',
		viemChain: createViemChain({
			id: 143,
			name: 'Monad',
			nativeCurrencySymbol: 'MON',
			nativeCurrencyName: 'Monad',
			explorerName: 'Monadscan',
			explorerUrl: 'https://monadscan.com'
		}),
		wagmiChain: createViemChain({
			id: 143,
			name: 'Monad',
			nativeCurrencySymbol: 'MON',
			nativeCurrencyName: 'Monad',
			explorerName: 'Monadscan',
			explorerUrl: 'https://monadscan.com'
		}) as WagmiChain,
		tokens: {
			USDC: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
			USDT: '0xe7cd86e13AC4309349F30B3435a9d337750fC82D'
		}
	},
	130: {
		chainId: 130,
		name: 'Unichain',
		shortName: 'Unichain',
		logoUrl: '/logos/chains/unichain.svg',
		isTestnet: false,
		nativeCurrency: 'ETH',
		explorerUrl: 'https://uniscan.xyz',
		viemChain: createViemChain({
			id: 130,
			name: 'Unichain',
			nativeCurrencySymbol: 'ETH',
			nativeCurrencyName: 'Ether',
			explorerName: 'Uniscan',
			explorerUrl: 'https://uniscan.xyz'
		}),
		wagmiChain: createViemChain({
			id: 130,
			name: 'Unichain',
			nativeCurrencySymbol: 'ETH',
			nativeCurrencyName: 'Ether',
			explorerName: 'Uniscan',
			explorerUrl: 'https://uniscan.xyz'
		}) as WagmiChain,
		tokens: {
			USDC: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
			USDT: '0x9151434b16b9763660705744891fA906F660EcC5'
		}
	},
	42220: {
		chainId: 42220,
		name: 'Celo',
		shortName: 'Celo',
		logoUrl: '/logos/chains/celo.svg',
		isTestnet: false,
		nativeCurrency: 'CELO',
		explorerUrl: 'https://celoscan.io',
		viemChain: createViemChain({
			id: 42220,
			name: 'Celo',
			nativeCurrencySymbol: 'CELO',
			nativeCurrencyName: 'Celo',
			explorerName: 'Celoscan',
			explorerUrl: 'https://celoscan.io'
		}),
		wagmiChain: createViemChain({
			id: 42220,
			name: 'Celo',
			nativeCurrencySymbol: 'CELO',
			nativeCurrencyName: 'Celo',
			explorerName: 'Celoscan',
			explorerUrl: 'https://celoscan.io'
		}) as WagmiChain,
		tokens: {
			USDC: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
			USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e'
		}
	},
	480: {
		chainId: 480,
		name: 'World Chain',
		shortName: 'World',
		logoUrl: '/logos/chains/worldchain.svg',
		isTestnet: false,
		nativeCurrency: 'ETH',
		explorerUrl: 'https://worldscan.org',
		viemChain: createViemChain({
			id: 480,
			name: 'World Chain',
			nativeCurrencySymbol: 'ETH',
			nativeCurrencyName: 'Ether',
			explorerName: 'Worldscan',
			explorerUrl: 'https://worldscan.org'
		}),
		wagmiChain: createViemChain({
			id: 480,
			name: 'World Chain',
			nativeCurrencySymbol: 'ETH',
			nativeCurrencyName: 'Ether',
			explorerName: 'Worldscan',
			explorerUrl: 'https://worldscan.org'
		}) as WagmiChain,
		tokens: {
			USDC: '0x79A02482A880bCe3F13E09da970dC34dB4cD24D1'
		}
	}
} as const satisfies Record<number, ChainDefinition>;

type ChainConfigMap = typeof CHAINS_CONFIG;
type ChainKeyToNumber<K> = K extends `${infer N extends number}` ? N : K extends number ? K : never;
export type SupportedChainId = ChainKeyToNumber<keyof ChainConfigMap>;

export const chainsConfig: Record<SupportedChainId, ChainDefinition> = CHAINS_CONFIG as Record<
	SupportedChainId,
	ChainDefinition
>;
export const supportedChainIds = Object.keys(CHAINS_CONFIG).map((id) =>
	Number(id)
) as SupportedChainId[];
