<script>
	import '../app.css';
	import { page } from '$app/stores';
	import { ClerkProvider, SignedIn, SignedOut, UserButton } from 'svelte-clerk';

	let { children, data } = $props();

	let publishableKey = $derived(data.PUBLIC_CLERK_PUBLISHABLE_KEY);

	const navLinks = [
		{ href: '/dashboard', label: 'Dashboard', icon: '📊' },
		{ href: '/clientes', label: 'Clientes', icon: '👥' },
		{ href: '/cotizaciones', label: 'Cotizaciones', icon: '📄' },
		{ href: '/cobranza', label: 'Cobranza', icon: '💰' }
	];

	let currentPath = $derived($page.url.pathname);
	let isSignInPage = $derived(currentPath.startsWith('/sign-in'));
</script>

<ClerkProvider publishableKey={publishableKey}>
	{#if isSignInPage}
		{@render children()}
	{:else}
		<SignedIn>
			<div class="flex h-screen bg-gray-100">
				<!-- Sidebar -->
				<aside class="w-64 bg-indigo-900 text-white flex flex-col">
					<div class="px-6 py-5 border-b border-indigo-700">
						<h1 class="text-xl font-bold tracking-tight">GestorPyme</h1>
						<p class="text-indigo-300 text-xs mt-1">Sistema de Gestión</p>
					</div>

					<nav class="flex-1 px-4 py-6 space-y-1">
						{#each navLinks as link}
							<a
								href={link.href}
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
					</div>
				</aside>

				<!-- Main content -->
				<div class="flex-1 flex flex-col overflow-hidden">
					<!-- Header -->
					<header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
						<h2 class="text-gray-700 font-semibold text-lg">
							{navLinks.find((l) => currentPath.startsWith(l.href))?.label ?? 'GestorPyme'}
						</h2>
						<div class="flex items-center gap-3">
							<UserButton afterSignOutUrl="/sign-in" />
						</div>
					</header>

					<!-- Page content -->
					<main class="flex-1 overflow-y-auto p-6">
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
