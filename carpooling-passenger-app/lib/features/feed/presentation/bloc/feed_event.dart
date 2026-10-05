import 'package:equatable/equatable.dart';
import '../../../../core/models/location_model.dart';

abstract class FeedEvent extends Equatable {
  const FeedEvent();

  @override
  List<Object?> get props => [];
}

class FetchFeedTripsEvent extends FeedEvent {
  final LocationModel? location;
  final int radiusKm;
  final int seats;
  final bool isRefresh;

  const FetchFeedTripsEvent({
    this.location,
    this.radiusKm = 5,
    this.seats = 1,
    this.isRefresh = false,
  });

  @override
  List<Object?> get props => [location, radiusKm, seats, isRefresh];
}
