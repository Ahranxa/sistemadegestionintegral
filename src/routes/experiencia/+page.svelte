<script>
	import { Doughnut, Bar } from 'svelte-chartjs';
	import {
		Chart as ChartJS,
		Title,
		Tooltip,
		Legend,
		ArcElement,
		BarElement,
		CategoryScale,
		LinearScale
	} from 'chart.js';

	ChartJS.register(Title, Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale);

	let { data } = $props();

	const doughnutData = $derived({
		labels: data.emotionDistribution.map((e) => e.label),
		datasets: [
			{
				data: data.emotionDistribution.map((e) => e.count),
				backgroundColor: [
					'#ef4444',
					'#f97316',
					'#eab308',
					'#22c55e',
					'#3b82f6',
					'#a855f7',
					'#64748b'
				]
			}
		]
	});

	const barData = $derived({
		labels: data.moduleCounts.map((m) => m.label),
		datasets: [
			{
				label: 'Eventos',
				data: data.moduleCounts.map((m) => m.count),
				backgroundColor: '#4F46E5',
				borderRadius: 6
			}
		]
	});

	const barOptions = {
		responsive: true,
		plugins: { legend: { display: false } }
	};
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-800">Analítica de Experiencia</h1>

	{#if data.error}
		<p class="text-sm text-red-600 bg-red-50 p-3 rounded">{data.error}</p>
	{/if}

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="bg-white rounded-lg shadow p-5 text-center">
			<p class="text-3xl font-bold text-indigo-700">{data.sessions}</p>
			<p class="text-sm text-gray-500">Sesiones analizadas</p>
		</div>
		<div class="bg-white rounded-lg shadow p-5 text-center">
			<p class="text-3xl font-bold text-green-700">{data.totalEvents}</p>
			<p class="text-sm text-gray-500">Eventos detectados</p>
		</div>
		<div class="bg-white rounded-lg shadow p-5 text-center">
			<p class="text-3xl font-bold text-purple-700">{data.emotionDistribution.length}</p>
			<p class="text-sm text-gray-500">Estados detectados</p>
		</div>
		<div class="bg-white rounded-lg shadow p-5 text-center">
			<p class="text-3xl font-bold text-orange-700">{data.moduleCounts.length}</p>
			<p class="text-sm text-gray-500">Módulos con eventos</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<div class="bg-white rounded-lg shadow p-6">
			<h2 class="text-lg font-semibold text-gray-800 mb-4">Distribución de estados/emociones</h2>
			<Doughnut
				data={doughnutData}
				options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
			/>
		</div>

		<div class="bg-white rounded-lg shadow p-6">
			<h2 class="text-lg font-semibold text-gray-800 mb-4">Módulos con más eventos</h2>
			<Bar data={barData} options={barOptions} />
		</div>
	</div>

	<div class="bg-white rounded-lg shadow overflow-x-auto">
		<h2 class="text-lg font-semibold text-gray-800 p-6 pb-0">Historial reciente de eventos</h2>
		<table class="w-full min-w-[500px] text-sm mt-4">
			<thead class="bg-gray-50 text-gray-600">
				<tr>
					<th class="px-6 py-3 text-left">Fecha</th>
					<th class="px-6 py-3 text-left">Módulo</th>
					<th class="px-6 py-3 text-left">Estado</th>
					<th class="px-6 py-3 text-left">Confianza</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each data.recentEvents as event}
					<tr>
						<td class="px-6 py-3 text-gray-600">
							{new Date(event.detectedAt).toLocaleString('es-MX')}
						</td>
						<td class="px-6 py-3 text-gray-600">{event.module || '-'}</td>
						<td class="px-6 py-3 font-medium text-indigo-700">{event.emotion}</td>
						<td class="px-6 py-3 text-gray-800">{(event.score * 100).toFixed(0)}%</td>
					</tr>
				{:else}
					<tr>
						<td colspan="4" class="px-6 py-8 text-center text-gray-500">
							Sin eventos registrados
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
