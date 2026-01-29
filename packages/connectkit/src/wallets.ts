export interface WalletConfig {
	name: string;
	id: string;
	icon?: string;
	getLink: (currentUrl: string) => string;
}

const metamaskIcon = new URL('./assets/wallets/metamask.svg', import.meta.url).href;
const trustIcon = new URL('./assets/wallets/trust.svg', import.meta.url).href;
const baseAppIcon = new URL('./assets/wallets/baseapp.svg', import.meta.url).href;
const rainbowIcon = new URL('./assets/wallets/rainbow.svg', import.meta.url).href;
const phantomIcon = new URL('./assets/wallets/phantom.svg', import.meta.url).href;

export const WALLETS: WalletConfig[] = [
	{
		name: 'MetaMask',
		id: 'metamask',
		icon: metamaskIcon,
		getLink: (url) => `https://metamask.app.link/dapp/${url.replace(/^https?:\/\//, '')}`
	},
	{
		name: 'Trust Wallet',
		id: 'trust',
		icon: trustIcon,
		getLink: (url) =>
			`https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(url)}`
	},
	{
		name: 'Base App',
		id: 'baseapp',
		icon: baseAppIcon,
		getLink: (url) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`
	},
	{
		name: 'Rainbow',
		id: 'rainbow',
		icon: rainbowIcon,
		getLink: (url) => `https://rainbow.me/ul?link=${encodeURIComponent(url)}`
	},
	{
		name: 'Phantom',
		id: 'phantom',
		icon: phantomIcon,
		getLink: (url) => `https://phantom.app/ul/browse/${encodeURIComponent(url)}`
	}
];

