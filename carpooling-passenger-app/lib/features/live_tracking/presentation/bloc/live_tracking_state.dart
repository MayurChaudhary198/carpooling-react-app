import 'package:equatable/equatable.dart';
import '../../data/models/tracking_data_model.dart';

abstract class LiveTrackingState extends Equatable {
  const LiveTrackingState();

  @override
  List<Object?> get props => [];
}

class LiveTrackingInitial extends LiveTrackingState {}

class LiveTrackingConnecting extends LiveTrackingState {}

class LiveTrackingActive extends LiveTrackingState {
  final TrackingDataModel trackingData;
  final bool isStale;

  const LiveTrackingActive({
    required this.trackingData,
    required this.isStale,
  });

  @override
  List<Object?> get props => [trackingData, isStale];
}

class LiveTrackingEnded extends LiveTrackingState {
  final String status;
  const LiveTrackingEnded(this.status);

  @override
  List<Object?> get props => [status];
}

class LiveTrackingError extends LiveTrackingState {
  final String message;
  const LiveTrackingError(this.message);

  @override
  List<Object?> get props => [message];
}
