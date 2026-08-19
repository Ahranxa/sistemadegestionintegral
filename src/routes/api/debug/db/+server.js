import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma.js';

function maskUrl(url) {
	if (!url) return null;
	return url.replace(/\/\/([^:]+):([^@]+)@/, '//...:...@');
}

export async function GET({ locals }) {
	const auth = locals.auth();
	if (!auth?.userId) return json({ error: 'No autenticado' }, { status: 401 });

	try {
		const rawUrl = process.env.DATABASE_URL || '';
		const tables = await prisma.$queryRaw`
			SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
		`;
		return json({
			databaseUrl: maskUrl(rawUrl),
			tables: tables.map((t) => t.tablename)
		});
	} catch (err) {
		console.error('[debug/db] error:', err);
		return json(
			{
				databaseUrl: maskUrl(process.env.DATABASE_URL || ''),
				error: err.message
			},
			{ status: 500 }
		);
	}
}
