import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/models/location_model.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_toast.dart';
import '../../../../core/widgets/hop_on_seat_map.dart';
import '../../../../core/widgets/hop_on_map_widget.dart';
import 'package:carpooling_passenger_app/features/feed/data/models/driver_model.dart';
import '../bloc/booking_bloc.dart';
import '../bloc/booking_event.dart';
import '../bloc/booking_state.dart';

class BookTripPage extends StatefulWidget {
  final String tripId;
  final String origin;
  final double originLat;
  final double originLon;
  final String destination;
  final num pricePerKm;
  final int availableSeats;
  final String departureTime;
  final DriverModel? driver;
  final CarModel? car;

  const BookTripPage({
    super.key,
    required this.tripId,
    required this.origin,
    required this.originLat,
    required this.originLon,
    required this.destination,
    required this.pricePerKm,
    required this.availableSeats,
    required this.departureTime,
    this.driver,
    this.car,
  });

  @override
  State<BookTripPage> createState() => _BookTripPageState();
}

class _BookTripPageState extends State<BookTripPage> {
  int _selectedSeat = 2; // Rear left default

  void _onBookPressed() {
    final pickupLocation = LocationModel(
      name: widget.origin,
      lat: widget.originLat,
      lon: widget.originLon,
    );
    final dropoffLocation = LocationModel(
      name: widget.destination,
      lat: 0.0,
      lon: 0.0,
    );

    context.read<BookingBloc>().add(
          CreateBookingEvent(
            tripId: widget.tripId,
            seats: 1,
            pickupLocation: pickupLocation,
            dropoffLocation: dropoffLocation,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    final fare = (widget.pricePerKm * 12).round(); // Leg fare

    return Scaffold(
      backgroundColor: AppTheme.canvas,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.ink900),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Thu 25 Sep · ${Formatters.formatTimeOnly(widget.departureTime)}',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: AppTheme.ink900,
              ),
            ),
            Text(
              '${widget.driver?.name ?? 'Kavya Mehta'} · ${widget.car?.model ?? 'Baleno'}',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: AppTheme.ink600,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, size: 20, color: AppTheme.ink900),
            onPressed: () {},
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: BlocConsumer<BookingBloc, BookingState>(
        listener: (context, state) {
          if (state is BookingCreatedSuccess) {
            showDialog(
              context: context,
              barrierDismissible: false,
              builder: (ctx) => AlertDialog(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusSheet)),
                title: const Row(
                  children: [
                    Icon(Icons.check_circle_rounded, color: AppTheme.teal700, size: 24),
                    SizedBox(width: 8),
                    Text('Seat Booked!', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
                  ],
                ),
                content: const Text(
                  'Your booking is confirmed. Your driver has been notified and you can track pickup live.',
                  style: TextStyle(fontSize: 13, height: 1.4),
                ),
                actions: [
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.pop(context);
                    },
                    child: const Text('View in My Trips'),
                  ),
                ],
              ),
            );
          } else if (state is BookingError) {
            AppToast.showError(context, state.message);
          }
        },
        builder: (context, state) {
          final isLoading = state is BookingActionLoading;

          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // ROUTE PREVIEW MAP (Screen S3)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: AppTheme.white,
                        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
                        border: Border.all(color: AppTheme.hairline),
                        boxShadow: const [AppTheme.shadowE1],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                            child: Row(
                              children: [
                                const Icon(Icons.map_outlined, size: 16, color: AppTheme.teal700),
                                const SizedBox(width: 8),
                                const Text(
                                  'CORRIDOR MAP · 24 KM',
                                  style: TextStyle(
                                    fontFamily: AppTheme.fontFamilyMono,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.ink700,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                const Spacer(),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppTheme.teal50,
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: AppTheme.teal100),
                                  ),
                                  child: const Text(
                                    'SG Highway',
                                    style: TextStyle(
                                      fontFamily: AppTheme.fontFamilyMono,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.teal700,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          SizedBox(
                            height: 180,
                            child: HopOnMapWidget(
                              origin: widget.origin,
                              destination: widget.destination,
                              driverName: widget.driver?.name ?? 'Kavya M.',
                              vehiclePlate: widget.car?.licensePlate ?? 'GJ01 KT 4821',
                              height: 180,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // ROUTE SECTION (Screen S3)
                    Container(
                      decoration: BoxDecoration(
                        color: AppTheme.white,
                        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
                        border: Border.all(color: AppTheme.hairline),
                        boxShadow: const [AppTheme.shadowE1],
                      ),
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'ROUTE',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                              color: AppTheme.ink500,
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Stop 1: Start (grey dashed before pickup)
                          _buildRouteStop(
                            time: '07:55',
                            title: 'Bopal Crossroads',
                            badge: 'Start',
                            badgeBg: AppTheme.sunk,
                            badgeFg: AppTheme.ink600,
                            isDashed: true,
                            isPickup: false,
                            isDropoff: false,
                          ),

                          // Stop 2: YOUR PICKUP (Teal ring + solid line)
                          _buildRouteStop(
                            time: '08:15',
                            title: widget.origin,
                            badge: 'YOUR PICKUP',
                            badgeBg: AppTheme.teal700,
                            badgeFg: AppTheme.white,
                            subtitle: 'Bay opp. Iscon Temple · 240 m walk',
                            isDashed: false,
                            isPickup: true,
                            isDropoff: false,
                          ),

                          // Stop 3: Intermediate stop
                          _buildRouteStop(
                            time: '08:28',
                            title: 'Thaltej Char Rasta',
                            subtitle: '1 more passenger joins',
                            isDashed: false,
                            isPickup: false,
                            isDropoff: false,
                          ),

                          // Stop 4: DROP-OFF (Amber square)
                          _buildRouteStop(
                            time: '08:52',
                            title: widget.destination,
                            badge: 'DROP-OFF',
                            badgeBg: AppTheme.amber50,
                            badgeFg: AppTheme.amber700,
                            subtitle: 'Gandhinagar · 400 m to Tower B',
                            isDashed: false,
                            isPickup: false,
                            isDropoff: true,
                            isLast: true,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // CHOOSE YOUR SEAT (Screen S3)
                    HopOnSeatMap(
                      initialSelectedSeat: _selectedSeat,
                      onSeatSelected: (idx) {
                        setState(() => _selectedSeat = idx);
                      },
                    ),
                    const SizedBox(height: 16),

                    // GOOD TO KNOW (Screen S3)
                    Container(
                      decoration: BoxDecoration(
                        color: AppTheme.white,
                        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
                        border: Border.all(color: AppTheme.hairline),
                        boxShadow: const [AppTheme.shadowE1],
                      ),
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'GOOD TO KNOW',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                              color: AppTheme.ink500,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: _buildGoodToKnowItem(
                                  icon: Icons.luggage_outlined,
                                  title: '1 bag',
                                  subtitle: 'cabin size / person',
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildGoodToKnowItem(
                                  icon: Icons.ac_unit_rounded,
                                  title: 'AC on',
                                  subtitle: 'set to 24°C',
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: _buildGoodToKnowItem(
                                  icon: Icons.smoke_free_rounded,
                                  title: 'No smoking',
                                  subtitle: 'incl. e-cigs',
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildGoodToKnowItem(
                                  icon: Icons.pets_outlined,
                                  title: 'Pets',
                                  subtitle: 'ask first',
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),

              // Sticky Bottom Bar (Screen S3)
              Container(
                decoration: const BoxDecoration(
                  color: AppTheme.white,
                  border: Border(top: BorderSide(color: AppTheme.hairline)),
                  boxShadow: [AppTheme.shadowE2],
                ),
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                child: SafeArea(
                  top: false,
                  child: Column(
                    children: [
                      // Refund terms rule (directly above CTA, not behind a link)
                      const Row(
                        children: [
                          Icon(Icons.info_outline_rounded, size: 13, color: AppTheme.ink500),
                          SizedBox(width: 4),
                          Text(
                            'Free cancellation up to 30 mins before departure',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.ink500),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          // Fare
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '₹$fare',
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.ink900,
                                ),
                              ),
                              const Text(
                                '1 seat · UPI',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.ink500),
                              ),
                            ],
                          ),
                          const SizedBox(width: 20),
                          // Book Instantly CTA
                          Expanded(
                            child: ElevatedButton(
                              onPressed: isLoading ? null : _onBookPressed,
                              child: isLoading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.bolt_rounded, size: 18),
                                        SizedBox(width: 4),
                                        Text('Book instantly'),
                                      ],
                                    ),
                            ),
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

  Widget _buildRouteStop({
    required String time,
    required String title,
    String? subtitle,
    String? badge,
    Color? badgeBg,
    Color? badgeFg,
    bool isDashed = false,
    bool isPickup = false,
    bool isDropoff = false,
    bool isLast = false,
  }) {
    Widget shape;
    if (isPickup) {
      shape = Container(
        width: 14,
        height: 14,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: AppTheme.white,
          border: Border.all(color: AppTheme.teal700, width: 3),
        ),
      );
    } else if (isDropoff) {
      shape = Container(
        width: 13,
        height: 13,
        decoration: BoxDecoration(
          color: AppTheme.amber600,
          borderRadius: BorderRadius.circular(2),
        ),
      );
    } else {
      shape = Container(
        width: 10,
        height: 10,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          color: AppTheme.muted,
        ),
      );
    }

    return Column(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 44,
              child: Text(
                time,
                style: const TextStyle(
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                  color: AppTheme.ink900,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Padding(
              padding: const EdgeInsets.only(top: 2.0),
              child: shape,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          title,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: isPickup || isDropoff ? FontWeight.w800 : FontWeight.w600,
                            color: AppTheme.ink900,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (badge != null) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: badgeBg ?? AppTheme.sunk,
                            borderRadius: BorderRadius.circular(AppTheme.radiusTag),
                          ),
                          child: Text(
                            badge,
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: badgeFg ?? AppTheme.ink900,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.ink500,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
        if (!isLast)
          Row(
            children: [
              const SizedBox(width: 52),
              Container(
                width: 14,
                alignment: Alignment.center,
                child: Container(
                  width: 2,
                  height: 22,
                  color: isDashed ? AppTheme.hairline : AppTheme.teal700,
                ),
              ),
            ],
          ),
      ],
    );
  }

  Widget _buildGoodToKnowItem({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppTheme.sunk,
        borderRadius: BorderRadius.circular(AppTheme.radiusCtl),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.ink700),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.ink900),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 10, color: AppTheme.ink500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
