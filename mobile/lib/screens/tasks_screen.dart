import 'package:flutter/material.dart';

import '../models/task.dart';
import '../services/api_service.dart';
import '../validation.dart';
import 'login_screen.dart';

class _DashColors {
  static const background = Color(0xFFF7F4EF);
  static const foreground = Color(0xFF2B2926);
  static const muted = Color(0xFF8A8580);
  static const card = Color(0xFFFFFFFF);
  static const secondary = Color(0xFFEFEAE3);
  static const primary = Color(0xFFF5D76E);
  static const border = Color(0xFFE4DDD4);
  static const sidebar = Color(0xFFF3EFE8);
  static const doneBg = Color(0xFFE8F3EA);
  static const doneFg = Color(0xFF3D6B52);
  static const progressBg = Color(0xFFF5EBE3);
  static const progressFg = Color(0xFF8A5A3D);
  static const todoBg = Color(0xFFFFF6D6);
  static const todoFg = Color(0xFF6B5A2A);
  static const error = Color(0xFFE34432);
}

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  final _searchController = TextEditingController();
  String _statusFilter = 'TODO';
  List<Task> _tasks = [];
  bool _loading = true;
  bool _hasLoadedOnce = false;
  String? _error;
  String _userName = '';

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    _userName = await widget.api.getUserName() ?? '';
    await _loadTasks();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadTasks() async {
    setState(() {
      if (!_hasLoadedOnce) _loading = true;
      _error = null;
    });
    try {
      final tasks = await widget.api.fetchTasks(
        search: _searchController.text.trim().isEmpty
            ? null
            : _searchController.text.trim(),
      );
      setState(() {
        _tasks = tasks;
        _hasLoadedOnce = true;
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Task> get _filtered {
    final q = _searchController.text.trim().toLowerCase();
    return _tasks.where((t) {
      if (t.status != _statusFilter) return false;
      if (q.isEmpty) return true;
      final desc = t.description?.toLowerCase() ?? '';
      return t.title.toLowerCase().contains(q) || desc.contains(q);
    }).toList();
  }

  int get _todoCount => _tasks.where((t) => t.status == 'TODO').length;
  int get _progressCount => _tasks.where((t) => t.status == 'IN_PROGRESS').length;
  int get _doneCount => _tasks.where((t) => t.status == 'DONE').length;

  Future<void> _openForm({Task? task}) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      backgroundColor: _DashColors.sidebar,
      barrierColor: const Color(0x662B2926),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _TaskFormSheet(
        api: widget.api,
        task: task,
        initialStatus: task?.status ?? _statusFilter,
      ),
    );
    if (saved == true) await _loadTasks();
  }

  Future<void> _deleteTask(Task task) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete task?'),
        content: Text('“${task.title}” will be permanently removed.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: _DashColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await widget.api.deleteTask(task.id);
      await _loadTasks();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    }
  }

  Future<void> _logout() async {
    await widget.api.logout();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => LoginScreen(api: widget.api)),
    );
  }

  Future<void> _confirmLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign out?'),
        content: const Text('You’ll need to sign in again to manage your tasks.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
    if (confirmed == true) await _logout();
  }

  String _label(String status) {
    switch (status) {
      case 'IN_PROGRESS':
        return 'In progress';
      case 'DONE':
        return 'Done';
      default:
        return 'To do';
    }
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
    if (parts.isEmpty) return '?';
    return parts.take(2).map((p) => p[0].toUpperCase()).join();
  }

  Color _badgeBg(String status) {
    switch (status) {
      case 'IN_PROGRESS':
        return _DashColors.foreground;
      case 'DONE':
        return _DashColors.primary;
      default:
        return const Color(0xFFE5E5E5);
    }
  }

  Color _badgeFg(String status) {
    switch (status) {
      case 'IN_PROGRESS':
        return _DashColors.card;
      case 'DONE':
        return _DashColors.foreground;
      default:
        return _DashColors.foreground;
    }
  }

  @override
  Widget build(BuildContext context) {
    final firstName = _userName.trim().isEmpty ? 'there' : _userName.trim().split(' ').first;

    return Scaffold(
      backgroundColor: _DashColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Good ${_greeting()}, $firstName',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.6,
                        color: _DashColors.foreground,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: _confirmLogout,
                    icon: const Icon(Icons.logout, color: _DashColors.foreground),
                  ),
                ],
              ),
            ),
            Expanded(
              child: _loading && !_hasLoadedOnce
                  ? const Center(child: CircularProgressIndicator())
                  : RefreshIndicator(
                      onRefresh: _loadTasks,
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                        children: [
                          _statsRow(),
                          const SizedBox(height: 14),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Expanded(
                                child: SizedBox(
                                  height: 40,
                                  child: Material(
                                    color: _DashColors.secondary.withValues(alpha: 0.8),
                                    borderRadius: BorderRadius.circular(12),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 12),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          value: _statusFilter,
                                          isExpanded: true,
                                          icon: const Icon(Icons.expand_more, size: 18),
                                          style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w500,
                                            color: _DashColors.foreground,
                                          ),
                                          items: const [
                                            DropdownMenuItem(value: 'TODO', child: Text('To do')),
                                            DropdownMenuItem(
                                              value: 'IN_PROGRESS',
                                              child: Text('In progress'),
                                            ),
                                            DropdownMenuItem(value: 'DONE', child: Text('Done')),
                                          ],
                                          onChanged: (v) {
                                            if (v != null) setState(() => _statusFilter = v);
                                          },
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              SizedBox(
                                height: 40,
                                child: FilledButton.icon(
                                  onPressed: () => _openForm(),
                                  style: FilledButton.styleFrom(
                                    backgroundColor: _DashColors.primary,
                                    foregroundColor: _DashColors.foreground,
                                    elevation: 0,
                                    padding: const EdgeInsets.symmetric(horizontal: 14),
                                    minimumSize: const Size(0, 40),
                                    maximumSize: const Size(double.infinity, 40),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  icon: const Icon(Icons.add, size: 16),
                                  label: const Text(
                                    'New task',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          SizedBox(
                            height: 40,
                            child: TextField(
                              controller: _searchController,
                              onChanged: (_) => setState(() {}),
                              onSubmitted: (_) => _loadTasks(),
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: _DashColors.foreground,
                              ),
                              decoration: InputDecoration(
                                hintText: 'Search…',
                                hintStyle: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: _DashColors.muted,
                                ),
                                prefixIcon: const Icon(
                                  Icons.search,
                                  size: 18,
                                  color: _DashColors.muted,
                                ),
                                filled: true,
                                fillColor: _DashColors.secondary.withValues(alpha: 0.8),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                              ),
                            ),
                          ),
                          if (_error != null) ...[
                            const SizedBox(height: 12),
                            Text(_error!, style: const TextStyle(color: _DashColors.error)),
                          ],
                          const SizedBox(height: 14),
                          if (_filtered.isEmpty)
                            Container(
                              padding: const EdgeInsets.symmetric(vertical: 40),
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: _DashColors.border),
                              ),
                              child: Text(
                                'No tasks in ${_label(_statusFilter).toLowerCase()}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: _DashColors.muted,
                                ),
                              ),
                            )
                          else
                            ..._filtered.map(_taskCard),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statsRow() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _statCard(
                label: 'Done',
                value: '$_doneCount',
                hint: '${_tasks.length} total tasks',
                bg: _DashColors.doneBg,
                fg: _DashColors.doneFg,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _statCard(
                label: 'In progress',
                value: '$_progressCount',
                hint: 'Active now',
                bg: _DashColors.progressBg,
                fg: _DashColors.progressFg,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        _statCard(
          label: 'To do',
          value: '$_todoCount',
          hint: '${_tasks.length} total · queued',
          bg: _DashColors.todoBg,
          fg: _DashColors.todoFg,
        ),
      ],
    );
  }

  Widget _statCard({
    required String label,
    required String value,
    required String hint,
    required Color bg,
    required Color fg,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: fg)),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.6,
              color: _DashColors.foreground,
            ),
          ),
          const SizedBox(height: 2),
          Text(hint, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: fg)),
        ],
      ),
    );
  }

  Widget _taskCard(Task task) {
    final name = _userName.isEmpty ? 'You' : _userName;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _DashColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _DashColors.border.withValues(alpha: 0.8)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _badgeBg(task.status),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  _label(task.status),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: _badgeFg(task.status),
                  ),
                ),
              ),
              const Spacer(),
              IconButton(
                visualDensity: VisualDensity.compact,
                onPressed: () => _openForm(task: task),
                icon: const Icon(Icons.edit_outlined, size: 18),
              ),
              IconButton(
                visualDensity: VisualDensity.compact,
                onPressed: () => _deleteTask(task),
                icon: const Icon(Icons.delete_outline, size: 18, color: _DashColors.error),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            task.title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.2,
              color: _DashColors.foreground,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            (task.description == null || task.description!.isEmpty)
                ? 'No description added yet.'
                : task.description!,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: _DashColors.muted,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.list_alt, size: 14, color: _DashColors.muted),
              const SizedBox(width: 4),
              Text(
                task.status == 'DONE' ? '1/1' : '0/1',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: _DashColors.muted,
                ),
              ),
              const Spacer(),
              CircleAvatar(
                radius: 11,
                backgroundColor: _DashColors.foreground,
                child: Text(
                  _initials(name),
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  name,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: _DashColors.foreground,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }
}

class _TaskFormSheet extends StatefulWidget {
  const _TaskFormSheet({
    required this.api,
    this.task,
    required this.initialStatus,
  });

  final ApiService api;
  final Task? task;
  final String initialStatus;

  @override
  State<_TaskFormSheet> createState() => _TaskFormSheetState();
}

class _TaskFormSheetState extends State<_TaskFormSheet> {
  late final TextEditingController _title;
  late final TextEditingController _description;
  late String _status;
  String? _titleError;
  String? _descriptionError;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _title = TextEditingController(text: widget.task?.title ?? '');
    _description = TextEditingController(text: widget.task?.description ?? '');
    _status = widget.task?.status ?? widget.initialStatus;
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final titleErr = validateTaskTitle(_title.text);
    final descErr = validateTaskDescription(_description.text);
    setState(() {
      _titleError = titleErr;
      _descriptionError = descErr;
    });
    if (titleErr != null || descErr != null) return;

    setState(() => _saving = true);
    try {
      final desc = _description.text.trim();
      if (widget.task != null) {
        await widget.api.updateTask(
          id: widget.task!.id,
          title: _title.text.trim(),
          description: desc.isEmpty ? null : desc,
          status: _status,
        );
      } else {
        await widget.api.createTask(
          title: _title.text.trim(),
          description: desc.isEmpty ? null : desc,
          status: _status,
        );
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    final editing = widget.task != null;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + bottom),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    editing ? 'Edit task' : 'Create a new task',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.3,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context, false),
                  icon: const Icon(Icons.close, size: 18),
                ),
              ],
            ),
            Text(
              editing
                  ? 'Update the details below, then save your changes.'
                  : 'Add a title, pick a status, and describe the work.',
              style: const TextStyle(fontSize: 12, color: _DashColors.muted),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _title,
              decoration: InputDecoration(
                labelText: 'Title',
                errorText: _titleError,
                filled: true,
                fillColor: _DashColors.card,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (_) {
                if (_titleError != null) setState(() => _titleError = null);
              },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: InputDecoration(
                labelText: 'Status',
                filled: true,
                fillColor: _DashColors.card,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              items: const [
                DropdownMenuItem(value: 'TODO', child: Text('To do')),
                DropdownMenuItem(value: 'IN_PROGRESS', child: Text('In progress')),
                DropdownMenuItem(value: 'DONE', child: Text('Done')),
              ],
              onChanged: (v) => setState(() => _status = v ?? 'TODO'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _description,
              minLines: 3,
              maxLines: 5,
              decoration: InputDecoration(
                labelText: 'Description',
                errorText: _descriptionError,
                filled: true,
                fillColor: _DashColors.card,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (_) {
                if (_descriptionError != null) setState(() => _descriptionError = null);
              },
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: _saving ? null : () => Navigator.pop(context, false),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: FilledButton(
                    onPressed: _saving ? null : _save,
                    style: FilledButton.styleFrom(
                      backgroundColor: _DashColors.primary,
                      foregroundColor: _DashColors.foreground,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: _saving
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(editing ? 'Save' : 'Create'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
