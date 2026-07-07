export const ROLES = {
	ADMIN: 'admin',
	ASISTENTE: 'asistente',
	SOCIO: 'socio'
};

export function getRole(user) {
	if (!user) return null;
	const role = user.publicMetadata?.role || user.unsafeMetadata?.role;
	return role || null;
}

export function isAdmin(user) {
	return getRole(user) === ROLES.ADMIN;
}

export function isAsistente(user) {
	const role = getRole(user);
	return role === ROLES.ADMIN || role === ROLES.ASISTENTE;
}

export function isSocio(user) {
	const role = getRole(user);
	return role === ROLES.ADMIN || role === ROLES.SOCIO;
}

export function canAccess(user, route) {
	if (!user) return false;
	const role = getRole(user);
	if (!role) return false;
	if (role === ROLES.ADMIN) return true;
	if (role === ROLES.ASISTENTE) {
		return !route.startsWith('/admin');
	}
	if (role === ROLES.SOCIO) {
		return route === '/dashboard' || route.startsWith('/reportes') || route.startsWith('/cotizaciones');
	}
	return false;
}

export function requireRole(user, allowedRoles) {
	const role = getRole(user);
	if (!role || !allowedRoles.includes(role)) {
		return { allowed: false, role };
	}
	return { allowed: true, role };
}
