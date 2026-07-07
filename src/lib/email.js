import { Resend } from 'resend';

export async function enviarCotizacionEmail({ to, clienteNombre, cotizacionNumero, total, url }) {
	const resend = new Resend(process.env.RESEND_API_KEY);
	const from = process.env.FROM_EMAIL;

	if (!from || !process.env.RESEND_API_KEY) {
		console.warn('Faltan credenciales de Resend. No se envió el correo.');
		return { skipped: true };
	}

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
			<h2 style="color: #4f46e5;">Hola ${clienteNombre},</h2>
			<p>Tienes una nueva cotización disponible: <strong>${cotizacionNumero}</strong>.</p>
			<p><strong>Total:</strong> ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total)}</p>
			<p>Para revisar los detalles, haz clic en el siguiente enlace:</p>
			<a href="${url}" style="display: inline-block; background: #4f46e5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Ver cotización</a>
			<p style="margin-top: 24px; color: #666; font-size: 12px;">Este correo fue generado automáticamente por GestorPyme.</p>
		</div>
	`;

	try {
		const result = await resend.emails.send({
			from,
			to,
			subject: `Tu cotización ${cotizacionNumero}`,
			html
		});
		return { success: true, result };
	} catch (err) {
		console.error('Error enviando correo:', err);
		return { success: false, error: err.message };
	}
}
