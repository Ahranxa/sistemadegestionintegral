import { json } from '@sveltejs/kit';
import { Anthropic } from '@anthropic-ai/sdk';
import { GESTORPYME_ASSISTANT_SYSTEM_PROMPT } from '$lib/ai/prompts/gestorpymeAssistantPrompt.js';
import { CLAUDE_MODEL, ANTHROPIC_API_KEY } from '$lib/ai/claudeConfig.js';

export async function POST({ request, locals }) {
	const auth = locals.auth();
	if (!auth?.userId) {
		return json({ error: 'No autorizado' }, { status: 401 });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Cuerpo de la petición inválido' }, { status: 400 });
	}

	const { message, context } = body ?? {};
	const userMessage = typeof message === 'string' ? message.trim() : '';

	if (!userMessage) {
		return json({ error: 'El mensaje está vacío' }, { status: 400 });
	}

	if (userMessage.length > 2000) {
		return json({ error: 'El mensaje es demasiado largo' }, { status: 400 });
	}

	if (!ANTHROPIC_API_KEY) {
		console.error('[assistant/chat] ANTHROPIC_API_KEY no configurada');
		return json({ error: 'El asistente no está configurado' }, { status: 503 });
	}

	const system = context
		? `${GESTORPYME_ASSISTANT_SYSTEM_PROMPT}\n\nContexto actual del usuario:\n- Ruta: ${context.route ?? 'desconocida'}\n- Módulo: ${context.module ?? 'desconocido'}`
		: GESTORPYME_ASSISTANT_SYSTEM_PROMPT;

	const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

	try {
		const response = await client.messages.create({
			model: CLAUDE_MODEL,
			max_tokens: 1024,
			system,
			messages: [{ role: 'user', content: userMessage }]
		});

		const text =
			response.content.find((c) => c.type === 'text')?.text ??
			'No se recibió respuesta';

		return json({ reply: text });
	} catch (err) {
		console.error('[assistant/chat] Error de Anthropic:', err);
		return json({ error: 'No se pudo obtener respuesta del asistente' }, { status: 502 });
	}
}
