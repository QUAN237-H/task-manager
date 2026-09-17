import 'dart:convert';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../models/auth_response.dart';
import '../models/task.dart';

String defaultApiBaseUrl() {
  const fromEnv = String.fromEnvironment('API_BASE_URL');
  if (fromEnv.isNotEmpty) return fromEnv;
  // Chrome / desktop → host machine. Android emulator → 10.0.2.2
  if (kIsWeb) return 'http://localhost:8080';
  return 'http://10.0.2.2:8080';
}

/// Docs: same Spring Boot API as the web app (`/api/auth/*`, `/api/tasks`).
class ApiService {
  ApiService({String? baseUrl}) : baseUrl = baseUrl ?? defaultApiBaseUrl();

  final String baseUrl;
  static const _tokenKey = 'jwt_token';
  static const _nameKey = 'user_name';

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<String?> getUserName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_nameKey);
  }

  Future<void> _saveSession(AuthResponse auth) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, auth.token);
    await prefs.setString(_nameKey, auth.name);
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_nameKey);
  }

  Map<String, String> _jsonHeaders({String? token}) => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<AuthResponse> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: _jsonHeaders(),
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (response.statusCode != 200) {
      throw Exception(_extractMessage(response.body, 'Login failed'));
    }
    final auth = AuthResponse.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    await _saveSession(auth);
    return auth;
  }

  Future<AuthResponse> register(String name, String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/register'),
      headers: _jsonHeaders(),
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );
    if (response.statusCode != 201) {
      throw Exception(_extractMessage(response.body, 'Registration failed'));
    }
    final auth = AuthResponse.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    await _saveSession(auth);
    return auth;
  }

  Future<List<Task>> fetchTasks({String? status, String? search}) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final params = <String, String>{};
    if (status != null && status.isNotEmpty) params['status'] = status;
    if (search != null && search.isNotEmpty) params['search'] = search;

    final uri = Uri.parse('$baseUrl/api/tasks').replace(queryParameters: params.isEmpty ? null : params);
    final response = await http.get(uri, headers: _jsonHeaders(token: token));
    if (response.statusCode != 200) {
      throw Exception(_extractMessage(response.body, 'Could not load tasks'));
    }
    final list = jsonDecode(response.body) as List<dynamic>;
    return list.map((e) => Task.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Task> createTask({
    required String title,
    String? description,
    String status = 'TODO',
  }) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await http.post(
      Uri.parse('$baseUrl/api/tasks'),
      headers: _jsonHeaders(token: token),
      body: jsonEncode({
        'title': title,
        'description': description,
        'status': status,
      }),
    );
    if (response.statusCode != 201) {
      throw Exception(_extractMessage(response.body, 'Could not create task'));
    }
    return Task.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<Task> updateTask({
    required int id,
    required String title,
    String? description,
    required String status,
  }) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await http.put(
      Uri.parse('$baseUrl/api/tasks/$id'),
      headers: _jsonHeaders(token: token),
      body: jsonEncode({
        'title': title,
        'description': description,
        'status': status,
      }),
    );
    if (response.statusCode != 200) {
      throw Exception(_extractMessage(response.body, 'Could not update task'));
    }
    return Task.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<void> deleteTask(int id) async {
    final token = await getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await http.delete(
      Uri.parse('$baseUrl/api/tasks/$id'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode != 204) {
      throw Exception(_extractMessage(response.body, 'Could not delete task'));
    }
  }

  String _extractMessage(String body, String fallback) {
    try {
      final map = jsonDecode(body) as Map<String, dynamic>;
      final message = map['message'] as String?;
      if (message != null && message.isNotEmpty) return message;
      final fields = map['fields'];
      if (fields is Map && fields.isNotEmpty) {
        return fields.entries.map((e) => '${e.key}: ${e.value}').join('; ');
      }
      return fallback;
    } catch (_) {
      return fallback;
    }
  }
}
