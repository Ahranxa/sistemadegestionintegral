<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let conceptos = $state([{ productoId: null, descripcion: '', unidad: '', cantidad: 1, precioUnitario: 0 }]);
	let impuestos = $state([]);
	let aplicarIva = $state(false);
	let clienteId = $state('');
	let fecha = $state(new Date().toISOString().split('T')[0]);
	let vencimiento = $state('');

	let subtotal = $derived(
		conceptos.reduce((sum, c) => sum + (Number(c.cantidad) || 0) * (Number(c.precioUnitario) || 0), 0)
	);
	let ivaCalculado = $derived(aplicarIva ? subtotal * 0.16 : 0);
	let totalImpuestos = $derived(
		ivaCalculado + impuestos.reduce((sum, imp) => sum + (Number(imp.monto) || 0), 0)
	);
	let total = $derived(subtotal + totalImpuestos);

	let busquedasAbiertas = $state({});
	let resultadosBusqueda = $state({});
	let timers = {};

	async function buscarProductos(idx, q) {
		if (!q || q.length < 1) {
			resultadosBusqueda = { ...resultadosBusqueda, [idx]: [] };
			busquedasAbiertas = { ...busquedasAbiertas, [idx]: false };
			return;
		}
		clearTimeout(timers[idx]);
		timers[idx] = setTimeout(async () => {
			const res = await fetch('/api/productos/buscar?q=' + encodeURIComponent(q));
			const json = await res.json();
			resultadosBusqueda = { ...resultadosBusqueda, [idx]: json };
			busquedasAbiertas = { ...busquedasAbiertas, [idx]: true };
		}, 220);
	}

	function seleccionarProducto(idx, prod) {
		conceptos = conceptos.map((c, i) =>
			i === idx
				? { productoId: prod.id, descripcion: prod.nombre, unidad: prod.unidad, cantidad: c.cantidad || 1, precioUnitario: prod.precioBase }
				: c
		);
		busquedasAbiertas = { ...busquedasAbiertas, [idx]: false };
		resultadosBusqueda = { ...resultadosBusqueda, [idx]: [] };
	}

	function cerrarBusqueda(idx) {
		setTimeout(() => {
			busquedasAbiertas = { ...busquedasAbiertas, [idx]: false };
		}, 180);
	}

	function agregarConcepto() {
		conceptos = [...conceptos, { productoId: null, descripcion: '', unidad: '', cantidad: 1, precioUnitario: 0 }];
	}
	function eliminarConcepto(index) {
		conceptos = conceptos.filter((_, i) => i !== index);
	}
	function actualizarConcepto(index, campo, valor) {
		conceptos = conceptos.map((c, i) => (i === index ? { ...c, [campo]: valor } : c));
	}

	function agregarImpuesto() {
		impuestos = [...impuestos, { nombre: '', tasa: 0, monto: 0 }];
	}
	function eliminarImpuesto(index) {
		impuestos = impuestos.filter((_, i) => i !== index);
	}
	function actualizarImpuesto(index, campo, valor) {
		impuestos = impuestos.map((imp, i) => {
			if (i !== index) return imp;
			const actualizado = { ...imp, [campo]: valor };
			if (campo === 'tasa') {
				actualizado.monto = +(subtotal * (Number(valor) / 100)).toFixed(2);
			}
			return actualizado;
		});
	}

	let showModalProducto = $state(false);
	let idxParaProducto = $state(null);
	let errorModalProducto = $state('');
	let guardandoProducto = $state(false);
	let nuevoProducto = $state({ sku: '', nombre: '', categoria: '', tipo: 'PRODUCTO', unidad: 'pza', precioBase: '', ivaPct: 16, stockInicial: 0 });

	function abrirModalProducto(idx) {
		idxParaProducto = idx;
		nuevoProducto = { sku: '', nombre: conceptos[idx]?.descripcion || '', categoria: '', tipo: 'PRODUCTO', unidad: 'pza', precioBase: '', ivaPct: 16, stockInicial: 0 };
		errorModalProducto = '';
		showModalProducto = true;
		busquedasAbiertas = { ...busquedasAbiertas, [idx]: false };
	}

	async function guardarNuevoProducto() {
		if (!nuevoProducto.sku || !nuevoProducto.nombre || !nuevoProducto.precioBase) {
			errorModalProducto = 'SKU, nombre y precio base son requeridos';
			return;
		}
		guardandoProducto = true;
		errorModalProducto = '';
		try {
			const res = await fetch('/api/productos/crear', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(nuevoProducto)
			});
			const prod = await res.json();
			if (!res.ok) { errorModalProducto = prod.error || 'Error al crear producto'; return; }
			seleccionarProducto(idxParaProducto, prod);
			showModalProducto = false;
		} catch {
			errorModalProducto = 'Error de conexion';
		} finally {
			guardandoProducto = false;
		}
	}

	function fmt(v) {
		return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);
	}
</script>

<div class="space-y-6 max-w-4xl">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-800">Nueva cotizacion</h1>
		<a href="/cotizaciones" class="text-indigo-600 hover:underline">← Cancelar</a>
	</div>

	{#if form?.errors?.general}
		<div class="bg-red-100 text-red-800 px-4 py-3 rounded-lg">{form.errors.general}</div>
	{/if}

	<form method="POST" action="?/guardar" use:enhance class="bg-white rounded-lg shadow p-6 space-y-6">
		<input type="hidden" name="numero" value={data.numero} />
		<input type="hidden" name="conceptos" value={JSON.stringify(conceptos)} />
		<input type="hidden" name="impuestos" value={JSON.stringify(impuestos)} />

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label for="clienteId" class="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
				<select id="clienteId" name="clienteId" bind:value={clienteId}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
					<option value="">Selecciona un cliente</option>
					{#each data.clientes as cliente}
						<option value={cliente.id}>{cliente.nombre}</option>
					{/each}
				</select>
				{#if form?.errors?.clienteId}
					<p class="text-red-600 text-sm mt-1">{form.errors.clienteId}</p>
				{/if}
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Numero</label>
				<input type="text" value={data.numero} disabled class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100" />
			</div>
			<div>
				<label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
				<input id="fecha" type="date" name="fecha" bind:value={fecha} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
			</div>
			<div>
				<label for="vencimiento" class="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
				<input id="vencimiento" type="date" name="vencimiento" bind:value={vencimiento} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
			</div>
		</div>

		<div>
			<h2 class="text-lg font-semibold text-gray-800 mb-3">Conceptos</h2>
			<div class="space-y-3">
				{#each conceptos as concepto, i}
					<div class="border border-gray-200 rounded-xl p-4 bg-gray-50 relative">
						<div class="mb-3 relative">
							<label class="block text-xs font-medium text-gray-500 mb-1">Producto / Servicio</label>
							<input
								type="text"
								value={concepto.descripcion}
								oninput={(e) => {
									actualizarConcepto(i, 'descripcion', e.currentTarget.value);
									actualizarConcepto(i, 'productoId', null);
									buscarProductos(i, e.currentTarget.value);
								}}
								onblur={() => cerrarBusqueda(i)}
								placeholder="Buscar por nombre, SKU o categoria..."
								class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
							/>
							{#if concepto.productoId}
								<span class="absolute right-3 top-7 text-green-600 text-xs font-medium">✓ Vinculado</span>
							{/if}

							{#if busquedasAbiertas[i]}
								<div class="absolute z-40 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
									{#each resultadosBusqueda[i] ?? [] as prod}
										<button
											type="button"
											onclick={() => seleccionarProducto(i, prod)}
											class="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-start gap-3 border-b border-gray-50 last:border-0"
										>
											<div class="flex-1 min-w-0">
												<p class="text-sm font-medium text-gray-800 truncate">{prod.nombre}</p>
												<p class="text-xs text-gray-500">{prod.sku} · {prod.categoria || 'Sin categoria'} · {prod.unidad}</p>
											</div>
											<div class="text-right shrink-0">
												<p class="text-sm font-semibold text-indigo-700">{fmt(prod.precioBase)}</p>
												{#if prod.tipo === 'PRODUCTO'}
													<p class="text-xs text-gray-400">Stock: {prod.stockActual}</p>
												{/if}
											</div>
										</button>
									{/each}
									<button
										type="button"
										onclick={() => abrirModalProducto(i)}
										class="w-full text-left px-4 py-3 text-indigo-600 hover:bg-indigo-50 text-sm font-medium flex items-center gap-2"
									>
										<span class="text-lg leading-none">+</span> Crear producto nuevo
									</button>
								</div>
							{/if}
						</div>

						<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
							<div>
								<label class="block text-xs font-medium text-gray-500 mb-1">Unidad</label>
								<input type="text" value={concepto.unidad}
									oninput={(e) => actualizarConcepto(i, 'unidad', e.currentTarget.value)}
									placeholder="pza"
									class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
							</div>
							<div>
								<label class="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
								<input type="number" min="0" step="0.01" value={concepto.cantidad}
									oninput={(e) => actualizarConcepto(i, 'cantidad', e.currentTarget.value)}
									class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
							</div>
							<div>
								<label class="block text-xs font-medium text-gray-500 mb-1">Precio unitario</label>
								<input type="number" min="0" step="0.01" value={concepto.precioUnitario}
									oninput={(e) => actualizarConcepto(i, 'precioUnitario', e.currentTarget.value)}
									class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
							</div>
							<div>
								<label class="block text-xs font-medium text-gray-500 mb-1">Subtotal</label>
								<p class="text-sm font-semibold text-gray-800 pt-1.5">
									{fmt((Number(concepto.cantidad) || 0) * (Number(concepto.precioUnitario) || 0))}
								</p>
							</div>
						</div>

						{#if conceptos.length > 1}
							<button type="button" onclick={() => eliminarConcepto(i)}
								class="absolute top-3 right-3 text-red-400 hover:text-red-600 text-xl leading-none">×</button>
						{/if}
					</div>
				{/each}
			</div>

			{#if form?.errors?.conceptos}
				<p class="text-red-600 text-sm mt-2">{form.errors.conceptos}</p>
			{/if}
			<button type="button" onclick={agregarConcepto} class="mt-3 text-indigo-600 font-medium hover:underline text-sm">
				+ Agregar concepto
			</button>
		</div>

		<div>
			<h2 class="text-lg font-semibold text-gray-800 mb-3">Impuestos</h2>
			<div class="flex items-center gap-3 mb-4">
				<input id="aplicarIva" type="checkbox" name="aplicarIva" bind:checked={aplicarIva} class="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
				<label for="aplicarIva" class="text-sm text-gray-700">Aplicar IVA (16%)</label>
			</div>

			{#if impuestos.length > 0}
				<div class="space-y-2 mb-4">
					{#each impuestos as impuesto, i}
						<div class="flex items-center gap-3 flex-wrap">
							<input type="text" value={impuesto.nombre}
								oninput={(e) => actualizarImpuesto(i, 'nombre', e.currentTarget.value)}
								placeholder="Nombre del impuesto"
								class="flex-1 min-w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
							<input type="number" min="0" step="0.01" value={impuesto.tasa}
								oninput={(e) => actualizarImpuesto(i, 'tasa', e.currentTarget.value)}
								placeholder="Tasa %"
								class="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
							<input type="number" min="0" step="0.01" value={impuesto.monto}
								oninput={(e) => actualizarImpuesto(i, 'monto', e.currentTarget.value)}
								placeholder="Monto"
								class="w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
							<button type="button" onclick={() => eliminarImpuesto(i)} class="text-red-600 hover:text-red-800 text-lg">×</button>
						</div>
					{/each}
				</div>
			{/if}
			<button type="button" onclick={agregarImpuesto} class="text-indigo-600 font-medium hover:underline text-sm">
				+ Agregar otro impuesto
			</button>
		</div>

		<div class="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
			<div class="space-y-1">
				<p class="text-sm text-gray-600">Subtotal: {fmt(subtotal)}</p>
				{#if aplicarIva}
					<p class="text-sm text-gray-600">IVA (16%): {fmt(ivaCalculado)}</p>
				{/if}
				{#each impuestos as imp}
					<p class="text-sm text-gray-600">{imp.nombre || 'Impuesto'}: {fmt(Number(imp.monto) || 0)}</p>
				{/each}
				<p class="text-xl font-bold text-gray-800">Total: {fmt(total)}</p>
			</div>
			<div class="flex gap-3 flex-wrap">
				<a href="/cotizaciones" class="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm">Cancelar</a>
				<button type="submit" name="estado" value="BORRADOR" class="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 text-sm">Guardar borrador</button>
				<button type="submit" name="estado" value="ENVIADA" class="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm">Enviar al cliente</button>
			</div>
		</div>
	</form>
</div>

{#if showModalProducto}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
				<h2 class="text-lg font-semibold text-gray-800">Crear producto nuevo</h2>
				<button onclick={() => (showModalProducto = false)} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
			</div>
			<div class="px-6 py-5 space-y-4">
				{#if errorModalProducto}
					<div class="bg-red-100 text-red-800 px-3 py-2 rounded-lg text-sm">{errorModalProducto}</div>
				{/if}
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
						<input type="text" bind:value={nuevoProducto.sku} placeholder="PROD-001" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
						<input type="text" bind:value={nuevoProducto.nombre} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
						<input type="text" bind:value={nuevoProducto.categoria} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
						<select bind:value={nuevoProducto.tipo} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
							<option value="PRODUCTO">Producto</option>
							<option value="SERVICIO">Servicio</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
						<input type="text" bind:value={nuevoProducto.unidad} placeholder="pza, lt, hr" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Precio base *</label>
						<input type="number" min="0" step="0.01" bind:value={nuevoProducto.precioBase} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">IVA (%)</label>
						<input type="number" min="0" step="0.01" bind:value={nuevoProducto.ivaPct} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Stock inicial</label>
						<input type="number" min="0" step="1" bind:value={nuevoProducto.stockInicial} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
					</div>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button type="button" onclick={() => (showModalProducto = false)} class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
					<button type="button" onclick={guardarNuevoProducto} disabled={guardandoProducto}
						class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60">
						{guardandoProducto ? 'Guardando...' : 'Crear y seleccionar'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
