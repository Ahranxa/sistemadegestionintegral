<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	function formatearMoneda(valor) {
		return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
	}

	function formatearFecha(fecha) {
		return new Date(fecha).toLocaleDateString('es-MX');
	}

	function colorFila(dias) {
		if (dias > 30) return 'bg-red-50';
		if (dias > 15) return 'bg-yellow-50';
		return '';
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<h1 class="text-2xl font-bold text-gray-800">Cobranza</h1>
		<div class="flex flex-wrap items-center gap-2">
			<a
				href="/api/cobranza/exportar?formato=csv"
				class="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
			>
				CSV
			</a>
			<a
				href="/api/cobranza/exportar?formato=xlsx"
				class="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
			>
				Excel
			</a>
			<a
				href="/api/cobranza/recordatorios/exportar?formato=csv"
				class="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
			>
				Recordatorios CSV
			</a>
			<a
				href="/api/cobranza/recordatorios/exportar?formato=xlsx"
				class="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
			>
				Recordatorios Excel
			</a>
			<div class="bg-white rounded-lg shadow px-4 py-3">
				<p class="text-xs text-gray-500">Cartera pendiente total</p>
				<p class="text-xl font-bold text-red-700">{formatearMoneda(data.carteraPendiente)}</p>
			</div>
		</div>
	</div>

	{#if form?.error}
		<div class="bg-red-100 text-red-800 px-4 py-3 rounded-lg">{form.error}</div>
	{/if}

	{#if form?.success}
		<div class="bg-green-100 text-green-800 px-4 py-3 rounded-lg">Recordatorio enviado correctamente</div>
	{/if}

	<div class="bg-white rounded-lg shadow overflow-x-auto">
		<table class="w-full min-w-[900px] text-left text-sm">
			<thead class="bg-gray-50 text-gray-600">
				<tr>
					<th class="px-6 py-3">Cliente</th>
					<th class="px-6 py-3">Cotización</th>
					<th class="px-6 py-3">Fecha</th>
					<th class="px-6 py-3 text-right">Total</th>
					<th class="px-6 py-3 text-right">Pagado</th>
					<th class="px-6 py-3 text-right">Pendiente</th>
					<th class="px-6 py-3 text-center">Días</th>
					<th class="px-6 py-3 text-right">Acciones</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each data.pendientes as cot}
					<tr class="{colorFila(cot.diasTranscurridos)}">
						<td class="px-6 py-4 font-medium text-gray-800">{cot.cliente.nombre}</td>
						<td class="px-6 py-4 text-indigo-600">
							<a href="/cotizaciones/{cot.id}" class="hover:underline">{cot.numero}</a>
						</td>
						<td class="px-6 py-4 text-gray-600">{formatearFecha(cot.fecha)}</td>
						<td class="px-6 py-4 text-right text-gray-800">{formatearMoneda(Number(cot.total))}</td>
						<td class="px-6 py-4 text-right text-green-700">{formatearMoneda(cot.totalPagado)}</td>
						<td class="px-6 py-4 text-right font-bold text-red-700">
							{formatearMoneda(cot.saldoPendiente)}
						</td>
						<td class="px-6 py-4 text-center">
							<span class="px-2 py-1 rounded-full text-xs font-medium
								{cot.diasTranscurridos > 30 ? 'bg-red-200 text-red-800' : cot.diasTranscurridos > 15 ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}">
								{cot.diasTranscurridos}
							</span>
						</td>
						<td class="px-6 py-4 text-right">
							<form
								method="POST"
								action="?/enviarRecordatorio"
								use:enhance={() => {
									return async ({ result, update }) => {
										if (result.type === 'success') {
											await invalidateAll();
										}
										update();
									};
								}}
								class="inline"
							>
								<input type="hidden" name="cotizacionId" value={cot.id} />
								<button
									type="submit"
									class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
								>
									Enviar recordatorio
								</button>
							</form>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="8" class="px-6 py-8 text-center text-gray-500">
							No hay cotizaciones con saldo pendiente.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
