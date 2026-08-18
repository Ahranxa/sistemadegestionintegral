class Producto {
  final String id;
  final String sku;
  final String nombre;
  final String? categoria;
  final String tipo;
  final String unidad;
  final double precioBase;
  final double ivaPct;
  final double stockFisico;
  final bool activo;

  Producto({
    required this.id,
    required this.sku,
    required this.nombre,
    this.categoria,
    this.tipo = 'PRODUCTO',
    this.unidad = 'pza',
    this.precioBase = 0.0,
    this.ivaPct = 16.0,
    this.stockFisico = 0.0,
    this.activo = true,
  });

  static double _toDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0.0;
  }

  factory Producto.fromJson(Map<String, dynamic> json) => Producto(
        id: json['id'] ?? '',
        sku: json['sku'] ?? '',
        nombre: json['nombre'] ?? '',
        categoria: json['categoria'],
        tipo: json['tipo'] ?? 'PRODUCTO',
        unidad: json['unidad'] ?? 'pza',
        precioBase: _toDouble(json['precioBase']),
        ivaPct: _toDouble(json['ivaPct']),
        stockFisico: _toDouble(json['stockFisico']),
        activo: json['activo'] ?? true,
      );
}
