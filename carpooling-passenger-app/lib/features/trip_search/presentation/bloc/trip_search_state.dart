import 'package:equatable/equatable.dart';
import '../../../../core/models/location_model.dart';
import 'package:carpooling_passenger_app/features/feed/data/models/feed_trip_model.dart';

abstract class TripSearchState extends Equatable {
  const TripSearchState();

  @override
  List<Object?> get props => [];
}

class TripSearchInitial extends TripSearchState {}

class PlaceSuggestionsLoading extends TripSearchState {
  final bool isOrigin;
  const PlaceSuggestionsLoading({required this.isOrigin});

  @override
  List<Object?> get props => [isOrigin];
}

class PlaceSuggestionsLoaded extends TripSearchState {
  final List<LocationModel> places;
  final bool isOrigin;

  const PlaceSuggestionsLoaded({required this.places, required this.isOrigin});

  @override
  List<Object?> get props => [places, isOrigin];
}

class RouteTripsLoading extends TripSearchState {}

class RouteTripsLoaded extends TripSearchState {
  final List<FeedTripModel> trips;

  const RouteTripsLoaded(this.trips);

  @override
  List<Object?> get props => [trips];
}

class TripSearchError extends TripSearchState {
  final String message;

  const TripSearchError(this.message);

  @override
  List<Object?> get props => [message];
}
