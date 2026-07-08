<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let conceptos = $state([{ descripcion: '', cantidad: 1, precioUnitario: 0 }]);
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

	function agregarConcepto() {
		conceptos = [...conceptos, { descripcion: '', cantidad: 1, precioUnitario: 0 }];
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
		impuestos = impuestos.map((imp, i) => (i === index ? { ...imp, [campo]: valor } : imp));
	}

	function formatearMoneda(valor) {
		return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
	}
</script>

<div class="space-y-6 max-w-4xl">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-800">Nueva cotización</h1>
		<a href="/cotizaciones" class="text-indigo-600 hover:underline">← Cancelar</a>
	</div>

	{#if form?.errors?.general}
		<div class="bg-red-100 text-red-800 px-4 py-3 rounded-lg">{form.errors.general}</div>
	{/if}

	<form
		method="POST"
		action="?/guardar"
		use:enhance
		class="bg-white rounded-lg shadow p-6 space-y-6"
	>
		<input type="hidden" name="numero" value={data.numero} />
		<input type="hidden" name="conceptos" value={JSON.stringify(conceptos)} />
		<input type="hidden" name="impuestos" value={JSON.stringify(impuestos)} />

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label for="clienteId" class="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
				<select
					id="clienteId"
					name="clienteId"
					bind:value={clienteId}
					class="w-full border border-gray-300 rounded-lg px-3 py-2"
				>
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
				<label for="numeroMostrar" class="block text-sm font-medium text-gray-700 mb-1">Número</label>
				<input
					id="numeroMostrar"
					type="text"
					value={data.numero}
					disabled
					class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
				/>
			</div>

			<div>
				<label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
				<input
					id="fecha"
					type="date"
					name="fecha"
					bind:value={fecha}
					class="w-full border border-gray-300 rounded-lg px-3 py-2"
				/>
				{#if form?.errors?.fecha}
					<p class="text-red-600 text-sm mt-1">{form.errors.fecha}</p>
				{/if}
			</div>

			<div>
				<label for="vencimiento" class="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
				<input
					id="vencimiento"
					type="date"
					name="vencimiento"
					bind:value={vencimiento}
					class="w-full border border-gray-300 rounded-lg px-3 py-2"
				/>
			</div>
		</div>

		<div>
			<h2 class="text-lg font-semibold text-gray-800 mb-3">Conceptos</h2>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 text-gray-600">
						<tr>
							<th class="px-3 py-2 text-left">Descripción</th>
							<th class="px-3 py-2 text-left w-28">Cantidad</th>
							<th class="px-3 py-2 text-left w-36">Precio unitario</th>
							<th class="px-3 py-2 text-right w-32">Subtotal</th>
							<th class="px-3 py-2 w-16"></th>
						</tr>
					</thead>
					<tbody>
						{#each conceptos as concepto, i}
							<tr>
								<td class="px-3 py-2">
									<input
										type="text"
										value={concepto.descripcion}
										oninput={(e) => actualizarConcepto(i, 'descripcion', e.currentTarget.value)}
										class="w-full border border-gray-300 rounded-lg px-2 py-1"
									/>
								</td>
								<td class="px-3 py-2">
									<input
										type="number"
										min="0"
										step="0.01"
										value={concepto.cantidad}
										oninput={(e) => actualizarConcepto(i, 'cantidad', e.currentTarget.value)}
										class="w-full border border-gray-300 rounded-lg px-2 py-1"
									/>
								</td>
								<td class="px-3 py-2">
									<input
										type="number"
										min="0"
										step="0.01"
										value={concepto.precioUnitario}
										oninput={(e) => actualizarConcepto(i, 'precioUnitario', e.currentTarget.value)}
										class="w-full border border-gray-300 rounded-lg px-2 py-1"
									/>
								</td>
								<td class="px-3 py-2 text-right">
									{formatearMoneda((Number(concepto.cantidad) || 0) * (Number(concepto.precioUnitario) || 0))}
								</td>
								<td class="px-3 py-2 text-right">
									{#if conceptos.length > 1}
										<button
											type="button"
											onclick={() => eliminarConcepto(i)}
											class="text-red-600 hover:text-red-800"
										>
											×
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if form?.errors?.conceptos}
				<p class="text-red-600 text-sm mt-2">{form.errors.conceptos}</p>
			{/if}
			<button
				type="button"
				onclick={agregarConcepto}
				class="mt-3 text-indigo-600 font-medium hover:underline"
			>
				+ Agregar concepto
			</button>
		</div>

		<div>
			<h2 class="text-lg font-semibold text-gray-800 mb-3">Impuestos</h2>
			<div class="flex items-center gap-3 mb-4">
				<input
					id="aplicarIva"
					type="checkbox"
					name="aplicarIva"
					bind:checked={aplicarIva}
					class="w-4 h-4 text-indigo-600 border-gray-300 rounded"
				/>
				<label for="aplicarIva" class="text-sm text-gray-700">Aplicar IVA (16%)</label>
			</div>

			{#if impuestos.length > 0}
				<div class="overflow-x-auto mb-4">
					<table class="w-full text-sm">
						<thead class="bg-gray-50 text-gray-600">
							<tr>
								<th class="px-3 py-2 text-left">Nombre</th>
								<th class="px-3 py-2 text-left w-28">Tasa (%)</th>
								<th class="px-3 py-2 text-left w-36">Monto</th>
								<th class="px-3 py-2 w-16"></th>
							</tr>
						</thead>
						<tbody>
							{#each impuestos as impuesto, i}
								<tr>
									<td class="px-3 py-2">
										<input
											type="text"
											value={impuesto.nombre}
											oninput={(e) => actualizarImpuesto(i, 'nombre', e.currentTarget.value)}
											placeholder="Ej. IEPS, Retención"
											class="w-full border border-gray-300 rounded-lg px-2 py-1"
										/>
									</td>
									<td class="px-3 py-2">
										<input
											type="number"
											min="0"
											step="0.01"
											value={impuesto.tasa}
											oninput={(e) => actualizarImpuesto(i, 'tasa', e.currentTarget.value)}
											class="w-full border border-gray-300 rounded-lg px-2 py-1"
										/>
									</td>
									<td class="px-3 py-2">
										<input
											type="number"
											min="0"
											step="0.01"
											value={impuesto.monto}
											oninput={(e) => actualizarImpuesto(i, 'monto', e.currentTarget.value)}
											class="w-full border border-gray-300 rounded-lg px-2 py-1"
										/>
									</td>
									<td class="px-3 py-2 text-right">
										<button
											type="button"
											onclick={() => eliminarImpuesto(i)}
											class="text-red-600 hover:text-red-800"
										>
											×
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
			<button
				type="button"
				onclick={agregarImpuesto}
				class="text-indigo-600 font-medium hover:underline"
			>
				+ Agregar otro impuesto
			</button>
		</div>

		<div class="flex justify-end gap-4 pt-4 border-t border-gray-100">
			<div class="text-right mr-auto space-y-1">
				<p class="text-sm text-gray-600">Subtotal: {formatearMoneda(subtotal)}</p>
				{#if aplicarIva}
					<p class="text-sm text-gray-600">IVA (16%): {formatearMoneda(ivaCalculado)}</p>
				{/if}
				{#each impuestos as impuesto}
					<p class="text-sm text-gray-600">{impuesto.nombre || 'Impuesto'}: {formatearMoneda(Number(impuesto.monto) || 0)}</p>
				{/each}
				<p class="text-xl font-bold text-gray-800">Total: {formatearMoneda(total)}</p>
			</div>
		</div>

		<div class="flex justify-end gap-3">
			<a href="/cotizaciones" class="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
				Cancelar
			</a>
			<button
				type="submit"
				name="estado"
				value="BORRADOR"
				class="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
			>
				Guardar borrador
			</button>
			<button
				type="submit"
				name="estado"
				value="ENVIADA"
				class="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
			>
				Enviar al cliente
			</button>
		</div>
	</form>
</div>
