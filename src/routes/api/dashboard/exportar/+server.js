import { getDashboardData } from '$lib/dashboardData.js';
import * as XLSX from 'xlsx';

function escapeCsv(value) {
	const str = value == null ? '' : String(value);
	if (str.includes(',') || str.includes('"') || str.includes('\n')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

function formatMoney(value) {
	return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

function formatDate(value) {
	return value ? new Date(value).toLocaleDateString('es-MX') : '-';
}

export const GET = async ({ url }) => {
	const formato = url.searchParams.get('formato');
	const clienteId = url.searchParams.get('clienteId') || null;
	const fechaInicio = url.searchParams.get('fechaInicio');
	const fechaFin = url.searchParams.get('fechaFin');

	const data = await getDashboardData({ clienteId, fechaInicioParam: fechaInicio, fechaFinParam: fechaFin });

	if (formato === 'csv') {
		const lineas = [
			['KPI', 'Valor'],
			['Facturado', formatMoney(data.totalFacturado)],
			['Cobrado', formatMoney(data.totalCobrado)],
			['Cartera pendiente', formatMoney(data.carteraPendiente)],
			['Cotizaciones activas', data.cotsActivas],
			[],
			['Mes', 'Ingreso'],
			...data.ingresosPorMes.map((i) => [i.label, formatMoney(i.total)]),
			[],
			['Estado', 'Cantidad'],
			...data.cotsPorEstado.map((e) => [e.estado, e._count.estado]),
			[],
			['Método de pago', 'Pagos', 'Monto'],
			...data.ingresosPorMetodo.map((m) => [m.metodo, m.cantidad, formatMoney(m.monto)]),
			[],
			['Número', 'Cliente', 'Fecha', 'Total', 'Estado'],
			...data.ultimasCots.map((c) => [
				c.numero,
				c.cliente?.nombre || '-',
				formatDate(c.fecha),
				formatMoney(Number(c.total)),
				c.estado
			]),
			[],
			['Cliente', 'Saldo pendiente'],
			...data.topClientes.map((c) => [c.nombre, formatMoney(c.pendiente)])
		];

		const csv = lineas.map((fila) => fila.map(escapeCsv).join(',')).join('\n');

		return new Response(csv, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': 'attachment; filename="dashboard.csv"'
			}
		});
	}

	if (formato === 'xlsx') {
		const wb = XLSX.utils.book_new();

		const kpis = [
			['KPI', 'Valor'],
			['Facturado', data.totalFacturado],
			['Cobrado', data.totalCobrado],
			['Cartera pendiente', data.carteraPendiente],
			['Cotizaciones activas', data.cotsActivas]
		];
		XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kpis), 'KPIs');

		const ingresos = [['Mes', 'Ingreso'], ...data.ingresosPorMes.map((i) => [i.label, i.total])];
		XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ingresos), 'Ingresos');

		const estados = [['Estado', 'Cantidad'], ...data.cotsPorEstado.map((e) => [e.estado, e._count.estado])];
		XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(estados), 'Estados');

		const metodos = [['Método de pago', 'Pagos', 'Monto'], ...data.ingresosPorMetodo.map((m) => [m.metodo, m.cantidad, m.monto])];
		XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(metodos), 'Metodos de pago');

		const ultimas = [
			['Número', 'Cliente', 'Fecha', 'Total', 'Estado'],
			...data.ultimasCots.map((c) => [
				c.numero,
				c.cliente?.nombre || '-',
				formatDate(c.fecha),
				Number(c.total),
				c.estado
			])
		];
		XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ultimas), 'Ultimas cotizaciones');

		const top = [['Cliente', 'Saldo pendiente'], ...data.topClientes.map((c) => [c.nombre, c.pendiente])];
		XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(top), 'Top clientes');

		const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

		return new Response(buf, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': 'attachment; filename="dashboard.xlsx"'
			}
		});
	}

	return new Response(JSON.stringify({ error: 'Formato no soportado. Usa csv o xlsx' }), {
		status: 400,
		headers: { 'Content-Type': 'application/json' }
	});
};
