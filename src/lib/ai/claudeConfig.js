import { env } from '$env/dynamic/private';

// Modelo de Anthropic Claude. Cambiar desde aquí para toda la aplicación.
export const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

// API Key de Anthropic. Debe agregarse en el .env del proyecto.
export const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
