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

function impuestosToString(impuestos) {
	if (!impuestos || impuestos.length === 0) return '-';
	return impuestos
		.map((imp) => `${imp.nombre} ${formatMoney(Number(imp.monto))}`)
		.join(', ');
}

export const GET = async ({ url }) => {
	const formato = url.searchParams.get('formato') || 'csv';

	const cotizaciones = await prisma.cotizacion.findMany({
		orderBy: { fecha: 'desc' },
		include: {
			cliente: true,
			conceptos: { orderBy: { orden: 'asc' } },
			impuestos: { orderBy: { orden: 'asc' } }
		}
	});

	const filas = [['Folio de cotización', 'Cliente', 'Fecha', 'Monto', 'Concepto', 'Cantidad', 'Precio Unitario', 'Impuestos']];

	for (const cot of cotizaciones) {
		const impuestosStr = impuestosToString(cot.impuestos);
		const montoTotal = formatMoney(Number(cot.total));
		const fecha = formatDate(cot.fecha);

		if (cot.conceptos.length === 0) {
			filas.push([cot.numero, cot.cliente?.nombre || '-', fecha, montoTotal, '-', '-', '-', impuestosStr]);
		} else {
			for (const con of cot.conceptos) {
				filas.push([
					cot.numero,
					cot.cliente?.nombre || '-',
					fecha,
					montoTotal,
					con.descripcion,
					Number(con.cantidad),
					formatMoney(Number(con.precioUnitario)),
					impuestosStr
				]);
			}
		}
	}

	if (formato === 'csv') {
		const csv = filas.map((fila) => fila.map(escapeCsv).join(',')).join('\n');
		return new Response(csv, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': 'attachment; filename="cotizaciones.csv"'
			}
		});
	}

	if (formato === 'xlsx') {
		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.aoa_to_sheet(filas);
		XLSX.utils.book_append_sheet(wb, ws, 'Cotizaciones');
		const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
		return new Response(buf, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': 'attachment; filename="cotizaciones.xlsx"'
			}
		});
	}

	return new Response(JSON.stringify({ error: 'Formato no soportado. Usa csv o xlsx' }), {
		status: 400,
		headers: { 'Content-Type': 'application/json' }
	});
};
