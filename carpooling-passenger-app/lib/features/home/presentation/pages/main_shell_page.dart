import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import 'package:carpooling_passenger_app/features/booking/presentation/pages/my_bookings_page.dart';
import 'package:carpooling_passenger_app/features/feed/presentation/pages/feed_page.dart';
import 'package:carpooling_passenger_app/features/profile/presentation/pages/profile_page.dart';
import 'package:carpooling_passenger_app/features/trip_search/presentation/pages/trip_search_page.dart';

class MainShellPage extends StatefulWidget {
  const MainShellPage({super.key});

  @override
  State<MainShellPage> createState() => _MainShellPageState();
}

class _MainShellPageState extends State<MainShellPage> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    FeedPage(),
    TripSearchPage(),
    MyBookingsPage(),
    ProfilePage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.canvas,
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppTheme.canvas,
          border: Border(
            top: BorderSide(
              color: AppTheme.hairline,
              width: 1,
            ),
          ),
          boxShadow: [AppTheme.shadowE1],
        ),
        child: SafeArea(
          child: NavigationBar(
            height: 64,
            elevation: 0,
            backgroundColor: AppTheme.canvas,
            selectedIndex: _currentIndex,
            onDestinationSelected: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            indicatorColor: AppTheme.teal50,
            indicatorShape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusControl),
              side: const BorderSide(color: AppTheme.hairline),
            ),
            labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.explore_outlined, color: AppTheme.ink500),
                selectedIcon: Icon(Icons.explore_rounded, color: AppTheme.teal700),
                label: 'Find',
              ),
              NavigationDestination(
                icon: Icon(Icons.search_rounded, color: AppTheme.ink500),
                selectedIcon: Icon(Icons.search_rounded, color: AppTheme.teal700),
                label: 'Search',
              ),
              NavigationDestination(
                icon: Icon(Icons.confirmation_number_outlined, color: AppTheme.ink500),
                selectedIcon: Icon(Icons.confirmation_number_rounded, color: AppTheme.teal700),
                label: 'My trips',
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline_rounded, color: AppTheme.ink500),
                selectedIcon: Icon(Icons.person_rounded, color: AppTheme.teal700),
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

