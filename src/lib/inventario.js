import { prisma } from './prisma.js';

/**
 * Calcula el stock reservado activo de un producto
 */
export async function getStockReservado(productoId, tx = prisma) {
	const result = await tx.reservaInventario.aggregate({
		where: { productoId, estatus: 'ACTIVA' },
		_sum: { cantidad: true }
	});
	return Number(result._sum.cantidad ?? 0);
}

/**
 * Calcula stock disponible = stockFisico - stockReservado
 */
export async function getStockDisponible(productoId, tx = prisma) {
	const producto = await tx.producto.findUnique({
		where: { id: productoId },
		select: { stockFisico: true }
	});
	const reservado = await getStockReservado(productoId, tx);
	return Math.max(0, Number(producto.stockFisico) - reservado);
}

/**
 * Crea reservas para todos los conceptos de producto de una cotización (APROBADA)
 */
export async function crearReservas(cotizacionId, vencimiento, user, tx = prisma) {
	const conceptos = await tx.conceptoCot.findMany({
		where: { cotizacionId },
		include: { producto: true }
	});

	const errores = [];

	for (const concepto of conceptos) {
		if (!concepto.productoId || concepto.producto?.tipo === 'SERVICIO') continue;

		const disponible = await getStockDisponible(concepto.productoId, tx);
		const cantidad = Number(concepto.cantidad);

		if (cantidad > disponible) {
			errores.push(
				`No existe inventario disponible suficiente para reservar "${concepto.producto.nombre}". Disponible: ${disponible}, solicitado: ${cantidad}`
			);
		}
	}

	if (errores.length > 0) {
		throw new Error(errores.join('\n'));
	}

	for (const concepto of conceptos) {
		if (!concepto.productoId || concepto.producto?.tipo === 'SERVICIO') continue;

		await tx.reservaInventario.create({
			data: {
				productoId: concepto.productoId,
				cotizacionId,
				cantidad: Number(concepto.cantidad),
				fechaVencimiento: vencimiento || null,
				estatus: 'ACTIVA'
			}
		});
	}
}

/**
 * Libera reservas de una cotización (RECHAZADA / cancelada)
 */
export async function liberarReservas(cotizacionId, tx = prisma) {
	await tx.reservaInventario.updateMany({
		where: { cotizacionId, estatus: 'ACTIVA' },
		data: { estatus: 'LIBERADA' }
	});
}

/**
 * Consume reservas y descuenta stock físico (PAGADA)
 * Registra un MovimientoInventario por cada concepto
 */
export async function consumirReservasYDescontar(cotizacionId, referencia, user, tx = prisma) {
	const reservas = await tx.reservaInventario.findMany({
		where: { cotizacionId, estatus: 'ACTIVA' },
		include: { producto: true }
	});

	for (const reserva of reservas) {
		const producto = await tx.producto.findUnique({
			where: { id: reserva.productoId }
		});

		const stockAnterior = Number(producto.stockFisico);
		const cantidad = Number(reserva.cantidad);
		const stockNuevo = Math.max(0, stockAnterior - cantidad);

		await tx.producto.update({
			where: { id: reserva.productoId },
			data: { stockFisico: stockNuevo }
		});

		await tx.movimientoInventario.create({
			data: {
				productoId: reserva.productoId,
				tipoMovimiento: 'SALIDA',
				cantidad,
				stockFisicoAnterior: stockAnterior,
				stockFisicoNuevo: stockNuevo,
				referencia: referencia || null,
				usuarioId: user?.id || null,
				usuarioNombre: user?.nombre || null,
				observaciones: `Salida por cotización ${referencia}`
			}
		});

		await tx.reservaInventario.update({
			where: { id: reserva.id },
			data: { estatus: 'CONSUMIDA' }
		});
	}
}

/**
 * Registra un movimiento manual (ENTRADA, AJUSTE, DEVOLUCION, STOCK_INICIAL)
 * y actualiza el stock físico dentro de una transacción
 */
export async function registrarMovimiento({ productoId, tipo, cantidad, referencia, observaciones, user }, tx = prisma) {
	const producto = await tx.producto.findUnique({ where: { id: productoId } });
	if (!producto) throw new Error('Producto no encontrado');

	const stockAnterior = Number(producto.stockFisico);
	let stockNuevo;

	if (tipo === 'SALIDA') {
		stockNuevo = stockAnterior - cantidad;
		if (stockNuevo < 0) throw new Error('El stock físico no puede ser negativo');
	} else if (tipo === 'AJUSTE') {
		stockNuevo = cantidad; // ajuste = valor absoluto
	} else {
		stockNuevo = stockAnterior + cantidad;
	}

	await tx.producto.update({
		where: { id: productoId },
		data: { stockFisico: stockNuevo }
	});

	await tx.movimientoInventario.create({
		data: {
			productoId,
			tipoMovimiento: tipo,
			cantidad: tipo === 'AJUSTE' ? Math.abs(stockNuevo - stockAnterior) : cantidad,
			stockFisicoAnterior: stockAnterior,
			stockFisicoNuevo: stockNuevo,
			referencia: referencia || null,
			usuarioId: user?.id || null,
			usuarioNombre: user?.nombre || null,
			observaciones: observaciones || null,
			fecha: new Date()
		}
	});

	return { stockAnterior, stockNuevo };
}
