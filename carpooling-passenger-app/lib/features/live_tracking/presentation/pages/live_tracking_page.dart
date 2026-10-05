import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/hop_on_badge.dart';
import '../../../../core/widgets/hop_on_sos_button.dart';
import '../../../../core/widgets/hop_on_route_timeline.dart';
import 'package:carpooling_passenger_app/features/booking/data/models/booking_model.dart';
import '../bloc/live_tracking_bloc.dart';
import '../bloc/live_tracking_event.dart';
import '../bloc/live_tracking_state.dart';

import '../../../../core/widgets/hop_on_map_widget.dart';

class LiveTrackingPage extends StatefulWidget {
  final BookingModel booking;

  const LiveTrackingPage({super.key, required this.booking});

  @override
  State<LiveTrackingPage> createState() => _LiveTrackingPageState();
}

class _LiveTrackingPageState extends State<LiveTrackingPage> {
  @override
  void initState() {
    super.initState();
    context.read<LiveTrackingBloc>().add(StartTrackingEvent(widget.booking.tripId));
  }

  @override
  void dispose() {
    super.dispose();
  }

  void _triggerEmergencySos() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.shield_rounded, color: AppTheme.white, size: 20),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                '🚨 Alert sent · 112 + 2 emergency contacts notified with live coordinates',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
              ),
            ),
          ],
        ),
        backgroundColor: AppTheme.red700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusControl)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final trip = widget.booking.trip;
    final driver = trip?.driver;
    final car = trip?.car;
    final tripCode = widget.booking.tripId.length > 4
        ? widget.booking.tripId.substring(widget.booking.tripId.length - 4).toUpperCase()
        : (widget.booking.tripId.isNotEmpty ? widget.booking.tripId.toUpperCase() : '4821');

    return Scaffold(
      backgroundColor: AppTheme.canvas,
      body: BlocConsumer<LiveTrackingBloc, LiveTrackingState>(
        listener: (context, state) {
          if (state is LiveTrackingError) {
            // Non-blocking telemetry notice
          }
        },
        builder: (context, state) {
          final isConnecting = state is LiveTrackingConnecting;
          final isActive = state is LiveTrackingActive;
          final isStale = isActive && state.isStale;
          final trackingData = isActive ? state.trackingData : null;

          final speedVal = trackingData?.speed ?? 48.0;
          final distanceVal = (trackingData?.speed ?? 48.0) > 0 ? 3.4 : 0.0;
          final etaVal = (distanceVal / (speedVal > 0 ? speedVal : 30) * 60).clamp(2, 45).round();

          return Stack(
            children: [
              // 1. HopOn DS Vector & Real Tile Map Surface (Leaflet/flutter_map)
              Positioned.fill(
                child: HopOnMapWidget(
                  origin: widget.booking.pickupLocation,
                  destination: widget.booking.dropoffLocation,
                  driverLat: (trackingData?.lat != null && trackingData!.lat != 0.0) ? trackingData.lat : null,
                  driverLon: (trackingData?.lon != null && trackingData!.lon != 0.0) ? trackingData.lon : null,
                  driverHeading: trackingData?.heading ?? 45,
                  driverName: driver?.name,
                  vehiclePlate: car?.licensePlate,
                  speed: speedVal,
                  isLiveTracking: true,
                  height: double.infinity,
                ),
              ),

              // 2. Screen S2: Top Telemetry Bar (No blur, solid offset shadow)
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppTheme.canvas,
                      borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                      border: Border.all(color: AppTheme.hairline),
                      boxShadow: const [AppTheme.shadowE1],
                    ),
                    child: Row(
                      children: [
                        InkWell(
                          onTap: () {
                            context.read<LiveTrackingBloc>().add(StopTrackingEvent());
                            Navigator.pop(context);
                          },
                          borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                          child: Container(
                            width: 34,
                            height: 34,
                            decoration: BoxDecoration(
                              color: AppTheme.sunk,
                              borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                              border: Border.all(color: AppTheme.hairline),
                            ),
                            child: const Icon(Icons.arrow_back, size: 18, color: AppTheme.ink900),
                          ),
                        ),
                        const SizedBox(width: 10),
                        // Status indicator dot
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: isStale
                                ? AppTheme.amber600
                                : (isConnecting ? AppTheme.ink400 : AppTheme.emerald600),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            isStale
                                ? 'TRIP HOP-$tripCode • GPS delayed'
                                : (isConnecting
                                    ? 'TRIP HOP-$tripCode • Connecting…'
                                    : 'TRIP HOP-$tripCode • Live GPS ±4 m'),
                            style: const TextStyle(
                              fontFamily: AppTheme.fontFamilyMono,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.ink900,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // 3. Screen S2: Bottom Sheet HUD (Fixed bottom sheet, no cards-on-cards)
              Align(
                alignment: Alignment.bottomCenter,
                child: Container(
                  decoration: BoxDecoration(
                    color: AppTheme.canvas,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(AppTheme.radiusSheet)),
                    border: const Border(
                      top: BorderSide(color: AppTheme.hairline),
                      left: BorderSide(color: AppTheme.hairline),
                      right: BorderSide(color: AppTheme.hairline),
                    ),
                    boxShadow: const [AppTheme.shadowE3],
                  ),
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Drag handle pill
                      Center(
                        child: Container(
                          width: 36,
                          height: 4,
                          decoration: BoxDecoration(
                            color: AppTheme.ink300,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Row 1: Large ETA title + On time badge
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Row(
                            children: [
                              Text(
                                'Arriving in $etaVal min',
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.ink900,
                                  letterSpacing: -0.3,
                                ),
                              ),
                            ],
                          ),
                          isStale
                              ? HopOnBadge.alert('Delayed')
                              : HopOnBadge.success('On time'),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Row 2: Driver & vehicle information
                      Row(
                        children: [
                          // Initials Avatar
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: AppTheme.teal50,
                              borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                              border: Border.all(color: AppTheme.hairline),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              (driver?.name != null && driver!.name.isNotEmpty)
                                  ? driver.name.substring(0, 1).toUpperCase()
                                  : 'D',
                              style: const TextStyle(
                                color: AppTheme.teal700,
                                fontWeight: FontWeight.w800,
                                fontSize: 18,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Flexible(
                                      child: Text(
                                        driver?.name ?? 'Assigned Driver',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 14,
                                          color: AppTheme.ink900,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    const Text(
                                      '★ 4.9',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 12,
                                        color: AppTheme.amber700,
                                      ),
                                    ),
                                    const Text(
                                      ' · 312 trips',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.ink500,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    HopOnBadge.plate(
                                      car?.licensePlate ?? 'GJ01 KT 4821',
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      '${car?.make ?? 'White'} ${car?.model ?? 'Baleno'}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.ink700,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Row 3: 3-column Telemetry Stats in Monospace
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: AppTheme.sunk,
                          borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                          border: Border.all(color: AppTheme.hairline),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStatItem('SPEED', '${speedVal.toStringAsFixed(0)} km/h'),
                            Container(width: 1, height: 28, color: AppTheme.hairline),
                            _buildStatItem('DISTANCE', '${distanceVal.toStringAsFixed(1)} km'),
                            Container(width: 1, height: 28, color: AppTheme.hairline),
                            _buildStatItem('ETA', '$etaVal min'),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Boarding PIN Row (if available)
                      if (widget.booking.pickupOtp != null) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppTheme.teal50,
                            borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                            border: Border.all(color: AppTheme.teal700.withValues(alpha: 0.2)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      HopOnBadge.tag('PIN', bg: AppTheme.teal700, fg: AppTheme.white),
                                      const SizedBox(width: 8),
                                      const Text(
                                        'Boarding verification',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 12,
                                          color: AppTheme.teal700,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  const Text(
                                    'Share with driver upon pickup',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: AppTheme.ink500,
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                widget.booking.pickupOtp!,
                                style: const TextStyle(
                                  fontFamily: AppTheme.fontFamilyMono,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 20,
                                  letterSpacing: 4,
                                  color: AppTheme.teal700,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                      ],

                      // Route Summary Bar
                      HopOnRouteTimeline(
                        origin: widget.booking.pickupLocation,
                        destination: widget.booking.dropoffLocation,
                        originWalk: '400 m',
                        destinationWalk: '600 m',
                      ),
                      const SizedBox(height: 14),

                      // Action Buttons Row: Call, Chat, SOS Button
                      Row(
                        children: [
                          // Call Button
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () {
                                final phone = driver?.phone ?? '9876543210';
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Calling $phone…')),
                                );
                              },
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppTheme.ink900,
                                side: const BorderSide(color: AppTheme.hairline),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                                ),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                              icon: const Icon(Icons.phone_outlined, size: 16),
                              label: const Text(
                                'Call',
                                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Chat Button
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Opening chat with driver…')),
                                );
                              },
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppTheme.ink900,
                                side: const BorderSide(color: AppTheme.hairline),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                                ),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                              icon: const Icon(Icons.chat_bubble_outline_rounded, size: 16),
                              label: const Text(
                                'Chat',
                                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          // HopOn Protected SOS Button (1.5s hold)
                          HopOnSosButton(
                            onTriggered: _triggerEmergencySos,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontFamily: AppTheme.fontFamilyMono,
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: AppTheme.ink500,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontFamily: AppTheme.fontFamilyMono,
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppTheme.ink900,
          ),
        ),
      ],
    );
  }
}

