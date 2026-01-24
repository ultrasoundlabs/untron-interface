import { env } from '$env/dynamic/public';
import createClient from 'openapi-fetch';
import type { paths } from './schema'; // generated

function getApiBaseUrl(): string {
	const envUrl = env.PUBLIC_UNTRON_BRIDGE_API_URL?.trim();
	return (envUrl && envUrl.length > 0 ? envUrl : 'https://api.untron.finance/bridge').replace(
		/\/$/,
		''
	);
}

export function api(fetchImpl?: typeof fetch) {
	return createClient<paths>({
		baseUrl: getApiBaseUrl(),
		fetch: fetchImpl
	});
}
