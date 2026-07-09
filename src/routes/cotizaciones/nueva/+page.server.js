import { fail, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/prisma.js';
import { cotizacionSchema } from '$lib/validations/cotizacion.js';
import { env } from '$env/dynamic/private';
import { getUserInfo } from '$lib/userInfo.js';

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
	guardar: async ({ request, locals }) => {
		const user = getUserInfo(locals);
		const formData = await request.formData();
		const raw = Object.fromEntries(formData);

		let conceptos = [];
		let impuestos = [];
		try {
			conceptos = JSON.parse(raw.conceptos || '[]');
			impuestos = JSON.parse(raw.impuestos || '[]');
		} catch {
			return fail(400, { errors: { general: 'Conceptos o impuestos inválidos' }, values: raw });
		}

		const payload = {
			clienteId: raw.clienteId,
			fecha: raw.fecha,
			vencimiento: raw.vencimiento || undefined,
			conceptos,
			impuestos,
			aplicarIva: raw.aplicarIva === 'on' || raw.aplicarIva === 'true',
			estado: raw.estado
		};

		const result = cotizacionSchema.safeParse(payload);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors,
				values: raw
			});
		}

		const {
			clienteId,
			fecha,
			vencimiento,
			conceptos: conceptosValidados,
			impuestos: impuestosValidados,
			aplicarIva,
			estado
		} = result.data;

		const subtotal = conceptosValidados.reduce((sum, c) => sum + c.cantidad * c.precioUnitario, 0);

		const impuestosFinales = impuestosValidados.map((imp) => ({
			...imp,
			monto: Number(imp.monto)
		}));

		if (aplicarIva) {
			impuestosFinales.push({
				nombre: 'IVA (16%)',
				tasa: 0.16,
				monto: Number((subtotal * 0.16).toFixed(2))
			});
		}

		const totalImpuestos = impuestosFinales.reduce((sum, imp) => sum + imp.monto, 0);
		const total = subtotal + totalImpuestos;

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
						total,
						...(user
							? {
									creadoPorId: user.id,
									creadoPorEmail: user.email,
									creadoPorNombre: user.nombre
								}
							: {})
					}
				});

				for (let i = 0; i < conceptosValidados.length; i++) {
					const con = conceptosValidados[i];
					await tx.conceptoCot.create({
						data: {
							cotizacionId: creada.id,
							productoId: con.productoId || null,
							descripcion: con.descripcion,
							unidad: con.unidad || null,
							cantidad: con.cantidad,
							precioUnitario: con.precioUnitario,
							subtotal: con.cantidad * con.precioUnitario,
							orden: i
						}
					});
				}

				for (let i = 0; i < impuestosFinales.length; i++) {
					const imp = impuestosFinales[i];
					await tx.impuestoCot.create({
						data: {
							cotizacionId: creada.id,
							nombre: imp.nombre,
							tasa: imp.tasa,
							monto: imp.monto,
							orden: i
						}
					});
				}

				await tx.historialCot.create({
					data: {
						cotizacionId: creada.id,
						estadoNuevo: estado,
						...(user
							? {
									creadoPorId: user.id,
									creadoPorEmail: user.email,
									creadoPorNombre: user.nombre
								}
							: {})
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
						cotizacion: { ...cotizacion, subtotal, total, vencimiento, impuestos: impuestosFinales },
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
