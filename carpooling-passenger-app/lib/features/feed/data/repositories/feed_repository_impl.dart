import '../../../../core/constants/app_constants.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/models/location_model.dart';
import '../../domain/repositories/feed_repository.dart';
import '../datasources/feed_remote_datasource.dart';
import '../models/feed_trip_model.dart';

class FeedRepositoryImpl implements FeedRepository {
  final FeedRemoteDataSource remoteDataSource;

  FeedRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<FeedTripModel>> getFeedTrips({
    required LocationModel currentLocation,
    int radiusKm = AppConstants.defaultRadiusKm,
    int seats = 1,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      return await remoteDataSource.getFeedTrips(
        currentLocation: currentLocation,
        radiusKm: radiusKm,
        seats: seats,
        page: page,
        limit: limit,
      );
    } on ServerException catch (e) {
      throw ServerFailure(e.message, field: e.field);
    } catch (e) {
      throw ServerFailure(e.toString());
    }
  }
}
