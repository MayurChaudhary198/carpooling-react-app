import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_toast.dart';
import '../../../../core/widgets/hop_on_badge.dart';
import '../../../../core/widgets/hop_on_route_timeline.dart';
import 'package:carpooling_passenger_app/features/live_tracking/presentation/pages/live_tracking_page.dart';
import '../bloc/booking_bloc.dart';
import '../bloc/booking_event.dart';
import '../bloc/booking_state.dart';
import 'package:carpooling_passenger_app/features/booking/data/models/booking_model.dart';

class MyBookingsPage extends StatefulWidget {
  const MyBookingsPage({super.key});

  @override
  State<MyBookingsPage> createState() => _MyBookingsPageState();
}

class _MyBookingsPageState extends State<MyBookingsPage> {
  int _selectedTabIndex = 0; // 0: All, 1: Active, 2: Completed, 3: Cancelled

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  void _loadBookings({bool isRefresh = false}) {
    context.read<BookingBloc>().add(FetchMyBookingsEvent(isRefresh: isRefresh));
  }

  void _confirmCancel(BookingModel booking) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.canvas,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusSheet),
          side: const BorderSide(color: AppTheme.hairline),
        ),
        title: const Text(
          'Cancel ride?',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 18,
            color: AppTheme.ink900,
          ),
        ),
        content: const Text(
          'Are you sure you want to cancel this booking? Another passenger on the corridor waitlist may claim this seat.',
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
            child: const Text('Keep ride', style: TextStyle(fontWeight: FontWeight.w700)),
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
              context.read<BookingBloc>().add(CancelBookingEvent(booking.id));
            },
            child: const Text('Cancel ride', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  List<BookingModel> _filterBookings(List<BookingModel> all) {
    if (_selectedTabIndex == 1) {
      return all.where((b) => b.isAccepted || b.isOngoing || b.isPending).toList();
    } else if (_selectedTabIndex == 2) {
      return all.where((b) => b.isCompleted).toList();
    } else if (_selectedTabIndex == 3) {
      return all.where((b) => b.isCancelled).toList();
    }
    return all;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.canvas,
      appBar: AppBar(
        title: const Text(
          'My trips',
          style: TextStyle(
            color: AppTheme.ink900,
            fontWeight: FontWeight.w800,
            fontSize: 20,
          ),
        ),
        backgroundColor: AppTheme.canvas,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppTheme.ink700),
            onPressed: () => _loadBookings(isRefresh: true),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppTheme.hairline, height: 1),
        ),
      ),
      body: Column(
        children: [
          // Filter Chips Row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: AppTheme.canvas,
              border: Border(bottom: BorderSide(color: AppTheme.hairline)),
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildTabChip('All trips', 0),
                  const SizedBox(width: 8),
                  _buildTabChip('Active', 1),
                  const SizedBox(width: 8),
                  _buildTabChip('Completed', 2),
                  const SizedBox(width: 8),
                  _buildTabChip('Cancelled', 3),
                ],
              ),
            ),
          ),

          // Content Area
          Expanded(
            child: BlocConsumer<BookingBloc, BookingState>(
              listener: (context, state) {
                if (state is BookingCancelledSuccess) {
                  AppToast.showSuccess(context, 'Booking cancelled successfully');
                } else if (state is BookingError) {
                  AppToast.showError(context, state.message);
                }
              },
              builder: (context, state) {
                if (state is BookingsLoading || state is BookingInitial) {
                  return const Center(
                    child: CircularProgressIndicator(color: AppTheme.teal700),
                  );
                }

                if (state is BookingError) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: AppTheme.amber50,
                              borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                              border: Border.all(color: AppTheme.amber600.withValues(alpha: 0.3)),
                            ),
                            child: const Icon(Icons.cloud_off_rounded, color: AppTheme.amber600, size: 28),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Unable to load bookings',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.ink900,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            state.message,
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 13, color: AppTheme.ink500),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: () => _loadBookings(isRefresh: true),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.teal700,
                              foregroundColor: AppTheme.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            ),
                            icon: const Icon(Icons.refresh, size: 16),
                            label: const Text('Try again', style: TextStyle(fontWeight: FontWeight.w700)),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                if (state is BookingsLoaded) {
                  final filtered = _filterBookings(state.bookings);

                  if (filtered.isEmpty) {
                    return RefreshIndicator(
                      color: AppTheme.teal700,
                      onRefresh: () async => _loadBookings(isRefresh: true),
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(32),
                        children: [
                          const SizedBox(height: 60),
                          Center(
                            child: Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                color: AppTheme.sunk,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppTheme.hairline),
                              ),
                              child: const Icon(
                                Icons.confirmation_number_outlined,
                                size: 32,
                                color: AppTheme.ink500,
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),
                          Text(
                            _selectedTabIndex == 0
                                ? 'No bookings found'
                                : 'No ${_getTabTitle(_selectedTabIndex).toLowerCase()} trips',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.ink900,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Find rides on the discovery feed or search your daily commute corridor to get started.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              color: AppTheme.ink500,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  return RefreshIndicator(
                    color: AppTheme.teal700,
                    onRefresh: () async => _loadBookings(isRefresh: true),
                    child: ListView.builder(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(16),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final booking = filtered[index];
                        return _buildBookingCard(booking);
                      },
                    ),
                  );
                }

                return const SizedBox();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabChip(String label, int index) {
    final isSelected = _selectedTabIndex == index;

    return InkWell(
      onTap: () => setState(() => _selectedTabIndex = index),
      borderRadius: BorderRadius.circular(AppTheme.radiusControl),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.teal700 : AppTheme.sunk,
          borderRadius: BorderRadius.circular(AppTheme.radiusControl),
          border: Border.all(
            color: isSelected ? AppTheme.teal700 : AppTheme.hairline,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? AppTheme.white : AppTheme.ink700,
          ),
        ),
      ),
    );
  }

  String _getTabTitle(int index) {
    switch (index) {
      case 1:
        return 'Active';
      case 2:
        return 'Completed';
      case 3:
        return 'Cancelled';
      default:
        return '';
    }
  }

  Widget _buildBookingCard(BookingModel booking) {
    final canTrack = booking.isAccepted || booking.isOngoing;
    final driver = booking.trip?.driver;
    final car = booking.trip?.car;

    Widget statusBadge;
    if (booking.isOngoing) {
      statusBadge = HopOnBadge.success('ON ROUTE');
    } else if (booking.isAccepted) {
      statusBadge = HopOnBadge.success('CONFIRMED');
    } else if (booking.isPending) {
      statusBadge = HopOnBadge.neutral('PENDING');
    } else if (booking.isCompleted) {
      statusBadge = HopOnBadge.neutral('COMPLETED');
    } else {
      statusBadge = HopOnBadge.alert('CANCELLED');
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppTheme.canvas,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(color: AppTheme.hairline),
        boxShadow: const [AppTheme.shadowE1],
      ),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Status Badge & Monospace Price
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              statusBadge,
              Text(
                '${Formatters.formatCurrency(booking.price)} · ${booking.seatBooked} seat${booking.seatBooked > 1 ? 's' : ''}',
                style: const TextStyle(
                  fontFamily: AppTheme.fontFamilyMono,
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                  color: AppTheme.ink900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Driver & Vehicle row (if available)
          if (driver != null) ...[
            Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: AppTheme.teal50,
                    borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                    border: Border.all(color: AppTheme.hairline),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    driver.name.isNotEmpty ? driver.name[0].toUpperCase() : 'D',
                    style: const TextStyle(
                      color: AppTheme.teal700,
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                    ),
                  ),
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
                              driver.name,
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
                        ],
                      ),
                      if (car != null) ...[
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            HopOnBadge.plate(car.licensePlate ?? 'GJ01 KT 4821'),
                            const SizedBox(width: 6),
                            Text(
                              '${car.make} ${car.model}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppTheme.ink500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],

          // Boarding PIN snippet (if present and active)
          if (booking.pickupOtp != null && (booking.isAccepted || booking.isOngoing)) ...[
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
                  const Text(
                    'Boarding PIN',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.teal700,
                    ),
                  ),
                  Text(
                    booking.pickupOtp!,
                    style: const TextStyle(
                      fontFamily: AppTheme.fontFamilyMono,
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 3,
                      color: AppTheme.teal700,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Accessible HopOn Route Timeline
          HopOnRouteTimeline(
            origin: booking.pickupLocation,
            destination: booking.dropoffLocation,
            originWalk: '300 m',
            destinationWalk: '500 m',
          ),
          const SizedBox(height: 14),

          // Action Buttons
          Row(
            children: [
              if (canTrack) ...[
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => LiveTrackingPage(booking: booking),
                        ),
                      );
                    },
                    icon: const Icon(Icons.navigation_outlined, size: 16),
                    label: const Text('Track ride live →', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.teal700,
                      foregroundColor: AppTheme.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              if (booking.isCanCancel)
                OutlinedButton(
                  onPressed: () => _confirmCancel(booking),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.red700,
                    side: const BorderSide(color: AppTheme.hairline),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                    ),
                  ),
                  child: const Text('Cancel ride', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

