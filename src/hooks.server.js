import { withClerkHandler } from 'svelte-clerk/server';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { sequence } from '@sveltejs/kit/hooks';
import { getRole } from '$lib/roles.js';

const clerkHandler = withClerkHandler({
	publishableKey: publicEnv.PUBLIC_CLERK_PUBLISHABLE_KEY,
	secretKey: privateEnv.CLERK_SECRET_KEY
});

const roleHandler = async ({ event, resolve }) => {
	console.error(
		'[hooks] Clerk keys present:',
		!!publicEnv.PUBLIC_CLERK_PUBLISHABLE_KEY,
		!!privateEnv.CLERK_SECRET_KEY
	);
	const auth = event.locals.auth();
	const user = auth?.user;
	let role = getRole(user);

	if (!role && user?.primaryEmailAddress?.emailAddress === 'aranxa.lopez@outlook.com') {
		role = 'admin';
	}

	event.locals.userRole = role;
	event.locals.user = user ?? null;
	console.error('[hooks] auth object:', !!auth, 'user:', user?.id, 'role:', role);
	return resolve(event);
};

export const handle = sequence(clerkHandler, roleHandler);
