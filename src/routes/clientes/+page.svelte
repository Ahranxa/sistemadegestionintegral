<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	let busqueda = $state('');
	let pagina = $state(1);
	const porPagina = 20;

	let showModal = $state(false);
	let modoEdicion = $state(false);
	let clienteEditando = $state(null);

	let filtrados = $derived(
		data.clientes.filter((c) => {
			const q = busqueda.toLowerCase();
			return (
				c.nombre.toLowerCase().includes(q) ||
				(c.empresa || '').toLowerCase().includes(q) ||
				(c.rfc || '').toLowerCase().includes(q)
			);
		})
	);

	let totalPaginas = $derived(Math.max(1, Math.ceil(filtrados.length / porPagina)));
	let paginados = $derived(
		filtrados.slice((pagina - 1) * porPagina, pagina * porPagina)
	);

	function abrirCrear() {
		modoEdicion = false;
		clienteEditando = null;
		showModal = true;
	}

	function abrirEditar(cliente) {
		modoEdicion = true;
		clienteEditando = { ...cliente };
		showModal = true;
	}

	function cerrarModal() {
		showModal = false;
		clienteEditando = null;
	}

	function formatearFecha(fecha) {
		return new Date(fecha).toLocaleDateString('es-MX');
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-800">Clientes</h1>
		<div class="flex items-center gap-3">
			<a
				href="/api/clientes/exportar?formato=csv"
				class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
			>
				Descargar CSV
			</a>
			<a
				href="/api/clientes/exportar?formato=xlsx"
				class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
			>
				Descargar Excel
			</a>
			<a
				href="/api/clientes/exportar-correos"
				download
				class="bg-white text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition"
			>
				Exportar correos (Resend)
			</a>
			<button
				onclick={abrirCrear}
				class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
			>
				+ Nuevo cliente
			</button>
		</div>
	</div>

	{#if form?.success}
		<div class="bg-green-100 text-green-800 px-4 py-3 rounded-lg">{form.message}</div>
	{/if}

	<div class="bg-white rounded-lg shadow p-4">
		<input
			type="text"
			bind:value={busqueda}
			placeholder="Buscar por nombre, empresa o RFC..."
			class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
		/>
	</div>

	<div class="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
		<table class="min-w-full text-left text-sm whitespace-nowrap">
			<thead class="bg-gray-50 text-gray-600">
				<tr>
					<th class="px-6 py-3">Nombre</th>
					<th class="px-6 py-3">Empresa</th>
					<th class="px-6 py-3">RFC</th>
					<th class="px-6 py-3">Correo</th>
					<th class="px-6 py-3">Teléfono</th>
					<th class="px-6 py-3">Alta</th>
					<th class="px-6 py-3 text-right">Acciones</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each paginados as cliente}
					<tr class="hover:bg-gray-50">
						<td class="px-6 py-4 font-medium text-gray-800">{cliente.nombre}</td>
						<td class="px-6 py-4 text-gray-600">{cliente.empresa || '-'}</td>
						<td class="px-6 py-4 text-gray-600">{cliente.rfc || '-'}</td>
						<td class="px-6 py-4 text-gray-600">{cliente.correo}</td>
						<td class="px-6 py-4 text-gray-600">{cliente.telefono || '-'}</td>
						<td class="px-6 py-4 text-gray-600">{formatearFecha(cliente.creadoEn)}</td>
						<td class="px-6 py-4 text-right space-x-2">
							<a
								href="/clientes/{cliente.id}"
								class="text-indigo-600 hover:underline"
							>
								Ver
							</a>
							<button
								onclick={() => abrirEditar(cliente)}
								class="text-indigo-600 hover:underline"
							>
								Editar
							</button>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="7" class="px-6 py-8 text-center text-gray-500">
							No se encontraron clientes.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if totalPaginas > 1}
		<div class="flex items-center justify-between bg-white rounded-lg shadow p-4">
			<button
				disabled={pagina === 1}
				onclick={() => pagina--}
				class="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
			>
				Anterior
			</button>
			<span class="text-gray-600">Página {pagina} de {totalPaginas}</span>
			<button
				disabled={pagina === totalPaginas}
				onclick={() => pagina++}
				class="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
			>
				Siguiente
			</button>
		</div>
	{/if}
</div>

{#if showModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="p-6">
				<h2 class="text-xl font-bold text-gray-800 mb-4">
					{modoEdicion ? 'Editar cliente' : 'Nuevo cliente'}
				</h2>

				<form
					method="POST"
					action={modoEdicion ? '?/editar' : '?/crear'}
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								cerrarModal();
								await invalidateAll();
							}
							update();
						};
					}}
					class="space-y-4"
				>
					{#if modoEdicion}
						<input type="hidden" name="id" value={clienteEditando?.id} />
					{/if}

					<div>
						<label for="nombre" class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
						<input
							id="nombre"
							type="text"
							name="nombre"
							value={clienteEditando?.nombre || ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2"
						/>
						{#if form?.errors?.nombre}
							<p class="text-red-600 text-sm mt-1">{form.errors.nombre}</p>
						{/if}
					</div>

					<div>
						<label for="empresa" class="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
						<input
							id="empresa"
							type="text"
							name="empresa"
							value={clienteEditando?.empresa || ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2"
						/>
					</div>

					<div>
						<label for="rfc" class="block text-sm font-medium text-gray-700 mb-1">RFC</label>
						<input
							id="rfc"
							type="text"
							name="rfc"
							value={clienteEditando?.rfc || ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2"
						/>
						{#if form?.errors?.rfc}
							<p class="text-red-600 text-sm mt-1">{form.errors.rfc}</p>
						{/if}
					</div>

					<div>
						<label for="correo" class="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
						<input
							id="correo"
							type="email"
							name="correo"
							value={clienteEditando?.correo || ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2"
						/>
						{#if form?.errors?.correo}
							<p class="text-red-600 text-sm mt-1">{form.errors.correo}</p>
						{/if}
					</div>

					<div>
						<label for="telefono" class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
						<input
							id="telefono"
							type="text"
							name="telefono"
							value={clienteEditando?.telefono || ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2"
						/>
					</div>

					<div>
						<label for="direccion" class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
						<input
							id="direccion"
							type="text"
							name="direccion"
							value={clienteEditando?.direccion || ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2"
						/>
					</div>

					<div>
						<label for="notas" class="block text-sm font-medium text-gray-700 mb-1">Notas</label>
						<textarea
							id="notas"
							name="notas"
							rows="3"
							value={clienteEditando?.notas || ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2"
						></textarea>
					</div>

					<div class="flex justify-end gap-3 pt-2">
						<button
							type="button"
							onclick={cerrarModal}
							class="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
						>
							Cancelar
						</button>
						<button
							type="submit"
							class="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
						>
							{modoEdicion ? 'Guardar cambios' : 'Crear cliente'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
