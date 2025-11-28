import { connect, disconnect } from '@wagmi/core';
import { injected } from '@wagmi/connectors';
import { config } from './config';

export async function connectWallet() {
	// Event handlers only run in the browser, so this is safe in SvelteKit
	await connect(config, { connector: injected() });
}

export async function disconnectWallet() {
	await disconnect(config);
}
