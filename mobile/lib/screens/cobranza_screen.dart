import 'package:flutter/material.dart';
import '../services/api_service.dart';

class CobranzaScreen extends StatefulWidget {
  const CobranzaScreen({super.key});

  @override
  State<CobranzaScreen> createState() => _CobranzaScreenState();
}

class _CobranzaScreenState extends State<CobranzaScreen> {
  late Future<List<dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _cargar();
  }

  Future<List<dynamic>> _cargar() async {
    final res = await ApiService.get('/cobranza/__data.json');
    if (res.statusCode != 200) throw Exception('Error ${res.statusCode}');
    final data = ApiService.parseDataJson(res.body);
    return (data['pendientes'] as List<dynamic>?) ?? [];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cobranza')),
      body: FutureBuilder<List<dynamic>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          final pendientes = snapshot.data ?? [];
          if (pendientes.isEmpty) return const Center(child: Text('No hay pendientes'));
          return ListView.builder(
            itemCount: pendientes.length,
            itemBuilder: (context, i) {
              final p = pendientes[i] as Map<String, dynamic>;
              final cliente = p['cliente']?['nombre'] ?? 'Desconocido';
              final saldo = (p['saldoPendiente'] as num?)?.toDouble() ?? 0.0;
              return ListTile(
                title: Text('${p['numero'] ?? ''} - $cliente'),
                subtitle: Text('Dias: ${p['diasTranscurridos'] ?? 0}'),
                trailing: Text(
                  '\$${saldo.toStringAsFixed(2)}',
                  style: const TextStyle(color: Colors.red),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
