import { prisma } from '$lib/prisma.js';
import * as XLSX from 'xlsx';

const TIPOS_VALIDOS = ['ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION', 'STOCK_INICIAL'];

function escapeCsv(value) {
	const str = value == null ? '' : String(value);
	if (str.includes(',') || str.includes('"') || str.includes('\n')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

function formatFecha(value) {
	if (!value) return '';
	return new Date(value).toLocaleDateString('es-MX', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});
}

function slugFecha(value) {
	if (!value) return '';
	return new Date(value).toISOString().split('T')[0];
}

export const GET = async ({ url }) => {
	const formato = url.searchParams.get('formato') || 'csv';
	const fechaInicio = url.searchParams.get('fechaInicio');
	const fechaFin = url.searchParams.get('fechaFin');
	const tipoMov = url.searchParams.get('tipo') || '';
	const productoId = url.searchParams.get('productoId') || '';
	const categoria = url.searchParams.get('categoria') || '';
	const usuario = url.searchParams.get('usuario') || '';
	const estadoInv = url.searchParams.get('estado') || '';

	// Validar fechas obligatorias
	if (!fechaInicio || !fechaFin) {
		return new Response(JSON.stringify({ error: 'Se requieren fecha inicial y final.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const inicio = new Date(fechaInicio);
	const fin = new Date(fechaFin);
	fin.setHours(23, 59, 59, 999);

	if (inicio > fin) {
		return new Response(JSON.stringify({ error: 'La fecha inicial no puede ser mayor a la final.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Construir where de MovimientoInventario
	const where = {
		fecha: { gte: inicio, lte: fin }
	};

	if (tipoMov && TIPOS_VALIDOS.includes(tipoMov)) {
		where.tipoMovimiento = tipoMov;
	}
	if (productoId) {
		where.productoId = productoId;
	}
	if (usuario) {
		where.usuarioNombre = { contains: usuario, mode: 'insensitive' };
	}

	// Incluir producto para filtros por categoría y estado
	const movimientos = await prisma.movimientoInventario.findMany({
		where,
		include: {
			producto: {
				select: {
					sku: true,
					nombre: true,
					categoria: true,
					stockFisico: true,
					stockMinimo: true,
					reservas: { where: { estatus: 'ACTIVA' }, select: { cantidad: true } }
				}
			}
		},
		orderBy: { fecha: 'desc' }
	});

	// Filtros de categoría y estado (post-query por ser calculados)
	let filas = movimientos
		.filter((m) => {
			if (categoria && (m.producto?.categoria || '') !== categoria) return false;
			if (estadoInv && m.producto) {
				const reservado = m.producto.reservas.reduce((s, r) => s + Number(r.cantidad), 0);
				const disponible = Math.max(0, Number(m.producto.stockFisico) - reservado);
				const minimo = Number(m.producto.stockMinimo);
				if (estadoInv === 'disponible' && !(disponible > minimo)) return false;
				if (estadoInv === 'bajo' && !(disponible > 0 && disponible <= minimo)) return false;
				if (estadoInv === 'agotado' && disponible !== 0) return false;
			}
			return true;
		})
		.map((m) => ({
			fecha: formatFecha(m.fecha),
			sku: m.producto?.sku || '',
			producto: m.producto?.nombre || '',
			categoria: m.producto?.categoria || '',
			tipo: m.tipoMovimiento,
			cantidad: Number(m.cantidad),
			stockAnterior: Number(m.stockFisicoAnterior),
			stockNuevo: Number(m.stockFisicoNuevo),
			usuario: m.usuarioNombre || '',
			referencia: m.referencia || '',
			observaciones: m.observaciones || ''
		}));

	if (filas.length === 0) {
		return new Response(JSON.stringify({ error: 'No existen registros para el rango y filtros seleccionados.' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const encabezados = [
		'Fecha',
		'SKU',
		'Producto',
		'Categoría',
		'Tipo de movimiento',
		'Cantidad',
		'Stock físico anterior',
		'Stock físico nuevo',
		'Usuario',
		'Referencia',
		'Observaciones'
	];

	const filaBase = slugFecha(inicio);
	const filaFin = slugFecha(fin);

	// Nombre del archivo
	let nombreBase;
	if (productoId) {
		const prod = await prisma.producto.findUnique({ where: { id: productoId }, select: { sku: true } });
		nombreBase = `producto_${(prod?.sku || productoId).replace(/[^a-zA-Z0-9_-]/g, '_')}_${filaBase}_${filaFin}`;
	} else {
		nombreBase = `inventario_general_${filaBase}_${filaFin}`;
	}

	// ── CSV ──
	if (formato === 'csv') {
		const bom = '\uFEFF';
		const lineas = [
			encabezados,
			...filas.map((f) => [
				f.fecha, f.sku, f.producto, f.categoria, f.tipo,
				f.cantidad, f.stockAnterior, f.stockNuevo,
				f.usuario, f.referencia, f.observaciones
			])
		];
		const csv = bom + lineas.map((row) => row.map(escapeCsv).join(',')).join('\r\n');

		return new Response(csv, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="${nombreBase}.csv"`
			}
		});
	}

	// ── XLSX ──
	if (formato === 'xlsx') {
		const datos = [
			encabezados,
			...filas.map((f) => [
				f.fecha, f.sku, f.producto, f.categoria, f.tipo,
				f.cantidad, f.stockAnterior, f.stockNuevo,
				f.usuario, f.referencia, f.observaciones
			])
		];

		const ws = XLSX.utils.aoa_to_sheet(datos);

		// Ancho automático de columnas
		const colWidths = encabezados.map((h, i) => {
			const maxLen = Math.max(
				h.length,
				...filas.map((f) => String(Object.values(f)[i] ?? '').length)
			);
			return { wch: Math.min(maxLen + 2, 50) };
		});
		ws['!cols'] = colWidths;

		// Formato de encabezados (negrita simulada con referencia de celda)
		const range = XLSX.utils.decode_range(ws['!ref']);
		for (let C = range.s.c; C <= range.e.c; C++) {
			const addr = XLSX.utils.encode_cell({ r: 0, c: C });
			if (!ws[addr]) continue;
			ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'E8EAED' } } };
		}

		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Movimientos Inventario');

		const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

		return new Response(buf, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': `attachment; filename="${nombreBase}.xlsx"`
			}
		});
	}

	return new Response(JSON.stringify({ error: 'Formato no soportado. Usa csv o xlsx.' }), {
		status: 400,
		headers: { 'Content-Type': 'application/json' }
	});
};
