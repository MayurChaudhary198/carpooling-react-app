import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/repositories/tracking_repository.dart';
import 'live_tracking_event.dart';
import 'live_tracking_state.dart';
import 'package:carpooling_passenger_app/features/live_tracking/data/models/tracking_data_model.dart';

class LiveTrackingBloc extends Bloc<LiveTrackingEvent, LiveTrackingState> {
  final TrackingRepository repository;
  StreamSubscription? _subscription;
  Timer? _staleCheckTimer;

  LiveTrackingBloc({required this.repository}) : super(LiveTrackingInitial()) {
    on<StartTrackingEvent>(_onStartTracking);
    on<TrackingLocationUpdatedEvent>(_onTrackingLocationUpdated);
    on<StopTrackingEvent>(_onStopTracking);
  }

  Future<void> _onStartTracking(
    StartTrackingEvent event,
    Emitter<LiveTrackingState> emit,
  ) async {
    emit(LiveTrackingConnecting());
    await _subscription?.cancel();
    _staleCheckTimer?.cancel();

    try {
      _subscription = repository.listenToTripTracking(event.tripId).listen(
        (TrackingDataModel? data) {
          add(TrackingLocationUpdatedEvent(data));
        },
        onError: (err) {
          add(TrackingLocationUpdatedEvent(null));
        },
      );

      // Periodically check if location data has become stale (> 30s)
      _staleCheckTimer = Timer.periodic(const Duration(seconds: 5), (_) {
        if (state is LiveTrackingActive) {
          final activeState = state as LiveTrackingActive;
          final isNowStale = activeState.trackingData.isStale;
          if (isNowStale != activeState.isStale) {
            add(TrackingLocationUpdatedEvent(activeState.trackingData));
          }
        }
      });
    } catch (e) {
      emit(LiveTrackingError('Failed to connect to live tracking: $e'));
    }
  }

  void _onTrackingLocationUpdated(
    TrackingLocationUpdatedEvent event,
    Emitter<LiveTrackingState> emit,
  ) {
    final data = event.trackingData;
    if (data == null) {
      emit(const LiveTrackingError('Waiting for driver to start broadcast...'));
      return;
    }

    if (data.status == 'COMPLETED' || data.status == 'CANCELLED') {
      emit(LiveTrackingEnded(data.status));
      return;
    }

    emit(
      LiveTrackingActive(
        trackingData: data,
        isStale: data.isStale,
      ),
    );
  }

  Future<void> _onStopTracking(
    StopTrackingEvent event,
    Emitter<LiveTrackingState> emit,
  ) async {
    await _subscription?.cancel();
    _staleCheckTimer?.cancel();
    _subscription = null;
    _staleCheckTimer = null;
    emit(LiveTrackingInitial());
  }

  @override
  Future<void> close() {
    _subscription?.cancel();
    _staleCheckTimer?.cancel();
    return super.close();
  }
}
