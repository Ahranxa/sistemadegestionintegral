<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();
	let showModal = $state(false);

	const labelsRol = {
		admin: 'Administrador',
		asistente: 'Asistente',
		socio: 'Socio',
		'sin-rol': 'Sin rol'
	};

	function formatearFecha(ts) {
		return ts ? new Date(Number(ts)).toLocaleDateString('es-MX') : '-';
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-800">Administración de usuarios</h1>
		<button
			type="button"
			onclick={() => (showModal = true)}
			class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
		>
			+ Nuevo usuario
		</button>
	</div>

	{#if form?.error}
		<div class="bg-red-100 text-red-800 px-4 py-3 rounded-lg">{form.error}</div>
	{/if}

	{#if form?.success}
		<div class="bg-green-100 text-green-800 px-4 py-3 rounded-lg">Operación exitosa</div>
	{/if}

	{#if data.error}
		<div class="bg-yellow-100 text-yellow-800 px-4 py-3 rounded-lg">{data.error}</div>
	{/if}

	<div class="bg-white rounded-lg shadow overflow-hidden">
		<table class="w-full text-sm">
			<thead class="bg-gray-50 text-gray-600">
				<tr>
					<th class="px-6 py-3 text-left">Usuario</th>
					<th class="px-6 py-3 text-left">Email</th>
					<th class="px-6 py-3 text-left">Rol</th>
					<th class="px-6 py-3 text-left">Creado</th>
					<th class="px-6 py-3 text-right">Acciones</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each data.usuarios as u}
					<tr>
						<td class="px-6 py-4 font-medium text-gray-800">{u.nombre}</td>
						<td class="px-6 py-4 text-gray-600">{u.email}</td>
						<td class="px-6 py-4">
							<form
								method="POST"
								action="?/cambiarRol"
								use:enhance={() => {
									return async ({ result, update }) => {
										if (result.type === 'success') await invalidateAll();
										update();
									};
								}}
								class="inline"
							>
								<input type="hidden" name="userId" value={u.id} />
								<select
									name="rol"
									onchange={(e) => e.target.form.requestSubmit()}
									class="border border-gray-300 rounded-lg px-2 py-1 text-sm"
								>
									{#each data.roles as rol}
										<option value={rol} selected={rol === u.rol}>
											{labelsRol[rol] || rol}
										</option>
									{/each}
								</select>
							</form>
						</td>
						<td class="px-6 py-4 text-gray-600">{formatearFecha(u.creadoEn)}</td>
						<td class="px-6 py-4 text-right">
							<form
								method="POST"
								action="?/eliminar"
								use:enhance={() => {
									return async ({ result, update }) => {
										if (result.type === 'success') await invalidateAll();
										update();
									};
								}}
								class="inline"
								onsubmit={(e) => !confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.') && e.preventDefault()}
							>
								<input type="hidden" name="userId" value={u.id} />
								<button type="submit" class="text-red-600 hover:text-red-800 text-sm font-medium">
									Eliminar
								</button>
							</form>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="5" class="px-6 py-8 text-center text-gray-500">No hay usuarios registrados</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

{#if showModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
			<h2 class="text-xl font-bold text-gray-800 mb-4">Nuevo usuario</h2>
			<form
				method="POST"
				action="?/crear"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							showModal = false;
							await invalidateAll();
						}
						update();
					};
				}}
				class="space-y-4"
			>
				<div>
					<label for="nombre" class="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
					<input id="nombre" name="nombre" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2" />
				</div>
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1">Correo</label>
					<input id="email" name="email" type="email" required class="w-full border border-gray-300 rounded-lg px-3 py-2" />
				</div>
				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
					<input id="password" name="password" type="password" required class="w-full border border-gray-300 rounded-lg px-3 py-2" />
				</div>
				<div>
					<label for="rol" class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
					<select id="rol" name="rol" required class="w-full border border-gray-300 rounded-lg px-3 py-2">
						{#each data.roles as rol}
							<option value={rol}>{labelsRol[rol] || rol}</option>
						{/each}
					</select>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button
						type="button"
						onclick={() => (showModal = false)}
						class="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
					>
						Cancelar
					</button>
					<button type="submit" class="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
						Crear usuario
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
