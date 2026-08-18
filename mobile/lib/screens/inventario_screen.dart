import 'package:flutter/material.dart';
import '../services/api_service.dart';

class InventarioScreen extends StatefulWidget {
  const InventarioScreen({super.key});

  @override
  State<InventarioScreen> createState() => _InventarioScreenState();
}

class _InventarioScreenState extends State<InventarioScreen> {
  late Future<List<dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _cargar();
  }

  Future<List<dynamic>> _cargar() async {
    final res = await ApiService.get('/inventario/__data.json');
    if (res.statusCode != 200) throw Exception('Error ${res.statusCode}');
    final data = ApiService.parseDataJson(res.body);
    return (data['inventario'] as List<dynamic>?) ?? [];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Inventario')),
      body: FutureBuilder<List<dynamic>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          final items = snapshot.data ?? [];
          if (items.isEmpty) {
            return const Center(child: Text('No hay productos en inventario'));
          }
          return ListView.builder(
            itemCount: items.length,
            itemBuilder: (context, i) {
              final item = items[i] as Map<String, dynamic>;
              return ListTile(
                title: Text(item['nombre'] ?? ''),
                subtitle: Text('SKU: ${item['sku'] ?? ''}'),
                trailing: Text(
                    'Disp: ${(item['stockDisponible'] as num?)?.toDouble() ?? 0}'),
              );
            },
          );
        },
      ),
    );
  }
}
