import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'screens/login_screen.dart';
import 'screens/tasks_screen.dart';
import 'services/api_service.dart';

void main() {
  runApp(const TaskManagerApp());
}

class TaskManagerApp extends StatelessWidget {
  const TaskManagerApp({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ApiService();
    final textTheme = GoogleFonts.plusJakartaSansTextTheme();
    return MaterialApp(
      title: 'Task Manager',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: const ColorScheme.light(
          primary: Color(0xFFF5D76E),
          onPrimary: Color(0xFF2B2926),
          secondary: Color(0xFFEFEAE3),
          onSecondary: Color(0xFF2B2926),
          surface: Color(0xFFF7F4EF),
          onSurface: Color(0xFF2B2926),
          error: Color(0xFFE34432),
        ),
        scaffoldBackgroundColor: const Color(0xFFF7F4EF),
        textTheme: textTheme.apply(
          bodyColor: const Color(0xFF2B2926),
          displayColor: const Color(0xFF2B2926),
        ),
        fontFamily: GoogleFonts.plusJakartaSans().fontFamily,
      ),
      home: FutureBuilder<String?>(
        future: api.getToken(),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          if (snapshot.data != null) {
            return TasksScreen(api: api);
          }
          return LoginScreen(api: api);
        },
      ),
    );
  }
}
