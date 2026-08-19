<script>
	import '../app.css';
	import { page } from '$app/stores';
	import { ClerkProvider, SignedIn, SignedOut, UserButton } from 'svelte-clerk';
	import AssistantFab from '$lib/components/AssistantFab.svelte';
	import ExperienceControl from '$lib/components/ExperienceControl.svelte';

	let { children, data } = $props();

	let publishableKey = $derived(data.PUBLIC_CLERK_PUBLISHABLE_KEY);
	let userRole = $derived(data.userRole);
	let isAdmin = $derived(userRole === 'admin');

	const navLinks = $derived([
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/clientes', label: 'Clientes' },
		{ href: '/productos', label: 'Productos' },
		{ href: '/inventario', label: 'Inventario' },
		{ href: '/cotizaciones', label: 'Cotizaciones' },
		{ href: '/cobranza', label: 'Cobranza' },
		{ href: '/experiencia', label: 'Experiencia' },
		...(isAdmin ? [{ href: '/admin/usuarios', label: 'Administración' }] : [])
	]);

	let currentPath = $derived($page.url.pathname);
	let isSignInPage = $derived(currentPath.startsWith('/sign-in'));
	let sidebarOpen = $state(false);

	function closeSidebar() {
		sidebarOpen = false;
	}
</script>

<ClerkProvider publishableKey={publishableKey}>
	{#if isSignInPage}
		{@render children()}
	{:else}
		<SignedIn>
			<div class="flex h-screen bg-slate-50 text-slate-900">
				{#if sidebarOpen}
					<div
						class="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
						onclick={closeSidebar}
						role="presentation"
					></div>
				{/if}

				<aside
					class="bg-slate-900 text-slate-300 flex flex-col z-30 transition-transform duration-300 ease-in-out
					w-64 md:translate-x-0 md:static md:h-screen
					{sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 h-screen"
				>
					<div class="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<svg class="w-8 h-8 flex-shrink-0" viewBox="0 0 100 100" aria-hidden="true">
								<defs>
									<linearGradient id="logoRainbow" x1="0" y1="0" x2="1" y2="0">
										<stop offset="0%" stop-color="#ef4444" />
										<stop offset="20%" stop-color="#f97316" />
										<stop offset="40%" stop-color="#eab308" />
										<stop offset="60%" stop-color="#22c55e" />
										<stop offset="80%" stop-color="#3b82f6" />
										<stop offset="100%" stop-color="#a855f7" />
									</linearGradient>
								</defs>
								<rect x="38" y="18" width="24" height="36" rx="3" fill="url(#logoRainbow)" />
								<path d="M44 54 L44 82 C44 88 56 88 56 82 L56 54 Z" fill="#1e3a8a" />
							</svg>
							<div>
								<h1 class="text-base font-semibold tracking-tight leading-none text-white">PINTA</h1>
								<p class="text-slate-400 text-xs mt-0.5">Gestor PYME</p>
							</div>
						</div>
						<button
							onclick={closeSidebar}
							class="md:hidden text-slate-400 hover:text-white text-2xl"
							aria-label="Cerrar menú"
						>
							×
						</button>
					</div>

					<nav class="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
						{#each navLinks as link}
							<a
								href={link.href}
								onclick={closeSidebar}
								class="block px-4 py-2.5 rounded text-sm font-medium transition-colors border-l-4
								{currentPath.startsWith(link.href)
									? 'bg-slate-800 border-indigo-500 text-white'
									: 'border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white'}"
							>
								{link.label}
							</a>
						{/each}
					</nav>

					<div class="px-5 py-4 border-t border-slate-800">
						{#if userRole}
							<p class="text-slate-400 text-xs font-medium mb-1">{userRole}</p>
						{/if}
						<p class="text-slate-500 text-[10px] uppercase tracking-wider">v1.0</p>
					</div>
				</aside>

				<div class="flex-1 flex flex-col overflow-hidden min-w-0">
					<header class="bg-white border-b border-slate-200 shadow-sm px-4 md:px-6 py-3 flex items-center justify-between">
						<div class="flex items-center gap-3 min-w-0">
							<button
								onclick={() => (sidebarOpen = !sidebarOpen)}
								class="md:hidden text-slate-600 hover:text-slate-900 text-xl"
								aria-label="Abrir menú"
							>
								☰
							</button>
							<h2 class="text-slate-800 font-semibold text-base md:text-lg truncate">
								{navLinks.find((l) => currentPath.startsWith(l.href))?.label ?? 'GestorPyme'}
							</h2>
						</div>
						<div class="flex items-center gap-3 shrink-0">
							<UserButton afterSignOutUrl="/sign-in" />
						</div>
					</header>

					<main class="flex-1 overflow-y-auto p-4 md:p-6">
						{@render children()}
					</main>
					<AssistantFab />
					<ExperienceControl />
				</div>
			</div>
		</SignedIn>

		<SignedOut>
			{@render children()}
		</SignedOut>
	{/if}
</ClerkProvider>
