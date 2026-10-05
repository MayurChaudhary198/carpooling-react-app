import 'package:equatable/equatable.dart';

class LocationModel extends Equatable {
  final String name;
  final double lat;
  final double lon;

  const LocationModel({
    required this.name,
    required this.lat,
    required this.lon,
  });

  factory LocationModel.fromJson(Map<String, dynamic> json) {
    return LocationModel(
      name: json['name'] as String? ?? json['fullName'] as String? ?? '',
      lat: (json['lat'] as num?)?.toDouble() ?? 0.0,
      lon: (json['lon'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'lat': lat,
      'lon': lon,
    };
  }

  @override
  List<Object?> get props => [name, lat, lon];
}
