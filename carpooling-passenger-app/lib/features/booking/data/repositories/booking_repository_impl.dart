import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/models/location_model.dart';
import '../../domain/repositories/booking_repository.dart';
import '../datasources/booking_remote_datasource.dart';
import '../models/booking_model.dart';

class BookingRepositoryImpl implements BookingRepository {
  final BookingRemoteDataSource remoteDataSource;

  BookingRepositoryImpl({required this.remoteDataSource});

  @override
  Future<BookingModel> bookTrip({
    required String tripId,
    required int seats,
    required LocationModel pickupLocation,
    required LocationModel dropoffLocation,
  }) async {
    try {
      return await remoteDataSource.bookTrip(
        tripId: tripId,
        seats: seats,
        pickupLocation: pickupLocation,
        dropoffLocation: dropoffLocation,
      );
    } on ServerException catch (e) {
      throw ServerFailure(e.message, field: e.field);
    } catch (e) {
      throw ServerFailure(e.toString());
    }
  }

  @override
  Future<void> joinWaitlist({
    required String tripId,
    required int seats,
    required LocationModel pickupLocation,
    required LocationModel dropoffLocation,
  }) async {
    try {
      await remoteDataSource.joinWaitlist(
        tripId: tripId,
        seats: seats,
        pickupLocation: pickupLocation,
        dropoffLocation: dropoffLocation,
      );
    } on ServerException catch (e) {
      throw ServerFailure(e.message, field: e.field);
    } catch (e) {
      throw ServerFailure(e.toString());
    }
  }

  @override
  Future<List<BookingModel>> getPassengerBookings() async {
    try {
      return await remoteDataSource.getPassengerBookings();
    } on ServerException catch (e) {
      throw ServerFailure(e.message, field: e.field);
    } catch (e) {
      throw ServerFailure(e.toString());
    }
  }

  @override
  Future<void> cancelBooking(String bookingId) async {
    try {
      await remoteDataSource.cancelBooking(bookingId);
    } on ServerException catch (e) {
      throw ServerFailure(e.message, field: e.field);
    } catch (e) {
      throw ServerFailure(e.toString());
    }
  }
}
