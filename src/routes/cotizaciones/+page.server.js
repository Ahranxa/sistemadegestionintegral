import { prisma } from '$lib/prisma.js';
import { serialize } from '$lib/serialize.js';

export const load = async () => {
	const cotizaciones = await prisma.cotizacion.findMany({
		include: { cliente: true },
		orderBy: { creadoEn: 'desc' }
	}).then((lista) =>
		lista.map((c) => ({
			...c,
			creadoPorNombre: c.creadoPorNombre || c.creadoPorEmail || '—'
		}))
	);

	const clientes = await prisma.cliente.findMany({
		where: { activo: true },
		orderBy: { nombre: 'asc' }
	});

	return serialize({ cotizaciones, clientes });
};
