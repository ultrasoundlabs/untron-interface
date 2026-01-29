import { readable, type Readable } from 'svelte/store';
import { connect, disconnect, getConnection, reconnect, watchConnection } from '@wagmi/core';
import type { Config, GetConnectionReturnType } from '@wagmi/core';
import { injected } from '@wagmi/connectors';
import { createConfig, http } from '@wagmi/core';
import type { Chain } from 'viem';

export function createInjectedWagmiConfig<TChains extends readonly [Chain, ...Chain[]]>(
	chains: TChains
) {
	const transports = Object.fromEntries(chains.map((chain) => [chain.id, http()])) as Record<
		TChains[number]['id'],
		ReturnType<typeof http>
	>;

	return createConfig({
		chains,
		connectors: [injected()],
		transports,
		ssr: false
	});
}

export function createConnectionStore<TConfig extends Config>(
	config: TConfig
): Readable<GetConnectionReturnType<TConfig>> {
	return readable<GetConnectionReturnType<TConfig>>(getConnection(config), (set) => {
		if (typeof window === 'undefined') return () => {};

		reconnect(config).catch((err) => {
			console.error('wagmi reconnect failed', err);
		});

		const unwatch = watchConnection(config, {
			onChange(next) {
				set(next);
			}
		});

		return () => unwatch();
	});
}

export async function connectInjectedWallet(config: Config) {
	await connect(config, { connector: injected() });
}

export async function disconnectWallet(config: Config) {
	await disconnect(config);
}

