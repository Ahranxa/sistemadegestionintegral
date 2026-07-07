export function templateCotizacionEnviada({ cliente, cotizacion, conceptos }) {
	const formatMXN = (n) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

	const filasConceptos = conceptos
		.map(
			(c) => `
			<tr>
				<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${c.descripcion}</td>
				<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${Number(c.cantidad)}</td>
				<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMXN(Number(c.precioUnitario))}</td>
				<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMXN(Number(c.subtotal))}</td>
			</tr>
		`
		)
		.join('');

	return `<!DOCTYPE html>
<html lang="es">
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;">
	<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
		<div style="background:#4F46E5;padding:24px 32px;">
			<h1 style="color:#ffffff;margin:0;font-size:22px;">Cotización ${cotizacion.numero}</h1>
		</div>
		<div style="padding:32px;">
			<p style="color:#374151;font-size:15px;">Estimado/a <strong>${cliente.nombre}</strong>,</p>
			<p style="color:#374151;font-size:15px;">Le enviamos la cotización <strong>${cotizacion.numero}</strong> con el siguiente desglose de servicios:</p>
			<table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
				<thead>
					<tr style="background:#f3f4f6;">
						<th style="padding:10px 12px;text-align:left;color:#6b7280;">Descripción</th>
						<th style="padding:10px 12px;text-align:center;color:#6b7280;">Cant.</th>
						<th style="padding:10px 12px;text-align:right;color:#6b7280;">Precio Unit.</th>
						<th style="padding:10px 12px;text-align:right;color:#6b7280;">Subtotal</th>
					</tr>
				</thead>
				<tbody>${filasConceptos}</tbody>
			</table>
			<div style="text-align:right;margin-top:16px;padding:16px;background:#eef2ff;border-radius:6px;">
				<p style="margin:4px 0;color:#6b7280;font-size:13px;">Subtotal: ${formatMXN(Number(cotizacion.subtotal))}</p>
				<p style="margin:4px 0;color:#6b7280;font-size:13px;">IVA (16%): ${formatMXN(Number(cotizacion.iva))}</p>
				<p style="margin:0;color:#4F46E5;font-size:20px;font-weight:bold;">Total: ${formatMXN(Number(cotizacion.total))}</p>
			</div>
			${cotizacion.vencimiento ? `<p style="color:#6b7280;font-size:13px;margin-top:16px;">Esta cotización tiene vigencia hasta el <strong>${new Date(cotizacion.vencimiento).toLocaleDateString('es-MX')}</strong>.</p>` : ''}
			${cotizacion.notas ? `<div style="background:#f9fafb;border-left:3px solid #4F46E5;padding:12px 16px;margin-top:16px;"><p style="margin:0;font-size:13px;color:#374151;">${cotizacion.notas}</p></div>` : ''}
		</div>
		<div style="background:#f3f4f6;padding:20px 32px;font-size:12px;color:#9ca3af;text-align:center;">
			<p style="margin:0;">Para cualquier duda, contáctenos al correo o teléfono del despacho.</p>
		</div>
	</div>
</body>
</html>`;
}

export function templateRecordatorioPago({ cliente, cotizacion, saldoPendiente }) {
	const formatMXN = (n) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

	return `<!DOCTYPE html>
<html lang="es">
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;">
	<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
		<div style="background:#1F2937;padding:24px 32px;">
			<h1 style="color:#ffffff;margin:0;font-size:20px;">Recordatorio de pago</h1>
		</div>
		<div style="padding:32px;">
			<p style="color:#374151;">Estimado/a <strong>${cliente.nombre}</strong>,</p>
			<p style="color:#374151;">Le recordamos que tiene un saldo pendiente correspondiente a la cotización <strong>${cotizacion.numero}</strong>.</p>
			<div style="text-align:center;padding:24px;background:#fef3c7;border-radius:8px;margin:20px 0;">
				<p style="margin:0;color:#92400e;font-size:13px;">Saldo pendiente</p>
				<p style="margin:8px 0 0;color:#92400e;font-size:28px;font-weight:bold;">${formatMXN(saldoPendiente)}</p>
			</div>
			<p style="color:#374151;font-size:14px;">Para cualquier aclaración, no dude en contactarnos. Agradecemos su preferencia.</p>
		</div>
	</div>
</body>
</html>`;
}
