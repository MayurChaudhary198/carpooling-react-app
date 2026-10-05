import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/models/location_model.dart';
import '../../domain/repositories/feed_repository.dart';
import 'feed_event.dart';
import 'feed_state.dart';

class FeedBloc extends Bloc<FeedEvent, FeedState> {
  final FeedRepository feedRepository;

  FeedBloc({required this.feedRepository}) : super(FeedInitial()) {
    on<FetchFeedTripsEvent>(_onFetchFeedTrips);
  }

  Future<void> _onFetchFeedTrips(
    FetchFeedTripsEvent event,
    Emitter<FeedState> emit,
  ) async {
    if (!event.isRefresh) {
      emit(FeedLoading());
    }

    try {
      LocationModel targetLocation = event.location ??
          const LocationModel(
            name: 'Current Location',
            lat: 23.0301,
            lon: 72.5082,
          );

      if (event.location == null) {
        try {
          LocationPermission permission = await Geolocator.checkPermission();
          if (permission == LocationPermission.denied) {
            permission = await Geolocator.requestPermission();
          }
          if (permission == LocationPermission.always ||
              permission == LocationPermission.whileInUse) {
            final pos = await Geolocator.getCurrentPosition(
              desiredAccuracy: LocationAccuracy.high,
              timeLimit: const Duration(seconds: 5),
            );
            targetLocation = LocationModel(
              name: 'My Current Location',
              lat: pos.latitude,
              lon: pos.longitude,
            );
          }
        } catch (_) {
          // Keep default fallback if GPS unavailable
        }
      }

      final trips = await feedRepository.getFeedTrips(
        currentLocation: targetLocation,
        radiusKm: event.radiusKm,
        seats: event.seats,
      );

      emit(
        FeedLoaded(
          trips: trips,
          currentLocation: targetLocation,
          radiusKm: event.radiusKm,
          seats: event.seats,
        ),
      );
    } on Failure catch (e) {
      emit(FeedError(e.message));
    } catch (e) {
      emit(FeedError(e.toString()));
    }
  }
}
