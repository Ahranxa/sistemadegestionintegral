import { prisma } from '$lib/prisma.js';
import * as XLSX from 'xlsx';

function escapeCsv(value) {
	const str = value == null ? '' : String(value);
	if (str.includes(',') || str.includes('"') || str.includes('\n')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

function formatDate(value) {
	return value ? new Date(value).toLocaleDateString('es-MX') : '-';
}

function formatDateTime(value) {
	return value
		? new Date(value).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
		: '-';
}

const estadosLabel = {
	BORRADOR: 'Borrador',
	ENVIADA: 'Enviada',
	APROBADA: 'Aprobada',
	RECHAZADA: 'Rechazada',
	FACTURADA: 'Facturada',
	PAGADA: 'Pagada'
};

export const GET = async ({ url }) => {
	const formato = url.searchParams.get('formato') || 'csv';
	const cotizacionId = url.searchParams.get('cotizacionId') || null;

	const historial = await prisma.historialCot.findMany({
		where: cotizacionId ? { cotizacionId } : {},
		orderBy: { creadoEn: 'desc' },
		include: {
			cotizacion: { include: { cliente: true } }
		}
	});

	const filas = [
		['Fecha', 'Cotización', 'Cliente', 'Estado anterior', 'Estado nuevo', 'Nota', 'Usuario']
	];

	for (const h of historial) {
		filas.push([
			formatDateTime(h.creadoEn),
			h.cotizacion?.numero || '-',
			h.cotizacion?.cliente?.nombre || '-',
			h.estadoAnterior ? estadosLabel[h.estadoAnterior] : '-',
			h.estadoNuevo ? estadosLabel[h.estadoNuevo] : '-',
			h.nota || '-',
			h.creadoPorNombre || h.creadoPorEmail || '-'
		]);
	}

	if (formato === 'csv') {
		const csv = filas.map((fila) => fila.map(escapeCsv).join(',')).join('\n');
		const filename = cotizacionId ? 'historial-cotizacion.csv' : 'historial-cotizaciones.csv';
		return new Response(csv, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	}

	if (formato === 'xlsx') {
		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.aoa_to_sheet(filas);
		XLSX.utils.book_append_sheet(wb, ws, 'Historial');
		const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
		const filename = cotizacionId ? 'historial-cotizacion.xlsx' : 'historial-cotizaciones.xlsx';
		return new Response(buf, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	}

	return new Response(JSON.stringify({ error: 'Formato no soportado. Usa csv o xlsx' }), {
		status: 400,
		headers: { 'Content-Type': 'application/json' }
	});
};
