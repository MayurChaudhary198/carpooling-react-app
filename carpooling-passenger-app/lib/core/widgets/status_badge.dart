import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

enum BookingBadgeStatus {
  confirmed,
  waitlisted,
  cancelled,
  pending,
  completed,
  live,
}

class StatusBadge extends StatelessWidget {
  final BookingBadgeStatus status;
  final String? customLabel;

  const StatusBadge({
    super.key,
    required this.status,
    this.customLabel,
  });

  factory StatusBadge.fromString(String rawStatus) {
    switch (rawStatus.toUpperCase()) {
      case 'CONFIRMED':
        return const StatusBadge(status: BookingBadgeStatus.confirmed);
      case 'WAITLISTED':
        return const StatusBadge(status: BookingBadgeStatus.waitlisted);
      case 'CANCELLED':
        return const StatusBadge(status: BookingBadgeStatus.cancelled);
      case 'COMPLETED':
        return const StatusBadge(status: BookingBadgeStatus.completed);
      case 'LIVE':
      case 'IN_TRANSIT':
        return const StatusBadge(status: BookingBadgeStatus.live);
      default:
        return const StatusBadge(status: BookingBadgeStatus.pending);
    }
  }

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color textColor;
    IconData icon;
    String label;

    switch (status) {
      case BookingBadgeStatus.confirmed:
        bg = AppTheme.secondaryTint;
        textColor = const Color(0xFF065F46);
        icon = Icons.check_circle_rounded;
        label = 'CONFIRMED';
        break;
      case BookingBadgeStatus.waitlisted:
        bg = AppTheme.warningTint;
        textColor = const Color(0xFF92400E);
        icon = Icons.schedule_rounded;
        label = 'WAITLISTED';
        break;
      case BookingBadgeStatus.cancelled:
        bg = AppTheme.errorTint;
        textColor = const Color(0xFF991B1B);
        icon = Icons.cancel_rounded;
        label = 'CANCELLED';
        break;
      case BookingBadgeStatus.completed:
        bg = const Color(0xFFF1F5F9);
        textColor = const Color(0xFF475569);
        icon = Icons.done_all_rounded;
        label = 'COMPLETED';
        break;
      case BookingBadgeStatus.live:
        bg = AppTheme.primaryTint;
        textColor = AppTheme.primaryAccent;
        icon = Icons.navigation_rounded;
        label = 'LIVE NOW';
        break;
      case BookingBadgeStatus.pending:
        bg = const Color(0xFFF1F5F9);
        textColor = const Color(0xFF64748B);
        icon = Icons.hourglass_top_rounded;
        label = 'PENDING';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(9999),
        border: Border.all(color: textColor.withValues(alpha: 0.2), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: textColor),
          const SizedBox(width: 5),
          Text(
            customLabel ?? label,
            style: TextStyle(
              color: textColor,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.4,
            ),
          ),
        ],
      ),
    );
  }
}
