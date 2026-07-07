<script>
	import { Bar, Doughnut } from 'svelte-chartjs';
	import {
		Chart as ChartJS,
		Title,
		Tooltip,
		Legend,
		BarElement,
		CategoryScale,
		LinearScale,
		ArcElement
	} from 'chart.js';

	ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

	let { data } = $props();

	const estados = {
		BORRADOR: 'Borrador',
		ENVIADA: 'Enviada',
		APROBADA: 'Aprobada',
		RECHAZADA: 'Rechazada',
		FACTURADA: 'Facturada',
		PAGADA: 'Pagada'
	};

	const coloresEstado = {
		BORRADOR: '#9CA3AF',
		ENVIADA: '#F59E0B',
		APROBADA: '#10B981',
		RECHAZADA: '#EF4444',
		FACTURADA: '#8B5CF6',
		PAGADA: '#14B8A6'
	};

	function formatearMoneda(valor) {
		return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
	}

	function formatearFecha(fecha) {
		return new Date(fecha).toLocaleDateString('es-MX');
	}

	const barData = $derived({
		labels: data.ingresosPorMes.map((i) => i.label),
		datasets: [
			{
				label: 'Ingresos',
				data: data.ingresosPorMes.map((i) => i.total),
				backgroundColor: '#4F46E5',
				borderRadius: 6
			}
		]
	});

	const barOptions = {
		responsive: true,
		plugins: {
			legend: { display: false },
			title: { display: false }
		},
		scales: {
			y: { beginAtZero: true, ticks: { callback: (v) => `$${v}` } }
		}
	};

	const doughnutData = $derived({
		labels: data.cotsPorEstado.map((e) => estados[e.estado]),
		datasets: [
			{
				data: data.cotsPorEstado.map((e) => e._count.estado),
				backgroundColor: data.cotsPorEstado.map((e) => coloresEstado[e.estado]),
				borderWidth: 0
			}
		]
	});

	const doughnutOptions = {
		responsive: true,
		plugins: {
			legend: { position: 'bottom' }
		}
	};

	const etiquetaPeriodo = $derived(data.filtros.usandoFiltroFecha ? 'en el periodo' : 'este mes');

	let kpis = $derived([
		{ label: `Facturado ${etiquetaPeriodo}`, valor: formatearMoneda(data.totalFacturado), icono: '💵', color: 'bg-blue-100 text-blue-700' },
		{ label: `Cobrado ${etiquetaPeriodo}`, valor: formatearMoneda(data.totalCobrado), icono: '💰', color: 'bg-green-100 text-green-700' },
		{ label: 'Cartera pendiente', valor: formatearMoneda(data.carteraPendiente), icono: '💳', color: 'bg-red-100 text-red-700' },
		{ label: 'Cotizaciones activas', valor: data.cotsActivas.toString(), icono: '📋', color: 'bg-purple-100 text-purple-700' }
	]);

	const tituloGraficaIngresos = $derived(
		data.filtros.usandoFiltroFecha ? 'Ingresos en el periodo' : 'Ingresos últimos 6 meses'
	);
	const tituloTopClientes = $derived(
		data.filtros.clienteId ? 'Saldo pendiente del cliente' : 'Top 3 clientes con mayor saldo pendiente'
	);

	const baseExport = $derived(
		`/api/dashboard/exportar?clienteId=${data.filtros.clienteId || ''}&fechaInicio=${data.filtros.fechaInicio || ''}&fechaFin=${data.filtros.fechaFin || ''}`
	);
</script>

<div class="space-y-6">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
		{#if data.filtros.usandoFiltroFecha || data.filtros.clienteId}
			<span class="text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full w-fit">
				Mostrando datos filtrados
			</span>
		{/if}
	</div>

	<form method="GET" class="bg-white rounded-lg shadow p-4">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
			<div>
				<label for="clienteId" class="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
				<select
					id="clienteId"
					name="clienteId"
					class="w-full border border-gray-300 rounded-lg px-3 py-2"
				>
					<option value="">Todos los clientes</option>
					{#each data.clientes as cliente}
						<option value={cliente.id} selected={cliente.id === data.filtros.clienteId}>
							{cliente.nombre}
						</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="fechaInicio" class="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
				<input
					id="fechaInicio"
					name="fechaInicio"
					type="date"
					value={data.filtros.fechaInicio || ''}
					class="w-full border border-gray-300 rounded-lg px-3 py-2"
				/>
			</div>
			<div>
				<label for="fechaFin" class="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
				<input
					id="fechaFin"
					name="fechaFin"
					type="date"
					value={data.filtros.fechaFin || ''}
					class="w-full border border-gray-300 rounded-lg px-3 py-2"
				/>
			</div>
			<div class="flex flex-col gap-2">
				<button
					type="submit"
					class="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
				>
					Aplicar filtros
				</button>
				<a
					href="/dashboard"
					class="w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
				>
					Limpiar
				</a>
			</div>
		</div>
	</form>

	<div class="flex flex-wrap items-center gap-3">
		<span class="text-sm text-gray-600">Descargar reporte:</span>
		<a
			href={`${baseExport}&formato=csv`}
			class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
		>
			CSV
		</a>
		<a
			href={`${baseExport}&formato=xlsx`}
			class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
		>
			Excel
		</a>
		<a
			href={`${baseExport}&formato=pdf`}
			class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
		>
			PDF
		</a>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each kpis as kpi}
			<div class="bg-white rounded-lg shadow p-5 flex items-center gap-4">
				<div class="text-3xl {kpi.color} w-12 h-12 flex items-center justify-center rounded-full">
					{kpi.icono}
				</div>
				<div>
					<p class="text-sm text-gray-500">{kpi.label}</p>
					<p class="text-xl font-bold text-gray-800">{kpi.valor}</p>
				</div>
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<div class="bg-white rounded-lg shadow p-6">
			<h2 class="text-lg font-semibold text-gray-800 mb-4">{tituloGraficaIngresos}</h2>
			<Bar data={barData} options={barOptions} />
		</div>

		<div class="bg-white rounded-lg shadow p-6">
			<h2 class="text-lg font-semibold text-gray-800 mb-4">Cotizaciones por estado</h2>
			<Doughnut data={doughnutData} options={doughnutOptions} />
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<h2 class="text-lg font-semibold text-gray-800 p-6 pb-0">Últimas cotizaciones</h2>
			<table class="w-full text-sm mt-4">
				<thead class="bg-gray-50 text-gray-600">
					<tr>
						<th class="px-6 py-3">Número</th>
						<th class="px-6 py-3">Cliente</th>
						<th class="px-6 py-3">Fecha</th>
						<th class="px-6 py-3 text-right">Total</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each data.ultimasCots as cot}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 font-medium text-indigo-600">
								<a href="/cotizaciones/{cot.id}" class="hover:underline">{cot.numero}</a>
							</td>
							<td class="px-6 py-4 text-gray-600">{cot.cliente.nombre}</td>
							<td class="px-6 py-4 text-gray-600">{formatearFecha(cot.fecha)}</td>
							<td class="px-6 py-4 text-right text-gray-800">{formatearMoneda(Number(cot.total))}</td>
						</tr>
					{:else}
						<tr>
							<td colspan="4" class="px-6 py-8 text-center text-gray-500">Sin cotizaciones</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="bg-white rounded-lg shadow overflow-hidden">
			<h2 class="text-lg font-semibold text-gray-800 p-6 pb-0">{tituloTopClientes}</h2>
			<table class="w-full text-sm mt-4">
				<thead class="bg-gray-50 text-gray-600">
					<tr>
						<th class="px-6 py-3">Cliente</th>
						<th class="px-6 py-3 text-right">Saldo pendiente</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each data.topClientes as cliente}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 font-medium text-gray-800">{cliente.nombre}</td>
							<td class="px-6 py-4 text-right font-bold text-red-700">
								{formatearMoneda(cliente.pendiente)}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="2" class="px-6 py-8 text-center text-gray-500">Sin clientes con saldo pendiente</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
