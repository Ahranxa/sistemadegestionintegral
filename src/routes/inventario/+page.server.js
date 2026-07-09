import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/prisma.js';
import { serialize } from '$lib/serialize.js';
import { registrarMovimiento } from '$lib/inventario.js';
import { getUserInfo } from '$lib/userInfo.js';

export const load = async () => {
	const productos = await prisma.producto.findMany({
		where: { tipo: 'PRODUCTO' },
		include: {
			reservas: { where: { estatus: 'ACTIVA' } },
			movimientos: { orderBy: { fecha: 'desc' }, take: 1 }
		},
		orderBy: { nombre: 'asc' }
	});

	const inventario = productos.map((p) => {
		const stockReservado = p.reservas.reduce((s, r) => s + Number(r.cantidad), 0);
		const stockFisico = Number(p.stockFisico);
		const stockDisponible = Math.max(0, stockFisico - stockReservado);
		const ultimoMovimiento = p.movimientos[0] || null;

		return {
			id: p.id,
			sku: p.sku,
			nombre: p.nombre,
			categoria: p.categoria,
			unidad: p.unidad,
			stockFisico,
			stockReservado,
			stockDisponible,
			stockMinimo: Number(p.stockMinimo),
			precioBase: Number(p.precioBase),
			activo: p.activo,
			ultimoMovimiento: ultimoMovimiento
				? { fecha: ultimoMovimiento.fecha, tipo: ultimoMovimiento.tipoMovimiento }
				: null
		};
	});

	return serialize({ inventario });
};

export const actions = {
	movimiento: async ({ request, locals }) => {
		const user = getUserInfo(locals);
		const formData = await request.formData();
		const productoId = formData.get('productoId');
		const tipo = formData.get('tipo');
		const cantidad = parseFloat(formData.get('cantidad'));
		const observaciones = formData.get('observaciones') || '';

		if (!productoId) return fail(400, { error: 'Producto requerido' });
		if (!['ENTRADA', 'AJUSTE', 'DEVOLUCION', 'STOCK_INICIAL'].includes(tipo)) {
			return fail(400, { error: 'Tipo de movimiento invalido' });
		}
		if (isNaN(cantidad) || cantidad <= 0) {
			return fail(400, { error: 'La cantidad debe ser mayor a 0' });
		}

		try {
			await prisma.$transaction(async (tx) => {
				await registrarMovimiento({ productoId, tipo, cantidad, observaciones, user }, tx);
			});
			return { success: true };
		} catch (err) {
			console.error(err);
			return fail(400, { error: err.message || 'Error al registrar movimiento' });
		}
	}
};
