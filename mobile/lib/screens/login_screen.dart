import 'package:flutter/material.dart';

import '../services/api_service.dart';
import '../validation.dart';
import 'tasks_screen.dart';

/// Colors locked to the web AuthShell / index.css tokens.
class _AuthColors {
  static const background = Color(0xFFF7F4EF);
  static const foreground = Color(0xFF2B2926);
  static const muted = Color(0xFF8A8580);
  static const inkSoft = Color(0xFF6F6A64);
  static const border = Color(0xFFD9D4CC);
  static const ring = Color(0xFFE8E4DE);
  static const primary = Color(0xFFF5D76E);
  static const white = Color(0xFFFFFFFF);
  static const placeholder = Color(0xFFB0AAA3);
  static const error = Color(0xFFE34432);
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  bool _registerMode = false;
  bool _loading = false;
  bool _showPassword = false;
  String? _nameError;
  String? _emailError;
  String? _passwordError;
  String? _formError;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  bool _validate() {
    setState(() {
      _nameError = _registerMode ? validateName(_nameController.text) : null;
      _emailError = validateEmail(_emailController.text);
      _passwordError = validatePassword(_passwordController.text);
      _formError = null;
    });
    return _nameError == null && _emailError == null && _passwordError == null;
  }

  Future<void> _submit() async {
    if (!_validate()) return;
    setState(() {
      _loading = true;
      _formError = null;
    });
    try {
      if (_registerMode) {
        await widget.api.register(
          _nameController.text.trim(),
          _emailController.text.trim(),
          _passwordController.text,
        );
      } else {
        await widget.api.login(
          _emailController.text.trim(),
          _passwordController.text,
        );
      }
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => TasksScreen(api: widget.api)),
      );
    } catch (e) {
      setState(() => _formError = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  InputDecoration _fieldDecoration({
    required String hint,
    Widget? suffix,
    String? errorText,
  }) {
    final errorBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(999),
      borderSide: const BorderSide(color: _AuthColors.error),
    );
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(
        color: _AuthColors.placeholder,
        fontSize: 15,
        fontWeight: FontWeight.w500,
      ),
      errorText: errorText,
      errorStyle: const TextStyle(
        color: _AuthColors.error,
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
      filled: true,
      fillColor: _AuthColors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      suffixIcon: suffix,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(999),
        borderSide: const BorderSide(color: _AuthColors.ring),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(999),
        borderSide: BorderSide(
          color: errorText != null ? _AuthColors.error : _AuthColors.ring,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(999),
        borderSide: BorderSide(
          color: errorText != null
              ? _AuthColors.error
              : _AuthColors.foreground.withValues(alpha: 0.15),
          width: 2,
        ),
      ),
      errorBorder: errorBorder,
      focusedErrorBorder: errorBorder,
    );
  }

  Widget _fieldLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: _AuthColors.muted,
        ),
      ),
    );
  }

  Widget _primaryButton({required String label, required VoidCallback? onPressed, bool loading = false}) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: _AuthColors.primary,
          foregroundColor: _AuthColors.foreground,
          disabledBackgroundColor: _AuthColors.primary.withValues(alpha: 0.55),
          disabledForegroundColor: _AuthColors.foreground.withValues(alpha: 0.55),
          elevation: 0,
          shape: const StadiumBorder(),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2.4, color: _AuthColors.foreground),
              )
            : Text(label),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final title = _registerMode ? 'Create an account' : 'Welcome back';
    final subtitle = _registerMode
        ? 'Sign up and start managing your tasks'
        : 'Sign in and get back to your tasks';

    return Scaffold(
      backgroundColor: _AuthColors.background,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final viewInsets = MediaQuery.viewInsetsOf(context).bottom;
            return SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(24, 28, 24, 28 + viewInsets),
              child: Center(
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: (constraints.maxHeight - 56).clamp(0, double.infinity),
                    maxWidth: 420,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: _AuthColors.border),
                          ),
                          child: const Text(
                            'Task Manager',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF2F2C28),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 36),
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 32,
                          height: 1.1,
                          fontWeight: FontWeight.w600,
                          letterSpacing: -0.8,
                          color: _AuthColors.foreground,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                          color: _AuthColors.muted,
                        ),
                      ),
                      const SizedBox(height: 36),
                      if (_registerMode) ...[
                        _fieldLabel('Name'),
                        TextField(
                          controller: _nameController,
                          textInputAction: TextInputAction.next,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w500,
                            color: _AuthColors.foreground,
                          ),
                          onChanged: (_) {
                            if (_nameError != null) setState(() => _nameError = null);
                          },
                          decoration: _fieldDecoration(
                            hint: 'Your name',
                            errorText: _nameError,
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      _fieldLabel('Email'),
                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        autocorrect: false,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                          color: _AuthColors.foreground,
                        ),
                        onChanged: (_) {
                          if (_emailError != null) setState(() => _emailError = null);
                        },
                        decoration: _fieldDecoration(
                          hint: 'you@example.com',
                          errorText: _emailError,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _fieldLabel('Password'),
                      TextField(
                        controller: _passwordController,
                        obscureText: !_showPassword,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => _loading ? null : _submit(),
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                          color: _AuthColors.foreground,
                        ),
                        onChanged: (_) {
                          if (_passwordError != null) {
                            setState(() => _passwordError = null);
                          }
                        },
                        decoration: _fieldDecoration(
                          hint: '••••••••••••',
                          errorText: _passwordError,
                          suffix: IconButton(
                            onPressed: () =>
                                setState(() => _showPassword = !_showPassword),
                            icon: Icon(
                              _showPassword
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                              size: 18,
                              color: const Color(0xFF9A9590),
                            ),
                          ),
                        ),
                      ),
                      if (_formError != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          _formError!,
                          style: const TextStyle(
                            color: _AuthColors.error,
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                      const SizedBox(height: 20),
                      _primaryButton(
                        label: _loading
                            ? (_registerMode ? 'Creating…' : 'Signing in…')
                            : 'Submit',
                        loading: _loading,
                        onPressed: _loading ? null : _submit,
                      ),
                      const SizedBox(height: 28),
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          const Text(
                            'Have any account? ',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: _AuthColors.inkSoft,
                            ),
                          ),
                          GestureDetector(
                            onTap: _loading
                                ? null
                                : () => setState(() {
                                      _registerMode = !_registerMode;
                                      _nameError = null;
                                      _emailError = null;
                                      _passwordError = null;
                                      _formError = null;
                                    }),
                            child: Text(
                              _registerMode ? 'Sign in' : 'Sign up',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: _AuthColors.foreground,
                                decoration: TextDecoration.underline,
                                decorationColor: _AuthColors.foreground,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
