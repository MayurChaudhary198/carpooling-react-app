import 'package:equatable/equatable.dart';
import '../../../../core/models/location_model.dart';

abstract class TripSearchEvent extends Equatable {
  const TripSearchEvent();

  @override
  List<Object?> get props => [];
}

class SearchPlacesQueryChangedEvent extends TripSearchEvent {
  final String query;
  final bool isOrigin;

  const SearchPlacesQueryChangedEvent({
    required this.query,
    required this.isOrigin,
  });

  @override
  List<Object?> get props => [query, isOrigin];
}

class ExecuteRouteTripSearchEvent extends TripSearchEvent {
  final LocationModel origin;
  final LocationModel destination;
  final DateTime dateAndTime;
  final int seats;

  const ExecuteRouteTripSearchEvent({
    required this.origin,
    required this.destination,
    required this.dateAndTime,
    required this.seats,
  });

  @override
  List<Object?> get props => [origin, destination, dateAndTime, seats];
}

class ClearSearchEvent extends TripSearchEvent {}
