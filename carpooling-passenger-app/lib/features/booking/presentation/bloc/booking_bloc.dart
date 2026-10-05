import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/repositories/booking_repository.dart';
import 'booking_event.dart';
import 'booking_state.dart';

class BookingBloc extends Bloc<BookingEvent, BookingState> {
  final BookingRepository repository;

  BookingBloc({required this.repository}) : super(BookingInitial()) {
    on<CreateBookingEvent>(_onCreateBooking);
    on<JoinWaitlistEvent>(_onJoinWaitlist);
    on<FetchMyBookingsEvent>(_onFetchMyBookings);
    on<CancelBookingEvent>(_onCancelBooking);
  }

  Future<void> _onCreateBooking(
    CreateBookingEvent event,
    Emitter<BookingState> emit,
  ) async {
    emit(BookingActionLoading());
    try {
      final booking = await repository.bookTrip(
        tripId: event.tripId,
        seats: event.seats,
        pickupLocation: event.pickupLocation,
        dropoffLocation: event.dropoffLocation,
      );
      emit(BookingCreatedSuccess(booking));
    } on Failure catch (e) {
      emit(BookingError(e.message));
    } catch (e) {
      emit(BookingError(e.toString()));
    }
  }

  Future<void> _onJoinWaitlist(
    JoinWaitlistEvent event,
    Emitter<BookingState> emit,
  ) async {
    emit(BookingActionLoading());
    try {
      await repository.joinWaitlist(
        tripId: event.tripId,
        seats: event.seats,
        pickupLocation: event.pickupLocation,
        dropoffLocation: event.dropoffLocation,
      );
      emit(WaitlistJoinedSuccess());
    } on Failure catch (e) {
      emit(BookingError(e.message));
    } catch (e) {
      emit(BookingError(e.toString()));
    }
  }

  Future<void> _onFetchMyBookings(
    FetchMyBookingsEvent event,
    Emitter<BookingState> emit,
  ) async {
    if (!event.isRefresh) {
      emit(BookingsLoading());
    }
    try {
      final bookings = await repository.getPassengerBookings();
      emit(BookingsLoaded(bookings));
    } on Failure catch (e) {
      emit(BookingError(e.message));
    } catch (e) {
      emit(BookingError(e.toString()));
    }
  }

  Future<void> _onCancelBooking(
    CancelBookingEvent event,
    Emitter<BookingState> emit,
  ) async {
    emit(BookingActionLoading());
    try {
      await repository.cancelBooking(event.bookingId);
      emit(BookingCancelledSuccess(event.bookingId));
      add(const FetchMyBookingsEvent(isRefresh: true));
    } on Failure catch (e) {
      emit(BookingError(e.message));
    } catch (e) {
      emit(BookingError(e.toString()));
    }
  }
}
