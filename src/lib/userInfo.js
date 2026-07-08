export function getUserInfo(locals) {
	const user = locals.user;
	if (!user) return null;
	return normalizeUser(user);
}

function normalizeUser(user) {
	const email = user.email
		?? user.emailAddresses?.[0]?.emailAddress
		?? user.primaryEmailAddress?.emailAddress
		?? user.emailAddress
		?? null;
	const firstName = user.firstName ?? user.first_name ?? '';
	const lastName = user.lastName ?? user.last_name ?? '';
	return {
		id: user.id ?? null,
		email,
		nombre: user.nombre ?? (`${firstName} ${lastName}`.trim() || email || 'Usuario')
	};
}

export async function getUserFromClerkApi(userId, secretKey) {
	if (!userId || !secretKey) return null;
	try {
		const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
			headers: { Authorization: `Bearer ${secretKey}` }
		});
		if (!res.ok) {
			console.error('[clerk api] error fetching user:', res.status, await res.text());
			return null;
		}
		const user = await res.json();
		return normalizeUser(user);
	} catch (err) {
		console.error('[clerk api] exception fetching user:', err);
		return null;
	}
}
