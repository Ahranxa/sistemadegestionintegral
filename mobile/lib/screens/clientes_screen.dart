import 'package:flutter/material.dart';
import '../models/cliente.dart';
import '../services/api_service.dart';

class ClientesScreen extends StatefulWidget {
  const ClientesScreen({super.key});

  @override
  State<ClientesScreen> createState() => _ClientesScreenState();
}

class _ClientesScreenState extends State<ClientesScreen> {
  late Future<List<Cliente>> _future;

  @override
  void initState() {
    super.initState();
    _future = _cargar();
  }

  Future<List<Cliente>> _cargar() async {
    final res = await ApiService.get('/clientes/__data.json');
    if (res.statusCode != 200) throw Exception('Error ${res.statusCode}');
    final data = ApiService.parseDataJson(res.body);
    final lista = (data['clientes'] as List<dynamic>?) ?? [];
    return lista.map((e) => Cliente.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Clientes')),
      body: FutureBuilder<List<Cliente>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          final clientes = snapshot.data ?? [];
          if (clientes.isEmpty) return const Center(child: Text('No hay clientes'));
          return ListView.builder(
            itemCount: clientes.length,
            itemBuilder: (context, i) {
              final c = clientes[i];
              return ListTile(
                title: Text(c.nombre),
                subtitle: Text('${c.empresa ?? ''} - ${c.correo}'),
              );
            },
          );
        },
      ),
    );
  }
}
