import 'package:flutter/material.dart';
import '../models/cotizacion.dart';
import '../services/api_service.dart';

class CotizacionesScreen extends StatefulWidget {
  const CotizacionesScreen({super.key});

  @override
  State<CotizacionesScreen> createState() => _CotizacionesScreenState();
}

class _CotizacionesScreenState extends State<CotizacionesScreen> {
  late Future<List<Cotizacion>> _future;

  @override
  void initState() {
    super.initState();
    _future = _cargar();
  }

  Future<List<Cotizacion>> _cargar() async {
    final res = await ApiService.get('/cotizaciones/__data.json');
    if (res.statusCode != 200) throw Exception('Error ${res.statusCode}');
    final data = ApiService.parseDataJson(res.body);
    final lista = (data['cotizaciones'] as List<dynamic>?) ?? [];
    return lista.map((e) => Cotizacion.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cotizaciones')),
      body: FutureBuilder<List<Cotizacion>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          final cots = snapshot.data ?? [];
          if (cots.isEmpty) return const Center(child: Text('No hay cotizaciones'));
          return ListView.builder(
            itemCount: cots.length,
            itemBuilder: (context, i) {
              final c = cots[i];
              return ListTile(
                title: Text(c.numero),
                subtitle: Text('${c.clienteNombre ?? 'Sin cliente'} - ${c.estado}'),
                trailing: Text('\$${c.total.toStringAsFixed(2)}'),
              );
            },
          );
        },
      ),
    );
  }
}
