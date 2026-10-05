import 'package:equatable/equatable.dart';
import 'driver_model.dart';

class FeedTripModel extends Equatable {
  final String id;
  final String origin;
  final double originLat;
  final double originLon;
  final String destinationLocation;
  final String departureTime;
  final int availableSeats;
  final num pricePerKm;
  final num? distanceFromCurrentLocationKm;
  final DriverModel? driver;
  final CarModel? car;

  const FeedTripModel({
    required this.id,
    required this.origin,
    required this.originLat,
    required this.originLon,
    required this.destinationLocation,
    required this.departureTime,
    required this.availableSeats,
    required this.pricePerKm,
    this.distanceFromCurrentLocationKm,
    this.driver,
    this.car,
  });

  factory FeedTripModel.fromJson(Map<String, dynamic> json) {
    return FeedTripModel(
      id: json['id'] as String? ?? json['_id'] as String? ?? '',
      origin: json['origin'] as String? ?? '',
      originLat: (json['originLat'] as num?)?.toDouble() ?? 0.0,
      originLon: (json['originLon'] as num?)?.toDouble() ?? 0.0,
      destinationLocation: json['destinationLocation'] as String? ?? '',
      departureTime: json['departureTime'] as String? ?? '',
      availableSeats: (json['availableSeats'] as num?)?.toInt() ?? 0,
      pricePerKm: (json['pricePerKm'] as num?) ?? 0,
      distanceFromCurrentLocationKm:
          json['distanceFromCurrentLocationKm'] as num?,
      driver: json['driver'] != null
          ? DriverModel.fromJson(json['driver'] as Map<String, dynamic>)
          : null,
      car: json['car'] != null
          ? CarModel.fromJson(json['car'] as Map<String, dynamic>)
          : null,
    );
  }

  @override
  List<Object?> get props => [
        id,
        origin,
        originLat,
        originLon,
        destinationLocation,
        departureTime,
        availableSeats,
        pricePerKm,
        distanceFromCurrentLocationKm,
        driver,
        car,
      ];
}
