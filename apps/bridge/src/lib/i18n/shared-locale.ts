import { cookieMaxAge, cookieName, overwriteSetLocale, setLocale } from '$lib/paraglide/runtime';

const baseSetLocale = setLocale;

const isUntronFinanceHost = () => {
	if (typeof window === 'undefined') return false;
	const host = window.location.hostname;
	return host === 'untron.finance' || host.endsWith('.untron.finance');
};

const deleteHostOnlyCookie = () => {
	if (typeof document === 'undefined') return;
	// Remove any host-only cookie so the shared-domain cookie is the single source of truth.
	document.cookie = `${cookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
};

const setSharedLocaleCookie = (locale: string) => {
	if (typeof document === 'undefined' || typeof window === 'undefined') return;
	const secure = window.location.protocol === 'https:' ? '; Secure' : '';
	document.cookie = `${cookieName}=${encodeURIComponent(locale)}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax; Domain=.untron.finance${secure}`;
};

// Ensure the locale cookie is shared between `untron.finance` and `bridge.untron.finance`.
overwriteSetLocale((newLocale, options) => {
	const shouldReload = options?.reload ?? true;

	// Run Paraglide's default logic without reloading so we can normalize cookies first.
	baseSetLocale(newLocale, { ...options, reload: false });

	if (isUntronFinanceHost()) {
		deleteHostOnlyCookie();
		setSharedLocaleCookie(newLocale);
	}

	if (shouldReload && typeof window !== 'undefined') {
		window.location.reload();
	}
});

