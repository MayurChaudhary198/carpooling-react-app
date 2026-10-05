import '../../../../core/constants/app_constants.dart';
import '../../../../core/models/location_model.dart';
import '../../../../core/network/api_client.dart';
import '../models/feed_trip_model.dart';

abstract class FeedRemoteDataSource {
  Future<List<FeedTripModel>> getFeedTrips({
    required LocationModel currentLocation,
    int radiusKm = AppConstants.defaultRadiusKm,
    int seats = 1,
    int page = 1,
    int limit = 10,
  });
}

class FeedRemoteDataSourceImpl implements FeedRemoteDataSource {
  final ApiClient apiClient;

  FeedRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<FeedTripModel>> getFeedTrips({
    required LocationModel currentLocation,
    int radiusKm = AppConstants.defaultRadiusKm,
    int seats = 1,
    int page = 1,
    int limit = 10,
  }) async {
    final response = await apiClient.post(
      AppConstants.feedEndpoint,
      data: {
        'currentLocation': currentLocation.toJson(),
        'radiusKm': radiusKm,
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
        list = response['data'] as List<dynamic>;
      }
    } else if (response is List) {
      list = response;
    }

    return list
        .map((item) => FeedTripModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }
}
