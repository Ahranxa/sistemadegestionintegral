<script>
	let { data } = $props();

	let filtroEstado = $state('');
	let filtroCliente = $state('');

	const estados = {
		BORRADOR: { label: 'Borrador', clase: 'bg-gray-100 text-gray-700' },
		ENVIADA: { label: 'Enviada', clase: 'bg-yellow-100 text-yellow-800' },
		APROBADA: { label: 'Aprobada', clase: 'bg-green-100 text-green-800' },
		RECHAZADA: { label: 'Rechazada', clase: 'bg-red-100 text-red-800' },
		FACTURADA: { label: 'Facturada', clase: 'bg-purple-100 text-purple-800' },
		PAGADA: { label: 'Pagada', clase: 'bg-teal-100 text-teal-800' }
	};

	let filtradas = $derived(
		data.cotizaciones.filter((c) => {
			const coincideEstado = !filtroEstado || c.estado === filtroEstado;
			const coincideCliente = !filtroCliente || c.clienteId === filtroCliente;
			return coincideEstado && coincideCliente;
		})
	);

	function formatearFecha(fecha) {
		return fecha ? new Date(fecha).toLocaleDateString('es-MX') : '-';
	}

	function formatearMoneda(valor) {
		return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<h1 class="text-2xl font-bold text-gray-800">Cotizaciones</h1>
		<div class="flex flex-wrap items-center gap-2">
			<a
				href="/api/cotizaciones/exportar?formato=csv"
				class="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
			>
				Cotizaciones CSV
			</a>
			<a
				href="/api/cotizaciones/exportar?formato=xlsx"
				class="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
			>
				Cotizaciones Excel
			</a>
			<a
				href="/api/cotizaciones/historial/exportar?formato=csv"
				class="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
			>
				Historial CSV
			</a>
			<a
				href="/api/cotizaciones/historial/exportar?formato=xlsx"
				class="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
			>
				Historial Excel
			</a>
			<a
				href="/cotizaciones/nueva"
				class="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
			>
				+ Nueva cotización
			</a>
		</div>
	</div>

	<div class="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-4">
		<select
			bind:value={filtroEstado}
			class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
		>
			<option value="">Todos los estados</option>
			{#each Object.entries(estados) as [key, val]}
				<option value={key}>{val.label}</option>
			{/each}
		</select>

		<select
			bind:value={filtroCliente}
			class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
		>
			<option value="">Todos los clientes</option>
			{#each data.clientes as cliente}
				<option value={cliente.id}>{cliente.nombre}</option>
			{/each}
		</select>
	</div>

	<div class="bg-white rounded-lg shadow overflow-x-auto">
		<table class="w-full min-w-[800px] text-left text-sm">
			<thead class="bg-gray-50 text-gray-600">
				<tr>
					<th class="px-6 py-3">Número</th>
					<th class="px-6 py-3">Cliente</th>
					<th class="px-6 py-3">Fecha</th>
					<th class="px-6 py-3">Vencimiento</th>
					<th class="px-6 py-3">Total</th>
					<th class="px-6 py-3">Estado</th>
					<th class="px-6 py-3">Creado por</th>
					<th class="px-6 py-3 text-right">Acciones</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each filtradas as cot}
					<tr class="hover:bg-gray-50">
						<td class="px-6 py-4 font-medium text-gray-800">{cot.numero}</td>
						<td class="px-6 py-4 text-gray-600">{cot.cliente.nombre}</td>
						<td class="px-6 py-4 text-gray-600">{formatearFecha(cot.fecha)}</td>
						<td class="px-6 py-4 text-gray-600">{formatearFecha(cot.vencimiento)}</td>
						<td class="px-6 py-4 text-gray-800">{formatearMoneda(Number(cot.total))}</td>
						<td class="px-6 py-4">
							<span class="px-2 py-1 rounded-full text-xs font-medium {estados[cot.estado].clase}">
								{estados[cot.estado].label}
							</span>
						</td>
						<td class="px-6 py-4 text-gray-600 text-sm">{cot.creadoPorNombre}</td>
						<td class="px-6 py-4 text-right">
							<a href="/cotizaciones/{cot.id}" class="text-indigo-600 hover:underline">Ver</a>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="8" class="px-6 py-8 text-center text-gray-500">
							No se encontraron cotizaciones.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
