-- DropForeignKey
ALTER TABLE "HistorialCot" DROP CONSTRAINT "HistorialCot_cotizacionId_fkey";

-- AddForeignKey
ALTER TABLE "HistorialCot" ADD CONSTRAINT "HistorialCot_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "Pago" DROP CONSTRAINT "Pago_cotizacionId_fkey";

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "LogRecordatorio" DROP CONSTRAINT "LogRecordatorio_cotizacionId_fkey";

-- AddForeignKey
ALTER TABLE "LogRecordatorio" ADD CONSTRAINT "LogRecordatorio_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
