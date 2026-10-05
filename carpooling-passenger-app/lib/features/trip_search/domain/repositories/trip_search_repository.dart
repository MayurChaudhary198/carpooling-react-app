import 'package:carpooling_passenger_app/core/models/location_model.dart';
import 'package:carpooling_passenger_app/features/feed/data/models/feed_trip_model.dart';

abstract class TripSearchRepository {
  Future<List<LocationModel>> searchPlaces(String query);

  Future<List<FeedTripModel>> searchTripsByRoute({
    required LocationModel origin,
    required LocationModel destination,
    required DateTime dateAndTime,
    int seats,
    int page,
    int limit,
  });
}
