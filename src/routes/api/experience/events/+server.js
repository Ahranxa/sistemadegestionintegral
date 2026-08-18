import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/prisma.js';
import { z } from 'zod';

const schema = z.object({
	sessionId: z.string(),
	emotion: z.string(),
	score: z.coerce.number().min(0).max(1),
	route: z.string().optional(),
	module: z.string().optional(),
	detectedAt: z.string().optional()
});

export async function POST({ request, locals }) {
	const auth = locals.auth();
	if (!auth?.userId) error(401, 'No autenticado');

	const body = await request.json().catch(() => ({}));
	const parsed = schema.safeParse(body);
	if (!parsed.success) error(400, parsed.error.message);

	const { sessionId, emotion, score, route, module, detectedAt } = parsed.data;

	const session = await prisma.experienceSession.findFirst({
		where: { id: sessionId, userId: auth.userId }
	});
	if (!session) error(404, 'Sesión no encontrada');

	const [event] = await prisma.$transaction([
		prisma.experienceEvent.create({
			data: {
				sessionId,
				userId: auth.userId,
				emotion,
				score,
				route: route ?? null,
				module: module ?? null,
				detectedAt: detectedAt ? new Date(detectedAt) : new Date()
			}
		}),
		prisma.experienceSession.update({
			where: { id: sessionId },
			data: { eventsCount: { increment: 1 } }
		})
	]);

	return json({ ok: true, id: event.id });
}
