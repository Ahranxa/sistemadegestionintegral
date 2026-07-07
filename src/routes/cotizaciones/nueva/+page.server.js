import { fail, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/prisma.js';
import { cotizacionSchema } from '$lib/validations/cotizacion.js';
import { env } from '$env/dynamic/private';

export const load = async () => {
	const clientes = await prisma.cliente.findMany({
		where: { activo: true },
		orderBy: { nombre: 'asc' }
	});

	const anio = new Date().getFullYear();
	const ultima = await prisma.cotizacion.findFirst({
		where: { numero: { startsWith: `COT-${anio}-` } },
		orderBy: { numero: 'desc' }
	});

	let siguiente = 1;
	if (ultima) {
		const partes = ultima.numero.split('-');
		siguiente = parseInt(partes[2], 10) + 1;
	}
	const numero = `COT-${anio}-${String(siguiente).padStart(3, '0')}`;

	return { clientes, numero };
};

export const actions = {
	guardar: async ({ request, url }) => {
		const formData = await request.formData();
		const raw = Object.fromEntries(formData);

		let conceptos = [];
		try {
			conceptos = JSON.parse(raw.conceptos || '[]');
		} catch {
			return fail(400, { errors: { general: 'Conceptos inválidos' }, values: raw });
		}

		const payload = {
			clienteId: raw.clienteId,
			fecha: raw.fecha,
			vencimiento: raw.vencimiento || undefined,
			conceptos,
			estado: raw.estado
		};

		const result = cotizacionSchema.safeParse(payload);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors,
				values: raw
			});
		}

		const { clienteId, fecha, vencimiento, conceptos: conceptosValidados, estado } = result.data;

		const subtotal = conceptosValidados.reduce((sum, c) => sum + c.cantidad * c.precioUnitario, 0);
		const iva = subtotal * 0.16;
		const total = subtotal + iva;

		try {
			const cotizacion = await prisma.$transaction(async (tx) => {
				const creada = await tx.cotizacion.create({
					data: {
						numero: raw.numero,
						clienteId,
						fecha,
						vencimiento: vencimiento || null,
						estado,
						subtotal,
						iva,
						total
					}
				});

				for (let i = 0; i < conceptosValidados.length; i++) {
					const con = conceptosValidados[i];
					await tx.conceptoCot.create({
						data: {
							cotizacionId: creada.id,
							descripcion: con.descripcion,
							cantidad: con.cantidad,
							precioUnitario: con.precioUnitario,
							subtotal: con.cantidad * con.precioUnitario,
							orden: i
						}
					});
				}

				await tx.historialCot.create({
					data: {
						cotizacionId: creada.id,
						estadoNuevo: estado
					}
				});

				return creada;
			});

			if (estado === 'ENVIADA') {
				const cliente = await prisma.cliente.findUnique({
					where: { id: clienteId }
				});

				if (cliente && cliente.correo) {
					const conceptosCreados = await prisma.conceptoCot.findMany({
						where: { cotizacionId: cotizacion.id },
						orderBy: { orden: 'asc' }
					});

					const { sendEmail } = await import('$lib/email.js');
					const { templateCotizacionEnviada } = await import('$lib/emailTemplates.js');

					const html = templateCotizacionEnviada({
						cliente,
						cotizacion: { ...cotizacion, subtotal, iva, total, vencimiento },
						conceptos: conceptosCreados
					});

					await sendEmail({
						to: cliente.correo,
						subject: `Cotización ${raw.numero} — ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total)} MXN`,
						html
					});
				}
			}

			throw redirect(303, '/cotizaciones');
		} catch (err) {
			if (err.status === 303) throw err;
			console.error(err);
			return fail(500, { errors: { general: 'Error al guardar la cotización' }, values: raw });
		}
	}
};
