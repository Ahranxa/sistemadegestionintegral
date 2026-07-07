<script>
	import { enhance } from '$app/forms';

	let { data } = $props();

	let cliente = $derived(data.cliente);

	function formatoMoneda(valor) {
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN'
		}).format(valor);
	}

	function formatearFecha(fecha) {
		return new Date(fecha).toLocaleDateString('es-MX');
	}

	function formatearEstado(estado) {
		const map = {
			BORRADOR: 'Borrador',
			ENVIADA: 'Enviada',
			APROBADA: 'Aprobada',
			RECHAZADA: 'Rechazada',
			FACTURADA: 'Facturada',
			PAGADA: 'Pagada'
		};
		return map[estado] || estado;
	}

	function confirmarDesactivacion() {
		return confirm('¿Estás seguro de desactivar este cliente? No se perderá su historial.');
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-800">Perfil del cliente</h1>
		<a href="/clientes" class="text-indigo-600 hover:underline">← Volver al listado</a>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div class="bg-white rounded-lg shadow p-6 lg:col-span-2">
			<h2 class="text-lg font-semibold text-gray-800 mb-4">Datos generales</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
				<div>
					<p class="text-gray-500">Nombre</p>
					<p class="font-medium text-gray-800">{cliente.nombre}</p>
				</div>
				<div>
					<p class="text-gray-500">Empresa</p>
					<p class="font-medium text-gray-800">{cliente.empresa || '-'}</p>
				</div>
				<div>
					<p class="text-gray-500">RFC</p>
					<p class="font-medium text-gray-800">{cliente.rfc || '-'}</p>
				</div>
				<div>
					<p class="text-gray-500">Correo</p>
					<p class="font-medium text-gray-800">{cliente.correo}</p>
				</div>
				<div>
					<p class="text-gray-500">Teléfono</p>
					<p class="font-medium text-gray-800">{cliente.telefono || '-'}</p>
				</div>
				<div>
					<p class="text-gray-500">Dirección</p>
					<p class="font-medium text-gray-800">{cliente.direccion || '-'}</p>
				</div>
				<div class="md:col-span-2">
					<p class="text-gray-500">Notas</p>
					<p class="font-medium text-gray-800">{cliente.notas || '-'}</p>
				</div>
			</div>

			<div class="mt-6 pt-6 border-t border-gray-100">
				<form
					method="POST"
					action="?/desactivar"
					use:enhance={() => {
						return async ({ update }) => {
							update();
						};
					}}
				>
					<button
						type="submit"
						onclick={confirmarDesactivacion}
						class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
					>
						Desactivar cliente
					</button>
				</form>
			</div>
		</div>

		<div class="space-y-4">
			<div class="bg-white rounded-lg shadow p-6">
				<p class="text-gray-500 text-sm">Total facturado</p>
				<p class="text-2xl font-bold text-indigo-700">{formatoMoneda(data.totalFacturado)}</p>
			</div>
			<div class="bg-white rounded-lg shadow p-6">
				<p class="text-gray-500 text-sm">Total cobrado</p>
				<p class="text-2xl font-bold text-green-700">{formatoMoneda(data.totalCobrado)}</p>
			</div>
			<div class="bg-white rounded-lg shadow p-6">
				<p class="text-gray-500 text-sm">Saldo pendiente</p>
				<p class="text-2xl font-bold text-red-700">{formatoMoneda(data.totalPendiente)}</p>
			</div>
		</div>
	</div>

	<div class="bg-white rounded-lg shadow overflow-hidden">
		<h2 class="text-lg font-semibold text-gray-800 p-6 pb-0">Cotizaciones</h2>
		<table class="w-full text-left text-sm mt-4">
			<thead class="bg-gray-50 text-gray-600">
				<tr>
					<th class="px-6 py-3">Número</th>
					<th class="px-6 py-3">Fecha</th>
					<th class="px-6 py-3">Estado</th>
					<th class="px-6 py-3 text-right">Total</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each cliente.cotizaciones as cot}
					<tr class="hover:bg-gray-50">
						<td class="px-6 py-4 font-medium text-indigo-600">
							<a href="/cotizaciones/{cot.id}" class="hover:underline">{cot.numero}</a>
						</td>
						<td class="px-6 py-4 text-gray-600">{formatearFecha(cot.fecha)}</td>
						<td class="px-6 py-4">
							<span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
								{formatearEstado(cot.estado)}
							</span>
						</td>
						<td class="px-6 py-4 text-right text-gray-800">{formatoMoneda(Number(cot.total))}</td>
					</tr>
				{:else}
					<tr>
						<td colspan="4" class="px-6 py-8 text-center text-gray-500">
							Este cliente aún no tiene cotizaciones.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
