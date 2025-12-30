import { readable } from 'svelte/store';
import { browser } from '$app/environment';
import { getConnection, reconnect, watchConnection } from '@wagmi/core';
import type { GetConnectionReturnType } from '@wagmi/core';
import { config } from './config';

type Connection = GetConnectionReturnType<typeof config>;

export const connection = readable<Connection>(getConnection(config), (set) => {
	if (!browser) {
		return () => {};
	}

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
