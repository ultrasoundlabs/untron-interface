import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
import { m } from '$lib/paraglide/messages.js';

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
let overlayEl: HTMLDivElement | null = null;
let modalEl: HTMLDivElement | null = null;
let bodyEl: HTMLDivElement | null = null;
let widgetHostEl: HTMLDivElement | null = null;
let widgetFrameEl: HTMLDivElement | null = null;
let previousBodyOverflow: string | null = null;

let inFlightTokenPromise: Promise<string> | null = null;
let resolveToken: ((token: string) => void) | null = null;
let rejectToken: ((err: Error) => void) | null = null;

function hideWidget() {
	if (!overlayEl) return;
	overlayEl.setAttribute('aria-hidden', 'true');
	overlayEl.style.opacity = '0';
	overlayEl.style.pointerEvents = 'none';
	overlayEl.style.visibility = 'hidden';
	if (previousBodyOverflow !== null) {
		document.body.style.overflow = previousBodyOverflow;
		previousBodyOverflow = null;
	}
}

function showWidget() {
	if (!overlayEl) return;
	if (previousBodyOverflow === null) previousBodyOverflow = document.body.style.overflow ?? '';
	document.body.style.overflow = 'hidden';
	overlayEl.setAttribute('aria-hidden', 'false');
	overlayEl.style.visibility = 'visible';
	overlayEl.style.opacity = '1';
	overlayEl.style.pointerEvents = 'auto';
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

function ensureOverlay() {
	if (overlayEl && widgetHostEl && widgetFrameEl && modalEl && bodyEl) return;

	overlayEl = document.createElement('div');
	overlayEl.setAttribute('aria-hidden', 'true');
	overlayEl.style.position = 'fixed';
	overlayEl.style.inset = '0';
	overlayEl.style.zIndex = '2147483647';
	overlayEl.style.display = 'flex';
	overlayEl.style.alignItems = 'center';
	overlayEl.style.justifyContent = 'center';
	overlayEl.style.padding = '24px';
	overlayEl.style.background = 'rgb(0 0 0 / 0.55)';
	overlayEl.style.backdropFilter = 'blur(6px)';
	overlayEl.style.transition = 'opacity 140ms ease';

	modalEl = document.createElement('div');
	modalEl.setAttribute('role', 'dialog');
	modalEl.setAttribute('aria-modal', 'true');
	modalEl.style.width = 'min(440px, 100%)';
	modalEl.style.borderRadius = 'var(--radius)';
	modalEl.style.border = '1px solid var(--border)';
	modalEl.style.background = 'var(--card)';
	modalEl.style.color = 'var(--card-foreground)';
	modalEl.style.boxShadow = '0 20px 60px rgb(0 0 0 / 0.35)';
	modalEl.style.padding = '18px';

	bodyEl = document.createElement('div');
	bodyEl.style.fontSize = '14px';
	bodyEl.style.lineHeight = '1.45';
	bodyEl.style.color = 'var(--muted-foreground)';
	bodyEl.style.textAlign = 'center';

	widgetHostEl = document.createElement('div');
	widgetHostEl.id = 'untron-turnstile';
	widgetHostEl.style.display = 'flex';
	widgetHostEl.style.justifyContent = 'center';

	widgetFrameEl = document.createElement('div');
	widgetFrameEl.style.marginTop = '14px';
	widgetFrameEl.style.padding = '12px';
	widgetFrameEl.style.border = '1px solid var(--border)';
	widgetFrameEl.style.borderRadius = '12px';
	widgetFrameEl.style.background = 'var(--card)';
	widgetFrameEl.style.boxShadow = '0 0 0 4px rgb(255 255 255 / 0.06)';

	modalEl.appendChild(bodyEl);
	widgetFrameEl.appendChild(widgetHostEl);
	modalEl.appendChild(widgetFrameEl);
	overlayEl.appendChild(modalEl);
	document.body.appendChild(overlayEl);

	hideWidget();
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

	ensureOverlay();
	if (!widgetHostEl || !bodyEl) throw new Error('Turnstile overlay missing');
	bodyEl.textContent = m.turnstile_nudge();

	if (widgetId) return widgetId;

	widgetId = window.turnstile.render(widgetHostEl, {
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
			}, 650);

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
