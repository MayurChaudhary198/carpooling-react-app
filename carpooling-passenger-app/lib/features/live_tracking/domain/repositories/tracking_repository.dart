import 'package:carpooling_passenger_app/features/live_tracking/data/models/tracking_data_model.dart';

abstract class TrackingRepository {
  Stream<TrackingDataModel?> listenToTripTracking(String tripId);
}
