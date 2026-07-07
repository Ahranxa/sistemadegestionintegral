import { prisma } from '$lib/prisma.js';

export const GET = async () => {
	const clientes = await prisma.cliente.findMany({
		where: { activo: true },
		orderBy: { nombre: 'asc' }
	});

	const filas = clientes
		.filter((c) => c.correo && c.correo.includes('@'))
		.map((c) => {
			const partes = c.nombre.trim().split(' ');
			const firstName = partes[0] || '';
			const lastName = partes.slice(1).join(' ') || '';
			const email = c.correo.trim();
			return `${escapeCsv(email)},${escapeCsv(firstName)},${escapeCsv(lastName)},true`;
		});

	const csv = ['email,first_name,last_name,subscribed', ...filas].join('\n');

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="clientes-resend.csv"'
		}
	});
};

function escapeCsv(value) {
	if (value.includes(',') || value.includes('"') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}
