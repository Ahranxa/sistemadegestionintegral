import { error, fail, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/prisma.js';
import { serialize } from '$lib/serialize.js';

export const load = async ({ params }) => {
	const cliente = await prisma.cliente.findUnique({
		where: { id: params.id },
		include: {
			cotizaciones: {
				include: { pagos: true },
				orderBy: { creadoEn: 'desc' }
			}
		}
	});

	if (!cliente) {
		throw error(404, 'Cliente no encontrado');
	}

	let totalFacturado = 0;
	let totalCobrado = 0;

	for (const cot of cliente.cotizaciones) {
		if (cot.estado === 'FACTURADA' || cot.estado === 'PAGADA') {
			totalFacturado += Number(cot.total);
		}
		for (const pago of cot.pagos) {
			totalCobrado += Number(pago.monto);
		}
	}

	const totalPendiente = Math.max(0, totalFacturado - totalCobrado);

	return serialize({
		cliente,
		totalFacturado,
		totalCobrado,
		totalPendiente
	});
};

export const actions = {
	desactivar: async ({ params }) => {
		try {
			await prisma.cliente.update({
				where: { id: params.id },
				data: { activo: false }
			});
			throw redirect(303, '/clientes');
		} catch (err) {
			if (err.status === 303) throw err;
			return fail(500, { errors: { general: 'Error al desactivar el cliente' } });
		}
	},

	activar: async ({ params }) => {
		try {
			await prisma.cliente.update({
				where: { id: params.id },
				data: { activo: true }
			});
			throw redirect(303, '/clientes');
		} catch (err) {
			if (err.status === 303) throw err;
			return fail(500, { errors: { general: 'Error al activar el cliente' } });
		}
	}
};
