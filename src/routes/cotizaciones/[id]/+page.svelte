<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	let cot = $derived(data.cotizacion);
	let showPago = $state(false);
	let showConfirmDelete = $state(false);
	let pagoAEliminar = $state(null);

	const estados = {
		BORRADOR: { label: 'Borrador', clase: 'bg-gray-100 text-gray-700' },
		ENVIADA: { label: 'Enviada', clase: 'bg-yellow-100 text-yellow-800' },
		APROBADA: { label: 'Aprobada', clase: 'bg-green-100 text-green-800' },
		RECHAZADA: { label: 'Rechazada', clase: 'bg-red-100 text-red-800' },
		FACTURADA: { label: 'Facturada', clase: 'bg-purple-100 text-purple-800' },
		PAGADA: { label: 'Pagada', clase: 'bg-teal-100 text-teal-800' }
	};

	const metodosPago = {
		TRANSFERENCIA: 'Transferencia',
		EFECTIVO: 'Efectivo',
		CHEQUE: 'Cheque',
		TARJETA: 'Tarjeta'
	};

	const transiciones = {
		BORRADOR: [{ estado: 'ENVIADA', label: 'Enviar al cliente', clase: 'bg-indigo-600 hover:bg-indigo-700' }],
		ENVIADA: [
			{ estado: 'APROBADA', label: 'Aprobar', clase: 'bg-green-600 hover:bg-green-700' },
			{ estado: 'RECHAZADA', label: 'Rechazar', clase: 'bg-red-600 hover:bg-red-700' }
		],
		APROBADA: [{ estado: 'FACTURADA', label: 'Facturar', clase: 'bg-purple-600 hover:bg-purple-700' }],
		FACTURADA: [{ estado: 'PAGADA', label: 'Marcar como pagada', clase: 'bg-teal-600 hover:bg-teal-700' }],
		RECHAZADA: [],
		PAGADA: []
	};

	function formatearMoneda(valor) {
		return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
	}

	function formatearFecha(fecha) {
		return fecha ? new Date(fecha).toLocaleDateString('es-MX') : '-';
	}

	function formatearHora(fecha) {
		return fecha ? new Date(fecha).toLocaleString('es-MX') : '-';
	}

	function colorSaldo(saldo) {
		if (saldo <= 0) return 'text-green-700';
		if (saldo <= Number(cot.total) * 0.5) return 'text-yellow-700';
		return 'text-red-700';
	}

	function abrirEliminar(pago) {
		pagoAEliminar = pago;
		showConfirmDelete = true;
	}

	function cerrarEliminar() {
		pagoAEliminar = null;
		showConfirmDelete = false;
	}
</script>

<div class="space-y-6 max-w-5xl">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-800">{cot.numero}</h1>
			<p class="text-gray-500">{cot.cliente.nombre}</p>
		</div>
		<a href="/cotizaciones" class="text-indigo-600 hover:underline">← Volver</a>
	</div>

	<div class="flex flex-wrap gap-3">
		<span class="px-3 py-1 rounded-full text-sm font-medium {estados[cot.estado].clase}">
			{estados[cot.estado].label}
		</span>
	</div>

	{#if form?.error}
		<div class="bg-red-100 text-red-800 px-4 py-3 rounded-lg">{form.error}</div>
	{/if}

	{#if form?.success}
		<div class="bg-green-100 text-green-800 px-4 py-3 rounded-lg">Operación exitosa</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div class="bg-white rounded-lg shadow p-6 lg:col-span-2">
			<h2 class="text-lg font-semibold text-gray-800 mb-4">Conceptos</h2>
			<table class="w-full text-sm">
				<thead class="bg-gray-50 text-gray-600">
					<tr>
						<th class="px-4 py-2 text-left">Descripción</th>
						<th class="px-4 py-2 text-right">Cantidad</th>
						<th class="px-4 py-2 text-right">Precio</th>
						<th class="px-4 py-2 text-right">Subtotal</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each cot.conceptos as concepto}
						<tr>
							<td class="px-4 py-3">{concepto.descripcion}</td>
							<td class="px-4 py-3 text-right">{Number(concepto.cantidad)}</td>
							<td class="px-4 py-3 text-right">{formatearMoneda(Number(concepto.precioUnitario))}</td>
							<td class="px-4 py-3 text-right">{formatearMoneda(Number(concepto.subtotal))}</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<div class="mt-4 text-right space-y-1">
				<p class="text-sm text-gray-600">Subtotal: {formatearMoneda(Number(cot.subtotal))}</p>
				<p class="text-sm text-gray-600">IVA (16%): {formatearMoneda(Number(cot.iva))}</p>
				<p class="text-xl font-bold text-gray-800">Total: {formatearMoneda(Number(cot.total))}</p>
			</div>
		</div>

		<div class="space-y-4">
			<div class="bg-white rounded-lg shadow p-6">
				<p class="text-gray-500 text-sm">Total pagado</p>
				<p class="text-2xl font-bold text-green-700">{formatearMoneda(data.totalPagado)}</p>
			</div>
			<div class="bg-white rounded-lg shadow p-6">
				<p class="text-gray-500 text-sm">Saldo pendiente</p>
				<p class="text-2xl font-bold text-red-700">{formatearMoneda(data.saldoPendiente)}</p>
			</div>

			{#if transiciones[cot.estado].length > 0}
				<div class="bg-white rounded-lg shadow p-6 space-y-2">
					<h3 class="text-sm font-semibold text-gray-700 mb-2">Cambiar estado</h3>
					{#each transiciones[cot.estado] as trans}
						<form
							method="POST"
							action="?/cambiarEstado"
							use:enhance={() => {
								return async ({ update }) => update();
							}}
						>
							<input type="hidden" name="nuevoEstado" value={trans.estado} />
							<button
								type="submit"
								class="w-full text-white px-4 py-2 rounded-lg transition {trans.clase}"
							>
								{trans.label}
							</button>
						</form>
					{/each}
				</div>
			{/if}

			{#if cot.estado === 'FACTURADA' || cot.estado === 'PAGADA'}
				<div class="bg-white rounded-lg shadow p-6">
					<button
						onclick={() => (showPago = true)}
						class="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
					>
						+ Registrar pago
					</button>
				</div>
			{/if}
		</div>
	</div>

	{#if cot.pagos.length > 0}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<h2 class="text-lg font-semibold text-gray-800 p-6 pb-0">Pagos registrados</h2>
			<table class="w-full text-sm mt-4">
				<thead class="bg-gray-50 text-gray-600">
					<tr>
						<th class="px-6 py-3">Fecha</th>
						<th class="px-6 py-3">Método</th>
						<th class="px-6 py-3">Referencia</th>
						<th class="px-6 py-3 text-right">Monto</th>
						<th class="px-6 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each cot.pagos as pago}
						<tr>
							<td class="px-6 py-4">{formatearFecha(pago.fecha)}</td>
							<td class="px-6 py-4">{metodosPago[pago.metodo] || pago.metodo}</td>
							<td class="px-6 py-4">{pago.referencia || '-'}</td>
							<td class="px-6 py-4 text-right">{formatearMoneda(Number(pago.monto))}</td>
							<td class="px-6 py-4 text-right">
								{#if cot.estado !== 'PAGADA'}
									<button
										type="button"
										onclick={() => abrirEliminar(pago)}
										class="text-red-600 hover:text-red-800 text-sm"
									>
										Eliminar
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<div class="border-t border-gray-100 p-6 text-right space-y-1">
				<p class="text-sm text-gray-600">Total: {formatearMoneda(Number(cot.total))}</p>
				<p class="text-sm text-gray-600">Pagado: {formatearMoneda(data.totalPagado)}</p>
				<p class="text-lg font-bold {colorSaldo(data.saldoPendiente)}">
					Pendiente: {formatearMoneda(data.saldoPendiente)}
				</p>
			</div>
		</div>
	{/if}

	<div class="bg-white rounded-lg shadow overflow-hidden">
		<h2 class="text-lg font-semibold text-gray-800 p-6 pb-0">Historial de estados</h2>
		<table class="w-full text-sm mt-4">
			<thead class="bg-gray-50 text-gray-600">
				<tr>
					<th class="px-6 py-3">Fecha</th>
					<th class="px-6 py-3">Estado anterior</th>
					<th class="px-6 py-3">Estado nuevo</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each cot.historial as h}
					<tr>
						<td class="px-6 py-4">{formatearHora(h.creadoEn)}</td>
						<td class="px-6 py-4">{h.estadoAnterior ? estados[h.estadoAnterior].label : '-'}</td>
						<td class="px-6 py-4">
							<span class="px-2 py-1 rounded-full text-xs font-medium {estados[h.estadoNuevo].clase}">
								{estados[h.estadoNuevo].label}
							</span>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="3" class="px-6 py-8 text-center text-gray-500">Sin historial</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

{#if showPago}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
			<h2 class="text-xl font-bold text-gray-800 mb-4">Registrar pago</h2>
			<form
				method="POST"
				action="?/registrarPago"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							showPago = false;
							await invalidateAll();
						}
						update();
					};
				}}
				class="space-y-4"
			>
				<div>
					<label for="monto" class="block text-sm font-medium text-gray-700 mb-1">Monto</label>
					<input
						id="monto"
						type="number"
						name="monto"
						min="0.01"
						step="0.01"
						max={data.saldoPendiente}
						required
						class="w-full border border-gray-300 rounded-lg px-3 py-2"
					/>
				</div>

				<div>
					<label for="fecha" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
					<input
						id="fecha"
						type="date"
						name="fecha"
						value={new Date().toISOString().split('T')[0]}
						class="w-full border border-gray-300 rounded-lg px-3 py-2"
					/>
				</div>

				<div>
					<label for="metodo" class="block text-sm font-medium text-gray-700 mb-1">Método</label>
					<select
						id="metodo"
						name="metodo"
						required
						class="w-full border border-gray-300 rounded-lg px-3 py-2"
					>
						<option value="">Selecciona</option>
						{#each Object.entries(metodosPago) as [key, label]}
							<option value={key}>{label}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="referencia" class="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
					<input
						id="referencia"
						type="text"
						name="referencia"
						class="w-full border border-gray-300 rounded-lg px-3 py-2"
					/>
				</div>

				<div class="flex justify-end gap-3 pt-2">
					<button
						type="button"
						onclick={() => (showPago = false)}
						class="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
					>
						Guardar pago
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showConfirmDelete && pagoAEliminar}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
			<h2 class="text-xl font-bold text-gray-800 mb-2">¿Eliminar pago?</h2>
			<p class="text-gray-600 mb-6">
				Se eliminará el pago de {formatearMoneda(Number(pagoAEliminar.monto))} realizado el {formatearFecha(pagoAEliminar.fecha)}.
			</p>
			<form
				method="POST"
				action="?/eliminarPago"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							cerrarEliminar();
							await invalidateAll();
						}
						update();
					};
				}}
				class="flex justify-end gap-3"
			>
				<input type="hidden" name="pagoId" value={pagoAEliminar.id} />
				<button
					type="button"
					onclick={cerrarEliminar}
					class="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
				>
					Cancelar
				</button>
				<button
					type="submit"
					class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
				>
					Eliminar
				</button>
			</form>
		</div>
	</div>
{/if}
