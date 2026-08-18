import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api.dart';
import 'auth_service.dart';

class ApiService {
  static final http.Client _client = http.Client();

  static Future<http.Response> get(String path, {Map<String, String>? query}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$path').replace(queryParameters: query);
    return _client.get(uri, headers: await _headers);
  }

  static Future<http.Response> post(String path, {Object? body}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    return _client.post(
      uri,
      headers: await _headers,
      body: body != null ? jsonEncode(body) : null,
    );
  }

  static Map<String, dynamic> parseDataJson(String body) {
    final decoded = jsonDecode(body) as Map<String, dynamic>;
    final nodes = decoded['nodes'] as List<dynamic>?;
    if (nodes == null) return decoded;
    for (final n in nodes) {
      if (n is Map<String, dynamic> &&
          n['type'] == 'data' &&
          n['data'] is Map<String, dynamic>) {
        return n['data'] as Map<String, dynamic>;
      }
    }
    return decoded;
  }

  static Future<Map<String, String>> get _headers async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    final token = await AuthService.token;
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }
}
