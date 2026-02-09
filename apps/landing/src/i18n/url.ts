export function normalizeLocaleUrl(url: string): string {
  if (!url) return '/';
  if (url.length === 1) return url;
  if (url.endsWith('/')) return url;
  return `${url}/`;
}
