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

function formatDateTime(value) {
	return value
		? new Date(value).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
		: '-';
}

export const GET = async ({ url }) => {
	const formato = url.searchParams.get('formato') || 'csv';

	const recordatorios = await prisma.logRecordatorio.findMany({
		orderBy: { enviadoEn: 'desc' },
		include: {
			cotizacion: { include: { cliente: true } }
		}
	});

	const filas = [
		['Fecha', 'Cotización', 'Cliente', 'Correo', 'Saldo pendiente', 'Enviado por', 'Exitoso', 'Error']
	];

	for (const r of recordatorios) {
		filas.push([
			formatDateTime(r.enviadoEn),
			r.cotizacion?.numero || '-',
			r.cotizacion?.cliente?.nombre || '-',
			r.clienteEmail || '-',
			formatMoney(Number(r.saldoPendiente)),
			r.enviadoPorNombre || r.enviadoPorEmail || '-',
			r.exitoso ? 'Sí' : 'No',
			r.error || '-'
		]);
	}

	if (formato === 'csv') {
		const csv = filas.map((fila) => fila.map(escapeCsv).join(',')).join('\n');
		return new Response(csv, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': 'attachment; filename="recordatorios.csv"'
			}
		});
	}

	if (formato === 'xlsx') {
		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.aoa_to_sheet(filas);
		XLSX.utils.book_append_sheet(wb, ws, 'Recordatorios');
		const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
		return new Response(buf, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': 'attachment; filename="recordatorios.xlsx"'
			}
		});
	}

	return new Response(JSON.stringify({ error: 'Formato no soportado. Usa csv o xlsx' }), {
		status: 400,
		headers: { 'Content-Type': 'application/json' }
	});
};
