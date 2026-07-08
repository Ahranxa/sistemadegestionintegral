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

	const [cots, pagos, historial, recordatorios] = await Promise.all([
		prisma.cotizacion.findMany({
			orderBy: { creadoEn: 'desc' },
			include: { cliente: true }
		}),
		prisma.pago.findMany({
			orderBy: { fecha: 'desc' },
			include: { cotizacion: { include: { cliente: true } } }
		}),
		prisma.historialCot.findMany({
			orderBy: { creadoEn: 'desc' },
			include: { cotizacion: { include: { cliente: true } } }
		}),
		prisma.logRecordatorio.findMany({
			orderBy: { enviadoEn: 'desc' },
			include: { cotizacion: { include: { cliente: true } } }
		})
	]);

	const filas = [['Fecha', 'Usuario', 'Acción', 'Cotización', 'Cliente', 'Detalle']];

	for (const c of cots) {
		filas.push([
			formatDateTime(c.creadoEn),
			c.creadoPorNombre || c.creadoPorEmail || '-',
			'Creó cotización',
			c.numero,
			c.cliente?.nombre || '-',
			`Total: ${formatMoney(Number(c.total))}`
		]);
	}

	for (const p of pagos) {
		filas.push([
			formatDateTime(p.fecha),
			p.creadoPorNombre || p.creadoPorEmail || '-',
			'Registró pago',
			p.cotizacion?.numero || '-',
			p.cotizacion?.cliente?.nombre || '-',
			`Monto: ${formatMoney(Number(p.monto))}`
		]);
	}

	for (const h of historial) {
		filas.push([
			formatDateTime(h.creadoEn),
			h.creadoPorNombre || h.creadoPorEmail || '-',
			'Cambió estado',
			h.cotizacion?.numero || '-',
			h.cotizacion?.cliente?.nombre || '-',
			`${h.estadoAnterior ? estadosLabel[h.estadoAnterior] : '-'} → ${estadosLabel[h.estadoNuevo]}`
		]);
	}

	for (const r of recordatorios) {
		filas.push([
			formatDateTime(r.enviadoEn),
			r.enviadoPorNombre || r.enviadoPorEmail || '-',
			'Envió recordatorio',
			r.cotizacion?.numero || '-',
			r.cotizacion?.cliente?.nombre || '-',
			`${r.exitoso ? 'Exitoso' : 'Fallido'} - ${formatMoney(Number(r.saldoPendiente))}`
		]);
	}

	filas.sort((a, b) => new Date(b[0]) - new Date(a[0]));

	if (formato === 'csv') {
		const csv = filas.map((fila) => fila.map(escapeCsv).join(',')).join('\n');
		return new Response(csv, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': 'attachment; filename="auditoria.csv"'
			}
		});
	}

	if (formato === 'xlsx') {
		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.aoa_to_sheet(filas);
		XLSX.utils.book_append_sheet(wb, ws, 'Auditoria');
		const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
		return new Response(buf, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': 'attachment; filename="auditoria.xlsx"'
			}
		});
	}

	return new Response(JSON.stringify({ error: 'Formato no soportado. Usa csv o xlsx' }), {
		status: 400,
		headers: { 'Content-Type': 'application/json' }
	});
};
