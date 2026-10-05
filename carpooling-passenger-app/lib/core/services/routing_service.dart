import 'dart:math' as math;
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:latlong2/latlong.dart';

class RouteResult {
  final List<LatLng> coordinates;
  final double distanceKm;
  final int durationMinutes;
  final bool isRealRoute;
  final String engine;

  const RouteResult({
    required this.coordinates,
    required this.distanceKm,
    required this.durationMinutes,
    required this.isRealRoute,
    required this.engine,
  });
}

class RoutingService {
  final Dio _dio;

  RoutingService({Dio? dio})
      : _dio = dio ??
            Dio(
              BaseOptions(
                connectTimeout: const Duration(seconds: 7),
                receiveTimeout: const Duration(seconds: 7),
              ),
            );

  /// Calculates driving route between origin and destination with optional waypoints.
  /// Matches the OSRM & OpenRouteService architecture used in carpooling-driver.
  Future<RouteResult> getRoute({
    required LatLng origin,
    required LatLng destination,
    List<LatLng> waypoints = const [],
  }) async {
    final allPoints = [origin, ...waypoints, destination];

    // 1. Primary: OSRM Routing Engine (Fast, free, no key required, covers highways & city roads)
    try {
      final coordString = allPoints
          .map((p) => '${p.longitude},${p.latitude}')
          .join(';');

      final osrmUrl =
          'https://router.project-osrm.org/route/v1/driving/$coordString?overview=full&geometries=geojson';

      final response = await _dio.get(osrmUrl);

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        if (data['code'] == 'Ok' && (data['routes'] as List).isNotEmpty) {
          final route = data['routes'][0] as Map<String, dynamic>;
          final rawCoords = (route['geometry']['coordinates'] as List)
              .cast<List<dynamic>>();

          final coordinates = rawCoords
              .map((c) => LatLng(
                    (c[1] as num).toDouble(),
                    (c[0] as num).toDouble(),
                  ))
              .toList();

          final distanceMeters = (route['distance'] as num).toDouble();
          final durationSecs = (route['duration'] as num).toDouble();

          final distanceKm = ((distanceMeters / 1000) * 10).round() / 10;
          final durationMinutes = (durationSecs / 60).round();

          return RouteResult(
            coordinates: coordinates,
            distanceKm: distanceKm,
            durationMinutes: durationMinutes,
            isRealRoute: true,
            engine: 'osrm',
          );
        }
      }
    } catch (_) {
      // OSRM failed or rate-limited; fallback to ORS
    }

    // 2. Secondary: OpenRouteService (Using driver app's API key)
    final orsKey = dotenv.env['ORS_API_KEY'];
    if (orsKey != null && orsKey.isNotEmpty) {
      try {
        final coordinates =
            allPoints.map((p) => [p.longitude, p.latitude]).toList();

        final response = await _dio.post(
          'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
          data: {'coordinates': coordinates},
          options: Options(
            headers: {
              'Authorization': orsKey,
              'Content-Type': 'application/json',
            },
          ),
        );

        if (response.statusCode == 200 && response.data != null) {
          final data = response.data as Map<String, dynamic>;
          final features = data['features'] as List;
          if (features.isNotEmpty) {
            final feature = features[0] as Map<String, dynamic>;
            final rawCoords = (feature['geometry']['coordinates'] as List)
                .cast<List<dynamic>>();

            final coordinates = rawCoords
                .map((c) => LatLng(
                      (c[1] as num).toDouble(),
                      (c[0] as num).toDouble(),
                    ))
                .toList();

            final summary =
                feature['properties']?['summary'] as Map<String, dynamic>?;
            final distanceMeters =
                (summary?['distance'] as num?)?.toDouble() ?? 0.0;
            final durationSecs =
                (summary?['duration'] as num?)?.toDouble() ?? 0.0;

            final distanceKm = ((distanceMeters / 1000) * 10).round() / 10;
            final durationMinutes = (durationSecs / 60).round();

            return RouteResult(
              coordinates: coordinates,
              distanceKm: distanceKm,
              durationMinutes: durationMinutes,
              isRealRoute: true,
              engine: 'ors',
            );
          }
        }
      } catch (_) {
        // ORS failed; fallback to straight-line interpolation
      }
    }

    // 3. Fallback: Haversine distance with interpolated line
    double totalMeters = 0;
    for (int i = 0; i < allPoints.length - 1; i++) {
      totalMeters += _haversineDistance(allPoints[i], allPoints[i + 1]);
    }

    final distanceKm = ((totalMeters / 1000) * 10).round() / 10;
    final durationMinutes = ((distanceKm / 45) * 60).round(); // Avg 45 km/h

    return RouteResult(
      coordinates: allPoints,
      distanceKm: distanceKm,
      durationMinutes: durationMinutes,
      isRealRoute: false,
      engine: 'haversine',
    );
  }

  double _haversineDistance(LatLng p1, LatLng p2) {
    const r = 6371000.0; // Earth radius in meters
    final dLat = _degToRad(p2.latitude - p1.latitude);
    final dLon = _degToRad(p2.longitude - p1.longitude);
    final lat1 = _degToRad(p1.latitude);
    final lat2 = _degToRad(p2.latitude);

    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.sin(dLon / 2) * math.sin(dLon / 2) * math.cos(lat1) * math.cos(lat2);
    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return r * c;
  }

  double _degToRad(double deg) => deg * (math.pi / 180.0);
}
