-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('PRODUCTO', 'SERVICIO');

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT,
    "tipo" "TipoProducto" NOT NULL DEFAULT 'PRODUCTO',
    "unidad" TEXT NOT NULL DEFAULT 'pza',
    "precioBase" DECIMAL(12,2) NOT NULL,
    "ivaPct" DECIMAL(5,2) NOT NULL DEFAULT 16,
    "stockActual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stockMinimo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Producto_sku_key" ON "Producto"("sku");

-- AlterTable ConceptoCot
ALTER TABLE "ConceptoCot" ADD COLUMN "productoId" TEXT,
                          ADD COLUMN "unidad" TEXT;

-- AddForeignKey
ALTER TABLE "ConceptoCot" ADD CONSTRAINT "ConceptoCot_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
