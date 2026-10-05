import '../../../../core/constants/app_constants.dart';
import '../../../../core/models/location_model.dart';
import '../../../../core/network/api_client.dart';
import 'package:carpooling_passenger_app/features/feed/data/models/feed_trip_model.dart';

abstract class TripSearchRemoteDataSource {
  Future<List<LocationModel>> searchPlaces(String query);

  Future<List<FeedTripModel>> searchTripsByRoute({
    required LocationModel origin,
    required LocationModel destination,
    required DateTime dateAndTime,
    int seats = 1,
    int page = 1,
    int limit = 10,
  });
}

class TripSearchRemoteDataSourceImpl implements TripSearchRemoteDataSource {
  final ApiClient apiClient;

  TripSearchRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<LocationModel>> searchPlaces(String query) async {
    final response = await apiClient.get(
      AppConstants.searchPlacesEndpoint,
      queryParameters: {'q': query},
    );

    List<dynamic> list = [];
    if (response is List) {
      list = response;
    } else if (response is Map<String, dynamic> && response['data'] is List) {
      list = response['data'] as List;
    }

    return list
        .map((item) => LocationModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<List<FeedTripModel>> searchTripsByRoute({
    required LocationModel origin,
    required LocationModel destination,
    required DateTime dateAndTime,
    int seats = 1,
    int page = 1,
    int limit = 10,
  }) async {
    final response = await apiClient.post(
      AppConstants.searchRouteTripsEndpoint,
      data: {
        'origin': origin.toJson(),
        'destination': destination.toJson(),
        'dateAndTime': dateAndTime.toUtc().toIso8601String(),
        'seats': seats,
        'pagination': {
          'page': page,
          'limit': limit,
        },
      },
    );

    List<dynamic> list = [];
    if (response is Map<String, dynamic>) {
      if (response.containsKey('data') && response['data'] is List) {
        list = response['data'] as List;
      }
    } else if (response is List) {
      list = response;
    }

    return list
        .map((item) => FeedTripModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }
}
