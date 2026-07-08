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

export const GET = async ({ url }) => {
	const formato = url.searchParams.get('formato') || 'csv';

	const clientes = await prisma.cliente.findMany({
		orderBy: { nombre: 'asc' }
	});

	const filas = [
		['Nombre', 'Empresa', 'RFC', 'Correo', 'Teléfono', 'Dirección', 'Notas', 'Activo', 'Creado el']
	];

	for (const c of clientes) {
		filas.push([
			c.nombre,
			c.empresa || '-',
			c.rfc || '-',
			c.correo,
			c.telefono || '-',
			c.direccion || '-',
			c.notas || '-',
			c.activo ? 'Sí' : 'No',
			formatDate(c.creadoEn)
		]);
	}

	if (formato === 'csv') {
		const csv = filas.map((fila) => fila.map(escapeCsv).join(',')).join('\n');
		return new Response(csv, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': 'attachment; filename="clientes.csv"'
			}
		});
	}

	if (formato === 'xlsx') {
		const wb = XLSX.utils.book_new();
		const ws = XLSX.utils.aoa_to_sheet(filas);
		XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
		const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
		return new Response(buf, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': 'attachment; filename="clientes.xlsx"'
			}
		});
	}

	return new Response(JSON.stringify({ error: 'Formato no soportado. Usa csv o xlsx' }), {
		status: 400,
		headers: { 'Content-Type': 'application/json' }
	});
};
