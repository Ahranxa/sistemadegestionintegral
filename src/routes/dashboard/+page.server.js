import { prisma } from '$lib/prisma.js';
import { serialize } from '$lib/serialize.js';

export const load = async () => {
	const ahora = new Date();
	const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

	const cotizacionesMes = await prisma.cotizacion.findMany({
		where: {
			estado: { not: 'BORRADOR' },
			creadoEn: { gte: inicioMes }
		}
	});
	const totalFacturado = cotizacionesMes.reduce((s, c) => s + Number(c.total), 0);

	const pagosMes = await prisma.pago.findMany({
		where: { fecha: { gte: inicioMes } }
	});
	const totalCobrado = pagosMes.reduce((s, p) => s + Number(p.monto), 0);

	const cotsPendientes = await prisma.cotizacion.findMany({
		where: { estado: { in: ['APROBADA', 'FACTURADA'] } },
		include: { pagos: true }
	});
	const carteraPendiente = cotsPendientes.reduce((s, c) => {
		const pagado = c.pagos.reduce((sp, p) => sp + Number(p.monto), 0);
		return s + (Number(c.total) - pagado);
	}, 0);

	const cotsActivas = await prisma.cotizacion.count({
		where: { estado: { in: ['ENVIADA', 'APROBADA', 'FACTURADA'] } }
	});

	const hace6Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
	const pagos6Meses = await prisma.pago.findMany({
		where: { fecha: { gte: hace6Meses } },
		orderBy: { fecha: 'asc' }
	});

	const meses = [];
	for (let i = 5; i >= 0; i--) {
		const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
		meses.push({
			inicio: d,
			label: d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
		});
	}

	const ingresosPorMes = meses.map((mes) => {
		const fin = new Date(mes.inicio.getFullYear(), mes.inicio.getMonth() + 1, 1);
		const total = pagos6Meses
			.filter((p) => {
				const f = new Date(p.fecha);
				return f >= mes.inicio && f < fin;
			})
			.reduce((s, p) => s + Number(p.monto), 0);
		return { label: mes.label, total };
	});

	const cotsPorEstado = await prisma.cotizacion.groupBy({
		by: ['estado'],
		_count: { estado: true }
	});

	const ultimasCots = await prisma.cotizacion.findMany({
		take: 5,
		orderBy: { creadoEn: 'desc' },
		include: { cliente: true }
	});

	const clientesConCots = await prisma.cliente.findMany({
		where: { activo: true },
		include: {
			cotizaciones: {
				where: { estado: { in: ['APROBADA', 'FACTURADA'] } },
				include: { pagos: true }
			}
		}
	});

	const topClientes = clientesConCots
		.map((cliente) => {
			const pendiente = cliente.cotizaciones.reduce((s, c) => {
				const pagado = c.pagos.reduce((sp, p) => sp + Number(p.monto), 0);
				return s + (Number(c.total) - pagado);
			}, 0);
			return { ...cliente, pendiente };
		})
		.filter((c) => c.pendiente > 0)
		.sort((a, b) => b.pendiente - a.pendiente)
		.slice(0, 3);

	return serialize({
		totalFacturado,
		totalCobrado,
		carteraPendiente,
		cotsActivas,
		ingresosPorMes,
		cotsPorEstado,
		ultimasCots,
		topClientes
	});
};
