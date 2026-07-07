import { withClerkHandler } from 'svelte-clerk/server';
import { env } from '$env/dynamic/private';

export const handle = withClerkHandler({
	publishableKey: env.PUBLIC_CLERK_PUBLISHABLE_KEY,
	secretKey: env.CLERK_SECRET_KEY
});
