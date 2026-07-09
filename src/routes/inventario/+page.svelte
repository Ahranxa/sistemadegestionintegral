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

	// Modal exportación
	let showExport = $state(false);
	let expFechaInicio = $state('');
	let expFechaFin = $state('');
	let expTipo = $state('');
	let expProductoId = $state('');
	let expCategoria = $state('');
	let expUsuario = $state('');
	let expEstado = $state('');
	let expError = $state('');
	let expCargando = $state(false);

	const hoy = new Date().toISOString().split('T')[0];

	function aplicarAtajo(atajo) {
		const ahora = new Date();
		let inicio, fin;
		if (atajo === 'hoy') {
			inicio = fin = hoy;
		} else if (atajo === 'ayer') {
			const d = new Date(ahora); d.setDate(d.getDate() - 1);
			inicio = fin = d.toISOString().split('T')[0];
		} else if (atajo === 'semana') {
			const d = new Date(ahora); d.setDate(d.getDate() - d.getDay());
			inicio = d.toISOString().split('T')[0]; fin = hoy;
		} else if (atajo === 'mes') {
			inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
			fin = hoy;
		} else if (atajo === 'mes_ant') {
			const m = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
			const mf = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
			inicio = m.toISOString().split('T')[0]; fin = mf.toISOString().split('T')[0];
		} else if (atajo === 'd30') {
			const d = new Date(ahora); d.setDate(d.getDate() - 30);
			inicio = d.toISOString().split('T')[0]; fin = hoy;
		} else if (atajo === 'd90') {
			const d = new Date(ahora); d.setDate(d.getDate() - 90);
			inicio = d.toISOString().split('T')[0]; fin = hoy;
		} else if (atajo === 'anio') {
			inicio = new Date(ahora.getFullYear(), 0, 1).toISOString().split('T')[0]; fin = hoy;
		}
		expFechaInicio = inicio;
		expFechaFin = fin;
	}

	async function exportar(formato) {
		expError = '';
		if (!expFechaInicio || !expFechaFin) { expError = 'Selecciona fecha inicial y final.'; return; }
		if (expFechaInicio > expFechaFin) { expError = 'La fecha inicial no puede ser mayor a la final.'; return; }
		expCargando = true;
		const params = new URLSearchParams({ formato, fechaInicio: expFechaInicio, fechaFin: expFechaFin });
		if (expTipo) params.set('tipo', expTipo);
		if (expProductoId) params.set('productoId', expProductoId);
		if (expCategoria) params.set('categoria', expCategoria);
		if (expUsuario) params.set('usuario', expUsuario);
		if (expEstado) params.set('estado', expEstado);

		try {
			const res = await fetch('/api/inventario/exportar?' + params.toString());
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				expError = body.error || 'Error al exportar.';
				expCargando = false;
				return;
			}
			const blob = await res.blob();
			const cd = res.headers.get('Content-Disposition') || '';
			const match = cd.match(/filename="([^"]+)"/);
			const nombre = match ? match[1] : `inventario.${formato}`;
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url; a.download = nombre; a.click();
			URL.revokeObjectURL(url);
			showExport = false;
		} catch (e) {
			expError = 'Error de conexión al exportar.';
		}
		expCargando = false;
	}

	// Categorías únicas para el selector
	let categorias = $derived([...new Set(data.inventario.map(p => p.categoria).filter(Boolean))].sort());

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
		<button onclick={() => { showExport = true; expError = ''; }}
			class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
			</svg>
			Exportar
		</button>
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

	<!-- Filtros de tabla -->
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
								<button onclick={() => { expProductoId = p.id; showExport = true; expError = ''; }}
									class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">Historial</button>
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

<!-- ── Modal movimiento ── -->
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
						<p class="text-xs text-gray-500 mt-1">Nuevo stock: <strong>{modalProducto.stockFisico + cantidad}</strong></p>
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
						class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Registrar</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ── Modal exportación ── -->
{#if showExport}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
		<div class="bg-white rounded-xl shadow-2xl w-full max-w-xl my-4">
			<div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
				<h2 class="text-lg font-semibold text-gray-800">Exportar inventario</h2>
				<button onclick={() => { showExport = false; expProductoId = ''; }} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
			</div>

			<div class="px-6 py-5 space-y-5">
				<!-- Filtros rápidos -->
				<div>
					<p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Periodo rápido</p>
					<div class="flex flex-wrap gap-2">
						{#each [['hoy','Hoy'],['ayer','Ayer'],['semana','Esta semana'],['mes','Este mes'],['mes_ant','Mes anterior'],['d30','Últimos 30 días'],['d90','Últimos 90 días'],['anio','Este año']] as [key, label]}
							<button type="button" onclick={() => aplicarAtajo(key)}
								class="px-3 py-1 text-xs border border-gray-300 rounded-full hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-700 transition">
								{label}
							</button>
						{/each}
					</div>
				</div>

				<!-- Rango de fechas -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Fecha inicial <span class="text-red-500">*</span></label>
						<input type="date" bind:value={expFechaInicio} max={hoy}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Fecha final <span class="text-red-500">*</span></label>
						<input type="date" bind:value={expFechaFin} max={hoy}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
					</div>
				</div>

				<!-- Filtros adicionales -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Tipo de movimiento</label>
						<select bind:value={expTipo} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
							<option value="">Todos</option>
							<option value="ENTRADA">Entrada</option>
							<option value="SALIDA">Salida</option>
							<option value="AJUSTE">Ajuste</option>
							<option value="DEVOLUCION">Devolución</option>
							<option value="STOCK_INICIAL">Stock inicial</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Estado del inventario</label>
						<select bind:value={expEstado} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
							<option value="">Todos</option>
							<option value="disponible">Disponible</option>
							<option value="bajo">Stock bajo</option>
							<option value="agotado">Sin existencias</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Producto</label>
						<select bind:value={expProductoId} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
							<option value="">Todos los productos</option>
							{#each data.inventario as p}
								<option value={p.id}>{p.nombre} ({p.sku})</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
						<select bind:value={expCategoria} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
							<option value="">Todas</option>
							{#each categorias as cat}
								<option value={cat}>{cat}</option>
							{/each}
						</select>
					</div>
					<div class="col-span-2">
						<label class="block text-sm font-medium text-gray-700 mb-1">Usuario (contiene)</label>
						<input type="text" bind:value={expUsuario} placeholder="Nombre del usuario..."
							class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
					</div>
				</div>

				{#if expError}
					<div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{expError}</div>
				{/if}

				<div class="flex justify-end gap-3 pt-1">
					<button type="button" onclick={() => { showExport = false; expProductoId = ''; }}
						class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
					<button type="button" onclick={() => exportar('csv')} disabled={expCargando}
						class="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50">
						{expCargando ? 'Generando...' : 'Descargar CSV'}
					</button>
					<button type="button" onclick={() => exportar('xlsx')} disabled={expCargando}
						class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
						{expCargando ? 'Generando...' : 'Descargar Excel'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
