-- Crear tabla de sesiones de experiencia (MorphCast)
CREATE TABLE "ExperienceSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "route" TEXT,
    "module" TEXT,
    "durationSeconds" INTEGER,
    "eventsCount" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperienceSession_pkey" PRIMARY KEY ("id")
);

-- Crear tabla de eventos de experiencia (MorphCast)
CREATE TABLE "ExperienceEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "route" TEXT,
    "module" TEXT,
    "emotion" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperienceEvent_pkey" PRIMARY KEY ("id")
);

-- Relación entre evento y sesión
ALTER TABLE "ExperienceEvent" ADD CONSTRAINT "ExperienceEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExperienceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
