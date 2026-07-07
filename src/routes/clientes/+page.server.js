import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/prisma.js';
import { clienteSchema } from '$lib/validations/cliente.js';

export const load = async () => {
	const clientes = await prisma.cliente.findMany({
		where: { activo: true },
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

	exportarCorreos: async () => {
		const clientes = await prisma.cliente.findMany({
			where: { activo: true },
			orderBy: { nombre: 'asc' }
		});

		const filas = clientes
			.filter((c) => c.correo && c.correo.includes('@'))
			.map((c) => {
				const partes = c.nombre.trim().split(' ');
				const firstName = partes[0] || '';
				const lastName = partes.slice(1).join(' ') || '';
				const email = c.correo.trim();
				return `${escapeCsv(email)},${escapeCsv(firstName)},${escapeCsv(lastName)},true`;
			});

		const csv = ['email,first_name,last_name,subscribed', ...filas].join('\n');

		return new Response(csv, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': 'attachment; filename="clientes-resend.csv"'
			}
		});
	}
};

function escapeCsv(value) {
	if (value.includes(',') || value.includes('"') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}
