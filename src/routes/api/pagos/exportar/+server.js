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

const metodosPago = {
	TRANSFERENCIA: 'Transferencia',
	EFECTIVO: 'Efectivo',
	CHEQUE: 'Cheque',
	TARJETA_DEBITO: 'Tarjeta de débito',
	TARJETA_CREDITO: 'Tarjeta de crédito',
	DEPOSITO: 'Depósito'
};

export const GET = async ({ url }) => {
	const formato = url.searchParams.get('formato') || 'csv';
	const cotizacionId = url.searchParams.get('cotizacionId') || null;

	const pagos = await prisma.pago.findMany({
		where: cotizacionId ? { cotizacionId } : {},
		orderBy: { fecha: 'desc' },
		include: {
			cotizacion: { include: { cliente: true } }
		}
	});

	const filas = [
		['Fecha', 'Cotización', 'Cliente', 'Método de pago', 'Referencia', 'Monto', 'Registrado por']
	];

	for (const pago of pagos) {
		filas.push([
			formatDate(pago.fecha),
			pago.cotizacion?.numero || '-',
			pago.cotizacion?.cliente?.nombre || '-',
			metodosPago[pago.metodo] || pago.metodo,
			pago.referencia || '-',
			formatMoney(Number(pago.monto)),
			pago.creadoPorNombre || pago.creadoPorEmail || '-'
		]);
	}

	if (formato === 'csv') {
		const csv = filas.map((fila) => fila.map(escapeCsv).join(',')).join('\n');
		const filename = cotizacionId ? 'pagos-cotizacion.csv' : 'pagos.csv';
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
		XLSX.utils.book_append_sheet(wb, ws, 'Pagos');
		const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
		const filename = cotizacionId ? 'pagos-cotizacion.xlsx' : 'pagos.xlsx';
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
