import { connect, disconnect } from '@wagmi/core';
import { injected } from '@wagmi/connectors';
import { config } from './config';

export async function connectWallet() {
	await connect(config, { connector: injected() });
}

export async function disconnectWallet() {
	await disconnect(config);
}
