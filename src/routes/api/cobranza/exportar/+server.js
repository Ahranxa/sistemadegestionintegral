import { prisma } from '$lib/prisma.js';
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
	const formato = url.searchParams.get('formato') || 'csv';

	const cotizaciones = await prisma.cotizacion.findMany({
		where: {
			estado: { in: ['APROBADA', 'FACTURADA'] }
		},
		include: {
			cliente: true,
			pagos: true
		},
		orderBy: { fecha: 'desc' }
	});

	const hoy = new Date();

	const pendientes = cotizaciones
		.map((cot) => {
			const totalPagado = cot.pagos.reduce((sum, p) => sum + Number(p.monto), 0);
			const saldoPendiente = Number(cot.total) - totalPagado;
			const diasTranscurridos = Math.floor(
				(hoy.getTime() - new Date(cot.fecha).getTime()) / (1000 * 60 * 60 * 24)
			);
			return { ...cot, totalPagado, saldoPendiente, diasTranscurridos };
		})
		.filter((cot) => cot.saldoPendiente > 0)
		.sort((a, b) => b.diasTranscurridos - a.diasTranscurridos);

	const filas = [
		['Cliente', 'Cotización', 'Fecha', 'Total', 'Pagado', 'Pendiente', 'Días transcurridos']
	];

	for (const cot of pendientes) {
		filas.push([
			cot.cliente?.nombre || '-',
			cot.numero,
			formatDate(cot.fecha),
			formatMoney(Number(cot.total)),
			formatMoney(cot.totalPagado),
			formatMoney(cot.saldoPendiente),
			cot.diasTranscurridos
		]);
	}

	if (formato === 'csv') {
		const csv = filas.map((fila) => fila.map(escapeCsv).join(',')).join('\n');
		return new Response(csv, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': 'attachment; filename="cobranza.csv"'
			}
		});
	}

	if (formato === 'xlsx') {
		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.aoa_to_sheet(filas);
		XLSX.utils.book_append_sheet(wb, ws, 'Cobranza');
		const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
		return new Response(buf, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': 'attachment; filename="cobranza.xlsx"'
			}
		});
	}

	return new Response(JSON.stringify({ error: 'Formato no soportado. Usa csv o xlsx' }), {
		status: 400,
		headers: { 'Content-Type': 'application/json' }
	});
};
