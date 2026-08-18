class Cotizacion {
  final String id;
  final String numero;
  final String clienteId;
  final String? clienteNombre;
  final String estado;
  final DateTime? fecha;
  final double total;

  Cotizacion({
    required this.id,
    required this.numero,
    required this.clienteId,
    this.clienteNombre,
    this.estado = 'BORRADOR',
    this.fecha,
    this.total = 0.0,
  });

  static double _toDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0.0;
  }

  factory Cotizacion.fromJson(Map<String, dynamic> json) => Cotizacion(
        id: json['id'] ?? '',
        numero: json['numero'] ?? '',
        clienteId: json['clienteId'] ?? '',
        clienteNombre: json['cliente']?['nombre'] ?? json['clienteNombre'],
        estado: json['estado'] ?? 'BORRADOR',
        fecha: json['fecha'] != null ? DateTime.tryParse(json['fecha'].toString()) : null,
        total: _toDouble(json['total']),
      );
}
