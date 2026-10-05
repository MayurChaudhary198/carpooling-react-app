import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/models/location_model.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_toast.dart';
import 'package:carpooling_passenger_app/features/booking/presentation/pages/book_trip_page.dart';
import 'package:carpooling_passenger_app/features/feed/presentation/widgets/feed_trip_card.dart';
import '../bloc/trip_search_bloc.dart';
import '../bloc/trip_search_event.dart';
import '../bloc/trip_search_state.dart';

class TripSearchPage extends StatefulWidget {
  const TripSearchPage({super.key});

  @override
  State<TripSearchPage> createState() => _TripSearchPageState();
}

class _TripSearchPageState extends State<TripSearchPage> {
  final _originController = TextEditingController();
  final _destinationController = TextEditingController();

  LocationModel? _selectedOrigin;
  LocationModel? _selectedDestination;
  DateTime _selectedDateTime = DateTime.now();
  int _seats = 1;

  @override
  void dispose() {
    _originController.dispose();
    _destinationController.dispose();
    super.dispose();
  }

  Future<void> _selectDateTime() async {
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: _selectedDateTime,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );

    if (pickedDate != null && mounted) {
      final pickedTime = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(_selectedDateTime),
      );

      if (pickedTime != null) {
        setState(() {
          _selectedDateTime = DateTime(
            pickedDate.year,
            pickedDate.month,
            pickedDate.day,
            pickedTime.hour,
            pickedTime.minute,
          );
        });
      }
    }
  }

  void _onSearchTrips() {
    if (_selectedOrigin == null) {
      AppToast.showWarning(context, 'Please select a pickup place from suggestions');
      return;
    }
    if (_selectedDestination == null) {
      AppToast.showWarning(context, 'Please select a destination place from suggestions');
      return;
    }

    context.read<TripSearchBloc>().add(
          ExecuteRouteTripSearchEvent(
            origin: _selectedOrigin!,
            destination: _selectedDestination!,
            dateAndTime: _selectedDateTime,
            seats: _seats,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.backgroundDark : AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Route Search & Matcher'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Floating Route Search Card
            Container(
              decoration: BoxDecoration(
                color: isDark ? AppTheme.surfaceDark : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(18.0),
              child: Column(
                children: [
                  // Origin Field
                  TextField(
                    controller: _originController,
                    decoration: InputDecoration(
                      hintText: 'Pickup Location',
                      prefixIcon: const Padding(
                        padding: EdgeInsets.all(12.0),
                        child: Icon(Icons.circle, size: 14, color: AppTheme.secondaryColor),
                      ),
                      suffixIcon: _originController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.close_rounded, size: 18),
                              onPressed: () {
                                _originController.clear();
                                setState(() => _selectedOrigin = null);
                              },
                            )
                          : null,
                    ),
                    onChanged: (val) {
                      context.read<TripSearchBloc>().add(
                            SearchPlacesQueryChangedEvent(query: val, isOrigin: true),
                          );
                    },
                  ),
                  const SizedBox(height: 12),
                  // Destination Field
                  TextField(
                    controller: _destinationController,
                    decoration: InputDecoration(
                      hintText: 'Where to? (Destination)',
                      prefixIcon: const Padding(
                        padding: EdgeInsets.all(12.0),
                        child: Icon(Icons.location_on_rounded, size: 18, color: AppTheme.errorColor),
                      ),
                      suffixIcon: _destinationController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.close_rounded, size: 18),
                              onPressed: () {
                                _destinationController.clear();
                                setState(() => _selectedDestination = null);
                              },
                            )
                          : null,
                    ),
                    onChanged: (val) {
                      context.read<TripSearchBloc>().add(
                            SearchPlacesQueryChangedEvent(query: val, isOrigin: false),
                          );
                    },
                  ),
                  const SizedBox(height: 16),
                  // Date Picker & Seats Selector Row
                  Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: InkWell(
                          onTap: _selectDateTime,
                          borderRadius: BorderRadius.circular(14),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                            decoration: BoxDecoration(
                              color: isDark ? AppTheme.surfaceSubtleDark : AppTheme.surfaceSubtle,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.calendar_today_rounded, size: 16, color: AppTheme.primaryAccent),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    Formatters.formatDateTime(_selectedDateTime.toIso8601String()),
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: isDark ? AppTheme.textPrimaryDark : AppTheme.textPrimaryLight,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        flex: 2,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
                          decoration: BoxDecoration(
                            color: isDark ? AppTheme.surfaceSubtleDark : AppTheme.surfaceSubtle,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                            ),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<int>(
                              value: _seats,
                              isExpanded: true,
                              icon: const Icon(Icons.people_rounded, size: 18, color: AppTheme.primaryColor),
                              items: [1, 2, 3, 4, 5, 6].map((s) {
                                return DropdownMenuItem<int>(
                                  value: s,
                                  child: Text(
                                    '$s Seat${s > 1 ? 's' : ''}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: isDark ? AppTheme.textPrimaryDark : AppTheme.textPrimaryLight,
                                    ),
                                  ),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _seats = val);
                              },
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Primary Search Button
                  ElevatedButton.icon(
                    onPressed: _onSearchTrips,
                    icon: const Icon(Icons.search_rounded, size: 20),
                    label: const Text('Find Matching Carpools'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Autocomplete suggestions or Results
            BlocBuilder<TripSearchBloc, TripSearchState>(
              builder: (context, state) {
                if (state is PlaceSuggestionsLoading) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24.0),
                      child: CircularProgressIndicator(color: AppTheme.primaryAccent),
                    ),
                  );
                }

                if (state is PlaceSuggestionsLoaded) {
                  if (state.places.isEmpty) return const SizedBox();
                  return Container(
                    decoration: BoxDecoration(
                      color: isDark ? AppTheme.surfaceDark : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                      ),
                    ),
                    child: ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: state.places.length,
                      separatorBuilder: (_, __) => Divider(
                        height: 1,
                        color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                      ),
                      itemBuilder: (context, index) {
                        final place = state.places[index];
                        return ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryTint,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.place_rounded, color: AppTheme.primaryAccent, size: 18),
                          ),
                          title: Text(
                            place.name,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: isDark ? AppTheme.textPrimaryDark : AppTheme.textPrimaryLight,
                            ),
                          ),
                          onTap: () {
                            setState(() {
                              if (state.isOrigin) {
                                _selectedOrigin = place;
                                _originController.text = place.name;
                              } else {
                                _selectedDestination = place;
                                _destinationController.text = place.name;
                              }
                            });
                            context.read<TripSearchBloc>().add(ClearSearchEvent());
                          },
                        );
                      },
                    ),
                  );
                }

                if (state is RouteTripsLoading) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(32.0),
                      child: CircularProgressIndicator(color: AppTheme.primaryAccent),
                    ),
                  );
                }

                if (state is RouteTripsLoaded) {
                  if (state.trips.isEmpty) {
                    return Padding(
                      padding: const EdgeInsets.all(32.0),
                      child: Column(
                        children: [
                          Icon(Icons.alt_route_rounded, size: 54, color: AppTheme.textTertiaryLight),
                          const SizedBox(height: 14),
                          Text(
                            'No Rides Matching This Route',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                              color: isDark ? AppTheme.textPrimaryDark : AppTheme.textPrimaryLight,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'No drivers have registered trips along this specific path for the chosen departure window.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 10.0),
                        child: Text(
                          '${state.trips.length} Matching Ride${state.trips.length > 1 ? 's' : ''}',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                            color: isDark ? AppTheme.textPrimaryDark : AppTheme.textPrimaryLight,
                          ),
                        ),
                      ),
                      ...state.trips.map(
                        (trip) => FeedTripCard(
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
                        ),
                      ),
                    ],
                  );
                }

                if (state is TripSearchError) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Text(
                        state.message,
                        style: const TextStyle(color: AppTheme.errorColor, fontWeight: FontWeight.w600),
                      ),
                    ),
                  );
                }

                return const SizedBox();
              },
            ),
          ],
        ),
      ),
    );
  }
}
