import { json, error } from '@sveltejs/kit';
import { prisma } from '$lib/prisma.js';
import { z } from 'zod';

const schema = z.object({
	route: z.string().optional(),
	module: z.string().optional()
});

export async function POST({ request, locals }) {
	const auth = locals.auth();
	if (!auth?.userId) error(401, 'No autenticado');

	const body = await request.json().catch(() => ({}));
	const parsed = schema.safeParse(body);
	if (!parsed.success) error(400, parsed.error.message);

	const session = await prisma.experienceSession.create({
		data: {
			userId: auth.userId,
			route: parsed.data.route ?? null,
			module: parsed.data.module ?? null,
			startedAt: new Date()
		}
	});

	return json({ id: session.id });
}
