import { prisma } from '$lib/prisma.js';

export const load = async () => {
	const cotizaciones = await prisma.cotizacion.findMany({
		include: { cliente: true },
		orderBy: { creadoEn: 'desc' }
	});

	const clientes = await prisma.cliente.findMany({
		where: { activo: true },
		orderBy: { nombre: 'asc' }
	});

	return { cotizaciones, clientes };
};
