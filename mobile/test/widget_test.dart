import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('App renders login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const GestorPymeApp());
    expect(find.text('GestorPyme Movil'), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);
  });
}
