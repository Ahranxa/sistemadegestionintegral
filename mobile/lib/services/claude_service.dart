import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

class ClaudeService {
  static const String _baseUrl = 'https://api.anthropic.com/v1/messages';
  static const String _model = 'claude-3-5-sonnet-20241022';
  static String? _cachedInstructions;

  static String get _apiKey => dotenv.env['ANTHROPIC_API_KEY'] ?? '';

  static Future<String> _loadInstructions() async {
    _cachedInstructions ??= await rootBundle.loadString('assets/claude_prompt.txt');
    return _cachedInstructions!;
  }

  static Future<String> ask(String userMessage, {String? appContext}) async {
    final key = _apiKey;
    if (key.isEmpty) {
      throw Exception('Falta ANTHROPIC_API_KEY en .env');
    }

    final instructions = await _loadInstructions();
    final context = appContext?.isNotEmpty == true ? appContext : 'Sin contexto adicional';
    final system = '$instructions\n\nContexto actual de la app: $context';

    final response = await http.post(
      Uri.parse(_baseUrl),
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: jsonEncode({
        'model': _model,
        'max_tokens': 1024,
        'system': system,
        'messages': [
          {'role': 'user', 'content': userMessage},
        ],
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Error de Claude: ${response.statusCode} ${response.body}');
    }

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    final content = decoded['content'] as List<dynamic>;
    if (content.isEmpty) throw Exception('Respuesta vacía de Claude');
    final first = content.first as Map<String, dynamic>;
    return first['text'] as String? ?? 'Sin respuesta';
  }
}
