import { withClerkHandler } from 'svelte-clerk/server';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { sequence } from '@sveltejs/kit/hooks';
import { getRole } from '$lib/roles.js';
import { getUserFromClerkApi } from '$lib/userInfo.js';

const clerkHandler = withClerkHandler({
	publishableKey: publicEnv.PUBLIC_CLERK_PUBLISHABLE_KEY,
	secretKey: privateEnv.CLERK_SECRET_KEY
});

const roleHandler = async ({ event, resolve }) => {
	const auth = event.locals.auth();
	let user = auth?.user;

	if (!user && auth?.userId && privateEnv.CLERK_SECRET_KEY) {
		user = await getUserFromClerkApi(auth.userId, privateEnv.CLERK_SECRET_KEY);
	}

	let role = getRole(user);

	if (!role && user?.email === 'aranxa.lopez@outlook.com') {
		role = 'admin';
	}

	event.locals.userRole = role;
	event.locals.user = user ?? null;
	return resolve(event);
};

export const handle = sequence(clerkHandler, roleHandler);
