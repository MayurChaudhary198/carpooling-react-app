import '../../../../core/models/location_model.dart';
import '../../data/models/feed_trip_model.dart';

abstract class FeedRepository {
  Future<List<FeedTripModel>> getFeedTrips({
    required LocationModel currentLocation,
    int radiusKm,
    int seats,
    int page,
    int limit,
  });
}
