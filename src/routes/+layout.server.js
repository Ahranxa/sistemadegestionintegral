import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
	const isSignInPage = url.pathname.startsWith('/sign-in');

	if (!isSignInPage) {
		const { userId } = locals.auth();
		if (!userId) {
			throw redirect(303, '/sign-in');
		}
		return {
			userId,
			user: locals.auth()
		};
	}

	return {};
};
