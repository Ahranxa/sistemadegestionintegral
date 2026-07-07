import { getDashboardData } from '$lib/dashboardData.js';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

	if (formato === 'pdf') {
		const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

		const periodo = data.filtros.usandoFiltroFecha
			? `${formatDate(data.filtros.fechaInicio)} - ${formatDate(data.filtros.fechaFin)}`
			: 'Mes actual';

		doc.setFontSize(18);
		doc.text('Reporte de Dashboard', 40, 50);

		doc.setFontSize(11);
		doc.setTextColor(100);
		doc.text(`Periodo: ${periodo}`, 40, 75);

		doc.setFontSize(12);
		doc.setTextColor(0);
		doc.text('KPIs', 40, 110);

		const finalY1 = autoTable(doc, {
			startY: 125,
			head: [['KPI', 'Valor']],
			body: [
				['Facturado', formatMoney(data.totalFacturado)],
				['Cobrado', formatMoney(data.totalCobrado)],
				['Cartera pendiente', formatMoney(data.carteraPendiente)],
				['Cotizaciones activas', String(data.cotsActivas)]
			],
			theme: 'striped',
			headStyles: { fillColor: [79, 70, 229] }
		}).finalY;

		doc.text('Ingresos por mes', 40, finalY1 + 35);
		const finalY2 = autoTable(doc, {
			startY: finalY1 + 50,
			head: [['Mes', 'Ingreso']],
			body: data.ingresosPorMes.map((i) => [i.label, formatMoney(i.total)]),
			theme: 'striped',
			headStyles: { fillColor: [79, 70, 229] }
		}).finalY;

		doc.text('Cotizaciones por estado', 40, finalY2 + 35);
		const finalY3 = autoTable(doc, {
			startY: finalY2 + 50,
			head: [['Estado', 'Cantidad']],
			body: data.cotsPorEstado.map((e) => [e.estado, String(e._count.estado)]),
			theme: 'striped',
			headStyles: { fillColor: [79, 70, 229] }
		}).finalY;

		doc.text('Últimas cotizaciones', 40, finalY3 + 35);
		const finalY4 = autoTable(doc, {
			startY: finalY3 + 50,
			head: [['Número', 'Cliente', 'Fecha', 'Total', 'Estado']],
			body: data.ultimasCots.map((c) => [
				c.numero,
				c.cliente?.nombre || '-',
				formatDate(c.fecha),
				formatMoney(Number(c.total)),
				c.estado
			]),
			theme: 'striped',
			headStyles: { fillColor: [79, 70, 229] }
		}).finalY;

		doc.text('Top clientes con saldo pendiente', 40, finalY4 + 35);
		autoTable(doc, {
			startY: finalY4 + 50,
			head: [['Cliente', 'Saldo pendiente']],
			body: data.topClientes.map((c) => [c.nombre, formatMoney(c.pendiente)]),
			theme: 'striped',
			headStyles: { fillColor: [79, 70, 229] }
		});

		const pdf = doc.output('arraybuffer');

		return new Response(new Uint8Array(pdf), {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': 'attachment; filename="dashboard.pdf"'
			}
		});
	}

	return new Response(JSON.stringify({ error: 'Formato no soportado' }), {
		status: 400,
		headers: { 'Content-Type': 'application/json' }
	});
};
