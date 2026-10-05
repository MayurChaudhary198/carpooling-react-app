import '../../../../core/constants/app_constants.dart';
import '../../../../core/models/location_model.dart';
import '../../../../core/network/api_client.dart';
import '../models/booking_model.dart';

abstract class BookingRemoteDataSource {
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

class BookingRemoteDataSourceImpl implements BookingRemoteDataSource {
  final ApiClient apiClient;

  BookingRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<BookingModel> bookTrip({
    required String tripId,
    required int seats,
    required LocationModel pickupLocation,
    required LocationModel dropoffLocation,
  }) async {
    final response = await apiClient.post(
      AppConstants.bookTripEndpoint(tripId),
      data: {
        'seats': seats,
        'pickupLocation': pickupLocation.toJson(),
        'dropoffLocation': dropoffLocation.toJson(),
      },
    );

    if (response is Map<String, dynamic>) {
      if (response['booking'] is Map<String, dynamic>) {
        return BookingModel.fromJson(response['booking'] as Map<String, dynamic>);
      }
      return BookingModel.fromJson(response);
    }
    throw Exception('Invalid booking response format');
  }

  @override
  Future<void> joinWaitlist({
    required String tripId,
    required int seats,
    required LocationModel pickupLocation,
    required LocationModel dropoffLocation,
  }) async {
    await apiClient.post(
      AppConstants.waitlistBookingEndpoint(tripId),
      data: {
        'seats': seats,
        'pickupLocation': pickupLocation.toJson(),
        'dropoffLocation': dropoffLocation.toJson(),
      },
    );
  }

  @override
  Future<List<BookingModel>> getPassengerBookings() async {
    final response = await apiClient.get(
      AppConstants.getPassengerBookingsEndpoint,
    );

    List<dynamic> list = [];
    if (response is List) {
      list = response;
    } else if (response is Map<String, dynamic>) {
      if (response['bookings'] is List) {
        list = response['bookings'] as List;
      } else if (response['data'] is List) {
        list = response['data'] as List;
      } else if (response['data'] is Map<String, dynamic> &&
          response['data']['bookings'] is List) {
        list = response['data']['bookings'] as List;
      }
    }

    return list
        .map((item) => BookingModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> cancelBooking(String bookingId) async {
    await apiClient.put(
      AppConstants.cancelBookingEndpoint(bookingId),
    );
  }
}
