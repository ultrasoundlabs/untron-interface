import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		paths: {
			// Prevent deep-route reloads from resolving `./_app` under the current path.
			relative: false
		},
		adapter: adapter({
			fallback: '200.html'
		}),
		prerender: {
			handleUnseenRoutes: 'ignore'
		}
	}
};

export default config;
