import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma.js';

export const GET = async ({ url }) => {
	const q = (url.searchParams.get('q') || '').trim();

	const productos = await prisma.producto.findMany({
		where: {
			activo: true,
			...(q
				? {
						OR: [
							{ nombre: { contains: q, mode: 'insensitive' } },
							{ sku: { contains: q, mode: 'insensitive' } },
							{ categoria: { contains: q, mode: 'insensitive' } }
						]
					}
				: {})
		},
		select: {
			id: true,
			sku: true,
			nombre: true,
			categoria: true,
			tipo: true,
			unidad: true,
			precioBase: true,
			ivaPct: true,
			stockFisico: true
		},
		orderBy: { nombre: 'asc' },
		take: 10
	});

	return json(
		productos.map((p) => ({
			...p,
			precioBase: Number(p.precioBase),
			ivaPct: Number(p.ivaPct),
			stockFisico: Number(p.stockFisico)
		}))
	);
};
