import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/prisma.js';
import { serialize } from '$lib/serialize.js';

export const load = async () => {
	const productos = await prisma.producto.findMany({
		orderBy: { creadoEn: 'desc' }
	});
	return serialize({ productos });
};

export const actions = {
	crear: async ({ request }) => {
		const formData = await request.formData();
		const raw = Object.fromEntries(formData);

		const sku = (raw.sku || '').trim();
		const nombre = (raw.nombre || '').trim();
		if (!sku) return fail(400, { errors: { sku: 'El SKU es requerido' }, values: raw });
		if (!nombre) return fail(400, { errors: { nombre: 'El nombre es requerido' }, values: raw });
		if (!raw.precioBase || isNaN(Number(raw.precioBase)))
			return fail(400, { errors: { precioBase: 'El precio base es requerido' }, values: raw });

		try {
			await prisma.producto.create({
				data: {
					sku,
					nombre,
					descripcion: raw.descripcion || null,
					categoria: raw.categoria || null,
					tipo: raw.tipo === 'SERVICIO' ? 'SERVICIO' : 'PRODUCTO',
					unidad: raw.unidad || 'pza',
					precioBase: Number(raw.precioBase),
					ivaPct: Number(raw.ivaPct ?? 16),
					stockFisico: Number(raw.stockFisico ?? 0),
					stockMinimo: Number(raw.stockMinimo ?? 0)
				}
			});
			return { success: true };
		} catch (err) {
			if (err.code === 'P2002') {
				return fail(400, { errors: { sku: 'El SKU ya existe' }, values: raw });
			}
			return fail(500, { errors: { general: 'Error al crear el producto' }, values: raw });
		}
	},

	editar: async ({ request }) => {
		const formData = await request.formData();
		const raw = Object.fromEntries(formData);

		const id = raw.id;
		const sku = (raw.sku || '').trim();
		const nombre = (raw.nombre || '').trim();
		if (!id) return fail(400, { errors: { general: 'ID requerido' } });
		if (!sku) return fail(400, { errors: { sku: 'El SKU es requerido' }, values: raw });
		if (!nombre) return fail(400, { errors: { nombre: 'El nombre es requerido' }, values: raw });

		try {
			await prisma.producto.update({
				where: { id },
				data: {
					sku,
					nombre,
					descripcion: raw.descripcion || null,
					categoria: raw.categoria || null,
					tipo: raw.tipo === 'SERVICIO' ? 'SERVICIO' : 'PRODUCTO',
					unidad: raw.unidad || 'pza',
					precioBase: Number(raw.precioBase),
					ivaPct: Number(raw.ivaPct ?? 16),
					stockFisico: Number(raw.stockFisico ?? 0),
					stockMinimo: Number(raw.stockMinimo ?? 0)
				}
			});
			return { success: true };
		} catch (err) {
			if (err.code === 'P2002') {
				return fail(400, { errors: { sku: 'El SKU ya existe' }, values: raw });
			}
			return fail(500, { errors: { general: 'Error al editar el producto' }, values: raw });
		}
	},

	desactivar: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		try {
			await prisma.producto.update({ where: { id }, data: { activo: false } });
			return { success: true };
		} catch {
			return fail(500, { errors: { general: 'Error al desactivar' } });
		}
	},

	activar: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		try {
			await prisma.producto.update({ where: { id }, data: { activo: true } });
			return { success: true };
		} catch {
			return fail(500, { errors: { general: 'Error al activar' } });
		}
	}
};
