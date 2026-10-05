import '../../../../core/models/location_model.dart';
import '../../data/models/booking_model.dart';

abstract class BookingRepository {
  Future<BookingModel> bookTrip({
    required String tripId,
    required int seats,
    required LocationModel pickupLocation,
    required LocationModel dropoffLocation,
  });

  Future<void> joinWaitlist({
    required String tripId,
    required int seats,
    required LocationModel pickupLocation,
    required LocationModel dropoffLocation,
  });

  Future<List<BookingModel>> getPassengerBookings();

  Future<void> cancelBooking(String bookingId);
}
