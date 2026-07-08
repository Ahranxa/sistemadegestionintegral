import { z } from 'zod';

export const conceptoSchema = z.object({
	descripcion: z.string().min(1, 'La descripción es requerida'),
	cantidad: z.coerce.number().min(0.01, 'La cantidad debe ser mayor a 0'),
	precioUnitario: z.coerce.number().min(0, 'El precio unitario debe ser mayor o igual a 0')
});

export const impuestoSchema = z.object({
	nombre: z.string().min(1, 'El nombre del impuesto es requerido'),
	tasa: z.coerce.number().min(0, 'La tasa debe ser mayor o igual a 0'),
	monto: z.coerce.number().min(0, 'El monto debe ser mayor o igual a 0')
});

export const cotizacionSchema = z.object({
	clienteId: z.string().min(1, 'Selecciona un cliente'),
	fecha: z.coerce.date({ invalid_type_error: 'La fecha no es válida' }),
	vencimiento: z.coerce.date({ invalid_type_error: 'El vencimiento no es válido' }).optional().or(z.literal('')),
	conceptos: z.array(conceptoSchema).min(1, 'Agrega al menos un concepto'),
	impuestos: z.array(impuestoSchema).default([]),
	aplicarIva: z.coerce.boolean().default(false),
	estado: z.enum(['BORRADOR', 'ENVIADA'])
});
