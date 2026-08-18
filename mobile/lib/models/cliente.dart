class Cliente {
  final String id;
  final String nombre;
  final String? empresa;
  final String? rfc;
  final String correo;
  final String? telefono;
  final String? direccion;
  final String? notas;
  final bool activo;

  Cliente({
    required this.id,
    required this.nombre,
    this.empresa,
    this.rfc,
    required this.correo,
    this.telefono,
    this.direccion,
    this.notas,
    this.activo = true,
  });

  factory Cliente.fromJson(Map<String, dynamic> json) => Cliente(
        id: json['id'] ?? '',
        nombre: json['nombre'] ?? '',
        empresa: json['empresa'],
        rfc: json['rfc'],
        correo: json['correo'] ?? '',
        telefono: json['telefono'],
        direccion: json['direccion'],
        notas: json['notas'],
        activo: json['activo'] ?? true,
      );
}
