final _emailRe = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

String? validateName(String value) {
  final v = value.trim();
  if (v.isEmpty) return 'Name is required';
  if (v.length < 2) return 'Name must be at least 2 characters';
  if (v.length > 80) return 'Name must be under 80 characters';
  return null;
}

String? validateEmail(String value) {
  final v = value.trim();
  if (v.isEmpty) return 'Email is required';
  if (!_emailRe.hasMatch(v)) return 'Enter a valid email address';
  return null;
}

String? validatePassword(String value) {
  if (value.isEmpty) return 'Password is required';
  if (value.length < 6) return 'Password must be at least 6 characters';
  if (value.length > 72) return 'Password must be under 72 characters';
  return null;
}

String? validateTaskTitle(String value) {
  final v = value.trim();
  if (v.isEmpty) return 'Title is required';
  if (v.length > 120) return 'Title must be under 120 characters';
  return null;
}

String? validateTaskDescription(String value) {
  if (value.trim().length > 1000) return 'Description must be under 1000 characters';
  return null;
}
