export function getUserInfo(locals) {
	const user = locals.user;
	if (!user) return null;
	return {
		id: user.id ?? null,
		email: user.primaryEmailAddress?.emailAddress ?? null,
		nombre: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.primaryEmailAddress?.emailAddress || 'Usuario'
	};
}
