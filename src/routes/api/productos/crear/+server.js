import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma.js';

export const POST = async ({ request }) => {
	try {
		const body = await request.json();
		const { sku, nombre, categoria, tipo, unidad, precioBase, ivaPct, stockInicial } = body;

		if (!sku || !nombre || precioBase === undefined) {
			return json({ error: 'SKU, nombre y precio base son requeridos' }, { status: 400 });
		}

		const producto = await prisma.producto.create({
			data: {
				sku: sku.trim(),
				nombre: nombre.trim(),
				categoria: categoria || null,
				tipo: tipo === 'SERVICIO' ? 'SERVICIO' : 'PRODUCTO',
				unidad: unidad || 'pza',
				precioBase: Number(precioBase),
				ivaPct: Number(ivaPct ?? 16),
				stockFisico: Number(stockInicial ?? 0),
				stockMinimo: 0
			}
		});

		return json({
			id: producto.id,
			sku: producto.sku,
			nombre: producto.nombre,
			categoria: producto.categoria,
			tipo: producto.tipo,
			unidad: producto.unidad,
			precioBase: Number(producto.precioBase),
			ivaPct: Number(producto.ivaPct),
			stockFisico: Number(producto.stockFisico)
		});
	} catch (err) {
		console.error('Error crear producto:', err);
		if (err.code === 'P2002') {
			return json({ error: 'El SKU ya existe' }, { status: 400 });
		}
		return json({ error: err.message || 'Error al crear el producto' }, { status: 500 });
	}
};
