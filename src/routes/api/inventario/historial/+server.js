import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma.js';

export const GET = async ({ url }) => {
	const productoId = url.searchParams.get('productoId');
	if (!productoId) {
		return json({ error: 'productoId requerido' }, { status: 400 });
	}

	const movimientos = await prisma.movimientoInventario.findMany({
		where: { productoId },
		orderBy: { fecha: 'desc' },
		take: 100
	});

	return json(
		movimientos.map((m) => ({
			id: m.id,
			fecha: m.fecha,
			tipo: m.tipoMovimiento,
			cantidad: Number(m.cantidad),
			stockAnterior: Number(m.stockFisicoAnterior),
			stockNuevo: Number(m.stockFisicoNuevo),
			usuario: m.usuarioNombre || '',
			referencia: m.referencia || '',
			observaciones: m.observaciones || ''
		}))
	);
};
