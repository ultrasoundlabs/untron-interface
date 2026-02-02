import { PUBLIC_UNTRON_BRIDGE_API_URL } from '$env/static/public';
import createClient from 'openapi-fetch';
import type { paths } from './schema'; // generated

export function getApiBaseUrl(): string {
	const envUrl = PUBLIC_UNTRON_BRIDGE_API_URL?.trim();
	return (envUrl && envUrl.length > 0 ? envUrl : 'https://api.untron.finance/bridge').replace(
		/\/$/,
		''
	);
}

export function api(fetchImpl?: typeof fetch) {
	// Ensure cookies (anon principal + future accounts session) are included when
	// calling the API from a different subdomain.
	const fetchWithCreds: typeof fetch = async (input, init) => {
		return (fetchImpl ?? fetch)(input, {
			...init,
			credentials: 'include'
		});
	};

	return createClient<paths>({
		baseUrl: getApiBaseUrl(),
		fetch: fetchWithCreds
	});
}
