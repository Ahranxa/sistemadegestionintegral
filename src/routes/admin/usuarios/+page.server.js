import { fail, redirect } from '@sveltejs/kit';
import { createClerkClient } from '@clerk/backend';
import { env } from '$env/dynamic/private';
import { ROLES, isAdmin } from '$lib/roles.js';

export const load = async ({ locals }) => {
	if (!isAdmin(locals.user)) {
		throw redirect(303, '/dashboard');
	}

	try {
		const { data: usuarios } = await createClerkClient({ secretKey: env.CLERK_SECRET_KEY }).users.getUserList({
			limit: 100
		});

		const lista = usuarios.map((u) => ({
			id: u.id,
			email: u.primaryEmailAddress?.emailAddress ?? '-',
			nombre: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || '-',
			rol: u.publicMetadata?.role ?? u.unsafeMetadata?.role ?? 'sin-rol',
			creadoEn: u.createdAt
		}));

		return { usuarios: lista, roles: Object.values(ROLES) };
	} catch (err) {
		console.error('Error cargando usuarios de Clerk:', err);
		return { usuarios: [], roles: Object.values(ROLES), error: 'No se pudieron cargar los usuarios' };
	}
};

export const actions = {
	crear: async ({ request, locals }) => {
		if (!isAdmin(locals.user)) {
			return fail(403, { error: 'No autorizado' });
		}

		const formData = await request.formData();
		const email = formData.get('email')?.toString().trim();
		const password = formData.get('password')?.toString();
		const rol = formData.get('rol')?.toString();
		const nombre = formData.get('nombre')?.toString().trim();

		if (!email || !password || !rol) {
			return fail(400, { error: 'Email, contraseña y rol son obligatorios' });
		}

		if (!Object.values(ROLES).includes(rol)) {
			return fail(400, { error: 'Rol inválido' });
		}

		try {
			const parts = nombre ? nombre.split(' ') : ['', ''];
			const firstName = parts[0] || '';
			const lastName = parts.slice(1).join(' ') || '';

			await createClerkClient({ secretKey: env.CLERK_SECRET_KEY }).users.createUser({
				emailAddress: [email],
				password,
				firstName,
				lastName,
				publicMetadata: { role: rol }
			});

			return { success: true };
		} catch (err) {
			console.error('Error creando usuario:', err);
			return fail(500, { error: err.message || 'Error al crear el usuario' });
		}
	},

	eliminar: async ({ request, locals }) => {
		if (!isAdmin(locals.user)) {
			return fail(403, { error: 'No autorizado' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		if (!userId) {
			return fail(400, { error: 'Usuario no especificado' });
		}

		try {
			await createClerkClient({ secretKey: env.CLERK_SECRET_KEY }).users.deleteUser(userId);
			return { success: true };
		} catch (err) {
			console.error('Error eliminando usuario:', err);
			return fail(500, { error: err.message || 'Error al eliminar el usuario' });
		}
	},

	cambiarRol: async ({ request, locals }) => {
		if (!isAdmin(locals.user)) {
			return fail(403, { error: 'No autorizado' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();
		const rol = formData.get('rol')?.toString();

		if (!userId || !rol || !Object.values(ROLES).includes(rol)) {
			return fail(400, { error: 'Datos inválidos' });
		}

		try {
			await createClerkClient({ secretKey: env.CLERK_SECRET_KEY }).users.updateUser(userId, {
				publicMetadata: { role: rol }
			});
			return { success: true };
		} catch (err) {
			console.error('Error cambiando rol:', err);
			return fail(500, { error: err.message || 'Error al cambiar el rol' });
		}
	}
};
