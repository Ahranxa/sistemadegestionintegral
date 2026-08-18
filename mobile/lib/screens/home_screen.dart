import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../widgets/claude_assistant_fab.dart';
import 'clientes_screen.dart';
import 'cobranza_screen.dart';
import 'cotizaciones_screen.dart';
import 'inventario_screen.dart';
import 'login_screen.dart';
import 'productos_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final modules = [
      _Module('Clientes', Icons.people, const ClientesScreen()),
      _Module('Productos', Icons.inventory, const ProductosScreen()),
      _Module('Cotizaciones', Icons.request_quote, const CotizacionesScreen()),
      _Module('Cobranza', Icons.account_balance_wallet, const CobranzaScreen()),
      _Module('Inventario', Icons.warehouse, const InventarioScreen()),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('GestorPyme'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await AuthService.clear();
              if (context.mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              }
            },
          ),
        ],
      ),
      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: modules.length,
        itemBuilder: (context, index) {
          final m = modules[index];
          return Card(
            child: InkWell(
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => m.screen),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(m.icon,
                      size: 48,
                      color: Theme.of(context).colorScheme.primary),
                  const SizedBox(height: 8),
                  Text(m.label, textAlign: TextAlign.center),
                ],
              ),
            ),
          );
        },
      ),
      floatingActionButton: const ClaudeAssistantFab(
        contextData: 'Pantalla de inicio. Módulos disponibles: Clientes, Productos, Cotizaciones, Cobranza e Inventario.',
      ),
    );
  }
}

class _Module {
  final String label;
  final IconData icon;
  final Widget screen;

  _Module(this.label, this.icon, this.screen);
}
