export interface WalletConfig {
	name: string;
	id: string;
	icon?: string;
	getLink: (currentUrl: string) => string;
}

export const WALLETS: WalletConfig[] = [
	{
		name: 'MetaMask',
		id: 'metamask',
		icon: '/logos/wallets/metamask.svg',
		getLink: (url) => `https://metamask.app.link/dapp/${url.replace(/^https?:\/\//, '')}`
	},
	{
		name: 'Trust Wallet',
		id: 'trust',
		icon: '/logos/wallets/trust.svg',
		getLink: (url) =>
			`https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(url)}`
	},
	{
		name: 'Base App',
		id: 'baseapp',
		icon: '/logos/wallets/baseapp.svg',
		getLink: (url) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`
	},
	{
		name: 'Rainbow',
		id: 'rainbow',
		icon: '/logos/wallets/rainbow.svg',
		getLink: (url) => `https://rainbow.me/ul?link=${encodeURIComponent(url)}`
	},
	{
		name: 'Phantom',
		id: 'phantom',
		icon: '/logos/wallets/phantom.svg',
		getLink: (url) => `https://phantom.app/ul/browse/${encodeURIComponent(url)}`
	}
];
