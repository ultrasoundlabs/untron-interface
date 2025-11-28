import { readable } from 'svelte/store';
import { browser } from '$app/environment';
import { getConnection, watchConnection, reconnect } from '@wagmi/core';
import type { GetConnectionReturnType } from '@wagmi/core';
import { config } from './config';

// Let TS infer everything from your config
type Connection = GetConnectionReturnType<typeof config>;

export const connection = readable<Connection>(getConnection(config), (set) => {
	// On the server, don't set up watchers (no window / wallet)
	if (!browser) {
		return () => {};
	}

	// Try to reconnect to any previously used connector
	reconnect(config).catch((err) => {
		console.error('wagmi reconnect failed', err);
	});

	// Keep the store in sync with wagmi's internal state
	const unwatch = watchConnection(config, {
		onChange(next) {
			set(next);
		}
	});

	return () => unwatch();
});
