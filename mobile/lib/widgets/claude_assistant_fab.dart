import 'package:flutter/material.dart';
import '../services/claude_service.dart';

class ClaudeAssistantFab extends StatelessWidget {
  final String? contextData;
  const ClaudeAssistantFab({super.key, this.contextData});

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      tooltip: 'Asistente Claude',
      onPressed: () => _openChat(context),
      child: const Icon(Icons.assistant),
    );
  }

  void _openChat(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _ClaudeChatPanel(contextData: contextData),
    );
  }
}

class _ClaudeChatPanel extends StatefulWidget {
  final String? contextData;
  const _ClaudeChatPanel({this.contextData});

  @override
  State<_ClaudeChatPanel> createState() => _ClaudeChatPanelState();
}

class _ClaudeChatPanelState extends State<_ClaudeChatPanel> {
  final TextEditingController _controller = TextEditingController();
  final List<Map<String, String>> _messages = [];
  bool _loading = false;

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add({'role': 'user', 'text': text});
      _loading = true;
    });
    _controller.clear();

    try {
      final reply = await ClaudeService.ask(text, appContext: widget.contextData);
      setState(() {
        _messages.add({'role': 'assistant', 'text': reply});
      });
    } catch (e) {
      setState(() {
        _messages.add({'role': 'assistant', 'text': 'Error: $e'});
      });
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: Container(
        padding: const EdgeInsets.all(16),
        height: 500,
        child: Column(
          children: [
            Text(
              'Asistente GestorPyme',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ListView.builder(
                itemCount: _messages.length,
                itemBuilder: (context, i) {
                  final m = _messages[i];
                  final isUser = m['role'] == 'user';
                  return Align(
                    alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isUser
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(context).colorScheme.secondaryContainer,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        m['text']!,
                        style: TextStyle(
                          color: isUser ? Colors.white : null,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            if (_loading) const LinearProgressIndicator(),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: const InputDecoration(
                      hintText: 'Escribe tu pregunta...',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (_) => _send(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send),
                  onPressed: _send,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
