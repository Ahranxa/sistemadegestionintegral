import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/prisma.js';
import { z } from 'zod';

const schema = z.object({
	eventsCount: z.coerce.number().int().min(0),
	durationSeconds: z.coerce.number().int().min(0)
});

export async function PATCH({ request, params, locals }) {
	const auth = locals.auth();
	if (!auth?.userId) error(401, 'No autenticado');

	const session = await prisma.experienceSession.findFirst({
		where: { id: params.id, userId: auth.userId }
	});
	if (!session) error(404, 'Sesión no encontrada');

	const body = await request.json().catch(() => ({}));
	const parsed = schema.safeParse(body);
	if (!parsed.success) error(400, parsed.error.message);

	await prisma.experienceSession.update({
		where: { id: params.id },
		data: {
			endedAt: new Date(),
			eventsCount: parsed.data.eventsCount,
			durationSeconds: parsed.data.durationSeconds
		}
	});

	return json({ ok: true });
}
