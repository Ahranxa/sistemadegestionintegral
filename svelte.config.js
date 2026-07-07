import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		env: {
			publicPrefix: 'PUBLIC_'
		}
	}
};

export default config;
