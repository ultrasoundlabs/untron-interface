export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'theme';

export function getStoredThemePreference(): ThemePreference | null {
	if (typeof localStorage === 'undefined') return null;
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
	return null;
}

export function getSystemTheme(): Exclude<ThemePreference, 'system'> {
	if (typeof window === 'undefined') return 'light';
	return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
}

export function resolveTheme(preference: ThemePreference): Exclude<ThemePreference, 'system'> {
	return preference === 'system' ? getSystemTheme() : preference;
}

export function applyTheme(preference: ThemePreference): void {
	if (typeof document === 'undefined') return;
	const resolved = resolveTheme(preference);
	document.documentElement.classList.toggle('dark', resolved === 'dark');
	document.documentElement.style.colorScheme = resolved;
}

export function setThemePreference(preference: ThemePreference): void {
	applyTheme(preference);
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(THEME_STORAGE_KEY, preference);
}

export function initTheme(defaultPreference: ThemePreference = 'light'): ThemePreference {
	const stored = getStoredThemePreference() ?? defaultPreference;
	applyTheme(stored);
	return stored;
}
