# Reporte Técnico MorphCast en GestorPyME

## API elegida

**MorphCast Emotion AI HTML5 SDK (versión 1.17)**.

Se eligió por ser una API oficial, basada en el navegador, con un snippet claro y una forma sencilla de obtener emociones (`CY.modules().FACE_EMOTION`). No requiere instalar un paquete npm; se carga vía CDN, lo que reduce el impacto en el bundle de producción.

## Valor aportado a GestorPyME

Añade una capa de **analítica de experiencia de usuario** sin alterar el flujo de trabajo existente. Permite:

- Detectar posibles dificultades mientras un usuario interactúa con los módulos.
- Registrar datos agregados para analizar qué partes del sistema generan más eventos emocionales.
- Demostrar un pipeline real: webcam → SDK → backend → Supabase → dashboard.

## Problemas encontrados y soluciones

### 1. Aplicar la migración a través de PgBouncer fallaba

**Problema:** `npx prisma migrate deploy` y `npx prisma db push` se quedaban colgados con la URL de conexión de Supabase en modo transacción (`pooler` puerto 6543).

**Solución:** Se generó el SQL correspondiente en `prisma/migrations/20260818160000_add_experience_tables/migration.sql`. El despliegue final de las tablas debe hacerse en Supabase con la conexión directa (puerto 5432) o ejecutando el SQL en el SQL Editor.

### 2. El build inicial fallaba porque el engine de Prisma quedó bloqueado

**Problema:** Otros procesos de Node mantenían bloqueado `query_engine-windows.dll.node`, impidiendo `prisma generate`.

**Solución:** Se terminaron los procesos `node.exe` y se regeneró el cliente de Prisma para que reconociera los nuevos modelos.

### 3. No se debe guardar un evento por cada frame

**Problema:** MorphCast puede emitir eventos hasta 30 veces por segundo.

**Solución:** Se centralizó en `morphcastConfig.js` una estrategia de throttling: intervalo mínimo, cooldown para la misma emoción y umbral de confianza. Esto evita sobrecargar Supabase y conserva datos útiles.

## Qué haría diferente en una siguiente versión

- Extraer `ExperienceControl` en un store global para compartir estado entre componentes sin elevarlo al `+layout`.
- Suscribir también a `FACE_ATTENTION` o `FACE_AROUSAL_VALENCE` si se quiere medir atención además de emoción.
- Añadir RLS en Supabase específico para que cada usuario vea solo sus propias sesiones/eventos, reforzando la privacidad.
