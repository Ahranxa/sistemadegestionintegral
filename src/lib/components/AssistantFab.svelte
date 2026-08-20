<script>
	import { page } from '$app/stores';
	import { fly } from 'svelte/transition';
	import { Sparkles, X, Send, Bot } from 'lucide-svelte';

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
	class="fixed bottom-4 right-4 z-50 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/45 hover:scale-105 hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200"
	aria-label="Asistente"
>
	{#if open}
		<X class="w-5 h-5 md:w-6 md:h-6 pointer-events-none" />
	{:else}
		<Bot class="w-5 h-5 md:w-6 md:h-6 pointer-events-none" />
	{/if}
</button>

{#if open}
	<div
		transition:fly={{ y: 20, duration: 200 }}
		class="fixed bottom-20 z-50 flex flex-col h-[70vh] max-h-[28rem] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-slate-200/60 bg-white shadow-2xl shadow-slate-900/10 md:w-96 md:right-4 md:left-auto md:max-w-none overflow-hidden"
	>
		<div class="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-white flex items-center gap-2">
			<Sparkles class="w-4 h-4 text-indigo-200" />
			<h3 class="font-semibold text-sm">Asistente GestorPyME</h3>
		</div>

		<div class="flex-1 space-y-3 overflow-y-auto p-4 bg-slate-50/50">
			{#if messages.length === 0}
				<div class="flex flex-col items-center justify-center h-full text-center p-4">
					<div class="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
						<Bot class="w-6 h-6" />
					</div>
					<p class="text-sm text-slate-600 font-medium">¿En qué puedo ayudarte?</p>
					<p class="text-xs text-slate-400 mt-1">Te oriento sobre GestorPyME.</p>
				</div>
			{:else}
				{#each messages as msg, i (i)}
					<div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
						<div class="max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm {msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'}">
							{msg.text}
						</div>
					</div>
				{/each}
			{/if}

			{#if loading}
				<div class="flex justify-start">
					<div class="rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm">
						<span class="animate-pulse">Pensando...</span>
					</div>
				</div>
			{/if}

			{#if error}
				<div class="rounded-xl bg-rose-50 border border-rose-100 p-3 text-sm text-rose-700">
					{error}
				</div>
			{/if}
		</div>

		<div class="border-t border-slate-200 bg-white p-3">
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={message}
					onkeydown={onKeydown}
					placeholder="Escribe tu pregunta..."
					class="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-slate-50/50 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
					disabled={loading}
				/>
				<button
					onclick={send}
					disabled={loading || !message.trim()}
					class="rounded-xl bg-indigo-600 px-3.5 py-2.5 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm hover:shadow transition"
				>
					<Send class="w-4 h-4 pointer-events-none" />
				</button>
			</div>
		</div>
	</div>
{/if}
