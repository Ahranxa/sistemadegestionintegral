import { prisma } from '$lib/prisma.js';
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { userId } = locals.auth();
	if (!userId) throw redirect(303, '/sign-in');

	try {
		const [sessions, totalEvents, emotionDistribution, moduleCounts, recentEvents] =
			await Promise.all([
				prisma.experienceSession.count({ where: { userId } }),
				prisma.experienceEvent.count({ where: { userId } }),
				prisma.experienceEvent.groupBy({
					by: ['emotion'],
					where: { userId },
					_count: { id: true }
				}),
				prisma.experienceEvent.groupBy({
					by: ['module'],
					where: { userId },
					_count: { id: true }
				}),
				prisma.experienceEvent.findMany({
					where: { userId },
					orderBy: { detectedAt: 'desc' },
					take: 20
				})
			]);

		return {
			sessions,
			totalEvents,
			emotionDistribution: emotionDistribution.map((e) => ({
				label: e.emotion,
				count: e._count.id
			})),
			moduleCounts: moduleCounts.map((m) => ({
				label: m.module || 'Sin módulo',
				count: m._count.id
			})),
			recentEvents: recentEvents.map((e) => ({
				...e,
				detectedAt: e.detectedAt.toISOString()
			}))
		};
	} catch (err) {
		console.error('[experiencia] error cargando datos:', err);
		return {
			sessions: 0,
			totalEvents: 0,
			emotionDistribution: [],
			moduleCounts: [],
			recentEvents: [],
			error: 'No se pudieron cargar los datos. Verifica que las tablas de MorphCast estén aplicadas en Supabase.'
		};
	}
}
