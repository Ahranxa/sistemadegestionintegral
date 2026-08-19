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
	import { Wallet, Coins, CreditCard, FileText } from 'lucide-svelte';

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

	const metodosPago = {
		TRANSFERENCIA: 'Transferencia',
		EFECTIVO: 'Efectivo',
		CHEQUE: 'Cheque',
		TARJETA_DEBITO: 'Tarjeta de débito',
		TARJETA_CREDITO: 'Tarjeta de crédito',
		DEPOSITO: 'Depósito'
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
				borderRadius: 4
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
		{ label: `Facturado ${etiquetaPeriodo}`, valor: formatearMoneda(data.totalFacturado), icon: Wallet, color: 'indigo', sub: 'Facturación registrada' },
		{ label: `Cobrado ${etiquetaPeriodo}`, valor: formatearMoneda(data.totalCobrado), icon: Coins, color: 'emerald', sub: 'Pagos recibidos' },
		{ label: 'Cartera pendiente', valor: formatearMoneda(data.carteraPendiente), icon: CreditCard, color: 'rose', sub: 'Por cobrar' },
		{ label: 'Cotizaciones activas', valor: data.cotsActivas.toString(), icon: FileText, color: 'amber', sub: 'Cotizaciones vigentes' }
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
	<div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
			<p class="text-sm text-slate-500 mt-1">Resumen operativo de GestorPyME</p>
		</div>
		{#if data.filtros.usandoFiltroFecha || data.filtros.clienteId}
			<span class="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full w-fit shadow-sm">
				Mostrando datos filtrados
			</span>
		{/if}
	</div>

	<form method="GET" class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
			<div>
				<label for="clienteId" class="block text-sm font-medium text-slate-700 mb-1.5">Cliente</label>
				<select
					id="clienteId"
					name="clienteId"
					class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50/50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition"
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
				<label for="fechaInicio" class="block text-sm font-medium text-slate-700 mb-1.5">Fecha inicio</label>
				<input
					id="fechaInicio"
					name="fechaInicio"
					type="date"
					value={data.filtros.fechaInicio || ''}
					class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50/50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition"
				/>
			</div>
			<div>
				<label for="fechaFin" class="block text-sm font-medium text-slate-700 mb-1.5">Fecha fin</label>
				<input
					id="fechaFin"
					name="fechaFin"
					type="date"
					value={data.filtros.fechaFin || ''}
					class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50/50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition"
				/>
			</div>
			<div class="flex flex-col gap-2">
				<button
					type="submit"
					class="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 shadow-sm hover:shadow-md transition-all"
				>
					Aplicar filtros
				</button>
				<a
					href="/dashboard"
					class="w-full text-center bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
				>
					Limpiar
				</a>
			</div>
		</div>
	</form>

	<div class="flex flex-wrap items-center gap-3">
		<span class="text-sm text-slate-600 font-medium">Descargar reporte:</span>
		<a
			href={`${baseExport}&formato=csv`}
			class="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 hover:shadow-sm transition text-sm font-medium"
		>
			CSV
		</a>
		<a
			href={`${baseExport}&formato=xlsx`}
			class="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 hover:shadow-sm transition text-sm font-medium"
		>
			Excel
		</a>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each kpis as kpi}
			{@const Icon = kpi.icon}
			<div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 border-t-4 border-{kpi.color}-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-w-0">
				<div class="flex items-start justify-between mb-3">
					<div class="w-10 h-10 rounded-lg bg-{kpi.color}-50 flex items-center justify-center text-{kpi.color}-600">
						<Icon class="w-5 h-5" />
					</div>
					<span class="text-xs font-medium text-slate-400">{kpi.sub}</span>
				</div>
				<p class="text-sm text-slate-500 break-words">{kpi.label}</p>
				<p class="text-2xl font-bold text-slate-900 mt-1 break-words">{kpi.valor}</p>
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 hover:shadow-md transition-shadow">
			<h2 class="text-base font-semibold text-slate-800 mb-4">{tituloGraficaIngresos}</h2>
			<Bar data={barData} options={barOptions} />
		</div>

		<div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 hover:shadow-md transition-shadow">
			<h2 class="text-base font-semibold text-slate-800 mb-4">Cotizaciones por estado</h2>
			<Doughnut data={doughnutData} options={doughnutOptions} />
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-x-auto hover:shadow-md transition-shadow">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 pb-0 gap-3">
				<h2 class="text-base font-semibold text-slate-800">Ingresos por método de pago</h2>
				<div class="flex items-center gap-2">
					<a
						href="/api/pagos/exportar?formato=csv"
						class="text-xs bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:shadow-sm transition font-medium"
					>
						CSV
					</a>
					<a
						href="/api/pagos/exportar?formato=xlsx"
						class="text-xs bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:shadow-sm transition font-medium"
					>
						Excel
					</a>
				</div>
			</div>
			<table class="w-full min-w-[300px] text-sm mt-4">
				<thead class="bg-slate-50/80 text-slate-600">
					<tr>
						<th class="px-5 py-3 text-left font-medium">Método</th>
						<th class="px-5 py-3 text-center font-medium">Pagos</th>
						<th class="px-5 py-3 text-right font-medium">Monto</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each data.ingresosPorMetodo as item}
						<tr class="hover:bg-slate-50/60 transition">
							<td class="px-5 py-4 font-medium text-slate-800 whitespace-normal break-words">
								{metodosPago[item.metodo] || item.metodo}
							</td>
							<td class="px-5 py-4 text-center text-slate-600">{item.cantidad}</td>
							<td class="px-5 py-4 text-right font-semibold text-emerald-700 whitespace-nowrap">
								{formatearMoneda(item.monto)}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="3" class="px-5 py-8 text-center text-slate-500">Sin pagos en el periodo</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-x-auto hover:shadow-md transition-shadow">
			<h2 class="text-base font-semibold text-slate-800 p-5 pb-0">Últimas cotizaciones</h2>
			<table class="w-full min-w-[400px] text-sm mt-4">
				<thead class="bg-slate-50/80 text-slate-600">
					<tr>
						<th class="px-5 py-3 text-left font-medium">Número</th>
						<th class="px-5 py-3 text-left font-medium">Cliente</th>
						<th class="px-5 py-3 text-left font-medium">Fecha</th>
						<th class="px-5 py-3 text-right font-medium">Total</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each data.ultimasCots as cot}
						<tr class="hover:bg-slate-50/60 transition">
							<td class="px-5 py-4 font-semibold text-indigo-600 whitespace-nowrap">
								<a href="/cotizaciones/{cot.id}" class="hover:underline">{cot.numero}</a>
							</td>
							<td class="px-5 py-4 text-slate-600 whitespace-normal break-words">{cot.cliente.nombre}</td>
							<td class="px-5 py-4 text-slate-600 whitespace-nowrap">{formatearFecha(cot.fecha)}</td>
							<td class="px-5 py-4 text-right text-slate-800 font-semibold whitespace-nowrap">{formatearMoneda(Number(cot.total))}</td>
						</tr>
					{:else}
						<tr>
							<td colspan="4" class="px-5 py-8 text-center text-slate-500">Sin cotizaciones</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 hover:shadow-md transition-shadow">
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-base font-semibold text-slate-800">Resumen de inventario</h2>
				<a href="/inventario" class="text-indigo-600 text-sm font-semibold hover:underline">Ver inventario</a>
			</div>
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
				<div class="min-w-0 text-center border-r border-slate-100 last:border-0">
					<p class="text-xl sm:text-2xl font-bold text-amber-600 break-words">{data.inventario?.stockBajo ?? 0}</p>
					<p class="text-xs text-slate-500 mt-1">Stock bajo</p>
				</div>
				<div class="min-w-0 text-center border-r border-slate-100 last:border-0">
					<p class="text-xl sm:text-2xl font-bold text-rose-600 break-words">{data.inventario?.agotados ?? 0}</p>
					<p class="text-xs text-slate-500 mt-1">Agotados</p>
				</div>
				<div class="min-w-0 text-center border-r border-slate-100 last:border-0">
					<p class="text-base sm:text-lg font-bold text-slate-800 break-words">{formatearMoneda(data.inventario?.valorTotal ?? 0)}</p>
					<p class="text-xs text-slate-500 mt-1">Valor en almacén</p>
				</div>
				<div class="min-w-0 text-center">
					<p class="text-base sm:text-lg font-bold text-slate-800 break-words">{formatearMoneda(data.inventario?.stockComprometido ?? 0)}</p>
					<p class="text-xs text-slate-500 mt-1">Stock comprometido</p>
				</div>
			</div>
			{#if data.inventario?.topReservados?.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-slate-50/80 text-slate-500 text-xs">
							<tr>
								<th class="px-3 py-2 text-left font-medium">Producto</th>
								<th class="px-3 py-2 text-right font-medium">Reservado</th>
								<th class="px-3 py-2 text-right font-medium">Disponible</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each data.inventario.topReservados as p}
								<tr class="hover:bg-slate-50/60 transition">
									<td class="px-3 py-2 text-slate-800 whitespace-normal break-words">{p.nombre}</td>
									<td class="px-3 py-2 text-right text-amber-600 font-semibold">{p.reservado}</td>
									<td class="px-3 py-2 text-right font-semibold">{p.disponible}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-x-auto hover:shadow-md transition-shadow">
			<h2 class="text-base font-semibold text-slate-800 p-5 pb-0">{tituloTopClientes}</h2>
			<table class="w-full min-w-[300px] text-sm mt-4">
				<thead class="bg-slate-50/80 text-slate-600">
					<tr>
						<th class="px-5 py-3 text-left font-medium">Cliente</th>
						<th class="px-5 py-3 text-right font-medium">Saldo pendiente</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each data.topClientes as cliente}
						<tr class="hover:bg-slate-50/60 transition">
							<td class="px-5 py-4 font-semibold text-slate-800 whitespace-normal break-words">{cliente.nombre}</td>
							<td class="px-5 py-4 text-right font-bold text-rose-700 whitespace-nowrap">
								{formatearMoneda(cliente.pendiente)}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="2" class="px-5 py-8 text-center text-slate-500">Sin clientes con saldo pendiente</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
