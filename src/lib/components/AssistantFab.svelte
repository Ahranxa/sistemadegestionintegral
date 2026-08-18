<script>
	import { page } from '$app/stores';
	import { fly } from 'svelte/transition';

	let open = $state(false);
	let message = $state('');
	let messages = $state([]);
	let loading = $state(false);
	let error = $state('');

	let currentPath = $derived($page.url.pathname);
	let currentModule = $derived(getModuleLabel(currentPath));

	function getModuleLabel(path) {
		if (path.startsWith('/dashboard')) return 'Dashboard';
		if (path.startsWith('/clientes')) return 'Clientes';
		if (path.startsWith('/productos')) return 'Productos';
		if (path.startsWith('/inventario')) return 'Inventario';
		if (path.startsWith('/cotizaciones')) return 'Cotizaciones';
		if (path.startsWith('/cobranza')) return 'Cobranza';
		if (path.startsWith('/admin')) return 'Admin';
		return 'GestorPyME';
	}

	async function send() {
		const text = message.trim();
		if (!text || loading) return;

		messages = [...messages, { role: 'user', text }];
		message = '';
		loading = true;
		error = '';

		try {
			const res = await fetch('/api/assistant/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: text,
					context: { route: currentPath, module: currentModule }
				})
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || 'Error del asistente');
			}

			messages = [...messages, { role: 'assistant', text: data.reply }];
		} catch (e) {
			error = e.message || 'No se pudo contactar al asistente';
		} finally {
			loading = false;
		}
	}

	function onKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}
</script>

<button
	onclick={() => (open = !open)}
	class="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
	aria-label="Asistente"
>
	{#if open}
		<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
		</svg>
	{:else}
		<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
		</svg>
	{/if}
</button>

{#if open}
	<div
		transition:fly={{ y: 20, duration: 200 }}
		class="fixed bottom-20 right-4 z-50 flex h-[28rem] w-80 flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl md:w-96"
	>
		<div class="border-b border-gray-100 bg-blue-600 px-4 py-3 text-white">
			<h3 class="font-semibold">Asistente GestorPyME</h3>
		</div>

		<div class="flex-1 space-y-3 overflow-y-auto p-4">
			{#if messages.length === 0}
				<p class="text-sm text-gray-500">¿En qué puedo ayudarte? Te oriento sobre GestorPyME.</p>
			{:else}
				{#each messages as msg, i (i)}
					<div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
						<div class="max-w-[85%] rounded-xl px-3 py-2 text-sm {msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}">
							{msg.text}
						</div>
					</div>
				{/each}
			{/if}

			{#if loading}
				<div class="flex justify-start">
					<div class="rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-800">
						<span class="animate-pulse">Pensando...</span>
					</div>
				</div>
			{/if}

			{#if error}
				<div class="rounded-lg bg-red-50 p-2 text-sm text-red-700">
					{error}
				</div>
			{/if}
		</div>

		<div class="border-t border-gray-100 p-3">
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={message}
					onkeydown={onKeydown}
					placeholder="Escribe tu pregunta..."
					class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
					disabled={loading}
				/>
				<button
					onclick={send}
					disabled={loading || !message.trim()}
					class="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
				>
					Enviar
				</button>
			</div>
		</div>
	</div>
{/if}
