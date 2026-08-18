import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/producto.dart';
import '../services/api_service.dart';

class ProductosScreen extends StatefulWidget {
  const ProductosScreen({super.key});

  @override
  State<ProductosScreen> createState() => _ProductosScreenState();
}

class _ProductosScreenState extends State<ProductosScreen> {
  final _controller = TextEditingController();
  List<Producto> _productos = [];
  bool _cargando = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _buscar('');
  }

  Future<void> _buscar(String q) async {
    setState(() => _cargando = true);
    try {
      final res = await ApiService.get('/api/productos/buscar', query: {'q': q});
      if (res.statusCode != 200) throw Exception('Error ${res.statusCode}');
      final lista = jsonDecode(res.body) as List<dynamic>;
      setState(() {
        _productos =
            lista.map((e) => Producto.fromJson(e as Map<String, dynamic>)).toList();
        _error = '';
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _cargando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Productos')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8),
            child: TextField(
              controller: _controller,
              decoration: InputDecoration(
                labelText: 'Buscar',
                suffixIcon: IconButton(
                  icon: const Icon(Icons.search),
                  onPressed: () => _buscar(_controller.text.trim()),
                ),
              ),
              onSubmitted: (v) => _buscar(v.trim()),
            ),
          ),
          if (_cargando) const LinearProgressIndicator(),
          if (_error.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text(_error, style: const TextStyle(color: Colors.red)),
            ),
          Expanded(
            child: ListView.builder(
              itemCount: _productos.length,
              itemBuilder: (context, i) {
                final p = _productos[i];
                return ListTile(
                  title: Text(p.nombre),
                  subtitle: Text(
                      'SKU: ${p.sku}  Precio: \$${p.precioBase.toStringAsFixed(2)}'),
                  trailing: Text('Stock: ${p.stockFisico.toStringAsFixed(0)}'),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
