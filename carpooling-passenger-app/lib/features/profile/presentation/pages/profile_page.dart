import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/hop_on_badge.dart';
import 'package:carpooling_passenger_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:carpooling_passenger_app/features/auth/presentation/bloc/auth_event.dart';
import 'package:carpooling_passenger_app/features/auth/presentation/bloc/auth_state.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.canvas,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusSheet),
          side: const BorderSide(color: AppTheme.hairline),
        ),
        title: const Text(
          'Sign out?',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 18,
            color: AppTheme.ink900,
          ),
        ),
        content: const Text(
          'Are you sure you want to sign out of your passenger account?',
          style: TextStyle(fontSize: 13, height: 1.4, color: AppTheme.ink700),
        ),
        actionsPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        actions: [
          OutlinedButton(
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.ink700,
              side: const BorderSide(color: AppTheme.hairline),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTheme.radiusControl),
              ),
            ),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.red700,
              foregroundColor: AppTheme.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTheme.radiusControl),
              ),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              context.read<AuthBloc>().add(LogoutEvent());
            },
            child: const Text('Sign out', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.canvas,
      appBar: AppBar(
        title: const Text(
          'Profile & safety',
          style: TextStyle(
            color: AppTheme.ink900,
            fontWeight: FontWeight.w800,
            fontSize: 20,
          ),
        ),
        backgroundColor: AppTheme.canvas,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppTheme.hairline, height: 1),
        ),
      ),
      body: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          final user = state is AuthenticatedState ? state.user : null;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // User Avatar & Name Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.canvas,
                  borderRadius: BorderRadius.circular(AppTheme.radiusCard),
                  border: Border.all(color: AppTheme.hairline),
                  boxShadow: const [AppTheme.shadowE1],
                ),
                child: Column(
                  children: [
                    Container(
                      width: 68,
                      height: 68,
                      decoration: BoxDecoration(
                        color: AppTheme.teal50,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppTheme.teal700, width: 2),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        user != null && user.name.isNotEmpty
                            ? user.name[0].toUpperCase()
                            : 'A',
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.teal700,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      user?.name ?? 'Aarav Mehta',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.ink900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user?.email ?? 'aarav@hopon.app',
                      style: const TextStyle(
                        color: AppTheme.ink500,
                        fontSize: 13,
                        fontFamily: AppTheme.fontFamilyMono,
                      ),
                    ),
                    if (user?.phone != null && user!.phone!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        user.phone!,
                        style: const TextStyle(
                          color: AppTheme.ink500,
                          fontSize: 13,
                          fontFamily: AppTheme.fontFamilyMono,
                        ),
                      ),
                    ],
                    const SizedBox(height: 14),
                    // Badges Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        HopOnBadge.success('✓ ID verified'),
                        const SizedBox(width: 8),
                        HopOnBadge.tag('PASSENGER', bg: AppTheme.teal700, fg: AppTheme.white),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Safety Center Card
              Container(
                decoration: BoxDecoration(
                  color: AppTheme.canvas,
                  borderRadius: BorderRadius.circular(AppTheme.radiusCard),
                  border: Border.all(color: AppTheme.hairline),
                  boxShadow: const [AppTheme.shadowE1],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.fromLTRB(16, 14, 16, 10),
                        child: Row(
                          children: [
                            Icon(Icons.shield_outlined, size: 18, color: AppTheme.teal700),
                            SizedBox(width: 8),
                            Text(
                              'Safety & Emergency Center',
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                                letterSpacing: 0.2,
                                color: AppTheme.ink900,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Divider(height: 1, color: AppTheme.hairline),
                      ListTile(
                        leading: const Icon(Icons.contact_phone_outlined, color: AppTheme.teal700, size: 20),
                        title: const Text('Emergency contacts', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.ink900)),
                        subtitle: const Text('Live trip telemetry dispatched upon SOS hold', style: TextStyle(fontSize: 12, color: AppTheme.ink500)),
                        trailing: const Icon(Icons.chevron_right, size: 18, color: AppTheme.ink500),
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('2 emergency contacts configured.')),
                          );
                        },
                      ),
                      const Divider(height: 1, color: AppTheme.hairline),
                      ListTile(
                        leading: const Icon(Icons.shield_rounded, color: AppTheme.red700, size: 20),
                        title: const Text('HopOn SOS 1.5s protection', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.ink900)),
                        subtitle: const Text('Hold button for 1.5 s prevents accidental pocket triggers', style: TextStyle(fontSize: 12, color: AppTheme.ink500)),
                        trailing: const Icon(Icons.chevron_right, size: 18, color: AppTheme.ink500),
                        onTap: () {},
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Ride Preferences Card
              Container(
                decoration: BoxDecoration(
                  color: AppTheme.canvas,
                  borderRadius: BorderRadius.circular(AppTheme.radiusCard),
                  border: Border.all(color: AppTheme.hairline),
                  boxShadow: const [AppTheme.shadowE1],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.ac_unit, color: AppTheme.teal700, size: 20),
                        title: const Text('AC ride preference', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.ink900)),
                        trailing: Switch(
                          value: true,
                          activeColor: AppTheme.teal700,
                          onChanged: (_) {},
                        ),
                      ),
                      const Divider(height: 1, color: AppTheme.hairline),
                      ListTile(
                        leading: const Icon(Icons.volume_off_outlined, color: AppTheme.teal700, size: 20),
                        title: const Text('Quiet ride preference', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.ink900)),
                        trailing: Switch(
                          value: false,
                          activeColor: AppTheme.teal700,
                          onChanged: (_) {},
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Logout Button
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.red700,
                  side: const BorderSide(color: AppTheme.hairline),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                  ),
                ),
                onPressed: () => _confirmLogout(context),
                icon: const Icon(Icons.logout_rounded, size: 18),
                label: const Text('Sign out of account', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              ),
              const SizedBox(height: 24),
            ],
          );
        },
      ),
    );
  }
}

