import { PUBLIC_UNTRON_API_URL } from '$env/static/public';
import createClient from 'openapi-fetch';
import type { paths } from './schema'; // generated

function getApiBaseUrl(): string {
	const envUrl = PUBLIC_UNTRON_API_URL?.trim();
	return (envUrl && envUrl.length > 0 ? envUrl : 'http://localhost:42069/v3').replace(/\/$/, '');
}

export function api(fetchImpl?: typeof fetch) {
	return createClient<paths>({
		baseUrl: getApiBaseUrl(),
		fetch: fetchImpl // optional override
	});
}
