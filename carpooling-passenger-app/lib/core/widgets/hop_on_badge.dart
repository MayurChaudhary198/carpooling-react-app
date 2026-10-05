import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

enum HopOnBadgeType {
  idVerified,
  instantBook,
  request,
  yourPickup,
  you,
  full,
  runningLate,
  custom,
}

class HopOnBadge extends StatelessWidget {
  final HopOnBadgeType type;
  final String? label;
  final Color? customBg;
  final Color? customFg;

  const HopOnBadge({
    super.key,
    required this.type,
    this.label,
    this.customBg,
    this.customFg,
  });

  factory HopOnBadge.plate(String plateText) {
    return HopOnBadge(
      type: HopOnBadgeType.custom,
      label: plateText,
      customBg: AppTheme.white,
      customFg: AppTheme.ink900,
    );
  }

  factory HopOnBadge.success(String text) {
    return HopOnBadge(
      type: HopOnBadgeType.custom,
      label: text,
      customBg: AppTheme.emerald50,
      customFg: AppTheme.emerald700,
    );
  }

  factory HopOnBadge.alert(String text) {
    return HopOnBadge(
      type: HopOnBadgeType.custom,
      label: text,
      customBg: AppTheme.amber50,
      customFg: AppTheme.amber700,
    );
  }

  factory HopOnBadge.neutral(String text) {
    return HopOnBadge(
      type: HopOnBadgeType.custom,
      label: text,
      customBg: AppTheme.sunk,
      customFg: AppTheme.ink700,
    );
  }

  factory HopOnBadge.tag(String text, {Color? bg, Color? fg}) {
    return HopOnBadge(
      type: HopOnBadgeType.custom,
      label: text,
      customBg: bg ?? AppTheme.teal700,
      customFg: fg ?? AppTheme.white,
    );
  }

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    Widget content;

    switch (type) {
      case HopOnBadgeType.idVerified:
        bg = AppTheme.emerald50;
        fg = AppTheme.emerald700;
        content = Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check_rounded, size: 13, color: fg),
            const SizedBox(width: 3),
            Text(
              label ?? 'ID verified',
              style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w700),
            ),
          ],
        );
        break;

      case HopOnBadgeType.instantBook:
        bg = AppTheme.teal50;
        fg = AppTheme.teal700;
        content = Text(
          label ?? 'Instant book',
          style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w700),
        );
        break;

      case HopOnBadgeType.request:
        bg = AppTheme.amber50;
        fg = AppTheme.amber700;
        content = Text(
          label ?? 'Request',
          style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w700),
        );
        break;

      case HopOnBadgeType.yourPickup:
        bg = AppTheme.teal700;
        fg = AppTheme.white;
        content = Text(
          label ?? 'YOUR PICKUP',
          style: TextStyle(color: fg, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5),
        );
        break;

      case HopOnBadgeType.you:
        bg = AppTheme.blue600;
        fg = AppTheme.white;
        content = Text(
          label ?? 'YOU · 30 m',
          style: TextStyle(
            color: fg,
            fontSize: 10,
            fontWeight: FontWeight.w800,
            fontFamily: 'monospace',
            letterSpacing: 0.5,
          ),
        );
        break;

      case HopOnBadgeType.full:
        bg = AppTheme.sunk;
        fg = AppTheme.ink500;
        content = Text(
          label ?? 'Full',
          style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w700),
        );
        break;

      case HopOnBadgeType.runningLate:
        bg = AppTheme.amber50;
        fg = AppTheme.amber700;
        content = Text(
          label ?? 'Running 6 min late',
          style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w700),
        );
        break;

      case HopOnBadgeType.custom:
        bg = customBg ?? AppTheme.sunk;
        fg = customFg ?? AppTheme.ink900;
        content = Text(
          label ?? '',
          style: TextStyle(
            color: fg,
            fontSize: 11,
            fontWeight: FontWeight.w800,
            fontFamily: 'monospace',
            letterSpacing: 0.5,
          ),
        );
        break;
    }

    return Container(
      height: 24,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppTheme.radiusTag),
        border: Border.all(
          color: (type == HopOnBadgeType.custom) ? AppTheme.hairline : fg.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      alignment: Alignment.center,
      child: content,
    );
  }
}
