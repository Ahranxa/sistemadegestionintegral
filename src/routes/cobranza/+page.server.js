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
	enviarRecordatorio: async ({ request, url }) => {
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

			const resend = new (await import('resend')).Resend(process.env.RESEND_API_KEY);
			const from = process.env.FROM_EMAIL;

			if (!from || !process.env.RESEND_API_KEY) {
				return fail(500, { error: 'Faltan credenciales de correo' });
			}

			const publicUrl = env.PUBLIC_ORIGIN || `https://${url.host}`;

			const html = `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
					<h2 style="color: #4f46e5;">Recordatorio de pago</h2>
					<p>Hola ${cot.cliente.nombre},</p>
					<p>Te recordamos que tienes un saldo pendiente por la cotización <strong>${cot.numero}</strong>.</p>
					<p><strong>Total:</strong> ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(cot.total))}</p>
					<p><strong>Saldo pendiente:</strong> ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(saldo)}</p>
					<a href="${publicUrl}/cotizaciones/${cot.id}" style="display: inline-block; background: #4f46e5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Ver cotización</a>
					<p style="margin-top: 24px; color: #666; font-size: 12px;">Este correo fue generado automáticamente por GestorPyme.</p>
				</div>
			`;

			await resend.emails.send({
				from,
				to: cot.cliente.correo,
				subject: `Recordatorio de pago - ${cot.numero}`,
				html
			});

			return { success: true };
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'Error al enviar el recordatorio' });
		}
	}
};
