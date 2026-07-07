<script>
	import '../app.css';
	import { page } from '$app/stores';
	import { ClerkProvider, SignedIn, SignedOut, UserButton } from 'svelte-clerk';

	let { children, data } = $props();

	let publishableKey = $derived(data.PUBLIC_CLERK_PUBLISHABLE_KEY);
	let userRole = $derived(data.userRole);
	let isAdmin = $derived(userRole === 'admin');

	const navLinks = $derived([
		{ href: '/dashboard', label: 'Dashboard', icon: '📊' },
		{ href: '/clientes', label: 'Clientes', icon: '👥' },
		{ href: '/cotizaciones', label: 'Cotizaciones', icon: '📄' },
		{ href: '/cobranza', label: 'Cobranza', icon: '💰' },
		...(isAdmin ? [{ href: '/admin/usuarios', label: 'Admin', icon: '⚙️' }] : [])
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
			<div class="flex h-screen bg-gray-100">
				<!-- Mobile overlay -->
				{#if sidebarOpen}
					<div
						class="fixed inset-0 bg-black/50 z-20 md:hidden"
						onclick={closeSidebar}
						role="presentation"
					></div>
				{/if}

				<!-- Sidebar -->
				<aside
					class="bg-indigo-900 text-white flex flex-col z-30 transition-transform duration-300 ease-in-out
					w-64 md:translate-x-0 md:static md:h-screen
					{sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 h-screen"
				>
					<div class="px-6 py-5 border-b border-indigo-700 flex items-center justify-between">
						<div>
							<h1 class="text-xl font-bold tracking-tight">GestorPyme</h1>
							<p class="text-indigo-300 text-xs mt-1">Sistema de Gestión</p>
						</div>
						<button
							onclick={closeSidebar}
							class="md:hidden text-indigo-200 hover:text-white text-2xl"
							aria-label="Cerrar menú"
						>
							×
						</button>
					</div>

					<nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
						{#each navLinks as link}
							<a
								href={link.href}
								onclick={closeSidebar}
								class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
								{currentPath.startsWith(link.href)
									? 'bg-indigo-600 text-white'
									: 'text-indigo-200 hover:bg-indigo-800 hover:text-white'}"
							>
								<span>{link.icon}</span>
								{link.label}
							</a>
						{/each}
					</nav>

					<div class="px-6 py-4 border-t border-indigo-700">
						<p class="text-indigo-400 text-xs mb-3">v1.0 MVP</p>
						{#if userRole}
							<p class="text-indigo-300 text-xs uppercase tracking-wider">Rol: {userRole}</p>
						{/if}
					</div>
				</aside>

				<!-- Main content -->
				<div class="flex-1 flex flex-col overflow-hidden min-w-0">
					<!-- Header -->
					<header class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<button
								onclick={() => (sidebarOpen = !sidebarOpen)}
								class="md:hidden text-gray-600 hover:text-gray-900 text-xl"
								aria-label="Abrir menú"
							>
								☰
							</button>
							<h2 class="text-gray-700 font-semibold text-base md:text-lg truncate">
								{navLinks.find((l) => currentPath.startsWith(l.href))?.label ?? 'GestorPyme'}
							</h2>
						</div>
						<div class="flex items-center gap-3">
							<UserButton afterSignOutUrl="/sign-in" />
						</div>
					</header>

					<!-- Page content -->
					<main class="flex-1 overflow-y-auto p-4 md:p-6">
						{@render children()}
					</main>
				</div>
			</div>
		</SignedIn>

		<SignedOut>
			{@render children()}
		</SignedOut>
	{/if}
</ClerkProvider>
