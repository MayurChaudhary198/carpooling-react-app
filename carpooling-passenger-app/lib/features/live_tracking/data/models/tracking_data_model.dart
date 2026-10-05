import 'package:equatable/equatable.dart';

class TrackingDataModel extends Equatable {
  final String tripId;
  final String driverId;
  final String status;
  final double lat;
  final double lon;
  final double heading;
  final double speed;
  final double accuracy;
  final int updatedAt; // Milliseconds timestamp

  const TrackingDataModel({
    required this.tripId,
    required this.driverId,
    required this.status,
    required this.lat,
    required this.lon,
    required this.heading,
    required this.speed,
    required this.accuracy,
    required this.updatedAt,
  });

  factory TrackingDataModel.fromJson(Map<dynamic, dynamic> json) {
    return TrackingDataModel(
      tripId: json['tripId']?.toString() ?? '',
      driverId: json['driverId']?.toString() ?? '',
      status: json['status']?.toString() ?? 'ONGOING',
      lat: (json['lat'] as num?)?.toDouble() ?? 0.0,
      lon: (json['lon'] as num?)?.toDouble() ?? 0.0,
      heading: (json['heading'] as num?)?.toDouble() ?? 0.0,
      speed: (json['speed'] as num?)?.toDouble() ?? 0.0,
      accuracy: (json['accuracy'] as num?)?.toDouble() ?? 0.0,
      updatedAt: (json['updatedAt'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'tripId': tripId,
        'driverId': driverId,
        'status': status,
        'lat': lat,
        'lon': lon,
        'heading': heading,
        'speed': speed,
        'accuracy': accuracy,
        'updatedAt': updatedAt,
      };

  /// Returns true if last update was more than 30 seconds ago
  bool get isStale {
    if (updatedAt == 0) return true;
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    return (nowMs - updatedAt) > 30000;
  }

  @override
  List<Object?> get props => [
        tripId,
        driverId,
        status,
        lat,
        lon,
        heading,
        speed,
        accuracy,
        updatedAt,
      ];
}
