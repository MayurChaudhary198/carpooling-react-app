import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class HopOnSosButton extends StatefulWidget {
  final VoidCallback onTriggered;

  const HopOnSosButton({super.key, required this.onTriggered});

  @override
  State<HopOnSosButton> createState() => _HopOnSosButtonState();
}

class _HopOnSosButtonState extends State<HopOnSosButton> {
  bool _isPressing = false;
  bool _isTriggered = false;
  Timer? _timer;
  double _progress = 0.0;
  Timer? _progressTimer;

  void _onTapDown(TapDownDetails details) {
    if (_isTriggered) return;
    setState(() {
      _isPressing = true;
      _progress = 0.0;
    });

    _progressTimer = Timer.periodic(const Duration(milliseconds: 50), (t) {
      if (mounted) {
        setState(() {
          _progress = (_progress + 0.033).clamp(0.0, 1.0);
        });
      }
    });

    _timer = Timer(const Duration(milliseconds: 1500), () {
      if (mounted) {
        setState(() {
          _isTriggered = true;
          _isPressing = false;
        });
        _progressTimer?.cancel();
        widget.onTriggered();
      }
    });
  }

  void _onTapUp(TapUpDetails details) {
    _cancelHold();
  }

  void _onTapCancel() {
    _cancelHold();
  }

  void _cancelHold() {
    if (!_isTriggered) {
      _timer?.cancel();
      _progressTimer?.cancel();
      setState(() {
        _isPressing = false;
        _progress = 0.0;
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _progressTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label;

    if (_isTriggered) {
      bg = AppTheme.red700;
      fg = AppTheme.white;
      label = 'Alert sent · 112 + 2 contacts';
    } else if (_isPressing) {
      bg = AppTheme.red700;
      fg = AppTheme.white;
      label = 'Hold 1.5 s…';
    } else {
      bg = AppTheme.red50;
      fg = AppTheme.red700;
      label = 'SOS';
    }

    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      child: Container(
        height: 44,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(AppTheme.radiusCtl),
          border: Border.all(color: AppTheme.red700, width: 1.5),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.shield_rounded, size: 16, color: fg),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: fg,
                fontSize: 13,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
