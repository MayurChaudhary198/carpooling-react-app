import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class AppToast {
  AppToast._();

  static void showSuccess(BuildContext context, String message, {String? title}) {
    _showSnackBar(
      context,
      title: title ?? 'Success',
      message: message,
      bg: AppTheme.secondaryColor,
      icon: Icons.check_circle_rounded,
    );
  }

  static void showWarning(BuildContext context, String message, {String? title}) {
    _showSnackBar(
      context,
      title: title ?? 'Attention',
      message: message,
      bg: AppTheme.warningColor,
      icon: Icons.warning_amber_rounded,
    );
  }

  static void showError(BuildContext context, String message, {String? title}) {
    _showSnackBar(
      context,
      title: title ?? 'Error',
      message: message,
      bg: AppTheme.errorColor,
      icon: Icons.error_outline_rounded,
    );
  }

  static void _showSnackBar(
    BuildContext context, {
    required String title,
    required String message,
    required Color bg,
    required IconData icon,
  }) {
    if (!context.mounted) return;
    try {
      final messenger = ScaffoldMessenger.maybeOf(context);
      if (messenger == null) return;
      messenger.hideCurrentSnackBar();
      messenger.showSnackBar(
        SnackBar(
          elevation: 0,
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusControl),
            side: const BorderSide(color: AppTheme.hairline),
          ),
          backgroundColor: bg,
          content: Row(
            children: [
              Icon(icon, color: AppTheme.white, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  message,
                  style: const TextStyle(
                    color: AppTheme.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          duration: const Duration(seconds: 3),
        ),
      );
    } catch (_) {}
  }
}
