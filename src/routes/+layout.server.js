import { redirect } from '@sveltejs/kit';
import { buildClerkProps } from 'svelte-clerk/server';
import { env as publicEnv } from '$env/dynamic/public';

export const load = async ({ locals, url }) => {
	const isSignInPage = url.pathname.startsWith('/sign-in');
	const clerkProps = buildClerkProps(locals.auth());

	if (!isSignInPage) {
		const { userId } = locals.auth();
		if (!userId) {
			throw redirect(303, '/sign-in');
		}
	}

	return {
		PUBLIC_CLERK_PUBLISHABLE_KEY: publicEnv.PUBLIC_CLERK_PUBLISHABLE_KEY,
		userRole: locals.userRole,
		user: clerkProps.user,
		...clerkProps
	};
};
