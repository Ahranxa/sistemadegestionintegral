import { withClerkHandler } from 'svelte-clerk/server';
import { env } from '$env/dynamic/private';
import { sequence } from '@sveltejs/kit/hooks';
import { getRole } from '$lib/roles.js';

const clerkHandler = withClerkHandler({
	publishableKey: env.PUBLIC_CLERK_PUBLISHABLE_KEY,
	secretKey: env.CLERK_SECRET_KEY
});

const roleHandler = async ({ event, resolve }) => {
	const auth = event.locals.auth();
	const user = auth?.user;
	let role = getRole(user);

	if (!role && user?.primaryEmailAddress?.emailAddress === 'aranxa.lopez@outlook.com') {
		role = 'admin';
	}

	event.locals.userRole = role;
	event.locals.user = user ?? null;
	console.error('[hooks] user:', user?.id, user?.primaryEmailAddress?.emailAddress, 'role:', role);
	return resolve(event);
};

export const handle = sequence(clerkHandler, roleHandler);
