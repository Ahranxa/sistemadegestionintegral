import { z } from 'zod';

export const clienteSchema = z.object({
	nombre: z.string().min(1, 'El nombre es requerido'),
	empresa: z.string().optional().or(z.literal('')),
	rfc: z.string().optional().or(z.literal('')),
	correo: z.string().min(1, 'El correo es requerido').email('El correo no es válido'),
	telefono: z.string().optional().or(z.literal('')),
	direccion: z.string().optional().or(z.literal('')),
	notas: z.string().optional().or(z.literal(''))
});
