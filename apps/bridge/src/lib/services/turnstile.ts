import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';

type Turnstile = {
	render: (
		container: HTMLElement,
		options: {
			sitekey: string;
			size?: 'compact' | 'flexible' | 'normal';
			execution?: 'render' | 'execute';
			appearance?: 'interaction-only' | 'always' | 'execute';
			action?: string;
			callback: (token: string) => void;
			'expired-callback'?: () => void;
			'error-callback'?: () => void;
		}
	) => string;
	execute: (widgetId: string) => void;
	reset: (widgetId: string) => void;
};

declare global {
	interface Window {
		turnstile?: Turnstile;
	}
}

const TURNSTILE_SCRIPT_SRC =
	'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptLoadPromise: Promise<void> | null = null;
let widgetId: string | null = null;
let containerEl: HTMLElement | null = null;

let inFlightTokenPromise: Promise<string> | null = null;
let resolveToken: ((token: string) => void) | null = null;
let rejectToken: ((err: Error) => void) | null = null;

function hideWidget() {
	if (!containerEl) return;
	containerEl.style.opacity = '0';
	containerEl.style.pointerEvents = 'none';
}

function showWidget() {
	if (!containerEl) return;
	containerEl.style.opacity = '1';
	containerEl.style.pointerEvents = 'auto';
}

function getSiteKey(): string | null {
	const key = PUBLIC_TURNSTILE_SITE_KEY?.trim();
	return key && key.length > 0 ? key : null;
}

function loadScript(): Promise<void> {
	if (typeof window === 'undefined') {
		return Promise.reject(new Error('Turnstile can only run in the browser'));
	}
	if (window.turnstile) return Promise.resolve();
	if (scriptLoadPromise) return scriptLoadPromise;

	scriptLoadPromise = new Promise<void>((resolve, reject) => {
		const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);
		if (existing) {
			existing.addEventListener('load', () => resolve(), { once: true });
			existing.addEventListener('error', () => reject(new Error('Failed to load Turnstile')), {
				once: true
			});
			return;
		}

		const script = document.createElement('script');
		script.src = TURNSTILE_SCRIPT_SRC;
		script.async = true;
		script.defer = true;
		script.addEventListener('load', () => resolve(), { once: true });
		script.addEventListener('error', () => reject(new Error('Failed to load Turnstile')), {
			once: true
		});
		document.head.appendChild(script);
	});

	return scriptLoadPromise;
}

async function ensureWidget(): Promise<string> {
	const siteKey = getSiteKey();
	if (!siteKey) {
		throw new Error('Missing PUBLIC_TURNSTILE_SITE_KEY');
	}

	await loadScript();

	if (!window.turnstile) {
		throw new Error('Turnstile did not initialize');
	}

	if (!containerEl) {
		containerEl = document.createElement('div');
		containerEl.id = 'untron-turnstile';
		containerEl.style.position = 'fixed';
		containerEl.style.right = '12px';
		containerEl.style.bottom = '12px';
		containerEl.style.zIndex = '2147483647';
		containerEl.style.transition = 'opacity 120ms ease';
		hideWidget();
		document.body.appendChild(containerEl);
	}

	if (widgetId) return widgetId;

	widgetId = window.turnstile.render(containerEl, {
		sitekey: siteKey,
		execution: 'execute',
		size: 'normal',
		appearance: 'interaction-only',
		action: 'create_order',
		callback: (token) => {
			resolveToken?.(token);
			resolveToken = null;
			rejectToken = null;
		},
		'expired-callback': () => {
			rejectToken?.(new Error('Turnstile token expired'));
			resolveToken = null;
			rejectToken = null;
		},
		'error-callback': () => {
			rejectToken?.(new Error('Turnstile challenge failed'));
			resolveToken = null;
			rejectToken = null;
		}
	});

	return widgetId;
}

/**
 * Gets a fresh Turnstile token for requests that require it.
 * The token is short-lived, so call this right before the API call.
 */
export async function getTurnstileToken(): Promise<string> {
	if (inFlightTokenPromise) return inFlightTokenPromise;

	inFlightTokenPromise = (async () => {
		const id = await ensureWidget();
		if (!window.turnstile) throw new Error('Turnstile not available');

		const token = await new Promise<string>((resolve, reject) => {
			const showTimeoutId = window.setTimeout(() => {
				// If an interactive challenge is required, it needs to be visible/clickable.
				showWidget();
			}, 800);

			const timeoutId = window.setTimeout(() => {
				rejectToken?.(new Error('Turnstile timed out'));
			}, 90_000);

			resolveToken = (token) => {
				window.clearTimeout(showTimeoutId);
				window.clearTimeout(timeoutId);
				resolve(token);
			};
			rejectToken = (err) => {
				window.clearTimeout(showTimeoutId);
				window.clearTimeout(timeoutId);
				reject(err);
			};

			try {
				window.turnstile!.execute(id);
			} catch (err) {
				window.clearTimeout(showTimeoutId);
				window.clearTimeout(timeoutId);
				reject(err instanceof Error ? err : new Error('Turnstile execute failed'));
			}
		});

		window.turnstile.reset(id);
		hideWidget();
		return token;
	})().finally(() => {
		inFlightTokenPromise = null;
	});

	return inFlightTokenPromise;
}
