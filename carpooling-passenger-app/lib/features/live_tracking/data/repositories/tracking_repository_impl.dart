import '../../domain/repositories/tracking_repository.dart';
import '../datasources/tracking_realtime_datasource.dart';
import '../models/tracking_data_model.dart';

class TrackingRepositoryImpl implements TrackingRepository {
  final TrackingRealtimeDataSource realtimeDataSource;

  TrackingRepositoryImpl({required this.realtimeDataSource});

  @override
  Stream<TrackingDataModel?> listenToTripTracking(String tripId) {
    return realtimeDataSource.listenToTripTracking(tripId);
  }
}
