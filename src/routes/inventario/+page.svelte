<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	let busqueda = $state('');
	let filtro = $state('todos');

	let filtrados = $derived(
		data.inventario.filter((p) => {
			const q = busqueda.toLowerCase().trim();
			const coincide = !q || p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.categoria || '').toLowerCase().includes(q);
			if (!coincide) return false;
			if (filtro === 'bajo') return p.activo && p.stockDisponible > 0 && p.stockDisponible <= p.stockMinimo;
			if (filtro === 'agotado') return p.activo && p.stockDisponible === 0;
			if (filtro === 'suficiente') return p.activo && p.stockDisponible > p.stockMinimo;
			if (filtro === 'inactivos') return !p.activo;
			return true;
		})
	);

	// Modal movimiento
	let showModal = $state(false);
	let modalTipo = $state('ENTRADA');
	let modalProducto = $state(null);
	let cantidad = $state(1);
	let observaciones = $state('');

	function abrirModal(prod, tipo) {
		modalProducto = prod;
		modalTipo = tipo;
		cantidad = 1;
		observaciones = '';
		showModal = true;
	}

	function badge(p) {
		if (p.stockDisponible === 0) return { texto: 'Sin existencias', clase: 'bg-red-100 text-red-700' };
		if (p.stockDisponible <= p.stockMinimo) return { texto: 'Stock bajo', clase: 'bg-yellow-100 text-yellow-700' };
		return { texto: 'Disponible', clase: 'bg-green-100 text-green-700' };
	}

	function fmt(v) {
		return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);
	}

	function fmtFecha(f) {
		if (!f) return '—';
		return new Date(f).toLocaleDateString('es-MX');
	}

	const enhanceHandler = () => {
		return async ({ result, update }) => {
			if (result.type === 'success') {
				showModal = false;
				await invalidateAll();
			}
			update();
		};
	};
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
		<h1 class="text-2xl font-bold text-gray-800">Inventario</h1>
	</div>

	{#if form?.error}
		<div class="bg-red-100 text-red-800 px-4 py-3 rounded-lg text-sm">{form.error}</div>
	{/if}

	<!-- KPIs -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
		<div class="bg-white rounded-lg shadow p-4">
			<p class="text-xs text-gray-500 uppercase tracking-wider">Total productos</p>
			<p class="text-2xl font-bold text-gray-800 mt-1">{data.inventario.length}</p>
		</div>
		<div class="bg-white rounded-lg shadow p-4">
			<p class="text-xs text-gray-500 uppercase tracking-wider">Stock bajo</p>
			<p class="text-2xl font-bold text-yellow-600 mt-1">{data.inventario.filter(p => p.activo && p.stockDisponible > 0 && p.stockDisponible <= p.stockMinimo).length}</p>
		</div>
		<div class="bg-white rounded-lg shadow p-4">
			<p class="text-xs text-gray-500 uppercase tracking-wider">Sin existencias</p>
			<p class="text-2xl font-bold text-red-600 mt-1">{data.inventario.filter(p => p.activo && p.stockDisponible === 0).length}</p>
		</div>
		<div class="bg-white rounded-lg shadow p-4">
			<p class="text-xs text-gray-500 uppercase tracking-wider">Valor en almacen</p>
			<p class="text-lg font-bold text-indigo-700 mt-1">{fmt(data.inventario.reduce((s, p) => s + p.stockFisico * p.precioBase, 0))}</p>
		</div>
	</div>

	<!-- Filtros -->
	<div class="flex flex-col sm:flex-row gap-3">
		<input type="text" bind:value={busqueda} placeholder="Buscar por nombre, SKU o categoria..."
			class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
		<select bind:value={filtro} class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
			<option value="todos">Todos</option>
			<option value="suficiente">Stock suficiente</option>
			<option value="bajo">Stock bajo</option>
			<option value="agotado">Sin existencias</option>
			<option value="inactivos">Inactivos</option>
		</select>
	</div>

	<!-- Tabla -->
	<div class="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
		<table class="min-w-full text-left text-sm whitespace-nowrap">
			<thead class="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
				<tr>
					<th class="px-4 py-3">SKU</th>
					<th class="px-4 py-3">Producto</th>
					<th class="px-4 py-3">Categoria</th>
					<th class="px-4 py-3">Unidad</th>
					<th class="px-4 py-3 text-right">Fisico</th>
					<th class="px-4 py-3 text-right">Reservado</th>
					<th class="px-4 py-3 text-right">Disponible</th>
					<th class="px-4 py-3 text-right">Minimo</th>
					<th class="px-4 py-3">Estado</th>
					<th class="px-4 py-3">Ult. movimiento</th>
					<th class="px-4 py-3 text-right">Acciones</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each filtrados as p}
					{@const b = badge(p)}
					<tr class="hover:bg-gray-50 {!p.activo ? 'opacity-50' : ''}">
						<td class="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
						<td class="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
						<td class="px-4 py-3 text-gray-600">{p.categoria || '—'}</td>
						<td class="px-4 py-3 text-gray-600">{p.unidad}</td>
						<td class="px-4 py-3 text-right text-gray-800 font-medium">{p.stockFisico}</td>
						<td class="px-4 py-3 text-right text-orange-600">{p.stockReservado}</td>
						<td class="px-4 py-3 text-right font-bold {p.stockDisponible === 0 ? 'text-red-600' : p.stockDisponible <= p.stockMinimo ? 'text-yellow-600' : 'text-green-700'}">{p.stockDisponible}</td>
						<td class="px-4 py-3 text-right text-gray-500">{p.stockMinimo}</td>
						<td class="px-4 py-3">
							<span class="px-2 py-0.5 rounded-full text-xs font-medium {b.clase}">{b.texto}</span>
						</td>
						<td class="px-4 py-3 text-gray-500 text-xs">
							{p.ultimoMovimiento ? fmtFecha(p.ultimoMovimiento.fecha) + ' · ' + p.ultimoMovimiento.tipo : '—'}
						</td>
						<td class="px-4 py-3 text-right">
							<div class="flex justify-end gap-2">
								<button onclick={() => abrirModal(p, 'ENTRADA')}
									class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Entrada</button>
								<button onclick={() => abrirModal(p, 'AJUSTE')}
									class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Ajuste</button>
								<button onclick={() => abrirModal(p, 'DEVOLUCION')}
									class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200">Devolucion</button>
							</div>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="11" class="px-4 py-8 text-center text-gray-500">No se encontraron productos.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Modal movimiento -->
{#if showModal && modalProducto}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
			<div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
				<h2 class="text-lg font-semibold text-gray-800">
					{modalTipo === 'ENTRADA' ? 'Registrar entrada' : modalTipo === 'AJUSTE' ? 'Registrar ajuste' : 'Registrar devolucion'}
				</h2>
				<button onclick={() => (showModal = false)} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
			</div>

			<form method="POST" action="?/movimiento" use:enhance={enhanceHandler} class="px-6 py-5 space-y-4">
				<input type="hidden" name="productoId" value={modalProducto.id} />
				<input type="hidden" name="tipo" value={modalTipo} />

				<div class="bg-gray-50 rounded-lg p-3 space-y-1">
					<p class="text-sm font-medium text-gray-800">{modalProducto.nombre}</p>
					<p class="text-xs text-gray-500">{modalProducto.sku} · {modalProducto.unidad}</p>
					<div class="flex gap-4 mt-2 text-xs">
						<span class="text-gray-600">Fisico: <strong>{modalProducto.stockFisico}</strong></span>
						<span class="text-orange-600">Reservado: <strong>{modalProducto.stockReservado}</strong></span>
						<span class="text-green-700">Disponible: <strong>{modalProducto.stockDisponible}</strong></span>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						{modalTipo === 'AJUSTE' ? 'Nuevo stock fisico' : 'Cantidad'}
					</label>
					<input type="number" name="cantidad" bind:value={cantidad} min="0.01" step="0.01" required
						class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
					{#if modalTipo !== 'AJUSTE'}
						<p class="text-xs text-gray-500 mt-1">
							Nuevo stock: <strong>{modalTipo === 'DEVOLUCION' ? modalProducto.stockFisico + cantidad : modalProducto.stockFisico + cantidad}</strong>
						</p>
					{:else}
						<p class="text-xs text-gray-500 mt-1">El stock fisico quedara en: <strong>{cantidad}</strong></p>
					{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
					<textarea name="observaciones" bind:value={observaciones} rows="2"
						class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
						placeholder="Motivo del movimiento..."></textarea>
				</div>

				<div class="flex justify-end gap-3">
					<button type="button" onclick={() => (showModal = false)}
						class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
					<button type="submit"
						class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
						Registrar
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
