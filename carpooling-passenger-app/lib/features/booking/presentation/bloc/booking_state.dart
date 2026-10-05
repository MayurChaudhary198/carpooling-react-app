import 'package:equatable/equatable.dart';
import '../../data/models/booking_model.dart';

abstract class BookingState extends Equatable {
  const BookingState();

  @override
  List<Object?> get props => [];
}

class BookingInitial extends BookingState {}

class BookingActionLoading extends BookingState {}

class BookingCreatedSuccess extends BookingState {
  final BookingModel booking;
  const BookingCreatedSuccess(this.booking);

  @override
  List<Object?> get props => [booking];
}

class WaitlistJoinedSuccess extends BookingState {}

class BookingsLoading extends BookingState {}

class BookingsLoaded extends BookingState {
  final List<BookingModel> bookings;
  const BookingsLoaded(this.bookings);

  @override
  List<Object?> get props => [bookings];
}

class BookingCancelledSuccess extends BookingState {
  final String bookingId;
  const BookingCancelledSuccess(this.bookingId);

  @override
  List<Object?> get props => [bookingId];
}

class BookingError extends BookingState {
  final String message;
  const BookingError(this.message);

  @override
  List<Object?> get props => [message];
}
