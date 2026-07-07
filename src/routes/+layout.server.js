import { redirect } from '@sveltejs/kit';
import { buildClerkProps } from 'svelte-clerk/server';

export const load = async ({ locals, url }) => {
	const isSignInPage = url.pathname.startsWith('/sign-in');

	if (!isSignInPage) {
		const { userId } = locals.auth();
		if (!userId) {
			throw redirect(303, '/sign-in');
		}
		return {
			PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY,
			...buildClerkProps(locals.auth())
		};
	}

	return {
		PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY,
		...buildClerkProps(locals.auth())
	};
};
