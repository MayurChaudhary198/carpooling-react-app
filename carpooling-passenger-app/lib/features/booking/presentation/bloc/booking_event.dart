import 'package:equatable/equatable.dart';
import '../../../../core/models/location_model.dart';

abstract class BookingEvent extends Equatable {
  const BookingEvent();

  @override
  List<Object?> get props => [];
}

class CreateBookingEvent extends BookingEvent {
  final String tripId;
  final int seats;
  final LocationModel pickupLocation;
  final LocationModel dropoffLocation;

  const CreateBookingEvent({
    required this.tripId,
    required this.seats,
    required this.pickupLocation,
    required this.dropoffLocation,
  });

  @override
  List<Object?> get props => [tripId, seats, pickupLocation, dropoffLocation];
}

class JoinWaitlistEvent extends BookingEvent {
  final String tripId;
  final int seats;
  final LocationModel pickupLocation;
  final LocationModel dropoffLocation;

  const JoinWaitlistEvent({
    required this.tripId,
    required this.seats,
    required this.pickupLocation,
    required this.dropoffLocation,
  });

  @override
  List<Object?> get props => [tripId, seats, pickupLocation, dropoffLocation];
}

class FetchMyBookingsEvent extends BookingEvent {
  final bool isRefresh;
  const FetchMyBookingsEvent({this.isRefresh = false});

  @override
  List<Object?> get props => [isRefresh];
}

class CancelBookingEvent extends BookingEvent {
  final String bookingId;

  const CancelBookingEvent(this.bookingId);

  @override
  List<Object?> get props => [bookingId];
}
