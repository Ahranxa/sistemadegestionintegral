<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { env } from '$env/dynamic/public';
	import {
		MORPHCAST_SCRIPT_URL,
		MORPHCAST_CONFIG,
		SEND_INTERVAL_MS,
		MIN_CONFIDENCE,
		SAME_EMOTION_COOLDOWN_MS,
		getModuleLabel
	} from '$lib/morphcast/morphcastConfig.js';
	import { Camera, ScanFace, Activity, Check, X, AlertCircle } from 'lucide-svelte';

	let isAnalyzing = $state(false);
	let showConsent = $state(false);
	let currentEmotion = $state('-');
	let currentScore = $state(0);
	let eventCount = $state(0);
	let statusText = $state('');
	let errorText = $state('');
	let sessionId = $state('');
	let licenseKey = $derived(env.PUBLIC_MORPHCAST_LICENSE_KEY);

	let currentRoute = $derived($page.url.pathname);
	let stopFn = null;
	let cameraRef = null;
	let listener = null;
	let startTime = 0;
	let lastSentEmotion = '';
	let lastSentAt = 0;
	let scriptPromise = null;

	function loadScript() {
		if (scriptPromise) return scriptPromise;
		scriptPromise = new Promise((resolve, reject) => {
			if (browser && typeof window !== 'undefined' && window.CY) return resolve();
			const script = document.createElement('script');
			script.src = MORPHCAST_SCRIPT_URL;
			script.async = true;
			script.onload = resolve;
			script.onerror = () => reject(new Error('No se pudo cargar MorphCast'));
			document.body.appendChild(script);
		});
		return scriptPromise;
	}

	async function startSession() {
		statusText = 'Iniciando sesión...';
		const res = await fetch('/api/experience/sessions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				route: currentRoute,
				module: getModuleLabel(currentRoute)
			})
		});
		if (!res.ok) throw new Error('No se pudo crear la sesión');
		const data = await res.json();
		sessionId = data.id;
	}

	function handleEvent(evt) {
		if (!isAnalyzing || !sessionId) return;
		const detail = evt?.detail;
		if (!detail?.output) return;
		const { dominantEmotion, emotion } = detail.output;
		if (!dominantEmotion || !emotion) return;
		const score = Number(emotion[dominantEmotion]) || 0;

		currentEmotion = dominantEmotion;
		currentScore = score;

		if (score < MIN_CONFIDENCE) return;

		const now = Date.now();
		if (now - lastSentAt < SAME_EMOTION_COOLDOWN_MS && dominantEmotion === lastSentEmotion) {
			return;
		}

		if (now - lastSentAt < SEND_INTERVAL_MS) {
			if (dominantEmotion === lastSentEmotion) return;
		}

		sendEvent(dominantEmotion, score, now);
	}

	async function sendEvent(emotion, score, now) {
		try {
			const res = await fetch('/api/experience/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId,
					emotion,
					score,
					route: currentRoute,
					module: getModuleLabel(currentRoute),
					detectedAt: new Date().toISOString()
				})
			});
			if (res.ok) {
				lastSentEmotion = emotion;
				lastSentAt = now;
				eventCount++;
				statusText = 'Analizando';
			}
		} catch (e) {
			console.error('Error enviando evento MorphCast', e);
		}
	}

	async function startAnalysis() {
		if (!licenseKey) {
			errorText = 'Falta configurar PUBLIC_MORPHCAST_LICENSE_KEY';
			return;
		}
		try {
			await startSession();
			await loadScript();
			const moduleName = window.CY.modules().FACE_EMOTION.name;
			cameraRef = window.CY.getUserMediaCameraFactory().createCamera();
			const { start, stop } = await window.CY
				.loader()
				.licenseKey(licenseKey)
				.source(cameraRef)
				.addModule(moduleName, MORPHCAST_CONFIG)
				.load();
			stopFn = stop;
			isAnalyzing = true;
			showConsent = false;
			startTime = Date.now();
			listener = (e) => handleEvent(e);
			window.addEventListener(window.CY.modules().FACE_EMOTION.eventName, listener);
			start();
			statusText = 'Analizando';
		} catch (e) {
			errorText = e.message || 'Error al iniciar MorphCast';
			statusText = '';
			isAnalyzing = false;
		}
	}

	async function stopAnalysis() {
		isAnalyzing = false;
		statusText = 'Finalizando...';
		if (listener && window.CY) {
			window.removeEventListener(window.CY.modules().FACE_EMOTION.eventName, listener);
			listener = null;
		}
		if (stopFn) {
			stopFn();
			stopFn = null;
		}
		if (cameraRef) {
			cameraRef.stop();
			cameraRef = null;
		}
		if (sessionId) {
			try {
				const duration = Math.max(0, Math.round((Date.now() - startTime) / 1000));
				await fetch(`/api/experience/sessions/${sessionId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ eventsCount, durationSeconds: duration })
				});
			} catch (e) {
				console.error('Error finalizando sesión', e);
			}
		}
		currentEmotion = '-';
		currentScore = 0;
		eventCount = 0;
		sessionId = '';
		statusText = '';
		errorText = '';
	}

	onMount(() => stopAnalysis);
</script>

{#if browser}
	<div class="fixed bottom-4 left-4 md:left-72 z-30 flex flex-col gap-2">
		{#if showConsent}
			<div class="bg-white border border-slate-200/80 rounded-2xl shadow-xl p-4 w-72">
				<div class="flex items-center gap-2 mb-2 text-indigo-600">
					<ScanFace class="w-5 h-5" />
					<h3 class="text-sm font-semibold">Análisis de experiencia</h3>
				</div>
				<p class="text-sm text-slate-600 mb-4">
					Se utilizará la cámara para analizar expresiones mediante MorphCast. No guardamos video ni imágenes.
				</p>
				<div class="flex gap-2">
					<button
						class="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:from-indigo-700 hover:to-violet-700 shadow-sm hover:shadow transition flex items-center justify-center gap-1.5"
						onclick={startAnalysis}
					>
						<Check class="w-4 h-4" />
						Aceptar
					</button>
					<button
						class="flex-1 bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-slate-200 transition flex items-center justify-center gap-1.5"
						onclick={() => (showConsent = false)}
					>
						<X class="w-4 h-4" />
						Cancelar
					</button>
				</div>
			</div>
		{:else if isAnalyzing}
			<div class="bg-indigo-50 border border-indigo-200 rounded-2xl shadow-xl p-4 w-72">
				<div class="flex items-center gap-2 mb-3">
					<div class="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
						<Activity class="w-4 h-4 text-emerald-600 animate-pulse" />
					</div>
					<span class="text-xs font-bold text-indigo-700 uppercase tracking-wide">{statusText}</span>
				</div>
				<p class="text-sm text-slate-800">
					Emoción: <span class="font-bold text-indigo-700">{currentEmotion}</span>
				</p>
				<p class="text-sm text-slate-600 mt-0.5">
					Confianza: <span class="font-bold">{(currentScore * 100).toFixed(0)}%</span>
				</p>
				<p class="text-xs text-slate-500 mt-1.5">Eventos: {eventCount}</p>
				<button
					class="mt-4 w-full bg-rose-100 text-rose-700 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-rose-200 transition flex items-center justify-center gap-1.5"
					onclick={stopAnalysis}
				>
					<X class="w-4 h-4" />
					Detener análisis
				</button>
			</div>
		{:else}
			<button
				class="bg-white border border-slate-200/80 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
				onclick={() => (showConsent = true)}
				disabled={!licenseKey}
			>
				<Camera class="w-4 h-4 text-indigo-600" />
				<span>{licenseKey ? 'Analizar experiencia' : 'MorphCast no configurado'}</span>
			</button>
		{/if}
		{#if errorText}
			<div class="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 shadow-sm flex items-center gap-1.5">
				<AlertCircle class="w-3.5 h-3.5 flex-shrink-0" />
				{errorText}
			</div>
		{/if}
	</div>
{/if}
