import 'package:equatable/equatable.dart';
import '../../data/models/tracking_data_model.dart';

abstract class LiveTrackingEvent extends Equatable {
  const LiveTrackingEvent();

  @override
  List<Object?> get props => [];
}

class StartTrackingEvent extends LiveTrackingEvent {
  final String tripId;

  const StartTrackingEvent(this.tripId);

  @override
  List<Object?> get props => [tripId];
}

class TrackingLocationUpdatedEvent extends LiveTrackingEvent {
  final TrackingDataModel? trackingData;

  const TrackingLocationUpdatedEvent(this.trackingData);

  @override
  List<Object?> get props => [trackingData];
}

class StopTrackingEvent extends LiveTrackingEvent {}
