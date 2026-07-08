import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/prisma.js';
import { clienteSchema } from '$lib/validations/cliente.js';

export const load = async () => {
	const clientes = await prisma.cliente.findMany({
		orderBy: { creadoEn: 'desc' }
	});

	return { clientes };
};

export const actions = {
	crear: async ({ request }) => {
		const formData = await request.formData();
		const raw = Object.fromEntries(formData);

		const result = clienteSchema.safeParse(raw);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors,
				values: raw
			});
		}

		try {
			await prisma.cliente.create({
				data: {
					nombre: result.data.nombre,
					empresa: result.data.empresa || null,
					rfc: result.data.rfc?.toUpperCase() || null,
					correo: result.data.correo,
					telefono: result.data.telefono || null,
					direccion: result.data.direccion || null,
					notas: result.data.notas || null
				}
			});
			return { success: true, message: 'Cliente registrado exitosamente' };
		} catch (err) {
			return fail(500, { errors: { general: 'Error al guardar el cliente' }, values: raw });
		}
	},

	editar: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		const raw = Object.fromEntries(formData);

		const result = clienteSchema.safeParse(raw);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors,
				values: { ...raw, id }
			});
		}

		try {
			await prisma.cliente.update({
				where: { id },
				data: {
					nombre: result.data.nombre,
					empresa: result.data.empresa || null,
					rfc: result.data.rfc?.toUpperCase() || null,
					correo: result.data.correo,
					telefono: result.data.telefono || null,
					direccion: result.data.direccion || null,
					notas: result.data.notas || null
				}
			});
			return { success: true, message: 'Cliente actualizado exitosamente' };
		} catch (err) {
			return fail(500, { errors: { general: 'Error al actualizar el cliente' }, values: { ...raw, id } });
		}
	},

	desactivar: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		try {
			await prisma.cliente.update({
				where: { id },
				data: { activo: false }
			});
			return { success: true, message: 'Cliente desactivado exitosamente' };
		} catch (err) {
			return fail(500, { errors: { general: 'Error al desactivar el cliente' } });
		}
	},

	eliminar: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		try {
			const cliente = await prisma.cliente.findUnique({ where: { id } });
			if (!cliente) return fail(404, { errors: { general: 'Cliente no encontrado' } });
			if (cliente.activo) return fail(400, { errors: { general: 'Solo se pueden eliminar clientes inactivos' } });

			await prisma.cliente.delete({ where: { id } });
			return { success: true, message: 'Cliente eliminado exitosamente' };
		} catch (err) {
			return fail(500, { errors: { general: 'Error al eliminar el cliente' } });
		}
	}
};
