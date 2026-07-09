-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION', 'STOCK_INICIAL');

-- CreateEnum
CREATE TYPE "EstatusReserva" AS ENUM ('ACTIVA', 'LIBERADA', 'CONSUMIDA');

-- AlterTable Producto: rename stockActual -> stockFisico (non-destructive: add new, copy, drop old)
ALTER TABLE "Producto" ADD COLUMN "stockFisico" DECIMAL(10,2) NOT NULL DEFAULT 0;
UPDATE "Producto" SET "stockFisico" = "stockActual";
ALTER TABLE "Producto" DROP COLUMN IF EXISTS "stockActual";

-- CreateTable ReservaInventario
CREATE TABLE "ReservaInventario" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cotizacionId" TEXT NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "fechaReserva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "estatus" "EstatusReserva" NOT NULL DEFAULT 'ACTIVA',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservaInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable MovimientoInventario
CREATE TABLE "MovimientoInventario" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "tipoMovimiento" "TipoMovimiento" NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "stockFisicoAnterior" DECIMAL(10,2) NOT NULL,
    "stockFisicoNuevo" DECIMAL(10,2) NOT NULL,
    "referencia" TEXT,
    "usuarioId" TEXT,
    "usuarioNombre" TEXT,
    "observaciones" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReservaInventario" ADD CONSTRAINT "ReservaInventario_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ReservaInventario" ADD CONSTRAINT "ReservaInventario_cotizacionId_fkey"
    FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
