import { prisma } from './prisma.js';

function inicioDelMes(fecha) {
	return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

function finDelMes(fecha) {
	return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59, 999);
}

function formatearMes(fecha) {
	return fecha.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
}

function formatearFechaInput(fecha) {
	return fecha.toISOString().split('T')[0];
}

export async function getDashboardData({ clienteId = null, fechaInicioParam = null, fechaFinParam = null } = {}) {
	const ahora = new Date();
	const usandoFiltroFecha = fechaInicioParam && fechaFinParam;

	let fechaInicio;
	let fechaFin;

	if (usandoFiltroFecha) {
		fechaInicio = new Date(fechaInicioParam);
		fechaFin = new Date(fechaFinParam);
		fechaFin.setHours(23, 59, 59, 999);
	} else {
		fechaInicio = inicioDelMes(ahora);
		fechaFin = finDelMes(ahora);
	}

	const whereRango = {
		gte: fechaInicio,
		lte: fechaFin
	};

	const whereCliente = clienteId ? { clienteId } : {};

	const baseWhereCot = {
		creadoEn: whereRango,
		...whereCliente
	};

	const [cotizacionesMes, pagosMes] = await Promise.all([
		prisma.cotizacion.findMany({
			where: baseWhereCot,
			include: { pagos: true, cliente: true }
		}),
		prisma.pago.findMany({
			where: {
				fecha: whereRango,
				...(clienteId ? { cotizacion: { clienteId } } : {})
			},
			include: { cotizacion: { include: { cliente: true } } }
		})
	]);

	const totalFacturado = cotizacionesMes
		.filter((c) => c.estado === 'FACTURADA' || c.estado === 'PAGADA')
		.reduce((s, c) => s + Number(c.total), 0);

	const totalCobrado = pagosMes.reduce((s, p) => s + Number(p.monto), 0);

	const cotsActivas = cotizacionesMes.filter((c) =>
		['ENVIADA', 'APROBADA', 'FACTURADA'].includes(c.estado)
	).length;

	const cotsPendientes = await prisma.cotizacion.findMany({
		where: {
			estado: { in: ['APROBADA', 'FACTURADA'] },
			...whereCliente
		},
		include: { pagos: true, cliente: true }
	});
	const carteraPendiente = cotsPendientes.reduce((s, c) => {
		const pagado = c.pagos.reduce((sp, p) => sp + Number(p.monto), 0);
		return s + (Number(c.total) - pagado);
	}, 0);

	const rangoMeses = Math.max(
		(fechaFin.getFullYear() - fechaInicio.getFullYear()) * 12 +
			(fechaFin.getMonth() - fechaInicio.getMonth()),
		0
	);

	const meses = [];
	for (let i = 0; i <= rangoMeses; i++) {
		const d = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + i, 1);
		meses.push({
			inicio: d,
			fin: finDelMes(d),
			label: formatearMes(d)
		});
	}

	const ingresosPorMes = meses.map((mes) => {
		const total = pagosMes
			.filter((p) => {
				const f = new Date(p.fecha);
				return f >= mes.inicio && f <= mes.fin;
			})
			.reduce((s, p) => s + Number(p.monto), 0);
		return { label: mes.label, total };
	});

	const cotsPorEstado = await prisma.cotizacion.groupBy({
		by: ['estado'],
		where: baseWhereCot,
		_count: { estado: true }
	});

	const ultimasCots = await prisma.cotizacion.findMany({
		where: baseWhereCot,
		take: 5,
		orderBy: { creadoEn: 'desc' },
		include: { cliente: true }
	});

	const clientes = await prisma.cliente.findMany({
		where: { activo: true },
		orderBy: { nombre: 'asc' }
	});

	const clientesConCots = await prisma.cliente.findMany({
		where: { activo: true, ...(clienteId ? { id: clienteId } : {}) },
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

	return {
		totalFacturado,
		totalCobrado,
		carteraPendiente,
		cotsActivas,
		ingresosPorMes,
		cotsPorEstado,
		ultimasCots,
		topClientes,
		clientes,
		cotizacionesMes,
		pagosMes,
		filtros: {
			clienteId,
			fechaInicio: usandoFiltroFecha ? formatearFechaInput(fechaInicio) : null,
			fechaFin: usandoFiltroFecha ? formatearFechaInput(fechaFin) : null,
			usandoFiltroFecha
		}
	};
}
