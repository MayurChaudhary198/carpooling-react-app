import 'package:firebase_database/firebase_database.dart';
import '../../../../core/constants/app_constants.dart';
import '../models/tracking_data_model.dart';

abstract class TrackingRealtimeDataSource {
  Stream<TrackingDataModel?> listenToTripTracking(String tripId);
}

class TrackingRealtimeDataSourceImpl implements TrackingRealtimeDataSource {
  final FirebaseDatabase? database;

  TrackingRealtimeDataSourceImpl({this.database});

  @override
  Stream<TrackingDataModel?> listenToTripTracking(String tripId) {
    try {
      final db = database ?? FirebaseDatabase.instance;
      final ref = db.ref(AppConstants.tripTrackingPath(tripId));

      return ref.onValue.map((event) {
        final data = event.snapshot.value;
        if (data == null || data is! Map) {
          return null;
        }
        return TrackingDataModel.fromJson(data);
      });
    } catch (_) {
      // Return empty stream if Firebase is not yet initialized with credentials
      return const Stream.empty();
    }
  }
}
