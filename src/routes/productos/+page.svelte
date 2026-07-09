<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	let busqueda = $state('');
	let filtroEstado = $state('todos');
	let pagina = $state(1);
	const porPagina = 20;

	let showModal = $state(false);
	let modoEdicion = $state(false);
	let productoEditando = $state(null);

	let filtrados = $derived(
		data.productos.filter((p) => {
			const q = busqueda.toLowerCase().trim();
			const coincideBusqueda =
				!q ||
				p.nombre.toLowerCase().includes(q) ||
				p.sku.toLowerCase().includes(q) ||
				(p.categoria || '').toLowerCase().includes(q);
			const coincideEstado =
				filtroEstado === 'todos' ||
				(filtroEstado === 'activos' && p.activo) ||
				(filtroEstado === 'inactivos' && !p.activo);
			return coincideBusqueda && coincideEstado;
		})
	);

	let totalPaginas = $derived(Math.max(1, Math.ceil(filtrados.length / porPagina)));
	let paginados = $derived(filtrados.slice((pagina - 1) * porPagina, pagina * porPagina));

	$effect(() => {
		busqueda;
		filtroEstado;
		pagina = 1;
	});

	function abrirCrear() {
		modoEdicion = false;
		productoEditando = null;
		showModal = true;
	}

	function abrirEditar(p) {
		modoEdicion = true;
		productoEditando = { ...p };
		showModal = true;
	}

	function cerrarModal() {
		showModal = false;
		productoEditando = null;
	}

	function formatearMoneda(v) {
		return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);
	}

	function formatearFecha(f) {
		return new Date(f).toLocaleDateString('es-MX');
	}

	const enhanceHandler = () => {
		return async ({ result, update }) => {
			if (result.type === 'success') {
				cerrarModal();
				await invalidateAll();
			}
			update();
		};
	};
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
		<h1 class="text-2xl font-bold text-gray-800">Catálogo de Productos</h1>
		<button
			onclick={abrirCrear}
			class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
		>
			+ Nuevo producto
		</button>
	</div>

	{#if form?.errors?.general}
		<div class="bg-red-100 text-red-800 px-4 py-3 rounded-lg text-sm">{form.errors.general}</div>
	{/if}

	<!-- Filtros -->
	<div class="flex flex-col sm:flex-row gap-3">
		<input
			type="text"
			bind:value={busqueda}
			placeholder="Buscar por nombre, SKU o categoría..."
			class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
		/>
		<select
			bind:value={filtroEstado}
			class="border border-gray-300 rounded-lg px-3 py-2 text-sm"
		>
			<option value="todos">Todos</option>
			<option value="activos">Activos</option>
			<option value="inactivos">Inactivos</option>
		</select>
	</div>

	<!-- Tabla -->
	<div class="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
		<table class="min-w-full text-left text-sm whitespace-nowrap">
			<thead class="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
				<tr>
					<th class="px-4 py-3">SKU</th>
					<th class="px-4 py-3">Nombre</th>
					<th class="px-4 py-3">Categoría</th>
					<th class="px-4 py-3">Tipo</th>
					<th class="px-4 py-3">Unidad</th>
					<th class="px-4 py-3 text-right">Precio base</th>
					<th class="px-4 py-3 text-right">IVA %</th>
					<th class="px-4 py-3 text-right">Stock</th>
					<th class="px-4 py-3">Estado</th>
					<th class="px-4 py-3 text-right">Acciones</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each paginados as p}
					<tr class="hover:bg-gray-50 {!p.activo ? 'opacity-60' : ''}">
						<td class="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
						<td class="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
						<td class="px-4 py-3 text-gray-600">{p.categoria || '-'}</td>
						<td class="px-4 py-3">
							<span class="px-2 py-0.5 rounded-full text-xs font-medium {p.tipo === 'SERVICIO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
								{p.tipo === 'SERVICIO' ? 'Servicio' : 'Producto'}
							</span>
						</td>
						<td class="px-4 py-3 text-gray-600">{p.unidad}</td>
						<td class="px-4 py-3 text-right text-gray-800">{formatearMoneda(Number(p.precioBase))}</td>
						<td class="px-4 py-3 text-right text-gray-600">{Number(p.ivaPct)}%</td>
						<td class="px-4 py-3 text-right {Number(p.stockActual) <= Number(p.stockMinimo) && p.tipo === 'PRODUCTO' ? 'text-red-600 font-semibold' : 'text-gray-600'}">
							{p.tipo === 'SERVICIO' ? '—' : Number(p.stockActual)}
						</td>
						<td class="px-4 py-3">
							<span class="px-2 py-0.5 rounded-full text-xs font-medium {p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
								{p.activo ? 'Activo' : 'Inactivo'}
							</span>
						</td>
						<td class="px-4 py-3 text-right space-x-2">
							<button onclick={() => abrirEditar(p)} class="text-indigo-600 hover:underline text-xs">
								Editar
							</button>
							{#if p.activo}
								<form method="POST" action="?/desactivar" class="inline" use:enhance={enhanceHandler}>
									<input type="hidden" name="id" value={p.id} />
									<button type="submit" class="text-orange-600 hover:underline text-xs">Desactivar</button>
								</form>
							{:else}
								<form method="POST" action="?/activar" class="inline" use:enhance={enhanceHandler}>
									<input type="hidden" name="id" value={p.id} />
									<button type="submit" class="text-green-600 hover:underline text-xs">Activar</button>
								</form>
							{/if}
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="10" class="px-4 py-8 text-center text-gray-500">
							No se encontraron productos.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Paginación -->
	{#if totalPaginas > 1}
		<div class="flex items-center justify-between bg-white rounded-lg shadow p-4">
			<p class="text-sm text-gray-600">
				{filtrados.length} producto{filtrados.length !== 1 ? 's' : ''}
			</p>
			<div class="flex items-center gap-2">
				<button
					onclick={() => pagina--}
					disabled={pagina === 1}
					class="px-3 py-1 rounded border text-sm disabled:opacity-40"
				>←</button>
				<span class="text-sm text-gray-600">{pagina} / {totalPaginas}</span>
				<button
					onclick={() => pagina++}
					disabled={pagina === totalPaginas}
					class="px-3 py-1 rounded border text-sm disabled:opacity-40"
				>→</button>
			</div>
		</div>
	{/if}
</div>

<!-- Modal crear/editar -->
{#if showModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
				<h2 class="text-lg font-semibold text-gray-800">
					{modoEdicion ? 'Editar producto' : 'Nuevo producto'}
				</h2>
				<button onclick={cerrarModal} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
			</div>

			<form
				method="POST"
				action={modoEdicion ? '?/editar' : '?/crear'}
				use:enhance={enhanceHandler}
				class="px-6 py-5 space-y-4"
			>
				{#if modoEdicion}
					<input type="hidden" name="id" value={productoEditando.id} />
				{/if}

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
						<input
							type="text"
							name="sku"
							value={productoEditando?.sku ?? ''}
							required
							class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
							placeholder="Ej. PROD-001"
						/>
						{#if form?.errors?.sku}
							<p class="text-red-600 text-xs mt-1">{form.errors.sku}</p>
						{/if}
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
						<input
							type="text"
							name="nombre"
							value={productoEditando?.nombre ?? ''}
							required
							class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
						<input
							type="text"
							name="categoria"
							value={productoEditando?.categoria ?? ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
							placeholder="Ej. Pintura, Mano de obra"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
						<select
							name="tipo"
							class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
						>
							<option value="PRODUCTO" selected={!productoEditando || productoEditando.tipo === 'PRODUCTO'}>
								Producto
							</option>
							<option value="SERVICIO" selected={productoEditando?.tipo === 'SERVICIO'}>
								Servicio
							</option>
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
						<input
							type="text"
							name="unidad"
							value={productoEditando?.unidad ?? 'pza'}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
							placeholder="Ej. pza, lt, m², hr"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Precio base (sin IVA) *</label>
						<input
							type="number"
							name="precioBase"
							value={productoEditando?.precioBase !== undefined ? Number(productoEditando.precioBase) : ''}
							min="0"
							step="0.01"
							required
							class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">IVA predeterminado (%)</label>
						<input
							type="number"
							name="ivaPct"
							value={productoEditando?.ivaPct !== undefined ? Number(productoEditando.ivaPct) : 16}
							min="0"
							step="0.01"
							class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Stock actual</label>
						<input
							type="number"
							name="stockActual"
							value={productoEditando?.stockActual !== undefined ? Number(productoEditando.stockActual) : 0}
							min="0"
							step="0.01"
							class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
						<input
							type="number"
							name="stockMinimo"
							value={productoEditando?.stockMinimo !== undefined ? Number(productoEditando.stockMinimo) : 0}
							min="0"
							step="0.01"
							class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
						/>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
					<textarea
						name="descripcion"
						rows="2"
						class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
						placeholder="Descripción detallada del producto o servicio"
					>{productoEditando?.descripcion ?? ''}</textarea>
				</div>

				<div class="flex justify-end gap-3 pt-2">
					<button
						type="button"
						onclick={cerrarModal}
						class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
					>
						{modoEdicion ? 'Guardar cambios' : 'Crear producto'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
