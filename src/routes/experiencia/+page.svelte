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
	import { ScanFace, Zap, Smile, LayoutGrid, Inbox } from 'lucide-svelte';

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
				borderRadius: 4
			}
		]
	});

	const barOptions = {
		responsive: true,
		plugins: { legend: { display: false } }
	};

	const metricas = $derived([
		{ label: 'Sesiones analizadas', valor: data.sessions, icon: ScanFace, color: 'indigo' },
		{ label: 'Eventos detectados', valor: data.totalEvents, icon: Zap, color: 'emerald' },
		{ label: 'Estados detectados', valor: data.emotionDistribution.length, icon: Smile, color: 'purple' },
		{ label: 'Módulos con eventos', valor: data.moduleCounts.length, icon: LayoutGrid, color: 'orange' }
	]);
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-slate-900">Analítica de Experiencia</h1>
		<p class="text-sm text-slate-500 mt-1">Resumen de detecciones MorphCast</p>
	</div>

	{#if data.error}
		<div class="text-sm text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2">
			<Inbox class="w-4 h-4" />
			{data.error}
		</div>
	{/if}

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each metricas as m}
			{@const Icon = m.icon}
			<div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 text-center border-t-4 border-{m.color}-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
				<div class="w-10 h-10 rounded-lg bg-{m.color}-50 flex items-center justify-center text-{m.color}-600 mx-auto mb-3">
					<Icon class="w-5 h-5" />
				</div>
				<p class="text-3xl font-bold text-slate-900">{m.valor}</p>
				<p class="text-sm text-slate-500 mt-1">{m.label}</p>
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 hover:shadow-md transition-shadow">
			<h2 class="text-base font-semibold text-slate-800 mb-4">Distribución de estados/emociones</h2>
			<Doughnut
				data={doughnutData}
				options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
			/>
		</div>

		<div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 hover:shadow-md transition-shadow">
			<h2 class="text-base font-semibold text-slate-800 mb-4">Módulos con más eventos</h2>
			<Bar data={barData} options={barOptions} />
		</div>
	</div>

	<div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-x-auto hover:shadow-md transition-shadow">
		<h2 class="text-base font-semibold text-slate-800 p-5 pb-0">Historial reciente de eventos</h2>
		<table class="w-full min-w-[500px] text-sm mt-4">
			<thead class="bg-slate-50/80 text-slate-600">
				<tr>
					<th class="px-5 py-3 text-left font-medium">Fecha</th>
					<th class="px-5 py-3 text-left font-medium">Módulo</th>
					<th class="px-5 py-3 text-left font-medium">Estado</th>
					<th class="px-5 py-3 text-left font-medium">Confianza</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-100">
				{#each data.recentEvents as event}
					<tr class="hover:bg-slate-50/60 transition">
						<td class="px-5 py-3 text-slate-600">
							{new Date(event.detectedAt).toLocaleString('es-MX')}
						</td>
						<td class="px-5 py-3 text-slate-600">{event.module || '-'}</td>
						<td class="px-5 py-3 font-semibold text-indigo-700">{event.emotion}</td>
						<td class="px-5 py-3 text-slate-800 font-medium">{(event.score * 100).toFixed(0)}%</td>
					</tr>
				{:else}
					<tr>
						<td colspan="4" class="px-5 py-10 text-center text-slate-500">
							<div class="flex flex-col items-center justify-center">
								<div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
									<Inbox class="w-5 h-5" />
								</div>
								<p class="text-sm font-medium">Sin eventos registrados</p>
								<p class="text-xs text-slate-400 mt-0.5">Activa MorphCast para comenzar a recopilar datos.</p>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
