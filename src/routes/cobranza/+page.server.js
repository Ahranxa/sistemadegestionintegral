import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/prisma.js';
import { env } from '$env/dynamic/private';

export const load = async () => {
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

			return {
				...cot,
				totalPagado,
				saldoPendiente,
				diasTranscurridos
			};
		})
		.filter((cot) => cot.saldoPendiente > 0)
		.sort((a, b) => b.diasTranscurridos - a.diasTranscurridos);

	const carteraPendiente = pendientes.reduce((sum, c) => sum + c.saldoPendiente, 0);

	return { pendientes, carteraPendiente };
};

export const actions = {
	enviarRecordatorio: async ({ request }) => {
		const formData = await request.formData();
		const cotizacionId = formData.get('cotizacionId');

		try {
			const cot = await prisma.cotizacion.findUnique({
				where: { id: cotizacionId },
				include: { cliente: true, pagos: true }
			});

			if (!cot || !cot.cliente || !cot.cliente.correo) {
				return fail(400, { error: 'Cliente no tiene correo registrado' });
			}

			const totalPagado = cot.pagos.reduce((sum, p) => sum + Number(p.monto), 0);
			const saldo = Number(cot.total) - totalPagado;

			const { sendEmail } = await import('$lib/email.js');
			const { templateRecordatorioPago } = await import('$lib/emailTemplates.js');

			const html = templateRecordatorioPago({
				cliente: cot.cliente,
				cotizacion: cot,
				saldoPendiente: saldo
			});

			const { ok, error: emailError } = await sendEmail({
				to: cot.cliente.correo,
				subject: `Recordatorio de pago - ${cot.numero}`,
				html
			});

			if (!ok) {
				return fail(500, { error: `Error al enviar correo: ${emailError?.message || emailError}` });
			}

			return { success: true };
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'Error al enviar el recordatorio' });
		}
	}
};
