import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/hop_on_badge.dart';
import '../../../../core/widgets/hop_on_route_timeline.dart';
import '../../data/models/feed_trip_model.dart';

class FeedTripCard extends StatelessWidget {
  final FeedTripModel trip;
  final VoidCallback onTap;

  const FeedTripCard({
    super.key,
    required this.trip,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isFull = trip.availableSeats <= 0;
    final totalSeats = 3; // Standard carpool capacity
    final bookedSeats = (totalSeats - trip.availableSeats).clamp(0, totalSeats);

    return Opacity(
      opacity: isFull ? 0.6 : 1.0,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppTheme.white,
          borderRadius: BorderRadius.circular(AppTheme.radiusCard),
          border: Border.all(color: AppTheme.hairline, width: 1),
          boxShadow: const [AppTheme.shadowE1],
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(AppTheme.radiusCard),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(AppTheme.radiusCard),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Who + Price Header
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Driver initials avatar
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppTheme.sunk,
                          borderRadius: BorderRadius.circular(AppTheme.radiusCtl),
                          border: Border.all(color: AppTheme.hairline),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          trip.driver != null && trip.driver!.name.isNotEmpty
                              ? trip.driver!.name
                                  .split(' ')
                                  .map((n) => n.isNotEmpty ? n[0] : '')
                                  .take(2)
                                  .join()
                                  .toUpperCase()
                              : 'KM',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.ink700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      // Driver name & rating
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              trip.driver?.name ?? 'Kavya Mehta',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.ink900,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                const Icon(Icons.star_rounded, size: 13, color: AppTheme.amber600),
                                const SizedBox(width: 3),
                                Text(
                                  '4.9 · 312 trips',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.emerald700,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      // Price
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            Formatters.formatCurrency(trip.pricePerKm * 15), // Approx typical leg fare
                            style: const TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.ink900,
                            ),
                          ),
                          const Text(
                            'per seat',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: AppTheme.ink500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // 2. What car
                  Text(
                    trip.car != null
                        ? '${trip.car!.color} ${trip.car!.make} ${trip.car!.model} · GJ01 · 4821'
                        : 'White Maruti Baleno · GJ01 · 4821',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.ink600,
                    ),
                  ),
                  const SizedBox(height: 14),

                  // 3. When/Where + Walk (Timeline)
                  HopOnRouteTimeline(
                    origin: trip.origin,
                    destination: trip.destinationLocation,
                    originTime: Formatters.formatTimeOnly(trip.departureTime),
                    destinationTime: '08:52',
                    originWalk: '240 m walk',
                    destinationWalk: '400 m · 37 min',
                    isWalkOver1km: (trip.distanceFromCurrentLocationKm ?? 0) > 1.0,
                  ),
                  const SizedBox(height: 14),

                  // 4. Seats indicator + Booking mode
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Seats graphical blocks
                      Row(
                        children: [
                          Row(
                            children: List.generate(totalSeats, (index) {
                              final isBooked = index < bookedSeats;
                              return Container(
                                width: 12,
                                height: 12,
                                margin: const EdgeInsets.only(right: 3),
                                decoration: BoxDecoration(
                                  color: isBooked ? AppTheme.ink900 : AppTheme.white,
                                  borderRadius: BorderRadius.circular(2),
                                  border: Border.all(
                                    color: isBooked ? AppTheme.ink900 : AppTheme.hairline,
                                    width: 1.5,
                                  ),
                                ),
                              );
                            }),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            isFull ? '0 of 3 left' : '${trip.availableSeats} of 3 left',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: isFull ? AppTheme.ink500 : AppTheme.ink900,
                            ),
                          ),
                        ],
                      ),
                      // Booking Mode Tag
                      isFull
                          ? const HopOnBadge(type: HopOnBadgeType.full)
                          : const HopOnBadge(type: HopOnBadgeType.instantBook),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
