# Integración MorphCast Emotion AI en GestorPyME

## 1. Qué hace MorphCast

MorphCast Emotion AI HTML5 SDK es un motor JavaScript de análisis facial que funciona en el navegador. Se carga desde `https://ai-sdk.morphcast.com` y, a través de la cámara del usuario, produce eventos con la emoción predominante y las probabilidades de cada emoción detectada (angry, disgust, fear, happy, neutral, sad, surprise).

En GestorPyME lo usamos para una funcionalidad opt-in de **Analítica de Experiencia de Usuario**: el usuario autenticado puede decidir activar el análisis, aceptar el uso de cámara y ver en pantalla el estado actual. Los resultados relevantes se envían a nuestro backend y se almacenan en Supabase.

## 2. Arquitectura implementada

```
Webcam del usuario
       │
       ▼
MorphCast SDK (navegador)
       │
       ▼
ExperienceControl.svelte (UI + consentimiento)
       │
       ▼
Endpoints /api/experience/* (SvelteKit + Clerk)
       │
       ▼
Supabase (PostgreSQL via Prisma)
       │
       ▼
Dashboard /experiencia (svelte-chartjs)
```

Flujo resumido:

1. Usuario autenticado pulsa "Analizar experiencia".
2. Aparece un aviso de privacidad y uso de cámara.
3. Al aceptar, se crea una `ExperienceSession` en Supabase.
4. Se carga el SDK de MorphCast y arranca el análisis de `FACE_EMOTION`.
5. Cada evento relevante se filtra y envía como `ExperienceEvent`.
6. El usuario puede detener el análisis; se cierra la sesión con `endedAt`, `durationSeconds` y `eventsCount`.
7. El dashboard `/experiencia` muestra sesiones, eventos y distribución de emociones.

## 3. Archivos involucrados

| Archivo | Función |
| --- | --- |
| `src/lib/morphcast/morphcastConfig.js` | URL del SDK, módulo, parámetros de reducción de eventos y mapeo de rutas a módulos. |
| `src/lib/components/ExperienceControl.svelte` | Botón flotante, consentimiento, carga del SDK, recepción de eventos y envío al backend. |
| `src/routes/api/experience/sessions/+server.js` | Crea una sesión (`POST`). |
| `src/routes/api/experience/sessions/[id]/+server.js` | Finaliza una sesión (`PATCH`). |
| `src/routes/api/experience/events/+server.js` | Recibe y guarda un evento de emoción (`POST`). |
| `src/routes/experiencia/+page.server.js` | Carga datos agregados para el dashboard. |
| `src/routes/experiencia/+page.svelte` | UI del dashboard con gráficos y tabla. |
| `src/routes/+layout.svelte` | Importa y ubica el control flotante; añade enlace a `/experiencia` en el menú lateral. |
| `prisma/schema.prisma` | Modelos `ExperienceSession` y `ExperienceEvent`. |
| `prisma/migrations/20260818160000_add_experience_tables/migration.sql` | SQL para crear las tablas. |

## 4. Credenciales

MorphCast requiere una `licenseKey` que se configura en el frontend, ya que el SDK se ejecuta en el navegador. No se hardcodea.

- Variable: `PUBLIC_MORPHCAST_LICENSE_KEY` en `.env` y en las variables de entorno de Render.
- Agregada a `.env.example` para documentación.

## 5. Supabase

### Tablas creadas

**`ExperienceSession`**

| Campo | Uso |
| --- | --- |
| `id` | UUID de la sesión. |
| `userId` | Identificador Clerk del usuario. |
| `startedAt` | Inicio de la sesión. |
| `endedAt` | Fin de la sesión (null hasta detener). |
| `route` | Ruta en la que inició la sesión. |
| `module` | Nombre legible del módulo. |
| `durationSeconds` | Duración calculada al finalizar. |
| `eventsCount` | Número de eventos registrados. |

**`ExperienceEvent`**

| Campo | Uso |
| --- | --- |
| `id` | UUID del evento. |
| `sessionId` | Relación con `ExperienceSession`. |
| `userId` | Identificador Clerk del usuario. |
| `route` | Ruta en la que ocurrió el evento. |
| `module` | Módulo en el que ocurrió. |
| `emotion` | Emoción predominante detectada. |
| `score` | Probabilidad/confianza entre 0 y 1. |
| `detectedAt` | Fecha/hora del evento. |

### Relación

Una sesión puede tener muchos eventos (`ExperienceEvent.sessionId → ExperienceSession.id`).

### Cómo se genera un registro

- `POST /api/experience/sessions` crea la sesión.
- `POST /api/experience/events` crea un evento asociado a `sessionId` e incrementa `eventsCount`.
- `PATCH /api/experience/sessions/:id` actualiza `endedAt`, `durationSeconds` y `eventsCount`.

## 6. Reducción de eventos

No se guarda un registro por frame. El control en `ExperienceControl.svelte` aplica:

- `SEND_INTERVAL_MS = 1000`: intervalo mínimo entre envíos.
- `SAME_EMOTION_COOLDOWN_MS = 2000`: no se reenvía la misma emoción inmediatamente.
- `MIN_CONFIDENCE = 0.3`: solo se almacenan emociones con confianza superior.

Además, solo se envía si cambia la emoción predominante o si pasa el tiempo de debounce. Los parámetros están centralizados en `src/lib/morphcast/morphcastConfig.js`.

## 7. Privacidad

- El análisis es **opt-in**: no se activa automáticamente.
- Se muestra un aviso claro de uso de cámara y almacenamiento.
- El usuario puede detenerlo en cualquier momento.
- **No se guarda video, imágenes ni frames**.
- Solo se almacenan: emoción predominante, confianza, ruta/módulo, timestamp, userId y metadatos de sesión.

## 8. Producción

Requisitos para que MorphCast funcione en Render:

- **HTTPS obligatorio** para acceder a la cámara.
- El navegador debe tener permiso de cámara.
- `PUBLIC_MORPHCAST_LICENSE_KEY` configurada en el entorno de producción.
- Dominio de producción autorizado en la cuenta de MorphCast (según su configuración de licencia).
- CSP y scripts externos: el SDK se carga vía `<script>` desde `ai-sdk.morphcast.com`. Revisar el `Content-Security-Policy` si lo tienes configurado; no se modificó en esta integración.
- CORS: no se tocó, porque el SDK se ejecuta en el navegador y los endpoints son del mismo dominio.

## 9. Pasos manuales que debes realizar

1. Crear las tablas en Supabase:
   - Ejecutar el SQL en `prisma/migrations/20260818160000_add_experience_tables/migration.sql` desde el SQL Editor de Supabase, o
   - Usar `npx prisma migrate deploy` con la conexión directa de Supabase (no el PgBouncer de transacciones).
2. Obtener una licencia de MorphCast y agregar `PUBLIC_MORPHCAST_LICENSE_KEY` en el `.env` y en las variables de entorno de Render.
3. Redesplegar en Render para que el build incluya la licencia.
4. Verificar que el dominio de producción esté autorizado en MorphCast.

## 10. Posibles preguntas del profesor

1. **¿Cómo funciona MorphCast?**
   Carga un SDK JS en el navegador que pide acceso a cámara y emite eventos `FACE_EMOTION` con `dominantEmotion` y probabilidades.

2. **¿Dónde ocurre el procesamiento?**
   En el navegador del cliente. No enviamos frames de vídeo a ningún servidor.

3. **¿Qué información almacenas?**
   Solo metadatos: userId, emoción, score, ruta/módulo y timestamps. Ni vídeo ni imágenes.

4. **¿Por qué utilizaste Supabase?**
   Ya era la base de datos del proyecto (PostgreSQL) y se accede mediante Prisma, igual que el resto de la aplicación.

5. **¿Cómo relacionas un evento con el usuario?**
   Cada evento incluye `userId` proveniente de `locals.auth()` de Clerk.

6. **¿Cómo evitas llenar la base de datos?**
   Aplico un intervalo mínimo, un cooldown para la misma emoción y un umbral de confianza.

7. **¿Qué pasa si el usuario rechaza la cámara?**
   MorphCast no inicia y el botón permanece inactivo; el componente muestra un mensaje de error.

8. **¿Dónde guardaste la API key?**
   En `PUBLIC_MORPHCAST_LICENSE_KEY` del `.env`, porque el SDK la requiere en el frontend.

9. **¿Cómo funciona en producción?**
   Se requiere HTTPS, la licencia configurada y el dominio autorizado. El flujo es idéntico al desarrollo.

10. **¿Por qué esta funcionalidad tiene sentido en GestorPyME?**
    Permite entender la experiencia de uso del sistema en tiempo real, identificando módulos que generan confusión o estrés.
