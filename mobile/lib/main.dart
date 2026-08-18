import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'screens/auth_gate.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");

  final publishableKey = dotenv.env['CLERK_PUBLISHABLE_KEY'] ?? '';
  if (publishableKey.isEmpty) {
    runApp(const _ErrorApp(message: 'Falta CLERK_PUBLISHABLE_KEY en .env'));
    return;
  }

  runApp(GestorPymeApp(publishableKey: publishableKey));
}

class _ErrorApp extends StatelessWidget {
  final String message;
  const _ErrorApp({required this.message});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.red, fontSize: 16.0),
            ),
          ),
        ),
      ),
    );
  }
}

class GestorPymeApp extends StatelessWidget {
  final String publishableKey;

  const GestorPymeApp({required this.publishableKey, super.key});

  @override
  Widget build(BuildContext context) {
    return ClerkAuth(
      config: ClerkAuthConfig(
        publishableKey: publishableKey,
        sessionTokenPolling: true,
      ),
      child: const MaterialApp(
        title: 'GestorPyme Movil',
        debugShowCheckedModeBanner: false,
        home: AuthGate(),
      ),
    );
  }
}
