<script>
	import { SignIn } from 'svelte-clerk';
	import { BarChart3 } from 'lucide-svelte';
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-slate-200/80 p-8">
			<div class="flex flex-col items-center mb-6">
				<div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-4">
					<BarChart3 class="w-7 h-7" />
				</div>
				<h1 class="text-2xl font-bold text-slate-900">GestorPyme</h1>
				<p class="text-sm text-slate-500 mt-1">Sistema Integral de Gestión para tu despacho</p>
			</div>
			<SignIn />
		</div>
		<p class="text-center text-xs text-slate-400 mt-6">PINTA · Gestor PYME</p>
	</div>
</div>
