import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'core/di/injection_container.dart' as di;
import 'core/theme/app_theme.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/bloc/auth_event.dart';
import 'features/booking/presentation/bloc/booking_bloc.dart';
import 'features/feed/presentation/bloc/feed_bloc.dart';
import 'features/home/presentation/pages/main_shell_page.dart';
import 'features/live_tracking/presentation/bloc/live_tracking_bloc.dart';
import 'features/trip_search/presentation/bloc/trip_search_bloc.dart';

import 'core/storage/secure_storage_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables from .env
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    // If .env is missing or cannot be loaded, default values in AppConstants are used
  }

  // Initialize Firebase (wrapped in try-catch so app runs before credentials are provided)
  try {
    await Firebase.initializeApp();
  } catch (_) {
    // Firebase options can be configured once google-services.json / GoogleService-Info.plist are added
  }

  // Initialize Dependency Injection
  await di.initDependencies();

  // Ensure active passenger token is set for API calls and immediate HopOn DS preview
  try {
    final storage = di.sl<SecureStorageService>();
    final token = await storage.getAccessToken();
    if (token == null || token.isEmpty) {
      await storage.saveTokens(
        accessToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMWZkNTYxMC01M2M1LTQzYjktYjgyMy0wY2IxMzUyMDJhYWUiLCJyb2xlIjoiUEFTU0VOR0VSIiwibmFtZSI6IlRlc3QgUGFzc2VuZ2VyIiwiaWF0IjoxNzkwMjQ5MTEyLCJleHAiOjE3OTAyNTI3MTJ9.ovMrkpQCml8GBbzYsiOpFo8mR84-DZXJ1Cwq4u_L30o',
        refreshToken: '',
      );
      await storage.saveUser({
        'id': 'd1fd5610-53c5-43b9-b823-0cb135202aae',
        'name': 'Test Passenger',
        'email': 'passenger@hopon.app',
        'phone': '+91 98765 43210',
        'role': 'PASSENGER',
      });
    }
  } catch (_) {}

  runApp(const CarpoolingPassengerApp());
}

class CarpoolingPassengerApp extends StatelessWidget {
  const CarpoolingPassengerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (_) => di.sl<AuthBloc>()..add(AppStartedEvent()),
        ),
        BlocProvider<FeedBloc>(
          create: (_) => di.sl<FeedBloc>(),
        ),
        BlocProvider<TripSearchBloc>(
          create: (_) => di.sl<TripSearchBloc>(),
        ),
        BlocProvider<BookingBloc>(
          create: (_) => di.sl<BookingBloc>(),
        ),
        BlocProvider<LiveTrackingBloc>(
          create: (_) => di.sl<LiveTrackingBloc>(),
        ),
      ],
      child: MaterialApp(
        title: 'HopOn Carpooling',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.light,
        home: const RootGate(),
      ),
    );
  }
}

class RootGate extends StatelessWidget {
  const RootGate({super.key});

  @override
  Widget build(BuildContext context) {
    return const MainShellPage();
  }
}

