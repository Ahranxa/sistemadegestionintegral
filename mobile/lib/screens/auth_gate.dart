import 'dart:async';

import 'package:clerk_auth/clerk_auth.dart' as clerk;
import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'home_screen.dart';
import 'login_screen.dart';

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  StreamSubscription<clerk.SessionToken>? _tokenSub;

  @override
  void initState() {
    super.initState();
    final auth = ClerkAuth.of(context, listen: false);
    _tokenSub = auth.sessionTokenStream.listen((token) async {
      await AuthService.setToken(token.jwt);
    });
  }

  @override
  void dispose() {
    _tokenSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ClerkAuth.of(context);

    if (auth.isNotAvailable) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (auth.isSignedIn) {
      return const HomeScreen();
    }

    return const LoginScreen();
  }
}
