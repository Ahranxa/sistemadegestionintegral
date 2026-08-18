// Configuración centralizada de la integración MorphCast Emotion AI
// Basado en la documentación oficial: https://ai-sdk.morphcast.com/latest/index.html

export const MORPHCAST_SCRIPT_URL = 'https://ai-sdk.morphcast.com/v1.17/ai-sdk.js';

export const MORPHCAST_MODULE = 'FACE_EMOTION';
export const MORPHCAST_CONFIG = { smoothness: 0.4 };

// Estrategia de reducción de eventos: no guardamos un registro por frame
export const SEND_INTERVAL_MS = 1000;
export const SAME_EMOTION_COOLDOWN_MS = 2000;
export const MIN_CONFIDENCE = 0.3;

export const MODULE_LABELS = {
	'/dashboard': 'Dashboard',
	'/clientes': 'Clientes',
	'/productos': 'Productos',
	'/inventario': 'Inventario',
	'/cotizaciones': 'Cotizaciones',
	'/cobranza': 'Cobranza',
	'/admin/usuarios': 'Admin',
	'/experiencia': 'Experiencia'
};

export function getModuleLabel(route = '') {
	for (const [prefix, label] of Object.entries(MODULE_LABELS)) {
		if (route.startsWith(prefix)) return label;
	}
	return 'General';
}
