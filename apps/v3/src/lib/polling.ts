export type PollOptions = {
	immediate?: boolean;
	/**
	 * Default: 'pause' (do not poll when tab is hidden).
	 * 'run' will continue polling in background tabs.
	 */
	whenHidden?: 'pause' | 'run';
	skipIf?: () => boolean;
};

export function startPolling(
	fn: () => void | Promise<void>,
	intervalMs: number,
	options: PollOptions = {}
): () => void {
	if (typeof document === 'undefined') return () => {};

	let inFlight = false;

	const tick = async () => {
		if (inFlight) return;
		if (options.skipIf?.()) return;
		if ((options.whenHidden ?? 'pause') === 'pause' && document.visibilityState === 'hidden')
			return;

		inFlight = true;
		try {
			await fn();
		} finally {
			inFlight = false;
		}
	};

	const id = setInterval(() => void tick(), intervalMs);

	const onVisibilityChange = () => {
		if (document.visibilityState === 'visible') setTimeout(() => void tick(), 0);
	};
	document.addEventListener('visibilitychange', onVisibilityChange);

	// Avoid running `tick()` synchronously during a Svelte `$effect` setup, otherwise any reactive reads
	// (e.g. `skipIf`) can get tracked and cause the effect to re-run in a tight loop.
	if (options.immediate) setTimeout(() => void tick(), 0);

	return () => {
		clearInterval(id);
		document.removeEventListener('visibilitychange', onVisibilityChange);
	};
}
