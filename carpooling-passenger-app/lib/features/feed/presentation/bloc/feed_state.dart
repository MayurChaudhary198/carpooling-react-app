import 'package:equatable/equatable.dart';
import '../../../../core/models/location_model.dart';
import '../../data/models/feed_trip_model.dart';

abstract class FeedState extends Equatable {
  const FeedState();

  @override
  List<Object?> get props => [];
}

class FeedInitial extends FeedState {}

class FeedLoading extends FeedState {}

class FeedLoaded extends FeedState {
  final List<FeedTripModel> trips;
  final LocationModel currentLocation;
  final int radiusKm;
  final int seats;

  const FeedLoaded({
    required this.trips,
    required this.currentLocation,
    required this.radiusKm,
    required this.seats,
  });

  @override
  List<Object?> get props => [trips, currentLocation, radiusKm, seats];
}

class FeedError extends FeedState {
  final String message;

  const FeedError(this.message);

  @override
  List<Object?> get props => [message];
}
