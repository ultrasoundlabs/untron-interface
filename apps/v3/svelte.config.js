import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		paths: {
			// See apps/bridge.
			relative: false
		},
		adapter: adapter({
			fallback: '200.html'
		})
	}
};

export default config;
