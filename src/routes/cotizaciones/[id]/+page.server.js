import { error, fail, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/prisma.js';
import { serialize } from '$lib/serialize.js';
import { env } from '$env/dynamic/private';
import { getUserInfo } from '$lib/userInfo.js';

const transicionesPermitidas = {
	BORRADOR: ['ENVIADA'],
	ENVIADA: ['APROBADA', 'RECHAZADA'],
	APROBADA: ['FACTURADA'],
	FACTURADA: ['PAGADA'],
	RECHAZADA: [],
	PAGADA: []
};

export const load = async ({ params }) => {
	const cotizacion = await prisma.cotizacion.findUnique({
		where: { id: params.id },
		include: {
			cliente: true,
			conceptos: { orderBy: { orden: 'asc' } },
			impuestos: { orderBy: { orden: 'asc' } },
			pagos: { orderBy: { fecha: 'desc' } },
			historial: { orderBy: { creadoEn: 'desc' } }
		}
	});

	if (!cotizacion) {
		throw error(404, 'Cotización no encontrada');
	}

	const totalPagado = cotizacion.pagos.reduce((sum, p) => sum + Number(p.monto), 0);
	const saldoPendiente = Math.max(0, Number(cotizacion.total) - totalPagado);

	return serialize({
		cotizacion,
		totalPagado,
		saldoPendiente
	});
};

export const actions = {
	cambiarEstado: async ({ request, params, locals }) => {
		const user = getUserInfo(locals);
		const formData = await request.formData();
		const nuevoEstado = formData.get('nuevoEstado');

		const cot = await prisma.cotizacion.findUnique({
			where: { id: params.id },
			include: { cliente: true, conceptos: { orderBy: { orden: 'asc' } } }
		});

		if (!cot) {
			return fail(404, { error: 'Cotización no encontrada' });
		}

		const permitidos = transicionesPermitidas[cot.estado] || [];
		if (!permitidos.includes(nuevoEstado)) {
			return fail(400, { error: `No se puede cambiar de ${cot.estado} a ${nuevoEstado}` });
		}

		let notaHistorial = null;

		if (nuevoEstado === 'ENVIADA' && cot.cliente && cot.cliente.correo) {
			try {
				const { sendEmail } = await import('$lib/email.js');
				const { templateCotizacionEnviada } = await import('$lib/emailTemplates.js');

				const html = templateCotizacionEnviada({
					cliente: cot.cliente,
					cotizacion: cot,
					conceptos: cot.conceptos
				});

				const { ok, error: emailError } = await sendEmail({
					to: cot.cliente.correo,
					subject: `Cotización ${cot.numero} — ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(cot.total))} MXN`,
					html
				});

				notaHistorial = ok
					? `Correo enviado a ${cot.cliente.correo}`
					: `Error al enviar correo: ${emailError?.message || String(emailError)}`;
			} catch (emailErr) {
				console.error('[cambiarEstado] Error en envío de correo:', emailErr);
				notaHistorial = `Error al enviar correo: ${emailErr.message}`;
			}
		}

		try {
			await prisma.$transaction(async (tx) => {
				await tx.cotizacion.update({
					where: { id: params.id },
					data: { estado: nuevoEstado }
				});

				await tx.historialCot.create({
					data: {
						cotizacionId: params.id,
						estadoAnterior: cot.estado,
						estadoNuevo: nuevoEstado,
						nota: notaHistorial,
						...(user
							? {
									creadoPorId: user.id,
									creadoPorEmail: user.email,
									creadoPorNombre: user.nombre
								}
							: {})
					}
				});
			});

			return { success: true };
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'Error al cambiar el estado' });
		}
	},

	registrarPago: async ({ request, params, locals }) => {
		const user = getUserInfo(locals);
		const formData = await request.formData();
		const monto = parseFloat(formData.get('monto'));
		const metodo = formData.get('metodo');
		const referencia = formData.get('referencia');
		const fecha = formData.get('fecha') || new Date().toISOString().split('T')[0];

		if (isNaN(monto) || monto <= 0) {
			return fail(400, { error: 'El monto debe ser mayor a 0' });
		}

		if (!metodo) {
			return fail(400, { error: 'Selecciona un método de pago' });
		}

		try {
			const cot = await prisma.cotizacion.findUnique({
				where: { id: params.id },
				include: { pagos: true }
			});

			if (!cot) {
				return fail(404, { error: 'Cotización no encontrada' });
			}

			const totalPagadoActual = cot.pagos.reduce((sum, p) => sum + Number(p.monto), 0);
			const saldoRestante = Number(cot.total) - totalPagadoActual;

			if (monto > saldoRestante + 0.01) {
				return fail(400, { error: 'El monto excede el saldo pendiente' });
			}

			await prisma.$transaction(async (tx) => {
				await tx.pago.create({
					data: {
						cotizacionId: params.id,
						monto,
						metodo,
						referencia: referencia || null,
						fecha: new Date(fecha),
						...(user
							? {
									creadoPorId: user.id,
									creadoPorEmail: user.email,
									creadoPorNombre: user.nombre
								}
							: {})
					}
				});

				const nuevoTotalPagado = totalPagadoActual + monto;
				if (nuevoTotalPagado >= Number(cot.total) - 0.01 && cot.estado !== 'PAGADA') {
					await tx.cotizacion.update({
						where: { id: params.id },
						data: { estado: 'PAGADA' }
					});

					await tx.historialCot.create({
						data: {
							cotizacionId: params.id,
							estadoAnterior: cot.estado,
							estadoNuevo: 'PAGADA',
							...(user
								? {
										creadoPorId: user.id,
										creadoPorEmail: user.email,
										creadoPorNombre: user.nombre
									}
								: {})
						}
					});
				}
			});

			return { success: true };
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'Error al registrar el pago' });
		}
	},

	eliminarPago: async ({ request, params }) => {
		const formData = await request.formData();
		const pagoId = formData.get('pagoId');

		try {
			const cot = await prisma.cotizacion.findUnique({
				where: { id: params.id },
				include: { pagos: true }
			});

			if (!cot) {
				return fail(404, { error: 'Cotización no encontrada' });
			}

			if (cot.estado === 'PAGADA') {
				return fail(400, { error: 'No se pueden eliminar pagos de una cotización pagada' });
			}

			const pago = cot.pagos.find((p) => p.id === pagoId);
			if (!pago) {
				return fail(404, { error: 'Pago no encontrado' });
			}

			await prisma.pago.delete({ where: { id: pagoId } });

			const nuevoTotalPagado = cot.pagos
				.filter((p) => p.id !== pagoId)
				.reduce((sum, p) => sum + Number(p.monto), 0);
			const nuevoSaldo = Math.max(0, Number(cot.total) - nuevoTotalPagado);

			return { success: true, saldoPendiente: nuevoSaldo };
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'Error al eliminar el pago' });
		}
	}
};
