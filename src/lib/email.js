import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;

export async function sendEmail({ to, subject, html }) {
	if (!RESEND_API_KEY || !FROM_EMAIL) {
		console.warn('[Resend] Faltan credenciales. No se envió el correo.');
		return { ok: false, error: 'Faltan credenciales de Resend' };
	}

	const resend = new Resend(RESEND_API_KEY);

	try {
		const { data, error } = await resend.emails.send({
			from: FROM_EMAIL,
			to: [to],
			subject,
			html
		});

		if (error) {
			console.error('[Resend] Error al enviar:', error);
			return { ok: false, error };
		}

		console.log('[Resend] Correo enviado. ID:', data.id);
		return { ok: true, id: data.id };
	} catch (err) {
		console.error('[Resend] Excepción:', err);
		return { ok: false, error: err.message };
	}
}
