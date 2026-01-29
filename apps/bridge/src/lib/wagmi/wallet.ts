import { connectInjectedWallet, disconnectWallet as disconnectWalletInner } from '@untron/connectkit/wagmi';
import { config } from './config';

export async function connectWallet() {
	await connectInjectedWallet(config);
}

export async function disconnectWallet() {
	await disconnectWalletInner(config);
}
