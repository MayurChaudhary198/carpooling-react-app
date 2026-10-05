import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_theme.dart';
import 'package:carpooling_passenger_app/features/booking/presentation/pages/book_trip_page.dart';
import '../bloc/feed_bloc.dart';
import '../bloc/feed_event.dart';
import '../bloc/feed_state.dart';
import '../../../../core/widgets/hop_on_map_widget.dart';
import '../widgets/feed_trip_card.dart';

class FeedPage extends StatefulWidget {
  const FeedPage({super.key});

  @override
  State<FeedPage> createState() => _FeedPageState();
}

class _FeedPageState extends State<FeedPage> {
  final _fromController = TextEditingController(text: 'Iscon Cross Rd, Satellite');
  final _toController = TextEditingController(text: 'Infocity, Gandhinagar');
  int _seats = 1;
  String _selectedCorridor = 'S.G. Highway → Infocity';
  bool _isMapView = false;

  @override
  void initState() {
    super.initState();
    _loadFeed();
  }

  void _loadFeed({bool isRefresh = false}) {
    context.read<FeedBloc>().add(
          FetchFeedTripsEvent(
            radiusKm: 25,
            seats: _seats,
            isRefresh: isRefresh,
          ),
        );
  }

  void _swapLocations() {
    final temp = _fromController.text;
    setState(() {
      _fromController.text = _toController.text;
      _toController.text = temp;
    });
  }

  @override
  void dispose() {
    _fromController.dispose();
    _toController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.canvas,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.teal700,
          onRefresh: () async => _loadFeed(isRefresh: true),
          child: CustomScrollView(
            slivers: [
              // 1. Header: Good morning, Aarav / Where to today? + Avatar
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Good morning, Aarav',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: AppTheme.ink600,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Where to today?',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.6,
                              color: AppTheme.ink900,
                            ),
                          ),
                        ],
                      ),
                      // User Initials Badge AK
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppTheme.teal100,
                          borderRadius: BorderRadius.circular(AppTheme.radiusFull),
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          'AK',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.teal700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // 2. Search & Filter Card (Screen S1)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppTheme.white,
                      borderRadius: BorderRadius.circular(AppTheme.radiusCard),
                      border: Border.all(color: AppTheme.hairline),
                      boxShadow: const [AppTheme.shadowE1],
                    ),
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // FROM Input
                        Row(
                          children: [
                            Container(
                              width: 14,
                              height: 14,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppTheme.white,
                                border: Border.all(color: AppTheme.teal700, width: 3),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'FROM',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.5,
                                      color: AppTheme.ink500,
                                    ),
                                  ),
                                  TextField(
                                    controller: _fromController,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.ink900,
                                    ),
                                    decoration: const InputDecoration(
                                      isDense: true,
                                      contentPadding: EdgeInsets.symmetric(vertical: 4),
                                      border: InputBorder.none,
                                      enabledBorder: InputBorder.none,
                                      focusedBorder: InputBorder.none,
                                      fillColor: Colors.transparent,
                                      filled: false,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.swap_vert_rounded, size: 20, color: AppTheme.ink600),
                              onPressed: _swapLocations,
                            ),
                          ],
                        ),
                        const Divider(height: 12, color: AppTheme.hairline),
                        // TO Input
                        Row(
                          children: [
                            Container(
                              width: 13,
                              height: 13,
                              decoration: BoxDecoration(
                                color: AppTheme.amber600,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                            const SizedBox(width: 13),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'TO',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.5,
                                      color: AppTheme.ink500,
                                    ),
                                  ),
                                  TextField(
                                    controller: _toController,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.ink900,
                                    ),
                                    decoration: const InputDecoration(
                                      isDense: true,
                                      contentPadding: EdgeInsets.symmetric(vertical: 4),
                                      border: InputBorder.none,
                                      enabledBorder: InputBorder.none,
                                      focusedBorder: InputBorder.none,
                                      fillColor: Colors.transparent,
                                      filled: false,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 16, color: AppTheme.hairline),

                        // Date, Leave & Seats Row
                        Row(
                          children: [
                            // DATE
                            Expanded(
                              flex: 3,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'DATE',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.5,
                                      color: AppTheme.ink500,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  const Text(
                                    'Today, 25 Sep',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.ink900,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // LEAVE
                            Expanded(
                              flex: 3,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'LEAVE',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.5,
                                      color: AppTheme.ink500,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  const Text(
                                    '08:00–09:00',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.ink900,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // SEATS Stepper
                            Expanded(
                              flex: 3,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  const Text(
                                    'SEATS',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.5,
                                      color: AppTheme.ink500,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      GestureDetector(
                                        onTap: _seats > 1 ? () => setState(() => _seats--) : null,
                                        child: Text(
                                          '−',
                                          style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            color: _seats > 1 ? AppTheme.ink900 : AppTheme.ink400,
                                          ),
                                        ),
                                      ),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 8.0),
                                        child: Text(
                                          '$_seats',
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w800,
                                            color: AppTheme.ink900,
                                          ),
                                        ),
                                      ),
                                      GestureDetector(
                                        onTap: _seats < 4 ? () => setState(() => _seats++) : null,
                                        child: const Text(
                                          '+',
                                          style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.ink900,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Find rides button
                        ElevatedButton(
                          onPressed: () => _loadFeed(),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Find rides'),
                              SizedBox(width: 6),
                              Text('→', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // 3. YOUR CORRIDORS (Chips)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'YOUR CORRIDORS',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.8,
                          color: AppTheme.ink500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _buildCorridorChip('S.G. Highway → Infocity'),
                            const SizedBox(width: 8),
                            _buildCorridorChip('Bopal → GIFT City'),
                            const SizedBox(width: 8),
                            _buildCorridorChip('Downtown → Airport'),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // 3b. Live Corridor Map (HopOn DS Vector Map)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 6, 16, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.map_outlined, size: 16, color: AppTheme.teal700),
                              SizedBox(width: 6),
                              Text(
                                'CORRIDOR ROUTE MAP',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.8,
                                  color: AppTheme.ink500,
                                ),
                              ),
                            ],
                          ),
                          InkWell(
                            onTap: () => setState(() => _isMapView = !_isMapView),
                            borderRadius: BorderRadius.circular(AppTheme.radiusTag),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              child: Row(
                                children: [
                                  Text(
                                    _isMapView ? 'Collapse' : 'Expand full map',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.teal700,
                                    ),
                                  ),
                                  Icon(
                                    _isMapView ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                                    size: 16,
                                    color: AppTheme.teal700,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      HopOnMapWidget(
                        origin: _fromController.text,
                        destination: _toController.text,
                        height: _isMapView ? 360 : 170,
                        isLiveTracking: true,
                      ),
                    ],
                  ),
                ),
              ),

              // 4. Results Header: "14 rides" + "Earliest first ▾"
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  child: BlocBuilder<FeedBloc, FeedState>(
                    builder: (context, state) {
                      final count = state is FeedLoaded ? state.trips.length : 0;
                      return Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            state is FeedLoaded ? '$count rides' : 'Searching rides...',
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.3,
                              color: AppTheme.ink900,
                            ),
                          ),
                          Row(
                            children: const [
                              Text(
                                'Earliest first',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.ink600,
                                ),
                              ),
                              SizedBox(width: 4),
                              Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: AppTheme.ink600),
                            ],
                          ),
                        ],
                      );
                    },
                  ),
                ),
              ),

              // 5. Ride Feed List
              BlocBuilder<FeedBloc, FeedState>(
                builder: (context, state) {
                  if (state is FeedLoading) {
                    return const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.all(40.0),
                        child: Center(
                          child: CircularProgressIndicator(color: AppTheme.teal700),
                        ),
                      ),
                    );
                  }

                  if (state is FeedError) {
                    return SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Column(
                          children: [
                            const Icon(Icons.cloud_off_rounded, size: 40, color: AppTheme.red700),
                            const SizedBox(height: 12),
                            Text(
                              state.message,
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontSize: 14, color: AppTheme.ink700),
                            ),
                            const SizedBox(height: 16),
                            OutlinedButton(
                              onPressed: () => _loadFeed(),
                              child: const Text('Retry Search'),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  if (state is FeedLoaded) {
                    if (state.trips.isEmpty) {
                      return SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: Column(
                            children: [
                              const SizedBox(height: 20),
                              const Text(
                                'No rides 08:00–09:00',
                                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppTheme.ink900),
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                '3 drivers leave between 07:30 and 08:00 on this corridor.',
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 13, color: AppTheme.ink600),
                              ),
                              const SizedBox(height: 20),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  ElevatedButton(
                                    onPressed: () => _loadFeed(),
                                    child: const Text('Widen to 07:30'),
                                  ),
                                  const SizedBox(width: 10),
                                  OutlinedButton(
                                    onPressed: () {},
                                    child: const Text('Alert me'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    }

                    return SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final trip = state.trips[index];
                            return FeedTripCard(
                              trip: trip,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => BookTripPage(
                                      tripId: trip.id,
                                      origin: trip.origin,
                                      originLat: trip.originLat,
                                      originLon: trip.originLon,
                                      destination: trip.destinationLocation,
                                      pricePerKm: trip.pricePerKm,
                                      availableSeats: trip.availableSeats,
                                      departureTime: trip.departureTime,
                                      driver: trip.driver,
                                      car: trip.car,
                                    ),
                                  ),
                                );
                              },
                            );
                          },
                          childCount: state.trips.length,
                        ),
                      ),
                    );
                  }

                  return const SliverToBoxAdapter(child: SizedBox());
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCorridorChip(String corridor) {
    final isSelected = _selectedCorridor == corridor;

    return GestureDetector(
      onTap: () {
        setState(() => _selectedCorridor = corridor);
        _loadFeed();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.teal700 : AppTheme.sunk,
          borderRadius: BorderRadius.circular(AppTheme.radiusCtl),
          border: Border.all(
            color: isSelected ? AppTheme.teal700 : AppTheme.hairline,
          ),
        ),
        child: Text(
          corridor,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: isSelected ? AppTheme.white : AppTheme.ink700,
          ),
        ),
      ),
    );
  }
}
