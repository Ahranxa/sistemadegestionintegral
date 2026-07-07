import { serialize } from '$lib/serialize.js';
import { getDashboardData } from '$lib/dashboardData.js';

export const load = async ({ url }) => {
	const clienteId = url.searchParams.get('clienteId') || null;
	const fechaInicio = url.searchParams.get('fechaInicio');
	const fechaFin = url.searchParams.get('fechaFin');

	const data = await getDashboardData({ clienteId, fechaInicioParam: fechaInicio, fechaFinParam: fechaFin });

	return serialize({
		totalFacturado: data.totalFacturado,
		totalCobrado: data.totalCobrado,
		carteraPendiente: data.carteraPendiente,
		cotsActivas: data.cotsActivas,
		ingresosPorMes: data.ingresosPorMes,
		cotsPorEstado: data.cotsPorEstado,
		ultimasCots: data.ultimasCots,
		topClientes: data.topClientes,
		clientes: data.clientes,
		filtros: data.filtros
	});
};
