import 'package:equatable/equatable.dart';
import 'package:carpooling_passenger_app/features/auth/data/models/user_model.dart';
import 'package:carpooling_passenger_app/features/feed/data/models/feed_trip_model.dart';

class BookingModel extends Equatable {
  final String id;
  final String tripId;
  final FeedTripModel? trip;
  final UserModel? passenger;
  final String pickupLocation;
  final String dropoffLocation;
  final int seatBooked;
  final num price;
  final String status; // PENDING, ACCEPTED, REJECTED, CANCELLED, COMPLETED, PICKEDUP
  final String? pickupOtp;
  final String? createdAt;

  const BookingModel({
    required this.id,
    required this.tripId,
    this.trip,
    this.passenger,
    required this.pickupLocation,
    required this.dropoffLocation,
    required this.seatBooked,
    required this.price,
    required this.status,
    this.pickupOtp,
    this.createdAt,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    FeedTripModel? tripObj;
    String tripIdStr = '';

    final rideData = json['ride'] ?? json['trip'];
    if (rideData is Map<String, dynamic>) {
      tripObj = FeedTripModel.fromJson(rideData);
      tripIdStr = tripObj.id;
    } else if (rideData is String) {
      tripIdStr = rideData;
    } else if (json['tripId'] != null) {
      tripIdStr = json['tripId'].toString();
    }

    // Extract pickup/dropoff names
    String pickupStr = '';
    if (json['pickupLocation'] is Map) {
      pickupStr = json['pickupLocation']['name'] ?? '';
    } else {
      pickupStr = json['pickupLocation']?.toString() ?? '';
    }

    String dropoffStr = '';
    if (json['dropoffLocation'] is Map) {
      dropoffStr = json['dropoffLocation']['name'] ?? '';
    } else {
      dropoffStr = json['dropoffLocation']?.toString() ?? '';
    }

    return BookingModel(
      id: json['id'] as String? ?? json['_id'] as String? ?? '',
      tripId: tripIdStr,
      trip: tripObj,
      passenger: json['passenger'] != null && json['passenger'] is Map<String, dynamic>
          ? UserModel.fromJson(json['passenger'] as Map<String, dynamic>)
          : null,
      pickupLocation: pickupStr,
      dropoffLocation: dropoffStr,
      seatBooked: (json['seatBooked'] as num?)?.toInt() ??
          (json['seats'] as num?)?.toInt() ??
          1,
      price: (json['price'] as num?) ?? (json['totalPrice'] as num?) ?? 0,
      status: json['status'] as String? ?? 'PENDING',
      pickupOtp: json['pickupOtp']?.toString() ?? json['otp']?.toString(),
      createdAt: json['createdAt'] as String?,
    );
  }

  bool get isOngoing => status.toUpperCase() == 'ONGOING';
  bool get isAccepted => status.toUpperCase() == 'ACCEPTED';
  bool get isPending => status.toUpperCase() == 'PENDING';
  bool get isCompleted => status.toUpperCase() == 'COMPLETED';
  bool get isCancelled =>
      status.toUpperCase() == 'CANCELLED' || status.toUpperCase() == 'REJECTED';
  bool get isCanCancel => isPending || isAccepted;

  @override
  List<Object?> get props => [
        id,
        tripId,
        trip,
        passenger,
        pickupLocation,
        dropoffLocation,
        seatBooked,
        price,
        status,
        pickupOtp,
        createdAt,
      ];
}
