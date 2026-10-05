import 'package:carpooling_passenger_app/core/errors/exceptions.dart';
import 'package:carpooling_passenger_app/core/errors/failures.dart';
import 'package:carpooling_passenger_app/core/models/location_model.dart';
import 'package:carpooling_passenger_app/features/feed/data/models/feed_trip_model.dart';
import 'package:carpooling_passenger_app/features/trip_search/domain/repositories/trip_search_repository.dart';
import 'package:carpooling_passenger_app/features/trip_search/data/datasources/trip_search_remote_datasource.dart';

class TripSearchRepositoryImpl implements TripSearchRepository {
  final TripSearchRemoteDataSource remoteDataSource;

  TripSearchRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<LocationModel>> searchPlaces(String query) async {
    try {
      return await remoteDataSource.searchPlaces(query);
    } on ServerException catch (e) {
      throw ServerFailure(e.message, field: e.field);
    } catch (e) {
      throw ServerFailure(e.toString());
    }
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
    try {
      return await remoteDataSource.searchTripsByRoute(
        origin: origin,
        destination: destination,
        dateAndTime: dateAndTime,
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
