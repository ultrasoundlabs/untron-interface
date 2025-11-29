import { KV_REST_API_URL, KV_REST_API_TOKEN } from '$env/static/private';
import { Redis } from '@upstash/redis';

if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
	throw new Error('Missing Upstash Redis credentials');
}

// Single shared client for the whole process
export const redis = new Redis({
	url: KV_REST_API_URL,
	token: KV_REST_API_TOKEN
});
